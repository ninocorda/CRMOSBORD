"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Send, Users, Mail, AlertCircle, CheckCircle2, Loader2, Info, Search, CheckSquare, Square, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getStudentsAction } from "@/core/use-cases/actions";
import { sendBulkEmailAction } from "@/core/use-cases/messages";

export default function MessagesPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const load = async () => {
            const { data } = await getStudentsAction();
            const list = data || [];
            setStudents(list);
            // Default select only ACTIVE students
            setSelectedIds(new Set(list.filter((s: any) => s.status === 'active').map((s: any) => s.id)));
            setIsLoadingStudents(false);
        };
        load();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [students, searchQuery]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const toggleAll = (onlyActive: boolean = false) => {
        if (onlyActive) {
            setSelectedIds(new Set(students.filter(s => s.status === 'active').map(s => s.id)));
        } else {
            if (selectedIds.size === students.length) {
                setSelectedIds(new Set());
            } else {
                setSelectedIds(new Set(students.map(s => s.id)));
            }
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !content) {
            toast.error("Por favor completa el asunto y el mensaje");
            return;
        }

        if (selectedIds.size === 0) {
            toast.error("Selecciona al menos un alumno para enviar el mensaje");
            return;
        }

        setIsSending(true);
        try {
            const res = await sendBulkEmailAction(Array.from(selectedIds), { subject, content });

            if (res.error) {
                toast.error("Error al enviar", { description: res.error });
            } else {
                toast.success(`Mensaje enviado a ${res.count} alumnos seleccionados correctamente`);
                setSubject("");
                setContent("");
            }
        } catch (error: any) {
            toast.error("Error inesperado", { description: error.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                        <Send className="h-8 w-8 text-blue-600" />
                        Mensajes Masivos
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Redacta y elige los destinatarios de tus comunicados oficiales de forma individual.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                {/* Left: Recipients Selection */}
                <div className="xl:col-span-4 space-y-6 order-2 xl:order-1">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[700px]">
                        <div className="p-6 border-b bg-slate-50/50 dark:bg-zinc-950/50 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Destinatarios ({selectedIds.size})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => toggleAll(true)}
                                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full transition-colors border border-emerald-100 dark:border-emerald-800/30"
                                    >
                                        Solo Activos
                                    </button>
                                    <button
                                        onClick={() => toggleAll(false)}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full transition-colors border border-blue-100 dark:border-blue-800/30"
                                    >
                                        {selectedIds.size === students.length ? "Ninguno" : "Todos"}
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar alumno..."
                                    className="pl-10 h-10 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {isLoadingStudents ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="h-14 bg-slate-50 dark:bg-zinc-900/50 animate-pulse rounded-lg m-2" />
                                ))
                            ) : filteredStudents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                                    <Search className="h-10 w-10 opacity-20" />
                                    <p className="text-sm italic">No se encontraron alumnos</p>
                                </div>
                            ) : (
                                filteredStudents.map((student) => {
                                    const isSelected = selectedIds.has(student.id);
                                    return (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleSelection(student.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/50 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50"}`}
                                        >
                                            <div className="shrink-0 transition-transform active:scale-90">
                                                {isSelected ? (
                                                    <CheckSquare className="h-5 w-5 text-blue-600 fill-blue-600/10" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-slate-300 dark:text-zinc-700" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${isSelected ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-zinc-300"}`}>
                                                    {student.first_name} {student.last_name}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-zinc-500 truncate font-medium flex items-center gap-2">
                                                    {student.email || "Sin correo"}
                                                    {student.status === 'suspended' && (
                                                        <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-bold uppercase tracking-tighter">S</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Message Editor */}
                <div className="xl:col-span-8 flex flex-col gap-6 order-1 xl:order-2">
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-blue-500/5 overflow-hidden">
                        <div className="p-1 px-6 border-b bg-slate-50/50 dark:bg-zinc-950/50 h-14 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-500" />
                                Redacción del Comunicado
                            </span>
                            <div className="flex gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-400" />
                                <div className="h-2 w-2 rounded-full bg-amber-400" />
                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                            </div>
                        </div>

                        <form onSubmit={handleSend} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Remitente oficial</label>
                                    <div className="p-3 bg-slate-50 dark:bg-zinc-950 border rounded-lg text-sm text-slate-600 dark:text-zinc-400 font-bold flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        raulramirez@osbord.com
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total de Destinatarios</label>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-bold flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Seleccionados
                                        </span>
                                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-xs">{selectedIds.size} Alumnos</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Asunto</label>
                                <Input
                                    placeholder="Ej: Invitación al Evento de Networking - Instituto Osbord"
                                    className="h-12 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Mensaje Personalizado</label>
                                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-inner">
                                    <div className="bg-slate-50 dark:bg-zinc-950 border-b p-2 flex gap-1">
                                        <button type="button" className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded text-sm font-black transition-colors w-10">B</button>
                                        <button type="button" className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded text-sm italic transition-colors w-10">I</button>
                                        <button type="button" className="p-2 hover:bg-white dark:hover:bg-zinc-800 rounded text-sm underline transition-colors w-10">U</button>
                                        <div className="w-px h-4 bg-slate-300 dark:bg-zinc-800 mx-2 self-center" />
                                        <button type="button" className="px-3 py-1 hover:bg-white dark:hover:bg-zinc-800 rounded text-xs font-bold transition-colors">Personalizar {`{{nombre}}`}</button>
                                    </div>
                                    <textarea
                                        className="w-full min-h-[400px] p-6 bg-white dark:bg-zinc-900 border-none outline-none resize-none font-sans leading-relaxed text-slate-800 dark:text-zinc-200 text-lg"
                                        placeholder="Estimado alumno, le escribimos para informarle sobre..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Info className="h-3.5 w-3.5 text-blue-500" />
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Cada alumno recibirá el correo con su propio nombre en el saludo de forma automática.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={isSending || isLoadingStudents || selectedIds.size === 0}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xl rounded-2xl shadow-xl shadow-blue-500/20 transition-all group active:scale-[0.98]"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                            PROCESANDO ENVÍO...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-3 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            ENVIAR COMUNICADO A {selectedIds.size} ALUMNOS
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl flex gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider">Aviso de Seguridad</p>
                                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                                    Una vez enviado, el proceso no puede detenerse. Asegúrate de que el asunto y el contenido sean los correctos.
                                </p>
                            </div>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-xl flex gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">Entrega Garantizada</p>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                                    Usamos **Resend** para asegurar que el 99.9% de tus correos lleguen a la bandeja de entrada y no a spam.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
