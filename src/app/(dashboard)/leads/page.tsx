import React from "react";
import { LeadsView } from "@/presentation/modules/crm/LeadsView";

export default function LeadsPage() {
    return (
        <div className="w-full flex-1 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/30 via-white to-slate-50 dark:from-slate-900 dark:via-zinc-950 dark:to-zinc-950 p-4 md:p-8 font-[family-name:var(--font-sans)] text-slate-900 dark:text-zinc-100 pb-10 min-h-screen">
            <main className="max-w-[1600px] mx-auto">
                <LeadsView />
            </main>
        </div>
    );
}
