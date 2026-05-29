import nodemailer from "nodemailer";

interface AlertEmail {
  to: string;
  subject: string;
  body: string;
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendAlertEmail(alert: AlertEmail): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log("[Email] SMTP not configured, skipping alert:", alert.subject);
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Premium Auto Analysis" <${process.env.SMTP_USER}>`,
    to: alert.to,
    subject: `🔴 ALERT: ${alert.subject}`,
    text: alert.body,
  });
}

export async function sendWeeklyReport(
  to: string,
  weekNumber: number,
  reportHtml: string
): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log("[Email] SMTP not configured, skipping weekly report");
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Premium Auto Analysis" <${process.env.SMTP_USER}>`,
    to,
    subject: `Premium Auto Analysis — Week ${weekNumber} Summary`,
    html: reportHtml,
  });
}
