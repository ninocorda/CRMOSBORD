import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(payload: {
    to: string | string[];
    subject: string;
    react: React.ReactNode | React.ReactElement | any;
    from?: string; // e.g. 'EduCRM <noreply@yourdomain.com>'
}) {
    return await resend.emails.send({
        from: payload.from || 'EduCRM <onboarding@resend.dev>',
        to: payload.to,
        subject: payload.subject,
        react: payload.react,
    });
}
