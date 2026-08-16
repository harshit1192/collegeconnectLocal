// server/utils/sendEmail.js
//
// DEV-ONLY STUB: instead of actually sending email, this logs the message
// to the server console so you can copy the verification/reset link during
// local development and testing.
//
// For a real deployment, replace the body of this function with something
// like Nodemailer + SMTP, SendGrid, or Resend. The function signature can
// stay the same so nothing else in the app needs to change.

const sendEmail = async ({ to, subject, text }) => {
  console.log('\n========== EMAIL (dev stub) ==========');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${text}`);
  console.log('=======================================\n');

  // Simulate an async email provider call.
  return Promise.resolve({ success: true });
};

module.exports = sendEmail;
