"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { CalendarAR } from "@/presentation/modules/calendar/CalendarAR";
import { PaymentVerificationModal } from "@/presentation/modules/finance/PaymentVerificationModal";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaymentsAction, verifyPaymentAction, getStudentsAction } from "@/core/use-cases/actions"; // ADD

// Dummy data removed, using getPaymentsAction instead

function getStatusBadge(status: string) {
    switch (status) {
        case "verified":
            return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100">Verificado</Badge>;
        case "pending":
            return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100">Pendiente</Badge>;
        case "rejected":
            return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100">Rechazado</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

export default function ReceivablesPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        const [paymentsRes, studentsRes] = await Promise.all([
            getPaymentsAction(),
            getStudentsAction()
        ]);

        if (paymentsRes.error) {
            toast.error("Error al cargar pagos", { description: paymentsRes.error });
            setPayments([]);
        } else {
            setPayments(paymentsRes.data || []);
        }

        if (!studentsRes.error) {
            setStudentsData(studentsRes.data || []);
        }

        setIsLoading(false);
    };

    React.useEffect(() => {
        loadData();
    }, []);

    const handleVerify = async (id: string, ref: string) => {
        const { error } = await verifyPaymentAction(id, ref);
        if (error) {
            toast.error("Error al verificar", { description: error });
        } else {
            toast.success("Pago verificado con éxito");
            setSelectedPaymentId(null);
            loadData();
        }
    };

    // Calculate metrics exactly as the Dashboard (FinancialOverview) does
    let totalVendidos = 0;
    let totalPorCobrar = 0;
    let totalVencidos = 0;
    const now = new Date();

    studentsData.forEach(student => {
        student.enrollments?.forEach((enr: any) => {
            enr.payments?.forEach((pay: any) => {
                const amount = Number(pay.amount) || 0;
                const isPaid = pay.verification_status === 'verified';
                const dueDate = new Date(pay.due_date);

                if (isPaid) {
                    totalVendidos += amount;
                } else {
                    totalPorCobrar += amount;
                    if (dueDate < now) {
                        totalVencidos += amount;
                    }
                }
            });
        });
    });

    return (
        <div className="w-full flex-1 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50/30 via-white to-slate-50 dark:from-slate-900 dark:via-zinc-950 dark:to-zinc-950 p-4 md:p-8 font-[family-name:var(--font-sans)] text-slate-900 dark:text-zinc-100 pb-10 min-h-screen">
            <main className="max-w-[1600px] mx-auto flex flex-col gap-8">

                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cuentas por Cobrar</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Vista consolidada de pagos pendientes, verificados y atrasados.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Transacciones</p>
                        <p className="text-2xl font-bold mt-1">{isLoading ? "..." : payments.length}</p>
                    </div>
                    <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Por Cobrar</p>
                        <p className="text-2xl font-bold mt-1 text-amber-600">${totalPorCobrar.toFixed(0)}</p>
                    </div>
                    <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm border-red-100 dark:border-red-900/30">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold text-red-600/80">Vencido</p>
                        <p className="text-2xl font-bold mt-1 text-red-600">${totalVencidos.toFixed(0)}</p>
                    </div>
                    <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Cobrado</p>
                        <p className="text-2xl font-bold mt-1 text-emerald-600">${totalVendidos.toFixed(0)}</p>
                    </div>
                    <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Pendientes</p>
                        <p className="text-2xl font-bold mt-1 text-blue-600">{isLoading ? "..." : payments.filter(p => p.verification_status === "pending").length}</p>
                    </div>
                </div>

                {/* Two columns: Table + Calendar */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* Payments Table */}
                    <div className="xl:col-span-7">
                        <div className="bg-white dark:bg-zinc-900 border rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b bg-slate-50/50 dark:bg-zinc-950/50">
                                <h3 className="font-semibold">Detalle de Pagos</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 dark:bg-zinc-950/50 hover:bg-transparent">
                                            <TableHead>Alumno</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Vencimiento</TableHead>
                                            <TableHead>Método</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                                    <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-10 w-20" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : payments.filter(p => p.verification_status === "pending").map((payment: any) => (
                                            <TableRow
                                                key={payment.id}
                                                className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
                                                onClick={() => setSelectedPaymentId(payment.id)}
                                            >
                                                <TableCell className="font-medium">
                                                    {payment.enrollment?.student?.first_name} {payment.enrollment?.student?.last_name}
                                                </TableCell>
                                                <TableCell className="font-mono">${Number(payment.amount).toFixed(2)}</TableCell>
                                                <TableCell className="text-sm">
                                                    {new Date(payment.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                                </TableCell>
                                                <TableCell className="capitalize text-sm">{payment.payment_method}</TableCell>
                                                <TableCell>{getStatusBadge(payment.verification_status)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="xl:col-span-5">
                        <CalendarAR
                            payments={payments.filter(p => p.verification_status === "pending")}
                            onEventClick={(id) => setSelectedPaymentId(id)}
                        />
                    </div>
                </div>

            </main>

            <PaymentVerificationModal
                isOpen={!!selectedPaymentId}
                onClose={() => setSelectedPaymentId(null)}
                payment={selectedPaymentId ? payments.find(p => p.id === selectedPaymentId) : null}
                onVerify={handleVerify}
            />
        </div>
    );
}
