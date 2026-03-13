
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars from .env.local manually to avoid extra dependencies
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim();
        }
    }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function importStudents() {
    const csvPath = path.resolve(process.cwd(), 'students_to_import.csv');
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1);

    console.log(`Starting import of ${rows.length} students...`);

    for (const row of rows) {
        const values = row.split(',');
        const data: any = {};
        headers.forEach((h, i) => {
            data[h] = values[i];
        });

        console.log(`Processing: ${data.first_name} ${data.last_name} (${data.email})`);

        try {
            // 1. Fetch course details for pricing
            const { data: course, error: cError } = await supabase
                .from("courses")
                .select("base_price, name")
                .eq("id", data.course_id)
                .single();

            if (cError) throw new Error(`Course not found: ${data.course_id}`);

            // 2. Create Student record
            const { data: student, error: sError } = await supabase
                .from("students")
                .insert({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    phone: data.phone,
                    country: data.country,
                    id_document: data.id_document,
                    campus_password: data.campus_password,
                    course_id: data.course_id,
                    entry_date: data.entry_date
                })
                .select()
                .single();

            if (sError) throw sError;

            // 3. Calculate next_payment_date
            const paid = parseInt(data.paid_installments);
            const total = parseInt(data.total_installments);
            const remaining = parseInt(data.remaining_installments);

            let nextPaymentDate = null;
            if (remaining > 0) {
                const entryDate = new Date(data.entry_date);
                const nextDate = new Date(entryDate);
                nextDate.setMonth(nextDate.getMonth() + paid);
                nextPaymentDate = nextDate.toISOString().split('T')[0];
            }

            // 4. Create Enrollment
            const { data: enrollment, error: eError } = await supabase
                .from("enrollments")
                .insert({
                    student_id: student.id,
                    course_id: data.course_id,
                    paid_installments: paid,
                    remaining_installments: remaining,
                    next_payment_date: nextPaymentDate,
                    preferred_payment_method: data.payment_method
                })
                .select()
                .single();

            if (eError) throw eError;

            // 5. Generate installments
            const entryDate = new Date(data.entry_date);
            const installmentPrice = Math.round((Number(course.base_price) / (total || 1)) * 100) / 100;
            const paymentsToInsert = [];

            for (let i = 0; i < total; i++) {
                const dueDate = new Date(entryDate);
                dueDate.setMonth(dueDate.getMonth() + i);
                const isPaid = i < paid;

                paymentsToInsert.push({
                    enrollment_id: enrollment.id,
                    amount: installmentPrice,
                    payment_method: data.payment_method,
                    due_date: dueDate.toISOString().split('T')[0],
                    verification_status: isPaid ? 'verified' : 'pending',
                    paid_at: isPaid ? new Date().toISOString() : null
                });
            }

            if (paymentsToInsert.length > 0) {
                const { error: payError } = await supabase
                    .from("payments")
                    .insert(paymentsToInsert);
                if (payError) throw payError;
            }

            console.log(`Successfully imported: ${data.first_name}`);
        } catch (err: any) {
            console.error(`Error importing ${data.first_name}:`, err.message);
        }
    }
}

importStudents();
