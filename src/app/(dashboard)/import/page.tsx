import React from "react";
import { DataIngestionModule } from "@/presentation/modules/crm/DataIngestionModule";

export default function ImportPage() {
    return (
        <div className="w-full flex-1 bg-slate-50/50 dark:bg-zinc-950 p-4 md:p-8 font-[family-name:var(--font-sans)] text-slate-900 dark:text-zinc-100 pb-10 min-h-screen">
            <main className="max-w-4xl mx-auto">
                <DataIngestionModule />
            </main>
        </div>
    );
}
