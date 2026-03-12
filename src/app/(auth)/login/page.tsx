"use client";

import React, { useState } from "react";
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { loginAction, sendMagicLinkAction } from "@/core/use-cases/actions";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingLink, setIsSendingLink] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await loginAction(formData);
        if (result?.error) {
            toast.error("Error al iniciar sesión", { description: result.error });
            setIsLoading(false);
        }
    };

    const handleMagicLink = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Ingresa tu correo primero", { description: "Escribe tu correo electrónico arriba e intenta de nuevo." });
            return;
        }
        setIsSendingLink(true);
        const loadingToast = toast.loading("Enviando enlace...");

        const result = await sendMagicLinkAction(email, window.location.origin);

        if (result.success) {
            toast.success("Enlace enviado", { id: loadingToast, description: "Revisa tu bandeja de entrada o carpeta de spam." });
        } else {
            toast.error("Error", { id: loadingToast, description: result.error });
        }
        setIsSendingLink(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-indigo-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-slate-950 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center justify-center w-24 h-24 mb-4">
                        <img src="/logo-osbord.png" alt="Osbord Logo" className="size-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">CRM OSBORD</h1>
                    <p className="text-sm text-muted-foreground mt-1">Instituto Osbord</p>
                </div>

                <Card className="shadow-xl border-0 shadow-slate-200/60 dark:shadow-zinc-900/60">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
                        <CardDescription>Accede al panel de administración</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="admin@tuinstituto.com"
                                        className="pl-10"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading || isSendingLink}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10"
                                        required
                                        disabled={isLoading || isSendingLink}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={isLoading}>
                                {isLoading ? "Ingresando..." : "Ingresar"}
                                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>

                        <div className="mt-6 text-center space-y-2 flex flex-col items-center">
                            <button
                                type="button"
                                onClick={handleMagicLink}
                                disabled={isSendingLink || isLoading}
                                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                            >
                                {isSendingLink ? "Enviando correo..." : "¿Olvidaste tu contraseña?"}
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    &copy; 2026 CRM OSBORD. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
