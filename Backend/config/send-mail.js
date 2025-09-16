import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>", // You can replace with your verified domain
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("❌ Mail error:", error);
      return { success: false, error };
    }

    console.log("✅ Mail sent:", data);
    return { success: true, data };
  } catch (err) {
    console.error("❌ Unexpected mail error:", err);
    return { success: false, error: err };
  }
};
