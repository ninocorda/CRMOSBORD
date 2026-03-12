"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Phone, MapPin, CalendarDays, CreditCard, GraduationCap, Loader2, MessageSquare, ArrowDownLeft, ArrowUpRight, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifyPaymentAction } from '@/core/use-cases/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Profile, Enrollment, Payment } from '@/core/entities/types';
import { createBrowserSupabaseClient } from '@/infrastructure/database/supabase-browser';

// =============================================
// Student Messages Sub-Component
// =============================================
function StudentMessages({ studentId, studentEmail }: { studentId: string; studentEmail: string }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createBrowserSupabaseClient();

    useEffect(() => {
        const loadMessages = async () => {
            setIsLoading(true);
            try {
                // Query by student_id OR by matching email (from_email or to_email)
                const { data, error } = await supabase
                    .from('communications_log')
                    .select('*')
                    .or(`student_id.eq.${studentId},from_email.eq.${studentEmail},to_email.eq.${studentEmail}`)
                    .order('sent_at', { ascending: false });

                if (error) throw error;
                setMessages(data || []);
            } catch (err) {
                console.error('Error loading student messages:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadMessages();
    }, [studentId, studentEmail]);

    if (isLoading) {
        return (
            <Card className="border-none shadow-xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md overflow-hidden">
                <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    <p className="text-sm text-slate-500 mt-3 italic">Cargando mensajes...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-950/50 border-b pb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Historial de Comunicación</CardTitle>
                        <CardDescription className="italic text-xs mt-1">Registro cronológico de todos los correos e interacciones con el alumno.</CardDescription>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <Mail className="h-5 w-5" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {messages.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-zinc-950 text-slate-300 mb-4 border border-slate-100 dark:border-zinc-800">
                            <MessageSquare className="h-8 w-8" />
                        </div>
                        <p className="font-bold text-slate-900 dark:text-zinc-100 italic">Sin conversaciones registradas</p>
                        <p className="text-xs text-slate-500 italic mt-1">Los correos que envíes o recibas desde la bandeja de entrada aparecerán aquí.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {messages.map((comm: any) => (
                            <div key={comm.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-zinc-950/30 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${comm.direction === 'inbound' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40'}`}>
                                        {comm.direction === 'inbound' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-black text-slate-900 dark:text-zinc-50 truncate pr-4">
                                                {comm.subject || "(Sin Asunto)"}
                                            </p>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0 italic">
                                                {new Date(comm.sent_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 uppercase font-bold tracking-widest ${comm.direction === 'inbound' ? 'border-blue-200 text-blue-600 bg-blue-50/50' : 'border-emerald-200 text-emerald-600 bg-emerald-50/50'}`}>
                                                {comm.direction === 'inbound' ? 'Recibido' : 'Enviado'}
                                            </Badge>
                                            <span className="text-[11px] text-slate-500 italic">de: {comm.from_email}</span>
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                                            {comm.snippet || comm.content?.substring(0, 200)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =============================================
// Student Profile Main Component
// =============================================
interface StudentProfileProps {
    student: Profile;
    enrollments: (Enrollment & {
        course?: { name: string, total_installments: number },
        payments?: Payment[]
    })[];
    onUpdate?: () => void;
}

export function StudentProfile({ student, enrollments, onUpdate }: StudentProfileProps) {
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);

    // Helpers
    const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`;

    const handlePaymentVerify = async (paymentId: string) => {
        setIsVerifying(paymentId);
        try {
            const res = await verifyPaymentAction(paymentId, "MANUAL-PROFILE-" + new Date().getTime());
            if (res.error) {
                toast.error("Error al verificar pago", { description: res.error });
            } else {
                toast.success("Pago verificado correctamente");
                startTransition(() => {
                    router.refresh();
                    if (onUpdate) onUpdate();
                });
            }
        } catch (error: any) {
            toast.error("Error inesperado", { description: error.message });
        } finally {
            setIsVerifying(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-700">

            {/* HEADER CARD - Perfil General */}
            <Card className="shadow-lg border-primary/20 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">

                        <Avatar className="h-28 w-28 ring-4 ring-primary/20 shadow-xl">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.first_name} ${student.last_name}`} />
                            <AvatarFallback className="text-3xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold tracking-tight">{student.first_name} {student.last_name}</h2>
                                <Badge variant={student.role === 'student' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider">
                                    {student.role}
                                </Badge>
                                {(student as any).status === 'suspended' && (
                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100 uppercase text-[10px] tracking-wider">
                                        Suspendido
                                    </Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <Mail className="h-4 w-4" /> {student.email}
                            </p>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 dark:text-slate-400">
                                {student.phone && (
                                    <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {student.phone}</div>
                                )}
                                {student.country && (
                                    <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {student.country}</div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <CalendarDays className="h-4 w-4" /> Ingreso: {new Date(student.entry_date).toLocaleDateString()}
                                </div>
                                {student.id_document && (
                                    <div className="flex items-center gap-1.5 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                                        Cédula: {student.id_document}
                                    </div>
                                )}
                                {student.campus_password && (
                                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-lg text-xs">
                                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                                        <span className="font-semibold text-amber-800 dark:text-amber-300">Contraseña Campus:</span>
                                        <span className="font-mono font-bold text-amber-900 dark:text-amber-200">
                                            {showPassword ? student.campus_password : '••••••••'}
                                        </span>
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="ml-1 text-amber-600 hover:text-amber-800 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 shadow-inner">
                            <div className="text-center px-4">
                                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{enrollments.length}</p>
                                <p className="text-xs uppercase tracking-wider text-blue-800/60 dark:text-blue-200/50 font-semibold mt-1">Cursos</p>
                            </div>
                            <Separator orientation="vertical" className="h-auto bg-blue-200/50 dark:bg-blue-800/50" />
                            <div className="text-center px-4">
                                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                    {enrollments.reduce((acc, sum) => acc + (sum.paid_installments || 0), 0)}
                                </p>
                                <p className="text-xs uppercase tracking-wider text-indigo-800/60 dark:text-indigo-200/50 font-semibold mt-1">Cuotas Pagadas</p>
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* Tabs Multi-Master Control */}
            <Tabs defaultValue={enrollments[0]?.id || 'none'} className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
                    {enrollments.map((enr) => (
                        <TabsTrigger
                            key={enr.id}
                            value={enr.id}
                            className="px-6 py-3 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 gap-2 font-medium"
                        >
                            <GraduationCap className="h-4 w-4" />
                            {enr.course?.name || 'Curso'}
                        </TabsTrigger>
                    ))}
                    <TabsTrigger
                        value="messages"
                        className="px-6 py-3 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300 gap-2 font-medium"
                    >
                        <MessageSquare className="h-4 w-4" />
                        Mensajes
                    </TabsTrigger>
                    {enrollments.length === 0 && (
                        <TabsTrigger value="none" disabled>No hay masters inscritos</TabsTrigger>
                    )}
                </TabsList>

                {enrollments.map((enr) => {
                    const paidCount = enr.payments?.filter(p => p.verification_status === 'verified').length || 0;
                    const totalCount = (enr.paid_installments || 0) + (enr.remaining_installments || 0) || enr.course?.total_installments || 1;
                    const remainingCount = totalCount - paidCount;

                    return (
                        <TabsContent key={enr.id} value={enr.id} className="mt-6 flex flex-col gap-6 outline-none">

                            {/* Info Metrics Enrollment */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Resumen Cuotas */}
                                <Card className="col-span-1 border-none shadow-md bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/20 dark:to-green-900/20">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Progreso de Pagos</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                                    {paidCount}
                                                </span>
                                                <span className="text-sm text-emerald-700/60 dark:text-emerald-400/60">/ {totalCount} Cuotas</span>
                                            </div>
                                            <span className="text-xs font-semibold text-emerald-900/50 dark:text-emerald-200/50 uppercase mt-2">
                                                {remainingCount} Restantes
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="col-span-1 border-none shadow-md bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/20 dark:to-amber-900/20">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Próximo Pago</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">
                                                    {enr.next_payment_date ? new Date(enr.next_payment_date).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900/60 dark:text-orange-200/60 mt-3">
                                                <CreditCard className="h-3.5 w-3.5" /> Metodo Pref: <span className="uppercase">{enr.preferred_payment_method}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Historial de Pagos de la Ficha */}
                            <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        Historial de Pagos
                                        <Badge variant={enr.status === 'active' ? 'default' : 'secondary'} className="uppercase text-xs">{enr.status}</Badge>
                                    </CardTitle>
                                    <CardDescription>Resumen de todas las cuotas procesadas para este diplomado/master.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent bg-slate-50/50 dark:bg-slate-900/50">
                                                <TableHead className="font-semibold px-6">ID Pago / Ref</TableHead>
                                                <TableHead className="font-semibold">Vencimiento</TableHead>
                                                <TableHead className="font-semibold">Monto</TableHead>
                                                <TableHead className="font-semibold">Método</TableHead>
                                                <TableHead className="font-semibold text-right px-6">Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(!enr.payments || enr.payments.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se han registrado pagos aún.</TableCell>
                                                </TableRow>
                                            ) : (
                                                enr.payments.map((p) => (
                                                    <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <TableCell className="font-mono text-xs px-6">
                                                            {p.reference_code || p.id.split('-')[0]}
                                                        </TableCell>
                                                        <TableCell>{new Date(p.due_date).toLocaleDateString()}</TableCell>
                                                        <TableCell className="font-semibold">${p.amount.toFixed(2)}</TableCell>
                                                        <TableCell className="uppercase text-xs font-medium text-slate-500">{p.payment_method}</TableCell>
                                                        <TableCell className="text-right px-6">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`uppercase text-[10px] tracking-wider font-bold ${p.verification_status === 'verified' ? 'border-green-500 text-green-600 bg-green-50' :
                                                                        p.verification_status === 'rejected' ? 'border-red-500 text-red-600 bg-red-50' :
                                                                            'border-amber-500 text-amber-600 bg-amber-50'
                                                                        }`}
                                                                >
                                                                    {p.verification_status}
                                                                </Badge>
                                                                {p.verification_status === 'pending' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handlePaymentVerify(p.id);
                                                                        }}
                                                                        disabled={isVerifying === p.id}
                                                                    >
                                                                        {isVerifying === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verificar"}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                        </TabsContent>
                    );
                })}
                {/* MESSAGES TAB CONTENT */}
                <TabsContent value="messages" className="mt-6 animate-in slide-in-from-bottom-2 duration-500 outline-none">
                    <StudentMessages studentId={student.id} studentEmail={student.email} />
                </TabsContent>
            </Tabs>

        </div>
    );
}
