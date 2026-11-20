import nodemailer from 'nodemailer';
import { z } from 'zod';

const MailConfig = z.object({
  ENQUIRY_EMAIL_TO: z.email(),
  SMTP_USER: z.email(),
  SMTP_APP_PASSWORD: z.string().min(8)
});

export async function sendEnquiryEmail(enquiry: { name: string; phone: string; service: string; message: string; id: string }): Promise<boolean> {
  const parsed = MailConfig.safeParse(process.env);
  if (!parsed.success) return false;
  const { ENQUIRY_EMAIL_TO, SMTP_USER, SMTP_APP_PASSWORD } = parsed.data;
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: SMTP_USER, pass: SMTP_APP_PASSWORD },
    connectionTimeout: 8_000, greetingTimeout: 8_000, socketTimeout: 12_000
  });
  await transport.sendMail({
    from: { name: 'SafeRide enquiries', address: SMTP_USER },
    to: ENQUIRY_EMAIL_TO,
    subject: `New SafeRide ${enquiry.service} enquiry`,
    text: `A new enquiry was saved in SafeRide.\n\nName: ${enquiry.name}\nPhone: ${enquiry.phone}\nService: ${enquiry.service}\nMessage:\n${enquiry.message}\n\nEnquiry ID: ${enquiry.id}\nReview and mark it handled in Owner → Notices & Enquiries.\n`
  });
  return true;
}
