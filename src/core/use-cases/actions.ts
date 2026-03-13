"use server";

import {
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getStudents,
    upsertProfile,
    getPaymentsWithStudents,
    verifyPayment,
    createEnrollment,
    createPayment,
    getEnrollmentsByStudent,
    deleteCommunication,
    deleteAllCommunications,
    markCommunicationAsRead,
    deleteStudent,
} from "@/infrastructure/database/repositories";

// ==========================================
// COURSE ACTIONS
// ==========================================
export async function getCoursesAction() {
    try {
        return { data: await getCourses(), error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

export async function createCourseAction(course: {
    name: string;
    description?: string;
    base_price: number;
    total_installments: number;
}) {
    try {
        return { data: await createCourse(course), error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

export async function updateCourseAction(id: string, updates: Record<string, unknown>) {
    try {
        return { data: await updateCourse(id, updates), error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

export async function deleteCourseAction(id: string) {
    try {
        await deleteCourse(id);
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ==========================================
// STUDENT ACTIONS
// ==========================================
export async function getStudentsAction() {
    try {
        return { data: await getStudents(), error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

export async function upsertStudentAction(profile: Record<string, unknown>) {
    try {
        return { data: await upsertProfile({ ...profile, role: "student" }), error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

export async function getStudentEnrollmentsAction(studentId: string) {
    try {
        return { data: await getEnrollmentsByStudent(studentId), error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

// ==========================================
// PAYMENT ACTIONS
// ==========================================
export async function getPaymentsAction() {
    try {
        return { data: await getPaymentsWithStudents(), error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

import { revalidatePath } from "next/cache";

export async function verifyPaymentAction(paymentId: string, referenceCode: string) {
    try {
        const result = await verifyPayment(paymentId, referenceCode);
        revalidatePath("/students");
        return { data: result, error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

// ==========================================
// ENROLLMENT ACTIONS
// ==========================================
export async function enrollStudentAction(enrollment: {
    student_id: string;
    course_id: string;
    remaining_installments: number;
    preferred_payment_method?: string;
    next_payment_date?: string;
}) {
    try {
        return { data: await createEnrollment(enrollment), error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

export async function createPaymentAction(payment: {
    enrollment_id: string;
    amount: number;
    payment_method: string;
    due_date: string;
}) {
    try {
        return { data: await createPayment(payment), error: null };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

// ==========================================
// AUTH ACTIONS
// ==========================================
import { getSupabaseClient } from "@/infrastructure/database/supabase-client";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
    try {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const supabase = await getSupabaseClient();

        if (!supabase) {
            return { error: "Configuración de Supabase faltante o incorrecta. Revisa tu archivo .env.local" };
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { error: error.message };
        }
    } catch (e: any) {
        return { error: e.message || "Error inesperado al iniciar sesión" };
    }

    // Redirect must happen outside try/catch to work correctly in Next.js Server Actions
    redirect("/");
}

export async function sendMagicLinkAction(email: string, origin: string) {
    try {
        if (email.toLowerCase() !== "osbordnet@gmail.com") {
            return { error: "Acceso denegado. Solo el administrador principal puede solicitar acceso sin contraseña." };
        }

        const supabase = await getSupabaseClient();
        if (!supabase) return { error: "Supabase no configurado" };

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Error al enviar el enlace mágico" };
    }
}

export async function registerAction(data: any) {
    try {
        const supabase = await getSupabaseClient();

        if (!supabase) {
            return { error: "Configuración de Supabase faltante o incorrecta. Revisa tu archivo .env.local" };
        }

        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    role: "student", // default role
                }
            }
        });

        if (error) {
            return { error: error.message };
        }

        // Create profile entry
        if (authData.user) {
            try {
                await upsertProfile({
                    id: authData.user.id,
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    role: "student",
                    country: data.country,
                    id_document: data.id_document,
                    phone: data.phone,
                });
            } catch (profileError: any) {
                console.error("Profile creation error:", profileError);
                // We still consider the registration successful if auth succeeded
            }
        }

        return { success: true };
    } catch (e: any) {
        console.error("Registration error:", e);
        return { error: e.message || "Error inesperado al registrar usuario" };
    }
}

import { createStudentWithEnrollment, updateStudentStatus, getSystemSettings, updateSystemSettings, updateStudent } from "@/infrastructure/database/repositories";

export async function updateStudentAction(id: string, formData: FormData) {
    try {
        const data = {
            first_name: formData.get("first_name") as string,
            last_name: formData.get("last_name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            country: formData.get("country") as string,
            id_document: formData.get("id_document") as string,
            campus_password: formData.get("campus_password") as string,
        };

        const result = await updateStudent(id, data);
        revalidatePath("/students");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error updating student:", error);
        return { success: false, error: error.message };
    }
}

export async function suspendStudentAction(id: string, status: string) {
    try {
        const result = await updateStudentStatus(id, status);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error setting student status:", error);
        return { success: false, error: error.message };
    }
}

export async function getSystemSettingsAction(key: string) {
    try {
        const result = await getSystemSettings(key);
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateSystemSettingsAction(key: string, value: any) {
    try {
        const result = await updateSystemSettings(key, value);
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function manualRegisterStudentAction(data: any) {
    try {
        const profile = await createStudentWithEnrollment(data);
        return { success: true, data: profile, error: null };
    } catch (error: any) {
        console.error("Manual registration error:", error);

        // Handle unique constraint violations for a better UX
        if (error.message?.includes("students_id_document_key")) {
            return { success: false, error: "Ya existe un alumno registrado con ese número de documento (ID Document)." };
        }
        if (error.message?.includes("students_email_key")) {
            return { success: false, error: "Ya existe un alumno registrado con ese correo electrónico." };
        }

        return { success: false, error: error.message };
    }
}

export async function logoutAction() {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
    redirect("/login");
}

// ==========================================
// COMMUNICATION ACTIONS
// ==========================================
export async function deleteCommunicationAction(id: string) {
    try {
        await deleteCommunication(id);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteAllCommunicationsAction() {
    try {
        await deleteAllCommunications();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markCommunicationAsReadAction(id: string) {
    try {
        await markCommunicationAsRead(id);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteStudentAction(id: string) {
    try {
        await deleteStudent(id);
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
