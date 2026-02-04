const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const getBaseTemplate = (title, content) => {
  return `
  <div style="background:#f4f6f8;padding:30px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
      
      <!-- Header -->
      <div style="background:#111827;color:#ffffff;padding:20px;text-align:center;">
        <h2 style="margin:0;">DevMate</h2>
        <p style="margin:0;font-size:13px;">Secure Account Notification</p>
      </div>

      <!-- Body -->
      <div style="padding:30px;color:#111827;font-size:14px;line-height:1.6;">
        <h3 style="margin-top:0;">${title}</h3>
        ${content}
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#6b7280;">
        <p style="margin:5px 0;">This is an automated message. Please do not reply.</p>
        <p style="margin:5px 0;">© ${new Date().getFullYear()} DevMate. All rights reserved.</p>
      </div>

    </div>
  </div>
  `;
};

const getEmailTemplate = (purpose, data) => {
  switch (purpose) {
    case "signup": {
      const content = `
        <p>Dear User,</p>
        <p>Thank you for registering with <strong>DevMate</strong>. To complete your account setup, please use the verification code below:</p>

        <div style="background:#f3f4f6;border:1px dashed #6366f1;padding:15px;text-align:center;font-size:26px;letter-spacing:6px;font-weight:bold;margin:20px 0;">
          ${data.otp}
        </div>

        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>For security reasons, do not share this code with anyone.</p>

        <p>If you did not create an account with DevMate, please ignore this email.</p>
      `;

      return {
        subject: "Verify your DevMate account",
        text: `Your DevMate verification code is ${data.otp}. It expires in 10 minutes.`,
        html: getBaseTemplate("Account Verification", content),
      };
    }

    case "login": {
      const content = `
        <p>Dear User,</p>
        <p>We received a request to sign in to your DevMate account. Please use the following One-Time Password (OTP):</p>

        <div style="background:#f3f4f6;border:1px dashed #6366f1;padding:15px;text-align:center;font-size:26px;letter-spacing:6px;font-weight:bold;margin:20px 0;">
          ${data.otp}
        </div>

        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If this login attempt was not made by you, we recommend changing your password immediately.</p>
      `;

      return {
        subject: "DevMate Login Verification Code",
        text: `Your DevMate login OTP is ${data.otp}.`,
        html: getBaseTemplate("Login Verification", content),
      };
    }

    case "forgotPassword": {
      const content = `
        <p>Dear User,</p>
        <p>We received a request to reset your DevMate account password.</p>

        <div style="background:#f3f4f6;border:1px dashed #ef4444;padding:15px;text-align:center;font-size:26px;letter-spacing:6px;font-weight:bold;margin:20px 0;">
          ${data.otp}
        </div>

        <p>This password reset code will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
      `;

      return {
        subject: "Password Reset Request – DevMate",
        text: `Your DevMate password reset OTP is ${data.otp}.`,
        html: getBaseTemplate("Password Reset", content),
      };
    }

    case "premiumPurchased": {
      const content = `
        <p>Dear ${data.name || "Customer"},</p>
        <p>Thank you for choosing <strong>DevMate Premium</strong>. Your subscription has been successfully activated.</p>

        <p><strong>Transaction Details:</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:15px 0;">
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">Transaction ID</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${data.transactionId}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">Amount Paid</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">₹${data.amount}</td>
          </tr>
        </table>

        <p>You now have access to all premium features including unlimited matches and enhanced profile visibility.</p>

        <p>If you have any questions, please contact our support team.</p>
        <p>We appreciate your trust in DevMate.</p>
      `;

      return {
        subject: "Your DevMate Premium Subscription is Active",
        text: `Your DevMate Premium plan is active. Transaction ID: ${data.transactionId}`,
        html: getBaseTemplate("Premium Subscription Activated", content),
      };
    }

    default:
      throw new Error("Invalid email purpose");
  }
};

const sendEmail = async (to, purpose, data) => {
  const template = getEmailTemplate(purpose, data);

  const msg = {
    to,
    from: `DevMate <${process.env.FROM_EMAIL}>`,
    subject: template.subject,
    text: template.text,
    html: template.html,
  };

  try {
    console.log(`Sending ${purpose} email...`);
    await sgMail.send(msg);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("SendGrid Error:", error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

module.exports = { sendEmail };

// await sendEmail(user.email, "signup", { otp: 123456 });

// await sendEmail(user.email, "login", { otp: 654321 });

// await sendEmail(user.email, "forgotPassword", { otp: 999999 });

// await sendEmail(user.email, "premiumPurchased", {
//   name: user.name,
//   transactionId: paymentId,
//   amount: 499,
// });
