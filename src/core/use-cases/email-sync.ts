"use server";

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { createClient } from "@supabase/supabase-js";

// Helper to get environment variables safely
const getEmailConfig = () => ({
    host: process.env.EMAIL_IMAP_HOST || "mail.privateemail.com",
    port: parseInt(process.env.EMAIL_IMAP_PORT || "993"),
    auth: {
        user: process.env.EMAIL_IMAP_USER || "raulramirez@osbord.com",
        pass: process.env.EMAIL_IMAP_PASS || ""
    }
});

export async function syncEmailsAction() {
    const config = getEmailConfig();

    if (!config.auth.pass) {
        return { success: false, error: "Contraseña de email no configurada (.env.local)" };
    }

    const client = new ImapFlow({
        host: config.host,
        port: config.port,
        secure: true,
        auth: config.auth,
        logger: false
    });

    // Supabase admin client for background sync
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
        await client.connect();
        let lock = await client.getMailboxLock("INBOX");

        try {
            // Fetch all messages available in the inbox for a complete history
            const messages = client.fetch({}, {
                source: true,
                uid: true,
                envelope: true,
                bodyStructure: true
            });

            let syncedCount = 0;

            for await (let message of messages) {
                if (!message.source) continue;

                const parsed = await simpleParser(message.source);
                const messageId = (parsed as any).messageId || `uid-${message.uid}`;
                const fromEmail = (parsed as any).from?.value[0]?.address;
                const subject = (parsed as any).subject || "Sin Asunto";
                const content = (parsed as any).text || (parsed as any).html || "";
                const snippet = content.substring(0, 150) + (content.length > 150 ? "..." : "");

                // 1. Try to find the student by email
                let studentId = null;
                if (fromEmail) {
                    const { data: student } = await supabase
                        .from('students')
                        .select('id')
                        .eq('email', fromEmail)
                        .maybeSingle();

                    if (student) studentId = student.id;
                }

                // 2. Insert into communications_log (check for duplicates first)
                const { data: existing } = await supabase
                    .from('communications_log')
                    .select('id')
                    .eq('external_id', messageId)
                    .maybeSingle();

                if (!existing) {
                    const { error: insertError } = await supabase.from('communications_log').insert({
                        student_id: studentId,
                        direction: 'inbound',
                        external_id: messageId,
                        from_email: fromEmail,
                        to_email: config.auth.user,
                        subject: subject,
                        content: content,
                        snippet: snippet,
                        type: 'email',
                        sent_at: (parsed as any).date || new Date().toISOString()
                    });

                    if (!insertError) {
                        syncedCount++;
                    } else if (insertError.code === '23505') {
                        // Duplicate key error, skip silently
                        console.log(`Email already exists: ${messageId}`);
                    } else {
                        console.error("Supabase Insert Error:", insertError);
                    }
                }
            }

            return { success: true, count: syncedCount };
        } finally {
            lock.release();
        }
    } catch (err: any) {
        console.error("IMAP Sync Error:", err);
        return { success: false, error: err.message };
    } finally {
        await client.logout();
    }
}
