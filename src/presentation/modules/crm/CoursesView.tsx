"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { PlusCircle, Search, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { AddCourseModal } from "./AddCourseModal";
import { getCoursesAction, createCourseAction, deleteCourseAction } from "@/core/use-cases/actions";

export function CoursesView() {
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);

    const loadCourses = async () => {
        setIsLoading(true);
        const { data, error } = await getCoursesAction();
        if (error) {
            toast.error("Error al cargar cursos", { description: error });
            setCourses([]);
        } else {
            setCourses(data || []);
        }
        setIsLoading(false);
    };

    React.useEffect(() => {
        loadCourses();
    }, []);

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSaveCourse = async (data: any) => {
        const { error } = await createCourseAction({
            ...data,
            total_installments: 1 // Default to 1 as we simplified the UI
        });
        if (error) {
            toast.error("Error al crear programa", { description: error });
        } else {
            toast.success(`Programa "${data.name}" creado correctamente.`);
            setIsAddOpen(false);
            loadCourses();
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este programa?")) return;
        const { success, error } = await deleteCourseAction(id);
        if (error) {
            toast.error("Error al eliminar", { description: error });
        } else {
            toast.success("Programa eliminado");
            loadCourses();
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Catálogo de Masters</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Gestiona los programas educativos, sus costos y cuotas.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" onClick={() => setIsAddOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Programa
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center gap-4 bg-slate-50/50 dark:bg-zinc-950/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nombre o descripción..."
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
                                <TableHead className="w-[400px]">Programa / Master</TableHead>
                                <TableHead>Inversión (USD)</TableHead>
                                <TableHead>Alumnos Matriculados</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => (
                                    <TableRow key={course.id}>
                                        <TableCell className="font-semibold text-slate-900 dark:text-zinc-100">
                                            {course.name}
                                        </TableCell>
                                        <TableCell>${Number(course.base_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="pl-6">{course.active_enrollments_count || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 h-8 w-8 p-0 transition-colors">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                                            onClick={() => handleDeleteCourse(course.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No se encontraron programas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add Course Modal */}
            <AddCourseModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSave={handleSaveCourse}
            />
        </div>
    );
}
