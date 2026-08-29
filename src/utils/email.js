import emailjs from "@emailjs/browser";

// EmailJS is a free, serverless email service used to deliver the sign-up OTP
// straight from the browser. Config lives in .env:
//   VITE_EMAILJS_SERVICE_ID / VITE_EMAILJS_TEMPLATE_ID / VITE_EMAILJS_PUBLIC_KEY
// The template receives `to_email`, `to_name` and `otp_code` variables.
const SERVICE_ID = (import.meta.env.VITE_EMAILJS_SERVICE_ID || "").trim();
const TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "").trim();
const PUBLIC_KEY = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "").trim();

export const EMAILJS_CONFIGURED = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/**
 * Send the sign-up OTP to the lecturer's email.
 *
 * When EmailJS is not configured (local development) the code is not emailed;
 * the caller surfaces it in the UI via `devOtp` so the flow stays testable.
 */
export async function sendOtpEmail({ toEmail, toName, otpCode }) {
  if (!EMAILJS_CONFIGURED) {
    console.warn(
      `[email] EmailJS is not configured. Development OTP for ${toEmail}: ${otpCode}`
    );
    return;
  }
  await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    to_email: toEmail,
    to_name: toName || toEmail.split("@")[0] || "Lecturer",
    otp_code: otpCode,
  }, PUBLIC_KEY);
}