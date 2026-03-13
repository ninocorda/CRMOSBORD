"use client";

import React, { useState } from "react";
import { Search, MoreHorizontal, Eye, Edit, Trash2, UserPlus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { StudentProfile } from "./StudentProfile";
import { getStudentsAction, suspendStudentAction, updateStudentAction, deleteStudentAction } from "@/core/use-cases/actions";
import { toast } from "sonner";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Dummy data removed, using getStudentsAction instead

function getStatusBadge(status: string) {
    switch (status) {
        case "active":
            return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100">Activo</Badge>;
        case "suspended":
            return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100">Suspendido</Badge>;
        case "completed":
            return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100">Graduado</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

export function StudentsView() {
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadStudents = async (updateSelectedId?: string) => {
        setIsLoading(true);
        const { data, error } = await getStudentsAction();
        if (error) {
            toast.error("Error al cargar alumnos", { description: error });
            setStudents([]);
        } else {
            const freshData = data || [];
            if (freshData.length) {
                console.log("Students loaded successfully:", freshData.length);
            }
            setStudents(freshData);

            // If we are refreshing because of a specific student update, update the selected student state too
            if (updateSelectedId) {
                const updated = freshData.find((s: any) => s.id === updateSelectedId);
                if (updated) setSelectedStudent(updated);
            }
        }
        setIsLoading(false);
    };

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!studentToEdit) return;

        const formData = new FormData(e.currentTarget);
        const loadingToast = toast.loading("Actualizando alumno...");

        try {
            const res = await updateStudentAction(studentToEdit.id, formData);
            if (res.success) {
                toast.success("Alumno actualizado correctamente", { id: loadingToast });
                setIsEditOpen(false);
                loadStudents(studentToEdit.id);
            } else {
                toast.error(res.error || "Error al actualizar alumno", { id: loadingToast });
            }
        } catch (error: any) {
            toast.error(error.message, { id: loadingToast });
        }
    };

    const handleDelete = async () => {
        if (!studentToDelete) return;
        setIsDeleting(true);
        const loadingToast = toast.loading("Eliminando alumno...");
        try {
            const res = await deleteStudentAction(studentToDelete.id);
            if (res.success) {
                toast.success("Alumno eliminado correctamente", { id: loadingToast });
                setIsDeleteOpen(false);
                setStudentToDelete(null);
                loadStudents();
            } else {
                toast.error(res.error || "Error al eliminar alumno", { id: loadingToast });
            }
        } catch (error: any) {
            toast.error(error.message, { id: loadingToast });
        } finally {
            setIsDeleting(false);
        }
    };

    React.useEffect(() => {
        loadStudents();
    }, []);

    const filteredStudents = students.filter(
        (s) =>
            `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase().includes(search.toLowerCase()) ||
            (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (s.id_document || "").toLowerCase().includes(search.toLowerCase())
    );

    if (selectedStudent) {
        return (
            <div className="space-y-4">
                <Button variant="outline" onClick={() => setSelectedStudent(null)} className="mb-4">
                    &larr; Volver al Listado
                </Button>
                <StudentProfile
                    student={selectedStudent}
                    enrollments={selectedStudent.enrollments || []}
                    onUpdate={() => loadStudents(selectedStudent.id)}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Alumno</DialogTitle>
                        <DialogDescription>
                            Realiza cambios en la información básica del alumno.
                        </DialogDescription>
                    </DialogHeader>
                    {studentToEdit && (
                        <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">Nombre</Label>
                                    <Input id="first_name" name="first_name" defaultValue={studentToEdit.first_name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Apellido</Label>
                                    <Input id="last_name" name="last_name" defaultValue={studentToEdit.last_name} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={studentToEdit.email} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input id="phone" name="phone" defaultValue={studentToEdit.phone} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">País</Label>
                                    <Input id="country" name="country" defaultValue={studentToEdit.country} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="id_document">Cédula / Documento</Label>
                                    <Input id="id_document" name="id_document" defaultValue={studentToEdit.id_document} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="campus_password">Contraseña Campus</Label>
                                    <Input id="campus_password" name="campus_password" defaultValue={studentToEdit.campus_password} />
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Cambios</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            ¿Estás seguro de que deseas eliminar permanentemente a <strong>{studentToDelete?.first_name} {studentToDelete?.last_name}</strong>?
                            <br /><br />
                            Esta acción eliminará también todo su historial de pagos y matrícula. <strong>No se puede deshacer.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4 flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancelar</Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar Definitivamente"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                        Alumnos
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Administra la matrícula, estado de pago y datos de tus estudiantes.
                    </p>
                </div>
                <Button render={<Link href="/students/new" />} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrar Alumno
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Alumnos</p>
                    <p className="text-2xl font-bold mt-1">{isLoading ? "..." : students.length}</p>
                </div>
                <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Activos</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-600">{isLoading ? "..." : students.filter(s => s.status === 'active').length}</p>
                </div>
                <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Suspendidos</p>
                    <p className="text-2xl font-bold mt-1 text-amber-600">{isLoading ? "..." : students.filter(s => s.status === 'suspended').length}</p>
                </div>
                <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Cuotas Pendientes</p>
                    <p className="text-2xl font-bold mt-1 text-blue-600">
                        {isLoading ? "..." : students.reduce((acc, s) => {
                            const pending = s.enrollments?.reduce((sum: number, e: any) => sum + (e.remaining_installments || 0), 0) || 0;
                            return acc + pending;
                        }, 0)}
                    </p>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-zinc-900 border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center gap-4 bg-slate-50/50 dark:bg-zinc-950/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nombre, email o cédula..."
                            className="pl-9 bg-white dark:bg-zinc-900"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-zinc-950/50 hover:bg-transparent">
                                <TableHead className="w-[250px]">Alumno</TableHead>
                                <TableHead>País</TableHead>
                                <TableHead>Cédula</TableHead>
                                <TableHead>Cursos</TableHead>
                                <TableHead>Cuotas</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <TableRow
                                        key={student.id}
                                        className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
                                        onClick={() => setSelectedStudent(student)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-medium">
                                                        {(student.first_name || "?")[0]}{(student.last_name || "?")[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 dark:text-zinc-100">
                                                        {student.first_name} {student.last_name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{student.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{student.country || "-"}</TableCell>
                                        <TableCell className="text-sm font-mono text-xs">{student.id_document || "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                {student.enrollments?.map((e: any, i: number) => (
                                                    <span key={i} className="text-xs text-muted-foreground">{e.course?.name}</span>
                                                )) || <span className="text-xs text-muted-foreground italic tracking-tight">Sin matrícula</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span className="font-medium text-emerald-600">
                                                    {student.enrollments?.reduce((acc: number, e: any) => acc + (e.paid_installments || 0), 0) || 0}
                                                </span>
                                                <span className="text-muted-foreground">/</span>
                                                <span className="text-muted-foreground">
                                                    {student.enrollments?.reduce((acc: number, e: any) => acc + ((e.paid_installments || 0) + (e.remaining_installments || 0)), 0) || 0}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(student.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    className="inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 h-8 w-8 p-0 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="sr-only">Menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => setSelectedStudent(student)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Ver Perfil
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            setStudentToEdit(student);
                                                            setIsEditOpen(true);
                                                        }}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className={student.status === 'suspended' ? "" : "text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const newStatus = student.status === 'suspended' ? 'active' : 'suspended';
                                                                const loadingToast = toast.loading(newStatus === 'suspended' ? 'Suspendiendo...' : 'Activando...');
                                                                const res = await suspendStudentAction(student.id, newStatus);
                                                                if (res.success) {
                                                                    toast.success(`Alumno ${newStatus === 'suspended' ? 'suspendido' : 'activado'}`, { id: loadingToast });
                                                                    loadStudents();
                                                                } else {
                                                                    toast.error(res.error || "Error al cambiar estado", { id: loadingToast });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            {student.status === 'suspended' ? 'Reactivar' : 'Suspender'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 font-bold"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setStudentToDelete(student);
                                                                setIsDeleteOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Eliminar Alumno
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No se encontraron alumnos.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
