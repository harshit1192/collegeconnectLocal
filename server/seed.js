// server/seed.js
//
// Populates the database with demo data for local development and
// classroom/project demonstrations: one admin account, several verified
// student accounts, sample posts, a question with an answer, a community,
// an event, and a resource.
//
// USAGE:
//   cd server
//   npm run seed
//
// WARNING: this script clears existing data from the collections it seeds
// before inserting fresh demo data. Do not run it against a database you
// care about — it's intended for local development only.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Post = require('./models/Post');
const Question = require('./models/Question');
const Answer = require('./models/Answer');
const Resource = require('./models/Resource');
const Community = require('./models/Community');
const Event = require('./models/Event');

const DEMO_PASSWORD = 'Student@123';
const ADMIN_PASSWORD = 'Admin@123';

const STUDENT_SEEDS = [
  { fullName: 'Aisha Khan', email: 'aisha@test.edu', rollNumber: 'CSE001', branch: 'CSE', year: '3rd Year', section: 'A' },
  { fullName: 'Rohan Mehta', email: 'rohan@test.edu', rollNumber: 'CSE002', branch: 'CSE', year: '3rd Year', section: 'A' },
  { fullName: 'Priya Sharma', email: 'priya@test.edu', rollNumber: 'ECE001', branch: 'ECE', year: '2nd Year', section: 'B' },
  { fullName: 'Karan Verma', email: 'karan@test.edu', rollNumber: 'ME001', branch: 'ME', year: '4th Year', section: 'A' },
  { fullName: 'Sneha Iyer', email: 'sneha@test.edu', rollNumber: 'CSE003', branch: 'CSE', year: '1st Year', section: 'C' },
];

const seed = async () => {
  await connectDB();
  console.log('Connected. Clearing existing demo-relevant collections...');

  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Question.deleteMany({}),
    Answer.deleteMany({}),
    Resource.deleteMany({}),
    Community.deleteMany({}),
    Event.deleteMany({}),
  ]);

  // ---------- Admin ----------
  const admin = await User.create({
    fullName: 'Admin User',
    email: 'admin@test.edu',
    password: ADMIN_PASSWORD,
    rollNumber: 'ADMIN001',
    branch: 'Administration',
    year: '4th Year',
    section: 'A',
    role: 'admin',
    isVerified: true,
  });
  console.log('Created admin account.');

  // ---------- Students ----------
  const students = [];
  for (const s of STUDENT_SEEDS) {
    const student = await User.create({ ...s, password: DEMO_PASSWORD, isVerified: true });
    students.push(student);
  }
  console.log(`Created ${students.length} demo student accounts.`);

  const [aisha, rohan, priya, karan, sneha] = students;

  // A couple of follow relationships so the network isn't empty.
  aisha.following.push(rohan._id, priya._id);
  rohan.followers.push(aisha._id);
  priya.followers.push(aisha._id);
  await Promise.all([aisha.save(), rohan.save(), priya.save()]);

  // ---------- Posts ----------
  await Post.create([
    {
      author: aisha._id,
      content: 'Just wrapped up our DBMS mini-project on indexing strategies. Happy to share notes if anyone needs them!',
      likes: [rohan._id],
    },
    {
      author: rohan._id,
      content: 'Reminder: placement prep group meets every Thursday in the library. All years welcome.',
      likes: [aisha._id, priya._id],
    },
    {
      author: priya._id,
      content: 'Does anyone have last year\'s Computer Networks question paper? Sem exams are next week.',
    },
  ]);
  console.log('Created demo posts.');

  // ---------- Academic Q&A ----------
  const question = await Question.create({
    title: 'How does B-Tree indexing improve query performance in DBMS?',
    description:
      'I understand indexes speed up lookups, but I don\'t fully get why B-Trees specifically are used over other structures. Can someone explain with an example?',
    author: karan._id,
    subject: 'DBMS',
    branch: 'CSE',
    year: '3rd Year',
    tags: ['dbms', 'indexing', 'exam-prep'],
  });

  const answer = await Answer.create({
    question: question._id,
    author: aisha._id,
    content:
      'B-Trees keep data sorted and allow searches, insertions, and deletions in logarithmic time, and they stay balanced automatically. Unlike a plain sorted array, you don\'t need to shift elements on insert, and unlike a hash index, they support range queries efficiently (e.g. "find all records between X and Y").',
    upvotes: [karan._id, rohan._id],
    isAccepted: true,
  });

  question.answers.push(answer._id);
  question.acceptedAnswer = answer._id;
  await question.save();
  console.log('Created demo question with an accepted answer.');

  // ---------- Community ----------
  const community = await Community.create({
    name: 'Coding Club',
    description: 'Weekly problem-solving sessions, hackathon prep, and peer code reviews.',
    category: 'Coding',
    creator: rohan._id,
    admins: [rohan._id],
    members: [rohan._id, aisha._id, sneha._id],
  });
  console.log('Created demo community.');

  // ---------- Event ----------
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await Event.create({
    title: 'Intro to Competitive Programming Workshop',
    description: 'A beginner-friendly workshop covering time complexity, common patterns, and how to approach contest problems.',
    category: 'Workshop',
    organizer: rohan._id,
    community: community._id,
    date: nextWeek,
    venue: 'CS Building, Room 204',
    maxParticipants: 40,
    registeredStudents: [aisha._id, sneha._id],
  });
  console.log('Created demo event.');

  // ---------- Resource ----------
  // Note: this seeds only the resource's *metadata*; no real file is
  // attached since the seed script doesn't upload through Multer. The
  // fileUrl below is a placeholder — download will 404 unless you also
  // manually place a matching file in server/uploads/resources/.
  await Resource.create({
    title: 'DBMS Unit 3 Notes - Indexing & Normalization',
    description: 'Covers B-Trees, hashing, and normal forms up to BCNF.',
    uploader: aisha._id,
    resourceType: 'Notes',
    subject: 'DBMS',
    branch: 'CSE',
    semester: '5',
    fileUrl: '/uploads/resources/placeholder.pdf',
    fileName: 'dbms-unit3-notes.pdf',
    fileType: 'application/pdf',
    fileSize: 204800,
  });
  console.log('Created demo resource metadata (placeholder file, see note above).');

  console.log('\n================ SEED COMPLETE ================');
  console.log('Demo admin login:');
  console.log(`  email:    admin@test.edu`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log('\nDemo student logins (all use the same password):');
  STUDENT_SEEDS.forEach((s) => console.log(`  ${s.email}`));
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log('=================================================\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
