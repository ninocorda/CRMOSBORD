"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Globe, CreditCard, BookOpen, Calendar, Lock, DollarSign, ChevronLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { getCoursesAction, manualRegisterStudentAction } from "@/core/use-cases/actions";

const PAYMENT_METHODS = [
    "Binance",
    "Zelle",
    "Transferencia Bancaria",
    "Stripe",
    "PayPal",
    "Efectivo",
    "Pago Móvil (Venezuela)"
];

export default function AddStudentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [totalInstallments, setTotalInstallments] = useState(1);
    const [paidInstallments, setPaidInstallments] = useState(0);
    const [remainingInstallments, setRemainingInstallments] = useState(1);

    useEffect(() => {
        const fetchCourses = async () => {
            const { data, error } = await getCoursesAction();
            if (error) {
                toast.error("Error al cargar cursos", { description: error });
            }
            setCourses(data || []);
        };
        fetchCourses();

        // Set default date on client only to avoid hydration mismatch
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('entry_date') as HTMLInputElement;
        if (dateInput) dateInput.value = today;
    }, []);

    useEffect(() => {
        if (selectedCourseId) {
            const course = courses.find(c => c.id === selectedCourseId);
            if (course) {
                setTotalInstallments(course.total_installments || 1);
            }
        }
    }, [selectedCourseId, courses]);

    useEffect(() => {
        setRemainingInstallments(Math.max(0, totalInstallments - paidInstallments));
    }, [totalInstallments, paidInstallments]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const entryDate = new FormData(e.currentTarget).get("entry_date") as string;
        const nextPayment = new Date(entryDate);
        nextPayment.setMonth(nextPayment.getMonth() + 1);

        const submissionData = {
            ...data,
            course_id: selectedCourseId,
            total_installments: Number(data.total_installments),
            paid_installments: Number(data.paid_installments),
            remaining_installments: Number(data.remaining_installments),
            amount_paid: Number(data.amount_paid) || 0,
            payment_method: selectedPaymentMethod,
            next_payment_date: nextPayment.toISOString().split('T')[0],
        };

        if (!selectedCourseId) {
            toast.error("Selección faltante", { description: "Por favor selecciona un curso." });
            setIsLoading(false);
            return;
        }

        const res = await manualRegisterStudentAction(submissionData);
        if (res.error) {
            toast.error("Error al registrar", { description: res.error });
            setIsLoading(false);
        } else {
            toast.success("Alumno registrado", { description: "Datos guardados correctamente en el sistema." });
            router.push("/students");
        }
    };

    return (
        <div className="w-full flex-1 bg-slate-50/50 dark:bg-zinc-950 p-4 md:p-8 font-[family-name:var(--font-sans)] text-slate-900 dark:text-zinc-100 pb-10 min-h-screen">
            <main className="max-w-4xl mx-auto flex flex-col gap-6">

                <div className="flex items-center gap-4">
                    <Button render={<Link href="/students" />} variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Nuevo Alumno</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Registro manual de datos (No crea cuenta de acceso).</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Data */}
                    <Card className="md:col-span-1 shadow-sm border-0 ring-1 ring-slate-200 dark:ring-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Datos Personales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">Nombre *</Label>
                                    <Input id="first_name" name="first_name" placeholder="María" required disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Apellido *</Label>
                                    <Input id="last_name" name="last_name" placeholder="Pérez" required disabled={isLoading} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico *</Label>
                                <Input id="email" name="email" type="email" placeholder="maria@example.com" required disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="id_document">Cédula / ID</Label>
                                    <Input id="id_document" name="id_document" placeholder="V-12345678" disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input id="phone" name="phone" placeholder="+58 412..." disabled={isLoading} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">País</Label>
                                <Input id="country" name="country" placeholder="Venezuela" disabled={isLoading} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academy Data */}
                    <Card className="md:col-span-1 shadow-sm border-0 ring-1 ring-slate-200 dark:ring-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                                Datos Académicos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Curso / Master *</Label>
                                <Select onValueChange={(val: string | null) => setSelectedCourseId(val || "")} value={selectedCourseId} disabled={isLoading}>
                                    <SelectTrigger className="w-full h-auto min-h-10 py-2">
                                        <SelectValue className="whitespace-normal text-left" placeholder="Selecciona un curso">
                                            {selectedCourseId && courses.find(c => c.id === selectedCourseId)?.name}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => (
                                            <SelectItem key={c.id} value={c.id} label={c.name} className="h-auto py-2">
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="campus_password">Contraseña Campus Virtual</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="campus_password" name="campus_password" placeholder="Pass de Ref." className="pl-10" disabled={isLoading} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="entry_date">Fecha de Ingreso *</Label>
                                <Input id="entry_date" name="entry_date" type="date" className="h-10" disabled={isLoading} required />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Data */}
                    <Card className="md:col-span-2 shadow-sm border-0 ring-1 ring-slate-200 dark:ring-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-blue-600" />
                                Plan de Pagos Integral
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="total_installments">Cuotas Totales</Label>
                                    <Input id="total_installments" name="total_installments" type="number" value={totalInstallments} onChange={(e) => setTotalInstallments(Number(e.target.value))} min="1" required disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paid_installments">Cuotas Pagadas</Label>
                                    <Input id="paid_installments" name="paid_installments" type="number" value={paidInstallments} onChange={(e) => setPaidInstallments(Number(e.target.value))} min="0" required disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="remaining_installments">Cuotas Restantes</Label>
                                    <Input id="remaining_installments" name="remaining_installments" type="number" value={remainingInstallments} readOnly className="bg-slate-50 dark:bg-zinc-800 pointer-events-none" required disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Método de Pago *</Label>
                                    <Select onValueChange={(val: string | null) => setSelectedPaymentMethod(val || "")} disabled={isLoading}>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder="Selecciona método" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map(m => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                        <Button render={<Link href="/students" />} variant="outline" type="button" disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 min-w-[200px]" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isLoading ? "Guardando..." : "Guardar Alumno"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
