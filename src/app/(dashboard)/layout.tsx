import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/presentation/components/AppSidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-slate-50/30 dark:bg-zinc-950 min-h-screen">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-md bg-white/50 dark:bg-zinc-900/50 sticky top-0 z-50">
                    <SidebarTrigger className="-ml-1" />
                    <div className="w-px h-4 bg-border mx-2 hidden md:block" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 hidden md:block">CRM <span className="text-blue-600">OSBORD</span> Administración</span>
                </header>
                <main className="flex-1 overflow-x-hidden">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
