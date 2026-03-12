"use client";

import React, { useState } from "react";
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

interface CourseFormData {
    name: string;
    base_price: string | number;
}

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CourseFormData) => void;
    initialData?: CourseFormData | null;
}

const emptyForm: CourseFormData = {
    name: "",
    base_price: "",
};

export function AddCourseModal({ isOpen, onClose, onSave, initialData }: AddCourseModalProps) {
    const [form, setForm] = useState<CourseFormData>(initialData || emptyForm);
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!initialData;

    const handleChange = (field: keyof CourseFormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.name || !form.base_price) return;
        setIsSaving(true);
        try {
            await onSave({
                ...form,
                base_price: parseFloat(form.base_price.toString())
            });
            setForm(emptyForm);
            onClose();
        } catch (error) {
            console.error("Error saving course:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Programa" : "Nuevo Programa Educativo"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los datos del programa y guarda los cambios."
                            : "Completa los campos para registrar un nuevo Master o Postgrado en el sistema."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="course-name">Nombre del Programa *</Label>
                        <Input
                            id="course-name"
                            placeholder="Ej. Master en Cloud Computing"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="course-price">Precio Base (USD) *</Label>
                        <Input
                            id="course-price"
                            type="number"
                            placeholder="3600.00"
                            value={form.base_price}
                            onChange={(e) => handleChange("base_price", e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !form.name || !form.base_price}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSaving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Programa"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
