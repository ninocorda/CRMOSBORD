export type UserRole = 'admin' | 'professor' | 'secretariat' | 'student';

export interface Profile {
    id: string; // UUID from auth.users
    role: UserRole;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country?: string;
    id_document?: string;
    campus_password?: string;
    entry_date: string; // ISO Date String
    created_at: string;
    updated_at: string;
    communications?: CommunicationLog[];
}

export interface Course {
    id: string;
    name: string;
    description?: string;
    base_price: number;
    total_installments: number;
    created_at: string;
}

export interface Enrollment {
    id: string;
    student_id: string;
    course_id: string;
    paid_installments: number;
    remaining_installments: number;
    next_payment_date?: string;
    preferred_payment_method?: string;
    status: 'active' | 'completed' | 'suspended';
    created_at: string;

    // Relations
    student?: Profile;
    course?: Course;
}

export interface Payment {
    id: string;
    enrollment_id: string;
    amount: number;
    payment_method: 'zelle' | 'binance' | 'pago_movil' | 'stripe';
    verification_status: 'pending' | 'verified' | 'rejected';
    reference_code?: string;
    stripe_payment_intent_id?: string;
    due_date: string; // ISO Date String
    paid_at?: string;
    created_at: string;

    // Relations
    enrollment?: Enrollment;
}

export interface CommunicationLog {
    id: string;
    user_id?: string;
    student_id?: string;
    type: string;
    direction: 'inbound' | 'outbound';
    subject?: string;
    content?: string;
    snippet?: string;
    external_id?: string;
    from_email?: string;
    to_email?: string;
    read_status: boolean;
    sent_at: string;
}
