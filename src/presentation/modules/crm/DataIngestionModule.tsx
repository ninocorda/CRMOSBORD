"use client";

import React, { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { manualRegisterStudentAction, getCoursesAction } from "@/core/use-cases/actions";
import { toast } from "sonner";

const DB_FIELDS = [
    { value: "first_name", label: "Nombre" },
    { value: "last_name", label: "Apellido" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Teléfono" },
    { value: "country", label: "País" },
    { value: "id_document", label: "Cédula" },
    { value: "course_id", label: "ID del Curso (UUID)" },
    { value: "total_installments", label: "Total Cuotas" },
    { value: "paid_installments", label: "Cuotas Pagadas" },
    { value: "remaining_installments", label: "Cuotas Restantes" },
    { value: "amount_paid", label: "Monto Pagado Inicial" },
    { value: "payment_method", label: "Método de Pago" },
    { value: "next_payment_date", label: "Fecha Próximo Pago (YYYY-MM-DD)" },
    { value: "__skip", label: "— Omitir —" },
];

type Step = "upload" | "mapping" | "preview" | "done";

export function DataIngestionModule() {
    const [step, setStep] = useState<Step>("upload");
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isDragOver, setIsDragOver] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchCourses = async () => {
            const { data, error } = await getCoursesAction();
            if (!error && data) {
                setCourses(data);
            }
        };
        fetchCourses();
    }, []);

    const parseCSV = (text: string) => {
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim().replace(/"/g, "")));
        return { headers, rows };
    };

    const handleFile = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const { headers, rows } = parseCSV(text);
            setCsvHeaders(headers);
            setCsvRows(rows);
            // Auto-map headers that match DB fields
            const autoMap: Record<string, string> = {};
            headers.forEach((h) => {
                const lowerH = h.toLowerCase();
                const match = DB_FIELDS.find(
                    (f) => f.value !== "__skip" && (f.value === lowerH || f.label.toLowerCase() === lowerH)
                );
                if (match) autoMap[h] = match.value;
            });
            setMapping(autoMap);
            setStep("mapping");
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith(".csv")) handleFile(file);
        },
        [handleFile]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleImport = async () => {
        setIsImporting(true);
        let successCount = 0;
        let errorCount = 0;

        for (const row of csvRows) {
            // Build the object from mapping
            const studentData: Record<string, any> = {};
            csvHeaders.forEach((header, index) => {
                const dbField = mapping[header];
                if (dbField && dbField !== "__skip") {
                    let val: any = row[index];

                    if (val === "") {
                        if (["total_installments", "paid_installments", "remaining_installments", "amount_paid"].includes(dbField)) {
                            studentData[dbField] = 0;
                        } else {
                            // Let the DB handle defaults instead of inserting empty string
                            // Important for dates and unique strings like id_document
                            studentData[dbField] = null;
                        }
                    } else {
                        // Parse numeric fields
                        if (["total_installments", "paid_installments", "remaining_installments", "amount_paid"].includes(dbField)) {
                            studentData[dbField] = Number(val) || 0;
                        } else {
                            studentData[dbField] = val;
                        }
                    }
                }
            });

            // Quick validation for mandatory fields (you can expand this as needed)
            if (!studentData.first_name || !studentData.email || !studentData.course_id) {
                errorCount++;
                continue;
            }

            const res = await manualRegisterStudentAction(studentData as any);
            if (res.error) {
                errorCount++;
            } else {
                successCount++;
            }
        }

        setIsImporting(false);
        setStep("done");

        if (errorCount > 0) {
            toast.warning(`Importación parcial`, { description: `${successCount} alumnos creados, ${errorCount} fallaron.` });
        } else {
            toast.success(`Importación completada`, { description: `Se crearon ${successCount} alumnos exitosamente.` });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-1">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Importar Datos</h2>
                <p className="text-muted-foreground text-sm font-medium">
                    Sube un archivo CSV con los datos de tus alumnos para importarlos al sistema.
                </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-sm">
                <Badge className={step === "upload" ? "bg-blue-600 text-white" : "bg-emerald-100 text-emerald-700"}>
                    1. Subir CSV
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge className={step === "mapping" ? "bg-blue-600 text-white" : step === "preview" || step === "done" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                    2. Mapear Columnas
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge className={step === "preview" ? "bg-blue-600 text-white" : step === "done" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                    3. Previsualizar
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge className={step === "done" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}>
                    4. Importado
                </Badge>
            </div>

            {/* Step 1: Upload */}
            {
                step === "upload" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardContent className="pt-6">
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragOver ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : "border-slate-300 dark:border-zinc-700"}`}
                                >
                                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="font-semibold text-lg mb-1">Arrastra tu archivo CSV aquí</h3>
                                    <p className="text-muted-foreground text-sm mb-4">o haz clic para seleccionar uno</p>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                                        <label htmlFor="csv-upload" className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-11 px-6 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer shadow-sm text-slate-800 dark:text-zinc-200">
                                            <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleInputChange} />
                                            <Upload className="mr-2 h-4 w-4" /> Seleccionar Archivo
                                        </label>
                                        <a
                                            href="/osbord-import-template.csv"
                                            download="osbord-import-template.csv"
                                            className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-11 px-6 text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800"
                                        >
                                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Descargar Plantilla
                                        </a>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-1 shadow-sm overflow-hidden flex flex-col h-full border-blue-100 dark:border-blue-900">
                            <CardHeader className="pb-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900">
                                <CardTitle className="text-sm font-bold text-blue-800 dark:text-blue-300">IDs de Másters Disponibles</CardTitle>
                                <CardDescription className="text-xs text-blue-600/80 dark:text-blue-400/80">Pega estos UUIDs en la columna course_id de tu plantilla Excel (Haz clic para copiar).</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 relative min-h-[200px]">
                                <div className="absolute inset-0 overflow-y-auto">
                                    {courses.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center h-full">
                                            <Loader2 className="h-5 w-5 animate-spin mb-2" />
                                            Cargando módulos...
                                        </div>
                                    ) : courses.map(course => (
                                        <div key={course.id} className="p-3 border-b border-border last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                                            <p className="font-semibold text-xs text-slate-800 dark:text-zinc-200 truncate mb-1" title={course.name}>{course.name}</p>
                                            <code
                                                className="text-[10px] text-slate-500 bg-slate-100 dark:bg-zinc-900 px-2 py-1 rounded block select-all cursor-copy hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                                title="Haz clic para copiar UUID al portapapeles"
                                                onClick={() => { navigator.clipboard.writeText(course.id); toast.success("UUID copiado", { description: `${course.name}` }); }}
                                            >
                                                {course.id}
                                            </code>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Step 2: Column Mapping */}
            {
                step === "mapping" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Mapeo de Columnas</CardTitle>
                            <CardDescription>
                                Asocia cada columna del CSV con el campo correspondiente en la base de datos.
                                Se cargaron <strong>{csvRows.length}</strong> filas y <strong>{csvHeaders.length}</strong> columnas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {csvHeaders.map((header) => (
                                <div key={header} className="grid grid-cols-3 items-center gap-4">
                                    <Label className="font-mono text-sm bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-right truncate">
                                        {header}
                                    </Label>
                                    <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground" />
                                    <Select
                                        value={mapping[header] || ""}
                                        onValueChange={(val: string | null) => setMapping((prev) => ({ ...prev, [header]: val || "" }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar campo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DB_FIELDS.map((f) => (
                                                <SelectItem key={f.value} value={f.value}>
                                                    {f.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setStep("preview")} className="bg-blue-600 hover:bg-blue-700">
                                    Continuar a Preview
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Step 3: Preview */}
            {
                step === "preview" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Previsualización de Datos</CardTitle>
                            <CardDescription>Revisa los primeros registros antes de importar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {csvHeaders.map((h) => (
                                                <TableHead key={h}>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted-foreground">{h}</span>
                                                        <span className="text-xs font-semibold text-blue-600">{mapping[h] || "—"}</span>
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {csvRows.slice(0, 5).map((row, i) => (
                                            <TableRow key={i}>
                                                {row.map((cell, j) => (
                                                    <TableCell key={j} className="text-sm">{cell}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {csvRows.length > 5 && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    Mostrando 5 de {csvRows.length} registros.
                                </p>
                            )}
                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={() => setStep("mapping")}>Atrás</Button>
                                <Button disabled={isImporting} onClick={handleImport} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                    {isImporting ? "Importando..." : `Importar ${csvRows.length} Registros`}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Step 4: Done */}
            {
                step === "done" && (
                    <Card className="border-emerald-200 dark:border-emerald-800">
                        <CardContent className="pt-6 text-center">
                            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                            <h3 className="text-xl font-bold mb-2">¡Importación Exitosa!</h3>
                            <p className="text-muted-foreground">
                                Se importaron <strong>{csvRows.length}</strong> registros de alumnos a la base de datos.
                            </p>
                            <Button variant="outline" className="mt-6" onClick={() => { setStep("upload"); setCsvHeaders([]); setCsvRows([]); setMapping({}); }}>
                                Importar otro archivo
                            </Button>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
}
