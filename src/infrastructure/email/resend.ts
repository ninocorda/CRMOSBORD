import { Resend } from 'resend';

// Solo instanciamos con la llave real si existe; de lo contrario usamos un placeholder
// para evitar que Next.js falle durante la fase de 'page data collection' en la build.
const apiKey = process.env.RESEND_API_KEY || 're_placeholder_for_build';
export const resend = new Resend(apiKey);

export async function sendEmail(payload: {
    to: string | string[];
    subject: string;
    react: React.ReactNode | React.ReactElement | any;
    from?: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("Emails: INTENTO DE ENVÍO FALLIDO - RESEND_API_KEY no configurada.");
        return { error: { message: "API Key missing" } };
    }

    return await resend.emails.send({
        from: payload.from || 'EduCRM <onboarding@resend.dev>',
        to: payload.to,
        subject: payload.subject,
        react: payload.react,
    });
}
