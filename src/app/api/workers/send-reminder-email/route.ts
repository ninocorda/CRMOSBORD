import { verifySignatureAppRouter } from '@upstash/qstash/dist/nextjs';
import { sendEmail } from '@/infrastructure/email/resend';
import { PaymentReminderTemplate } from '@/infrastructure/email/templates/PaymentReminder';
import { NextResponse } from 'next/server';

async function handler(req: Request) {
    try {
        const body = await req.json();
        const { paymentId, studentEmail, studentName, amount, dueDate } = body;

        const emailResponse = await sendEmail({
            to: studentEmail,
            subject: `Recordatorio de Pago Próximo - Vencimiento: ${dueDate}`,
            react: PaymentReminderTemplate({ studentName, amount, dueDate }),
        });

        if (emailResponse.error) {
            console.error("Resend API failed:", emailResponse.error);
            return NextResponse.json({ error: emailResponse.error.message }, { status: 500 });
        }

        // Opcional: Escribir en la base de datos (CommunicationsLog) para registrar el envio.

        return NextResponse.json({ success: true, paymentId });
    } catch (error: any) {
        console.error("QStash Worker processing error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Para seguridad, verificamos que el request realmente venga de QStash:
// Solo aplicamos la verificación si las llaves están configuradas para evitar fallos en la build.
export const POST = (process.env.NODE_ENV === 'production' && process.env.QSTASH_CURRENT_SIGNING_KEY)
    ? verifySignatureAppRouter(handler)
    : handler; 
