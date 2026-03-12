"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Payment } from "@/core/entities/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface PaymentVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: any | null; // We use any because due to dummy data, it includes student details directly nested
    onVerify: (paymentId: string, referenceCode: string) => void;
}

export function PaymentVerificationModal({
    isOpen,
    onClose,
    payment,
    onVerify,
}: PaymentVerificationModalProps) {
    const [reference, setReference] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    if (!payment) return null;

    const handleVerify = async () => {
        if (!reference) return;
        setIsVerifying(true);

        // Simulate API delay for Server Action
        await new Promise((resolve) => setTimeout(resolve, 800));

        onVerify(payment.id, reference);
        setIsVerifying(false);
        setReference("");
        onClose();
    };

    const isVerified = payment.verification_status === "verified";
    const studentInfo = payment.enrollment?.student;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Verificación de Pago
                        {isVerified && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    </DialogTitle>
                    <DialogDescription>
                        Revisa los detalles del pago y añade el código de referencia (Zelle, Binance) para confirmarlo.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                    <div className="rounded-lg border bg-slate-50 dark:bg-slate-900/50 p-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="text-muted-foreground">Alumno:</div>
                            <div className="font-medium text-right">{studentInfo?.first_name} {studentInfo?.last_name}</div>

                            <div className="text-muted-foreground">Monto Base:</div>
                            <div className="font-medium text-right">${payment.amount.toFixed(2)}</div>

                            <div className="text-muted-foreground">Fecha Vencimiento:</div>
                            <div className="font-medium text-right">
                                {format(new Date(payment.due_date), "dd MMM yyyy", { locale: es })}
                            </div>

                            <div className="text-muted-foreground">Método:</div>
                            <div className="font-medium text-right capitalize">{payment.payment_method}</div>
                        </div>
                    </div>

                    {!isVerified ? (
                        <div className="grid grid-cols-4 items-center gap-4 mt-2">
                            <Label htmlFor="reference" className="text-right">
                                Referencia
                            </Label>
                            <Input
                                id="reference"
                                placeholder="Ej. TXN-994827"
                                className="col-span-3"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-md border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Pago verificado. (Ref: {payment.reference_code || "N/A"})
                            </span>
                        </div>
                    )}

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isVerifying}>
                        Cancelar
                    </Button>
                    {!isVerified && (
                        <Button
                            type="submit"
                            onClick={handleVerify}
                            disabled={isVerifying || reference.length < 3}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isVerifying ? "Verificando..." : "Confirmar Pago"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
