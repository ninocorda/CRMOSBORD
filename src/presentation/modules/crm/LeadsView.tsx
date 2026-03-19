"use client";

import React, { useState, useEffect } from "react";
import { Search, MoreHorizontal, Edit, Trash2, UserPlus, ArrowRightLeft, Loader2, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    getLeadsAction,
    upsertLeadAction,
    deleteLeadAction,
    convertLeadToStudentAction,
    getCoursesAction
} from "@/core/use-cases/actions";

function getStatusBadge(status: string) {
    switch (status) {
        case "nuevo":
            return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Nuevo</Badge>;
        case "contactado":
            return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Contactado</Badge>;
        case "interesado":
            return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Interesado</Badge>;
        case "convertido":
            return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Convertido</Badge>;
        case "perdido":
            return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300">Perdido</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

export function LeadsView() {
    const [leads, setLeads] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modals state
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [leadToEdit, setLeadToEdit] = useState<any | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const [leadToConvert, setLeadToConvert] = useState<any | null>(null);
    const [isConverting, setIsConverting] = useState(false);

    const loadLeads = async () => {
        setIsLoading(true);
        const { data, error } = await getLeadsAction();
        if (error) {
            toast.error("Error al cargar leads", { description: error });
        } else {
            setLeads(data || []);
        }
        setIsLoading(false);
    };

    const loadCourses = async () => {
        const { data, error } = await getCoursesAction();
        if (!error && data) {
            setCourses(data);
        }
    };

    useEffect(() => {
        loadLeads();
        loadCourses();
    }, []);

    const handleUpsertSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            id: leadToEdit?.id,
            first_name: formData.get("first_name") as string,
            last_name: formData.get("last_name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            status: formData.get("status") as string,
            notes: formData.get("notes") as string,
        };

        const loadingToast = toast.loading(leadToEdit ? "Actualizando lead..." : "Creando lead...");
        const res = await upsertLeadAction(data);

        if (res.success) {
            toast.success(leadToEdit ? "Lead actualizado" : "Lead creado", { id: loadingToast });
            setIsAddEditOpen(false);
            loadLeads();
        } else {
            toast.error(res.error || "Error al procesar lead", { id: loadingToast });
        }
    };

    const handleDelete = async () => {
        if (!leadToDelete) return;
        setIsDeleting(true);
        const loadingToast = toast.loading("Eliminando lead...");
        const res = await deleteLeadAction(leadToDelete.id);

        if (res.success) {
            toast.success("Lead eliminado", { id: loadingToast });
            setIsDeleteOpen(false);
            loadLeads();
        } else {
            toast.error(res.error || "Error al eliminar lead", { id: loadingToast });
        }
        setIsDeleting(false);
    };

    const handleConvertSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!leadToConvert) return;

        setIsConverting(true);
        const formData = new FormData(e.currentTarget);
        const conversionData = {
            course_id: formData.get("course_id") as string,
            total_amount: Number(formData.get("total_amount")),
            installments: Number(formData.get("installments")),
            payment_method: formData.get("payment_method") as string,
        };

        const loadingToast = toast.loading("Convirtiendo lead en alumno...");
        const res = await convertLeadToStudentAction(leadToConvert.id, conversionData);

        if (res.success) {
            toast.success("¡Lead convertido en alumno exitosamente!", {
                id: loadingToast,
                description: "Se han generado el perfil, la matrícula y las cuotas correspondientes."
            });
            setIsConvertOpen(false);
            loadLeads();
        } else {
            toast.error(res.error || "Error en la conversión", { id: loadingToast });
        }
        setIsConverting(false);
    };

    const filteredLeads = leads.filter(
        (l) =>
            `${l.first_name || ""} ${l.last_name || ""}`.toLowerCase().includes(search.toLowerCase()) ||
            (l.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (l.phone || "").includes(search)
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                        Captación de Leads
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Gestiona los prospectos provenientes de Meta Ads y conviértelos en alumnos.
                    </p>
                </div>
                <Button
                    onClick={() => { setLeadToEdit(null); setIsAddEditOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-md"
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nuevo Lead
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Leads</p>
                    <p className="text-2xl font-bold mt-1">{isLoading ? "..." : leads.length}</p>
                </div>
                <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm border-blue-100 dark:border-blue-900">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Nuevos</p>
                    <p className="text-2xl font-bold mt-1 text-blue-600">{isLoading ? "..." : leads.filter(l => l.status === 'nuevo').length}</p>
                </div>
                <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm border-purple-100 dark:border-purple-900">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Interesados</p>
                    <p className="text-2xl font-bold mt-1 text-purple-600">{isLoading ? "..." : leads.filter(l => l.status === 'interesado').length}</p>
                </div>
                <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm border-emerald-100 dark:border-emerald-900">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Convertidos</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-600">{isLoading ? "..." : leads.filter(l => l.status === 'convertido').length}</p>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white dark:bg-zinc-900 border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center gap-4 bg-slate-50/50 dark:bg-zinc-950/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar leads..."
                            className="pl-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-zinc-950/50 hover:bg-transparent">
                                <TableHead className="w-[280px]">Lead / Prospecto</TableHead>
                                <TableHead>Datos de Contacto</TableHead>
                                <TableHead>Origen</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha Registro</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-12 w-full text-right" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredLeads.length > 0 ? (
                                filteredLeads.map((lead) => (
                                    <TableRow key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-slate-100 dark:border-zinc-800">
                                                    <AvatarFallback className="bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 font-bold text-xs uppercase">
                                                        {(lead.first_name || "?")[0]}{(lead.last_name || "")[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-tight text-sm">
                                                        {lead.first_name} {lead.last_name}
                                                    </span>
                                                    {lead.notes && (
                                                        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]" title={lead.notes}>
                                                            {lead.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                                                    <Mail className="h-3 w-3" /> {lead.email || "Sin email"}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                                                    <Phone className="h-3 w-3" /> {lead.phone || "Sin teléfono"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border-slate-200">
                                                {lead.source}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    className="inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 h-8 w-8 p-0 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="sr-only">Menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[200px]">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => { setLeadToEdit(lead); setIsAddEditOpen(true); }}>
                                                            <Edit className="h-4 w-4 mr-2" /> Editar Información
                                                        </DropdownMenuItem>
                                                        {lead.status !== 'convertido' && (
                                                            <DropdownMenuItem
                                                                onClick={() => { setLeadToConvert(lead); setIsConvertOpen(true); }}
                                                                className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/50 font-bold"
                                                            >
                                                                <ArrowRightLeft className="h-4 w-4 mr-2" /> Convertir en Alumno
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => { setLeadToDelete(lead); setIsDeleteOpen(true); }}
                                                            className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/50"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar Lead
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                        No se encontraron leads registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modals */}

            {/* Add/Edit Lead Modal */}
            <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{leadToEdit ? "Editar Lead" : "Nuevo Lead de Captación"}</DialogTitle>
                        <DialogDescription>
                            Ingresa los datos del prospecto proveniente de Meta u otros canales.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpsertSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">Nombre</Label>
                                <Input id="first_name" name="first_name" defaultValue={leadToEdit?.first_name} required placeholder="Ej: Juan" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Apellido</Label>
                                <Input id="last_name" name="last_name" defaultValue={leadToEdit?.last_name} placeholder="Ej: Pérez" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={leadToEdit?.email} placeholder="juan@ejemplo.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                                <Input id="phone" name="phone" defaultValue={leadToEdit?.phone} placeholder="+56 9..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado del Lead</Label>
                            <Select name="status" defaultValue={leadToEdit?.status || "nuevo"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nuevo">Nuevo / Sin contactar</SelectItem>
                                    <SelectItem value="contactado">Ya contactado</SelectItem>
                                    <SelectItem value="interesado">Interesado / Prospecto Caliente</SelectItem>
                                    <SelectItem value="perdido">No interesado / Perdido</SelectItem>
                                    {leadToEdit?.status === 'convertido' && <SelectItem value="convertido">Convertido en Alumno</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas / Observaciones</Label>
                            <Input id="notes" name="notes" defaultValue={leadToEdit?.notes} placeholder="Información adicional sobre el interés del lead..." />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                {leadToEdit ? "Guardar Cambios" : "Crear Lead"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Eliminar Lead</DialogTitle>
                        <DialogDescription className="pt-2">
                            ¿Estás seguro de eliminar a <strong>{leadToDelete?.first_name}</strong>? Esta acción es permanente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CONVERT TO STUDENT MODAL */}
            <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
                <DialogContent className="sm:max-w-[500px] border-emerald-100 dark:border-emerald-950 shadow-2xl">
                    <DialogHeader>
                        <div className="mx-auto bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full mb-2">
                            <ArrowRightLeft className="h-6 w-6 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-center text-xl font-extrabold text-slate-900 dark:text-slate-100">
                            Convertir Lead en Alumno
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Estás por matricular a <strong>{leadToConvert?.first_name} {leadToConvert?.last_name}</strong>. Completa los detalles financieros.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleConvertSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="course_id" className="font-bold">Curso / Máster a Matricular</Label>
                            <Select name="course_id" required>
                                <SelectTrigger className="border-emerald-200 focus:ring-emerald-500">
                                    <SelectValue placeholder="Selecciona un curso..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.name} - ${course.base_price}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="total_amount" className="font-bold">Monto Total ($)</Label>
                                <Input id="total_amount" name="total_amount" type="number" step="0.01" required placeholder="Ej: 1500" className="border-emerald-200 focus:ring-emerald-500" />
                                <p className="text-[10px] text-muted-foreground italic">Precio pactado con el alumno.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="installments" className="font-bold">Número de Cuotas</Label>
                                <Input id="installments" name="installments" type="number" min="1" max="48" defaultValue="1" required className="border-emerald-200 focus:ring-emerald-500" />
                                <p className="text-[10px] text-muted-foreground italic">1 para pago contado.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_method" className="font-bold">Método de Pago Preferido</Label>
                            <Select name="payment_method" defaultValue="transferencia">
                                <SelectTrigger className="border-emerald-200 focus:ring-emerald-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                                    <SelectItem value="mercadopago">Mercado Pago / Tarjeta</SelectItem>
                                    <SelectItem value="efectivo">Efectivo / Otros</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="pt-6">
                            <Button type="button" variant="outline" onClick={() => setIsConvertOpen(false)} disabled={isConverting}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8" disabled={isConverting}>
                                {isConverting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                                    </>
                                ) : "Confirmar Matrícula"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
