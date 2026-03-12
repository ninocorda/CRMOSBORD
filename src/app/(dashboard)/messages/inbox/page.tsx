"use client";

import React, { useState, useEffect } from "react";
import {
    Inbox,
    RefreshCcw,
    Search,
    User,
    Clock,
    ChevronRight,
    Mail,
    ArrowLeft,
    Send,
    Loader2,
    Calendar,
    Filter,
    Trash2,
    CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { syncEmailsAction } from "@/core/use-cases/email-sync";
import { sendReplyEmailAction } from "@/core/use-cases/messages";
import {
    markCommunicationAsReadAction,
    deleteCommunicationAction,
    deleteAllCommunicationsAction
} from "@/core/use-cases/actions";
import { createBrowserSupabaseClient } from "@/infrastructure/database/supabase-browser";

export default function InboxPage() {
    const [emails, setEmails] = useState<any[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'all'>('inbox');

    const supabase = createBrowserSupabaseClient();

    const loadEmails = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('communications_log')
                .select('*, student:students(first_name, last_name, email)')
                .order('sent_at', { ascending: false });

            if (error) throw error;
            setEmails(data || []);
            if (data && data.length > 0 && !selectedEmail) {
                // setSelectedEmail(data[0]);
            }
        } catch (error: any) {
            toast.error("Error al cargar correos", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (email: any) => {
        if (email.read_status) return;
        try {
            await markCommunicationAsReadAction(email.id);
            // Local update
            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read_status: true } : e));
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("¿Estás seguro de que quieres borrar este mensaje?")) return;
        try {
            await deleteCommunicationAction(id);
            setEmails(prev => prev.filter(email => email.id !== id));
            if (selectedEmail?.id === id) setSelectedEmail(null);
            toast.success("Mensaje eliminado.");
        } catch (err: any) {
            toast.error("Error al eliminar", { description: err.message });
        }
    };

    const handleClearAll = async () => {
        if (!confirm("🚨 ¿ESTÁS SEGURO? Se borrarán TODOS los mensajes de la lista permanentemente.")) return;
        try {
            await deleteAllCommunicationsAction();
            setEmails([]);
            setSelectedEmail(null);
            toast.success("Bandeja de entrada vaciada.");
        } catch (err: any) {
            toast.error("Error al vaciar bandeja", { description: err.message });
        }
    };

    const handleSendReply = async () => {
        if (!selectedEmail || !replyText.trim()) return;
        setIsSending(true);
        try {
            const res = await sendReplyEmailAction({
                to_email: selectedEmail.from_email,
                subject: selectedEmail.subject,
                content: replyText,
                student_id: selectedEmail.student_id || undefined,
            });
            if (res.success) {
                toast.success("Respuesta enviada correctamente.");
                setReplyText("");
                loadEmails(); // Reload to show the outbound reply in the list
            } else {
                toast.error("Error al enviar respuesta", { description: res.error });
            }
        } catch (err: any) {
            toast.error("Error inesperado", { description: err.message });
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        loadEmails();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await syncEmailsAction();
            if (res.success) {
                toast.success(`Sincronización completada: ${res.count} nuevos emails.`);
                loadEmails();
            } else {
                toast.error("Error en sincronización", { description: res.error });
            }
        } catch (error: any) {
            toast.error("Error inesperado", { description: error.message });
        } finally {
            setIsSyncing(false);
        }
    };

    const filteredEmails = emails.filter(e => {
        // Direction filter
        if (activeTab === 'inbox' && e.direction !== 'inbound') return false;
        if (activeTab === 'sent' && e.direction !== 'outbound') return false;
        // Search filter
        const matchesSearch =
            e.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.from_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.student && `${e.student.first_name} ${e.student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const inboundCount = emails.filter(e => e.direction === 'inbound').length;
    const outboundCount = emails.filter(e => e.direction === 'outbound').length;
    const unreadCount = emails.filter(e => e.direction === 'inbound' && !e.read_status).length;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden animate-in fade-in duration-500">
            {/* Header / Toolbar */}
            <div className="bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-black text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                        <Inbox className="h-6 w-6 text-blue-600" />
                        Buzón Vanguardia
                    </h1>
                    <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 hidden md:block" />
                    <div className="relative hidden md:block w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar en el buzón..."
                            className="bg-slate-50 dark:bg-zinc-900 border-none pl-9 h-9 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAll}
                        className="flex items-center gap-2 font-bold"
                    >
                        <Trash2 className="h-4 w-4" />
                        Limpiar Todo
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 flex items-center gap-2 font-bold"
                    >
                        {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        ) : (
                            <RefreshCcw className="h-4 w-4 text-blue-500" />
                        )}
                        {isSyncing ? "Sincronizando..." : "Sincronizar"}
                    </Button>
                </div>
            </div>

            {/* Main Split View */}
            <div className="flex flex-1 overflow-hidden">

                {/* Email List Sidebar */}
                <div className="w-full md:w-[350px] lg:w-[400px] border-r border-slate-200 dark:border-zinc-800 overflow-y-auto bg-slate-50/30 dark:bg-zinc-950/30 custom-scrollbar flex flex-col">
                    {/* Tab Bar */}
                    <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
                        <button
                            onClick={() => { setActiveTab('inbox'); setSelectedEmail(null); }}
                            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'inbox'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Mail className="h-3.5 w-3.5" />
                                Recibidos
                                {unreadCount > 0 && (
                                    <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                                        {unreadCount}
                                    </span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('sent'); setSelectedEmail(null); }}
                            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'sent'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Send className="h-3.5 w-3.5" />
                                Enviados
                                <span className="text-[10px] text-slate-400">({outboundCount})</span>
                            </span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('all'); setSelectedEmail(null); }}
                            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'all'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Todos
                        </button>
                    </div>
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-5 border-b border-slate-100 dark:border-zinc-900 animate-pulse">
                                <div className="h-4 w-2/3 bg-slate-200 dark:bg-zinc-800 rounded mb-2" />
                                <div className="h-3 w-1/2 bg-slate-200 dark:bg-zinc-800 rounded opacity-50" />
                            </div>
                        ))
                    ) : filteredEmails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-300">
                                <Mail className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-zinc-100 italic">No hay mensajes</p>
                                <p className="text-xs text-slate-500 italic mt-1">Pulsa sincronizar para buscar nuevos correos.</p>
                            </div>
                        </div>
                    ) : (
                        filteredEmails.map((email) => (
                            <div
                                key={email.id}
                                onClick={() => {
                                    setSelectedEmail(email);
                                    handleMarkAsRead(email);
                                }}
                                className={`group p-5 border-b border-slate-100 dark:border-zinc-900 cursor-pointer transition-all hover:bg-white dark:hover:bg-zinc-900 ${selectedEmail?.id === email.id ? "bg-white dark:bg-zinc-900 border-l-4 border-l-blue-600 shadow-sm" : ""}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        {email.direction === 'inbound' && !email.read_status && (
                                            <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                        )}
                                        {email.direction === 'outbound' && (
                                            <ArrowLeft className="h-3 w-3 text-slate-400" />
                                        )}
                                        <span className={`text-sm font-bold truncate max-w-[150px] ${email.direction === 'inbound' && !email.read_status ? "text-slate-900 dark:text-zinc-100" : "text-slate-500 font-medium"}`}>
                                            {email.student ? `${email.student.first_name} ${email.student.last_name}` : email.from_email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter shrink-0">{formatDate(email.sent_at)}</span>
                                        <button
                                            onClick={(e) => handleDelete(email.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                                <p className={`text-xs font-bold truncate mb-1 ${selectedEmail?.id === email.id ? "text-blue-600" : "text-slate-800 dark:text-zinc-200"}`}>
                                    {email.subject}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-500 line-clamp-2 italic leading-normal">
                                    {email.snippet}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Email Content Area */}
                <div className="hidden md:flex flex-1 flex-col bg-white dark:bg-zinc-900 overflow-y-auto relative custom-scrollbar">
                    {selectedEmail ? (
                        <>
                            {/* Email Header Detail */}
                            <div className="p-8 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight leading-tight mb-4">
                                            {selectedEmail.subject}
                                        </h2>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                {selectedEmail.student ? selectedEmail.student.first_name[0] : <User className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-zinc-100">
                                                        {selectedEmail.student ? `${selectedEmail.student.first_name} ${selectedEmail.student.last_name}` : selectedEmail.from_email}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium italic">&lt;{selectedEmail.from_email}&gt;</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-500 italic mt-0.5">
                                                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(selectedEmail.sent_at).toLocaleString()}</span>
                                                    <span className="flex items-center gap-1.5"><Filter className="h-3 w-3 text-blue-500" /> {selectedEmail.direction === 'inbound' ? "Recibido" : "Enviado"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Email Body */}
                            <div className="p-8 flex-1">
                                <div
                                    className="prose dark:prose-invert max-w-none text-slate-800 dark:text-zinc-300 leading-relaxed text-lg"
                                    dangerouslySetInnerHTML={{ __html: selectedEmail.content.replace(/\n/g, '<br/>') }}
                                />
                            </div>

                            {/* Reply Footer */}
                            <div className="sticky bottom-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
                                <div className="flex gap-3">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Escribe tu respuesta aquí..."
                                        className="flex-1 min-h-[48px] max-h-[120px] rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 placeholder:italic"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendReply();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleSendReply}
                                        disabled={isSending || !replyText.trim()}
                                        className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        {isSending ? "Enviando..." : "Responder"}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">Firma: Profesor Raúl Ramírez · Tutor Académico | Instituto Osbord · osbord.com</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-4">
                            <div className="h-24 w-24 rounded-3xl bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-slate-200 border border-slate-100 dark:border-zinc-900">
                                <Inbox className="h-12 w-12" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-zinc-50 tracking-tight italic">Selecciona un correo</h3>
                                <p className="text-sm text-slate-500 italic mt-1 max-w-xs">Elige un mensaje de la izquierda para visualizar el contenido completo y gestionar la conversación.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
