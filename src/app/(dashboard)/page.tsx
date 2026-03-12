"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { CalendarAR } from "@/presentation/modules/calendar/CalendarAR";
import { PaymentVerificationModal } from "@/presentation/modules/finance/PaymentVerificationModal";
import { FinancialOverview } from "@/presentation/modules/dashboard/FinancialOverview";
import type { Payment, Profile, Enrollment } from "@/core/entities/types";
import { getStudentsAction, getCoursesAction, getPaymentsAction, verifyPaymentAction } from "@/core/use-cases/actions";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [stats, setStats] = useState({ students: 0, courses: 0, pendingPayments: 0 });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const loadDashboardData = async () => {
    setIsLoading(true);
    const [studentsRes, coursesRes, paymentsRes] = await Promise.all([
      getStudentsAction(),
      getCoursesAction(),
      getPaymentsAction()
    ]);

    const totalSoldMasters = studentsRes.data?.reduce((acc: number, student: any) => {
      return acc + (student.enrollments?.length || 0);
    }, 0) || 0;

    setStats({
      students: studentsRes.data?.length || 0,
      courses: totalSoldMasters,
      pendingPayments: paymentsRes.data?.filter((p: any) => p.verification_status === 'pending').length || 0
    });

    setRecentPayments(paymentsRes.data || []);
    setStudentsData(studentsRes.data || []);
    setIsLoading(false);
  };

  React.useEffect(() => {
    loadDashboardData();
  }, []);

  const handleVerify = async (id: string, ref: string) => {
    const { error } = await verifyPaymentAction(id, ref);
    if (error) {
      toast.error("Error al verificar", { description: error });
    } else {
      toast.success("Pago verificado");
      setSelectedPaymentId(null);
      loadDashboardData(); // Recargar tras verificar
    }
  };

  return (
    <div className="w-full flex-1 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/40 via-white to-slate-50 dark:from-slate-900 dark:via-zinc-950 dark:to-zinc-950 p-4 md:p-8 font-[family-name:var(--font-sans)] text-slate-900 dark:text-zinc-100 pb-10">

      <main className="max-w-[1600px] mx-auto flex flex-col gap-8">

        {/* Simple Header */}
        <div className="flex flex-col gap-1 items-start mt-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
            Panel de Control
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Resumen general de la actividad de Instituto Osbord
          </p>
        </div>

        {/* Stats Summary Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm flex flex-col gap-2">
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Alumnos Totales</span>
            <span className="text-4xl font-extrabold">{isLoading ? <Skeleton className="h-10 w-20" /> : stats.students}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm flex flex-col gap-2">
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Masters Vendidos</span>
            <span className="text-4xl font-extrabold">{isLoading ? <Skeleton className="h-10 w-20" /> : stats.courses}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm flex flex-col gap-2 border-amber-100 bg-amber-50/20 dark:border-amber-900/30">
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">Cuotas por Cobrar</span>
            <span className="text-4xl font-extrabold text-amber-600">{isLoading ? <Skeleton className="h-10 w-20" /> : stats.pendingPayments}</span>
          </div>
        </div>

        {/* Dos columnas de Módulos (CRM y Pagos) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full mt-4">

          {/* Columna Izquierda: Financial Overview */}
          <div className="xl:col-span-12 2xl:col-span-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <FinancialOverview students={studentsData} />
          </div>

          {/* Columna Derecha: Motor Financiero */}
          <div className="xl:col-span-12 2xl:col-span-4 animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-sans">Mapa de Cobranzas</h3>
                <p className="text-muted-foreground text-sm">Vencimientos detectados</p>
              </div>
            </div>
            <div className="sticky top-24">
              <CalendarAR
                payments={recentPayments}
                onEventClick={(id) => setSelectedPaymentId(id)}
              />
            </div>
          </div>

        </div>

      </main>

      {/* Verification Modal Layer */}
      <PaymentVerificationModal
        isOpen={!!selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
        payment={selectedPaymentId ? recentPayments.find(p => p.id === selectedPaymentId) : null}
        onVerify={handleVerify}
      />
    </div>
  );
}
