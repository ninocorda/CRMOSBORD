"use client";

import React, { useState } from "react";
import { BookOpen, Mail, Lock, Eye, EyeOff, User, Phone, Globe, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { registerAction } from "@/core/use-cases/actions";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await registerAction(data);
            if (res?.error) {
                toast.error("Error al registrar", { description: res.error });
            } else {
                toast.success("Registro exitoso", { description: "Alumno registrado correctamente." });
                router.push("/students");
            }
        } catch (error: any) {
            toast.error("Error de conexión", { description: "No se pudo conectar con el servidor." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-white to-blue-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-slate-950 p-4">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center justify-center w-24 h-24 mb-4">
                        <img src="/logo-osbord.png" alt="Osbord Logo" className="size-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">CRM OSBORD</h1>
                    <p className="text-sm text-muted-foreground mt-1">Registro de nuevo usuario</p>
                </div>

                <Card className="shadow-xl border-0 shadow-slate-200/60 dark:shadow-zinc-900/60">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl">Formulario de Registro</CardTitle>
                        <CardDescription>Completa los datos del alumno o miembro del staff</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">Nombre *</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="first_name" name="first_name" placeholder="María" className="pl-10" required disabled={isLoading} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Apellido *</Label>
                                    <Input id="last_name" name="last_name" placeholder="Pérez" required disabled={isLoading} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="email" name="email" type="email" placeholder="maria@example.com" className="pl-10" required disabled={isLoading} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="phone" name="phone" placeholder="+58 414..." className="pl-10" disabled={isLoading} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">País</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="country" name="country" placeholder="Venezuela" className="pl-10" disabled={isLoading} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="id_document">Cédula de Identidad</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="id_document" name="id_document" placeholder="V-12345678" className="pl-10" disabled={isLoading} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña *</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" className="pl-10 pr-10" required disabled={isLoading} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={isLoading}>
                                {isLoading ? "Registrando..." : "Crear Cuenta"}
                                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>

                        <p className="text-center text-xs text-muted-foreground mt-6">
                            ¿Ya tienes cuenta?{" "}
                            <Link href="/login" className="text-blue-600 hover:underline font-medium">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
