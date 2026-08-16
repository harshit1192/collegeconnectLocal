// server/models/User.js
// Core User model: authentication fields (Phase 3) + profile and
// networking fields (Phase 4: bio, skills, followers/following, etc.).

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'College email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never return password by default in queries
    },
    rollNumber: {
      type: String,
      required: [true, 'University roll number is required'],
      unique: true,
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Year is required'],
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },

    // ---------- Profile fields (Phase 4) ----------
    profilePicture: {
      type: String,
      default: '', // relative URL served from /uploads, e.g. /uploads/profile-pictures/xyz.jpg
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    achievements: {
      type: [String],
      default: [],
    },
    githubUrl: {
      type: String,
      default: '',
      trim: true,
    },
    linkedinUrl: {
      type: String,
      default: '',
      trim: true,
    },

    // ---------- Networking (Phase 4) ----------
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ---------- Verification & moderation ----------
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpire: Date,

    // ---------- Password reset ----------
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Helpful indexes for lookups/searches used throughout the app.
userSchema.index({ email: 1 });
userSchema.index({ rollNumber: 1 });
userSchema.index({ fullName: 'text' });

// ---------- Hash password before saving ----------
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ---------- Instance methods ----------

// Compare a plaintext password against the stored hash.
userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Generate a random token for email verification, hash it for storage,
// and return the *unhashed* token (this is what gets emailed to the user).
userSchema.methods.generateVerificationToken = function generateVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.verificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return rawToken;
};

// Generate a random token for password reset, hash it for storage,
// and return the *unhashed* token (this is what gets emailed to the user).
userSchema.methods.generatePasswordResetToken = function generatePasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

  return rawToken;
};

// Strip sensitive fields whenever a user document is sent as JSON.
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationTokenExpire;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
