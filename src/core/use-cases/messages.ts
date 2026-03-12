"use server";

import { Resend } from "resend";
import { getStudentsAction } from "./actions";
import { logCommunication } from "@/infrastructure/database/repositories";

// Initialize Resend inside the function to avoid module-level errors if the key is missing
// const resend = new Resend(process.env.RESEND_API_KEY);

interface BulkEmailPayload {
    subject: string;
    content: string;
}

export async function sendBulkEmailAction(studentIds: string[], payload: BulkEmailPayload) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return { success: false, error: "Resend API Key no configurada (.env.local)" };
    }

    const resend = new Resend(apiKey);

    try {
        const { data: allStudents, error: fetchError } = await getStudentsAction();

        if (fetchError || !allStudents) {
            throw new Error(fetchError || "No se pudieron obtener los alumnos");
        }

        // Filter only the selected students
        const students = allStudents.filter((s: any) => studentIds.includes(s.id));

        if (students.length === 0) {
            return { success: false, error: "No se seleccionaron alumnos válidos" };
        }

        const emailResults = [];

        // Send individually to ensure privacy (BCC alternative if many, but separate is better for personalization)
        for (const student of students) {
            if (!student.email) continue;

            const response = await resend.emails.send({
                from: "Instituto Osbord <raulramirez@osbord.com>",
                to: [student.email],
                subject: payload.subject,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; font-size: 16px; line-height: 1.8; color: #334155;">
                        ${payload.content.replace(/\n/g, '<br/>')}
                        <br/><br/>
                        <span style="font-size: 15px; font-weight: 700; color: #1e293b;">Profesor Raúl Ramírez</span><br/>
                        <span style="font-size: 13px; color: #64748b;">Tutor Académico | Instituto Osbord</span><br/>
                        <span style="font-size: 13px; color: #2563eb; font-weight: 600;">osbord.com</span>
                    </div>
                `,
            });

            // Log to database for history tracking
            try {
                await logCommunication({
                    student_id: student.id,
                    type: 'email',
                    direction: 'outbound',
                    from_email: "raulramirez@osbord.com",
                    to_email: student.email,
                    subject: payload.subject,
                    content: payload.content,
                    snippet: payload.content.substring(0, 150),
                    external_id: (response.data as any)?.id || null
                });
            } catch (logError) {
                console.error("Error logging communication:", logError);
            }

            emailResults.push(response);
        }

        return { success: true, count: students.length };
    } catch (error: any) {
        console.error("Resend Bulk Email Error:", error);
        return { success: false, error: error.message };
    }
}

export async function sendReplyEmailAction(payload: {
    to_email: string;
    subject: string;
    content: string;
    student_id?: string;
}) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return { success: false, error: "Resend API Key no configurada (.env.local)" };
    }

    const resend = new Resend(apiKey);

    try {
        // Ensure subject has "Re:" prefix
        const replySubject = payload.subject.startsWith("Re:")
            ? payload.subject
            : `Re: ${payload.subject}`;

        const response = await resend.emails.send({
            from: "Instituto Osbord <raulramirez@osbord.com>",
            to: [payload.to_email],
            subject: replySubject,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; font-size: 16px; line-height: 1.8; color: #334155;">
                    ${payload.content.replace(/\n/g, '<br/>')}
                    <br/><br/>
                    <span style="font-size: 15px; font-weight: 700; color: #1e293b;">Profesor Raúl Ramírez</span><br/>
                    <span style="font-size: 13px; color: #64748b;">Tutor Académico | Instituto Osbord</span><br/>
                    <span style="font-size: 13px; color: #2563eb; font-weight: 600;">osbord.com</span>
                </div>
            `,
        });

        // Log the reply to communications_log
        try {
            await logCommunication({
                student_id: payload.student_id || undefined,
                type: 'email',
                direction: 'outbound',
                from_email: "raulramirez@osbord.com",
                to_email: payload.to_email,
                subject: replySubject,
                content: payload.content,
                snippet: payload.content.substring(0, 150),
                external_id: (response.data as any)?.id || `reply-${Date.now()}`
            });
        } catch (logError) {
            console.error("Error logging reply:", logError);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Reply Email Error:", error);
        return { success: false, error: error.message };
    }
}
