// server/controllers/authController.js

const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// Only allow registration with college email domains.
// Update this list (or read from an env var) to match your institution(s).
const ALLOWED_EMAIL_DOMAINS = ['college.edu', 'university.edu', 'test.edu'];

const isCollegeEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    confirmPassword,
    rollNumber,
    branch,
    year,
    section,
  } = req.body;

  // ---- Basic validation ----
  if (!fullName || !email || !password || !confirmPassword || !rollNumber || !branch || !year || !section) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Password and confirm password do not match');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  if (!isCollegeEmail(email)) {
    res.status(400);
    throw new Error(
      `Please register with a valid college email (allowed domains: ${ALLOWED_EMAIL_DOMAINS.join(', ')})`
    );
  }

  const emailExists = await User.findOne({ email: email.toLowerCase() });
  if (emailExists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const rollExists = await User.findOne({ rollNumber });
  if (rollExists) {
    res.status(400);
    throw new Error('An account with this roll number already exists');
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    rollNumber,
    branch,
    year,
    section,
  });

  // Generate email verification token and "send" it (console-logged in dev).
  const rawToken = user.generateVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your CollegeConnect account',
    text: `Welcome to CollegeConnect! Please verify your account by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
  });
});

// @desc    Verify a student's email using the token from their email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Verification link is invalid or has expired');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now log in.',
  });
});

// @desc    Log in a student or admin
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error('This account has been blocked. Contact an administrator.');
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error('Please verify your email before logging in');
  }

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Log out current user
// @route   POST /api/auth/logout
// @access  Private
// Note: since we use stateless JWTs stored client-side (not cookies), the
// server has nothing to invalidate — logout is really a frontend action
// (discard the token). This endpoint exists for a consistent API and so a
// future cookie-based or token-blacklist strategy can slot in here.
const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Get the currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
});

// @desc    Request a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide your email address');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond with the same generic message, whether or not the user
  // exists, so attackers can't use this endpoint to discover valid emails.
  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const rawToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your CollegeConnect password',
    text: `You requested a password reset. Visit this link to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  });

  res.status(200).json(genericResponse);
});

// @desc    Reset password using a valid reset token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    res.status(400);
    throw new Error('Please provide a new password and confirmation');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    res.status(400);
    throw new Error('Reset link is invalid or has expired');
  }

  user.password = password; // will be re-hashed by the pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now log in with your new password.',
  });
});

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
};
