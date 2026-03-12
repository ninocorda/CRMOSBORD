"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, CreditCard, BookOpen, Settings, LifeBuoy, Send, Sun, Moon, LogOut, Inbox } from "lucide-react";
import { useTheme } from "next-themes";
import { logoutAction } from "@/core/use-cases/actions";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
} from "@/components/ui/sidebar";

const data = {
    navMain: [
        {
            title: "Vistas Generales",
            items: [
                {
                    title: "Dashboard",
                    url: "/",
                    icon: LayoutDashboard,
                },
                {
                    title: "Alumnos",
                    url: "/students",
                    icon: Users,
                },
                {
                    title: "Cuentas por Cobrar",
                    url: "/receivables",
                    icon: CreditCard,
                },
                {
                    title: "Cursos / Masters",
                    url: "/courses",
                    icon: BookOpen,
                },
                {
                    title: "Bandeja de Entrada",
                    url: "/messages/inbox",
                    icon: Inbox,
                },
                {
                    title: "Mensajes Masivos",
                    url: "/messages",
                    icon: Send,
                },
            ],
        },
        {
            title: "Configuración",
            items: [
                {
                    title: "Ajustes del Sistema",
                    url: "/settings",
                    icon: Settings,
                },
                {
                    title: "Importar Datos (CSV)",
                    url: "/import",
                    icon: Send,
                },
            ],
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href="/" />} className="h-24 py-6 px-4">
                            <div className="flex aspect-square size-14 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 shadow-md shrink-0">
                                <img src="/logo-osbord.png" alt="Osbord Logo" className="size-full object-contain" />
                            </div>
                            <div className="grid flex-1 text-left leading-tight ml-4">
                                <span className="truncate font-extrabold text-blue-950 dark:text-blue-50 text-lg tracking-tight">
                                    CRM OSBORD
                                </span>
                                <span className="truncate text-[11px] font-semibold text-blue-600/80 dark:text-blue-400 uppercase tracking-wider">
                                    Instituto Osbord
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {data.navMain.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel className="px-2 pb-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-zinc-500">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const isActive = pathname === item.url || (item as any).isActive;
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                isActive={isActive}
                                                tooltip={item.title}
                                                render={<Link href={item.url} />}
                                                className={`py-6 px-4 transition-all duration-200 group-hover/menu-item:translate-x-1 ${isActive ? "bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-600 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-zinc-800"}`}
                                            >
                                                <item.icon className={`size-5.5 transition-colors ${isActive ? "text-blue-600" : "text-slate-400 group-hover/sidebar-menu-button:text-blue-600 dark:text-zinc-500"}`} />
                                                <span className={`text-[15px] transition-colors ml-1 ${isActive ? "font-bold text-blue-950 dark:text-blue-50" : "font-semibold text-slate-600 dark:text-zinc-400 group-hover/sidebar-menu-button:text-slate-900 dark:group-hover:text-zinc-200"}`}>
                                                    {item.title}
                                                </span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <div className="p-4 border-t border-sidebar-border mt-auto">
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200 dark:border-blue-800">
                            AD
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Administrador</span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">admin@osbord.com</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-zinc-800">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 ml-1">&copy; 2026 CRM OSBORD</span>
                        <div className="flex items-center">
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-800 shadow-sm transition-all text-slate-500 hover:text-blue-600"
                                title={mounted ? (theme === "dark" ? "Modo claro" : "Modo oscuro") : "Cambiar tema"}
                            >
                                {mounted ? (theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />) : <div className="h-3.5 w-3.5" />}
                            </button>
                            <form action={logoutAction}>
                                <button
                                    type="submit"
                                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
