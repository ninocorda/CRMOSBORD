import { getSupabaseClient } from "./supabase-client";

async function getClient() {
    const supabase = await getSupabaseClient();
    if (!supabase) {
        throw new Error("Conexión a base de datos no disponible. Verifica tus credenciales de Supabase en .env.local y reinicia el proyecto.");
    }
    return supabase;
}

// ==========================================
// PROFILES REPOSITORY
// ==========================================
export async function getProfiles() {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
}

export async function getProfileById(id: string) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw error;
    return data;
}

export async function getStudents() {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("students")
        .select("*, enrollments:enrollments(*, course:courses(name, total_installments, base_price), payments(*)), communications:communications_log(*)")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
}

export async function updateStudentStatus(id: string, status: string) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("students")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateStudent(id: string, data: Record<string, any>) {
    const supabase = await getClient();
    const { data: updatedData, error } = await supabase
        .from("students")
        .update(data)
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return updatedData;
}

export async function upsertProfile(profile: Record<string, unknown>) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("profiles")
        .upsert(profile)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ==========================================
// COURSES REPOSITORY
// ==========================================
export async function getCourses() {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
}

export async function getCourseById(id: string) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw error;
    return data;
}

export async function createCourse(course: {
    name: string;
    description?: string;
    base_price: number;
    total_installments: number;
}) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("courses")
        .insert(course)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateCourse(id: string, updates: Record<string, unknown>) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteCourse(id: string) {
    const supabase = await getClient();
    const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

// ==========================================
// ENROLLMENTS REPOSITORY
// ==========================================
export async function getEnrollmentsByStudent(studentId: string) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("enrollments")
        .select("*, course:courses(*), payments(*)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
}

export async function createEnrollment(enrollment: {
    student_id: string;
    course_id: string;
    remaining_installments: number;
    preferred_payment_method?: string;
    next_payment_date?: string;
}) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("enrollments")
        .insert(enrollment)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ==========================================
// PAYMENTS REPOSITORY
// ==========================================
export async function getPaymentsWithStudents() {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("payments")
        .select("*, enrollment:enrollments(student:students(first_name, last_name, email))")
        .order("due_date", { ascending: true });

    if (error) throw error;
    return data;
}

export async function getPendingPayments() {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("payments")
        .select("*, enrollment:enrollments(student:students(first_name, last_name, email))")
        .eq("verification_status", "pending")
        .order("due_date", { ascending: true });
    if (error) throw error;
    return data;
}

export async function verifyPayment(paymentId: string, referenceCode: string) {
    const supabase = await getClient();

    // 1. Get payment details to know the enrollment_id
    const { data: payment, error: pError } = await supabase
        .from("payments")
        .select("enrollment_id, verification_status")
        .eq("id", paymentId)
        .single();

    if (pError) throw pError;
    if (payment.verification_status === "verified") return payment;

    // 2. Update the payment
    const { data, error } = await supabase
        .from("payments")
        .update({
            verification_status: "verified",
            reference_code: referenceCode,
            paid_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .select()
        .single();
    if (error) throw error;

    // 3. Update the enrollment counts
    // We increment paid and decrement remaining
    const { error: eError } = await supabase.rpc('increment_enrollment_progress', {
        p_enrollment_id: payment.enrollment_id
    });

    // Fallback if RPC doesn't exist yet (let's create the RPC in a migration or use direct update)
    if (eError) {
        console.warn("RPC increment_enrollment_progress failed, attempting direct update:", eError.message);
        // Direct update approach (less atomic but works if RPC is missing)
        const { data: enr } = await supabase.from("enrollments").select("paid_installments, remaining_installments").eq("id", payment.enrollment_id).single();
        if (enr) {
            // Find the next pending payment after the one we just verified
            const { data: nextPayment } = await supabase
                .from("payments")
                .select("due_date")
                .eq("enrollment_id", payment.enrollment_id)
                .eq("verification_status", "pending")
                .gt("due_date", data.due_date)
                .order("due_date", { ascending: true })
                .limit(1)
                .maybeSingle();

            await supabase.from("enrollments").update({
                paid_installments: (enr.paid_installments || 0) + 1,
                remaining_installments: Math.max(0, (enr.remaining_installments || 0) - 1),
                next_payment_date: nextPayment?.due_date || null
            }).eq("id", payment.enrollment_id);
        }
    } else {
        // If RPC succeeded, we still need to update the next_payment_date if the RPC doesn't do it
        // (Assuming the RPC only increments counts, let's fix the next_payment_date here too)
        const { data: nextPayment } = await supabase
            .from("payments")
            .select("due_date")
            .eq("enrollment_id", payment.enrollment_id)
            .eq("verification_status", "pending")
            .gt("due_date", data.due_date)
            .order("due_date", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (nextPayment) {
            await supabase.from("enrollments").update({
                next_payment_date: nextPayment.due_date
            }).eq("id", payment.enrollment_id);
        }
    }

    return data;
}

export async function createPayment(payment: {
    enrollment_id: string;
    amount: number;
    payment_method: string;
    due_date: string;
}) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("payments")
        .insert(payment)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ==========================================
// COMMUNICATIONS LOG REPOSITORY
// ==========================================
export async function logCommunication(entry: {
    student_id?: string;
    type: string;
    direction: 'inbound' | 'outbound';
    subject: string;
    content: string;
    snippet?: string;
    from_email?: string;
    to_email?: string;
    external_id?: string;
}) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("communications_log")
        .upsert({
            ...entry,
            sent_at: new Date().toISOString()
        }, {
            onConflict: 'external_id'
        })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteCommunication(id: string) {
    const supabase = await getClient();
    const { error } = await supabase
        .from("communications_log")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

export async function deleteAllCommunications() {
    const supabase = await getClient();
    const { error } = await supabase
        .from("communications_log")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Standard way to target all
    if (error) throw error;
}

export async function markCommunicationAsRead(id: string) {
    const supabase = await getClient();
    const { error } = await supabase
        .from("communications_log")
        .update({ read_status: true })
        .eq("id", id);
    if (error) throw error;
}
// ==========================================
// COMPLEX FLOWS
// ==========================================
export async function createStudentWithEnrollment(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country?: string;
    id_document?: string;
    campus_password?: string;
    entry_date?: string;
    course_id: string;
    total_installments: number;
    paid_installments: number;
    remaining_installments: number;
    next_payment_date: string;
    payment_method: string;
    amount_paid: number;
}) {
    const supabase = await getClient();

    // 1. Fetch course details for pricing
    const { data: course, error: cError } = await supabase
        .from("courses")
        .select("base_price, name")
        .eq("id", data.course_id)
        .single();

    if (cError) throw cError;

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
            entry_date: data.entry_date || new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

    if (sError) throw sError;

    // 3. Create Enrollment
    const { data: enrollment, error: eError } = await supabase
        .from("enrollments")
        .insert({
            student_id: student.id,
            course_id: data.course_id,
            paid_installments: data.paid_installments,
            remaining_installments: data.remaining_installments,
            next_payment_date: data.next_payment_date,
            preferred_payment_method: data.payment_method
        })
        .select()
        .single();

    if (eError) throw eError;

    // 4. Generate all installments in the payments table
    // Each installment is monthly starting from entry_date
    const entryDate = new Date(data.entry_date || new Date().toISOString().split('T')[0]);
    const installmentPrice = Math.round((Number(course.base_price) / (data.total_installments || 1)) * 100) / 100;

    const paymentsToInsert = [];

    for (let i = 0; i < data.total_installments; i++) {
        const dueDate = new Date(entryDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const isPaid = i < data.paid_installments;

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

    return student;
}

// ==========================================
// SYSTEM SETTINGS REPOSITORY
// ==========================================
export async function getSystemSettings(key: string) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
    // if not found, we don't throw, we just return null or undefined so the caller handles it
    if (error && error.code !== 'PGRST116') throw error;
    return data?.value || null;
}

export async function updateSystemSettings(key: string, value: any) {
    const supabase = await getClient();
    const { data, error } = await supabase
        .from("system_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteStudent(id: string) {
    const supabase = await getClient();

    // Although the schema should handle ON DELETE CASCADE, 
    // we explicitly delete to ensure clean cleanup across all related tables
    // 1. Delete associated payments via enrollments
    const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", id);

    if (enrollments && enrollments.length > 0) {
        const enrollmentIds = enrollments.map((e: any) => e.id);
        await supabase.from("payments").delete().in("enrollment_id", enrollmentIds);
    }

    // 2. Delete enrollments
    await supabase.from("enrollments").delete().eq("student_id", id);

    // 3. Delete communications
    await supabase.from("communications_log").delete().eq("user_id", id);
    await supabase.from("communications_log").delete().eq("student_id", id);

    // 4. Finally delete the student
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;

    return { success: true };
}
