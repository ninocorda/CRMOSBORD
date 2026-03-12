'use server'

import { createServerClient } from '@/infrastructure/database/supabase-server';
import { Client as QStashClient } from '@upstash/qstash';

const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! });

export async function dispatchPaymentRemindersAction() {
    const supabase = await createServerClient();

    // Localizamos pagos con estatus pending, que venzan en los próximos 1-3 días
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: upcomingPayments, error } = await supabase
        .from('payments')
        .select(`
      *,
      enrollment:enrollments(
        student:profiles(email, first_name)
      )
    `)
        .eq('verification_status', 'pending')
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', threeDaysFromNow.toISOString().split('T')[0]);

    if (error) {
        console.error("Error fetching pending payments:", error);
        throw new Error('Error fetching pending payments for reminders');
    }

    const dispatchedJobs = [];

    for (const payment of upcomingPayments || []) {
        const student = payment.enrollment.student;
        if (!student?.email) continue;

        // Disparamos un job asíncrono hacia nuestro route handler
        // URL base de producción (se configurará en env. local como ngrok/tunnel para pruebas)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const res = await qstash.publishJSON({
            url: `${baseUrl}/api/workers/send-reminder-email`,
            body: {
                paymentId: payment.id,
                studentEmail: student.email,
                studentName: student.first_name,
                amount: payment.amount,
                dueDate: payment.due_date,
            },
            // Retry actions up to 3 times on failure automatically
            retries: 3,
        });

        dispatchedJobs.push(res.messageId);
    }

    return { success: true, count: dispatchedJobs.length };
}
