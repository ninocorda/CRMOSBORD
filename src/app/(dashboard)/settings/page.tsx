"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Database, Mail, Zap, CreditCard, Eye, EyeOff, CircleCheck, Trash2 } from "lucide-react";
import { getSystemSettingsAction, updateSystemSettingsAction } from "@/core/use-cases/actions";
import { toast } from "sonner";

export default function SettingsPage() {
    const [showKeys, setShowKeys] = useState(false);
    const [saved, setSaved] = useState(false);

    // Payment Methods State
    const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
    const [newMethod, setNewMethod] = useState("");
    const [isAddingMethod, setIsAddingMethod] = useState(false);

    React.useEffect(() => {
        getSystemSettingsAction("payment_methods").then(res => {
            if (res.success && res.data) {
                try {
                    // It can be a JSON array string or already an array
                    setPaymentMethods(typeof res.data === 'string' ? JSON.parse(res.data) : res.data);
                } catch (e) {
                    setPaymentMethods(res.data);
                }
            } else {
                setPaymentMethods(["Binance", "Zelle", "Stripe", "PayPal", "Efectivo", "Pago Móvil", "Transferencia"]);
            }
        });
    }, []);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleAddMethod = async () => {
        if (!newMethod.trim()) return;
        const updated = [...paymentMethods, newMethod.trim()];
        setPaymentMethods(updated);
        setNewMethod("");
        setIsAddingMethod(false);
        await updateSystemSettingsAction("payment_methods", updated);
        toast.success("Método de pago añadido");
    };

    const handleRemoveMethod = async (method: string) => {
        const updated = paymentMethods.filter(m => m !== method);
        setPaymentMethods(updated);
        await updateSystemSettingsAction("payment_methods", updated);
        toast.success("Método de pago eliminado");
    };

    return (
        <div className="w-full flex-1 bg-slate-50/50 dark:bg-zinc-950 p-4 md:p-8 font-[family-name:var(--font-sans)] text-slate-900 dark:text-zinc-100 pb-10 min-h-screen">
            <main className="max-w-4xl mx-auto flex flex-col gap-8">

                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ajustes del Sistema</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Configura las credenciales de integración y parámetros globales del CRM.</p>
                </div>

                {/* Supabase Config */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <Database className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle>Supabase (PostgreSQL)</CardTitle>
                                <CardDescription>Base de datos y autenticación</CardDescription>
                            </div>
                            <Badge className="ml-auto bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="supabase-url">Project URL</Label>
                            <Input id="supabase-url" placeholder="https://xyzproject.supabase.co" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="supabase-key">Anon Key (Público)</Label>
                            <div className="relative">
                                <Input id="supabase-key" type={showKeys ? "text" : "password"} placeholder="eyJhbGciOi..." />
                                <button
                                    onClick={() => setShowKeys(!showKeys)}
                                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition"
                                >
                                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Resend Config */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Resend (Email)</CardTitle>
                                <CardDescription>Correos transaccionales y recordatorios</CardDescription>
                            </div>
                            <Badge className="ml-auto bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="resend-key">API Key</Label>
                            <Input id="resend-key" type={showKeys ? "text" : "password"} placeholder="re_xxxxxxxx" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="resend-from">Remitente (From)</Label>
                            <Input id="resend-from" placeholder="notificaciones@tuinstituto.com" />
                        </div>
                    </CardContent>
                </Card>

                {/* QStash Config */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <Zap className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <CardTitle>Upstash QStash (Workers)</CardTitle>
                                <CardDescription>Jobs en segundo plano y cron jobs de cobro</CardDescription>
                            </div>
                            <Badge className="ml-auto bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="qstash-token">Token</Label>
                            <Input id="qstash-token" type={showKeys ? "text" : "password"} placeholder="ey..." />
                        </div>
                    </CardContent>
                </Card>

                {/* Stripe Config */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                <CreditCard className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <CardTitle>Stripe (Pagos Automáticos)</CardTitle>
                                <CardDescription>Billing & Subscriptions — preparado para futuro</CardDescription>
                            </div>
                            <Badge className="ml-auto bg-slate-100 text-slate-500 hover:bg-slate-100">Próximamente</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="stripe-pk">Publishable Key</Label>
                            <Input id="stripe-pk" type={showKeys ? "text" : "password"} placeholder="pk_live_..." disabled className="opacity-50" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="stripe-sk">Secret Key</Label>
                            <Input id="stripe-sk" type={showKeys ? "text" : "password"} placeholder="sk_live_..." disabled className="opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Methods Management */}
                <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-xl">Métodos de Pago Aceptados</CardTitle>
                        <CardDescription>Define qué opciones aparecen al registrar cobros manuales.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {paymentMethods.map(m => (
                                <div key={m} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 dark:bg-zinc-900 group hover:border-blue-200 transition-all">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-sm font-medium">{m}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveMethod(m)}
                                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Eliminar método"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            {isAddingMethod ? (
                                <div className="border border-blue-200 rounded-xl p-2 flex flex-col gap-2">
                                    <Input
                                        autoFocus
                                        value={newMethod}
                                        onChange={e => setNewMethod(e.target.value)}
                                        placeholder="Ej: USDT"
                                        className="h-8 text-sm"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleAddMethod();
                                            if (e.key === 'Escape') setIsAddingMethod(false);
                                        }}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" onClick={handleAddMethod} className="w-full h-7 text-xs">Guardar</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsAddingMethod(false)} className="w-full h-7 text-xs">Cancelar</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button onClick={() => setIsAddingMethod(true)} variant="outline" className="border-dashed h-full rounded-xl py-6 flex flex-col gap-1 items-center justify-center min-h-[58px]">
                                    <span className="text-xs font-bold text-blue-600">+ AÑADIR</span>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Business Parameters */}
                <Card className="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
                    <CardHeader>
                        <CardTitle className="text-lg">Parámetros del Negocio</CardTitle>
                        <CardDescription>Opciones específicas para el flujo de cobranza</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Permitir Pagos Adicionales</Label>
                                <p className="text-sm text-muted-foreground">
                                    Habilita la opción de cobrar conceptos extra (certificaciones, materiales, etc.)
                                </p>
                            </div>
                            <div className="flex items-center h-6">
                                <Input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Recordatorios Automáticos</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enviar correos 3 días antes del vencimiento (Requiere Resend activo)
                                </p>
                            </div>
                            <div className="flex items-center h-6">
                                <Input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 min-w-[200px]">
                        {saved ? (
                            <>
                                <CircleCheck className="mr-2 h-4 w-4" />
                                Guardado
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Configuración
                            </>
                        )}
                    </Button>
                </div>

            </main>
        </div>
    );
}
