// server/middleware/uploadMiddleware.js
// Reusable Multer configuration for image uploads. Resource file uploads
// (PDFs, docs, etc.) get their own configuration in Phase 7.

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PROFILE_PICTURES_DIR = path.join(__dirname, '..', 'uploads', 'profile-pictures');
const POST_IMAGES_DIR = path.join(__dirname, '..', 'uploads', 'posts');
const RESOURCES_DIR = path.join(__dirname, '..', 'uploads', 'resources');
const EVENTS_DIR = path.join(__dirname, '..', 'uploads', 'events');

// Ensure target directories exist (Multer won't create them for you).
[PROFILE_PICTURES_DIR, POST_IMAGES_DIR, RESOURCES_DIR, EVENTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PROFILE_PICTURES_DIR);
  },
  filename: (req, file, cb) => {
    // Prefix with user id + timestamp to avoid collisions and keep files
    // traceable to their owner. Sanitize the extension from the mimetype
    // rather than trusting the original filename.
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const filename = `${req.user._id}-${Date.now()}${safeExt}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, or WEBP images are allowed'));
  }
  cb(null, true);
};

const uploadProfilePicture = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ---------- Post images (Phase 5) ----------
const postImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, POST_IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const unique = `${req.user._id}-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  },
});

const uploadPostImages = multer({
  storage: postImageStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 4 }, // up to 4 images per post
});

// ---------- Study resources (Phase 7) ----------
// Only allow well-known, low-risk document/archive types. Explicitly
// excludes anything executable or script-like (.exe, .sh, .bat, .js, .html,
// etc.) to reduce the risk of malware being distributed through the platform.
const ALLOWED_RESOURCE_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'image/jpeg',
  'image/png',
];
const ALLOWED_RESOURCE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png',
];
const MAX_RESOURCE_SIZE = 15 * 1024 * 1024; // 15 MB

const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, RESOURCES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_RESOURCE_EXTENSIONS.includes(ext) ? ext : '.bin';
    const unique = `${req.user._id}-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  },
});

const resourceFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_RESOURCE_TYPES.includes(file.mimetype);
  const extOk = ALLOWED_RESOURCE_EXTENSIONS.includes(ext);

  // Require BOTH the declared mimetype and the file extension to be on the
  // allowlist — relying on either alone is easy to spoof.
  if (!mimeOk || !extOk) {
    return cb(new Error('This file type is not allowed. Allowed: PDF, Word, PowerPoint, Excel, TXT, JPG, PNG.'));
  }
  cb(null, true);
};

const uploadResourceFile = multer({
  storage: resourceStorage,
  fileFilter: resourceFileFilter,
  limits: { fileSize: MAX_RESOURCE_SIZE },
});

// ---------- Event images (Phase 9) ----------
const eventImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, EVENTS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const unique = `${req.user._id}-${Date.now()}${safeExt}`;
    cb(null, unique);
  },
});

const uploadEventImage = multer({
  storage: eventImageStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = { uploadProfilePicture, uploadPostImages, uploadResourceFile, uploadEventImage };
