"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Banknote, Calendar } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
    subDays, subMonths, addDays, addMonths,
    startOfDay, format, eachDayOfInterval,
    eachMonthOfInterval, isWithinInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FinancialOverviewProps {
    students: any[];
}

export function FinancialOverview({ students }: FinancialOverviewProps) {
    const [range, setRange] = useState('all');

    const rangeDates = useMemo(() => {
        const now = new Date();
        const today = startOfDay(now);

        switch (range) {
            case '1w':
                return {
                    start: subDays(today, 7),
                    end: addDays(today, 7),
                    unit: 'day' as const
                };
            case '1m':
                return {
                    start: subDays(today, 15),
                    end: addDays(today, 30),
                    unit: 'day' as const
                };
            case '3m':
                return {
                    start: subMonths(today, 3),
                    end: addMonths(today, 3),
                    unit: 'month' as const
                };
            case '6m':
                return {
                    start: subMonths(today, 6),
                    end: addMonths(today, 6),
                    unit: 'month' as const
                };
            case '1y':
                return {
                    start: subMonths(today, 12),
                    end: addMonths(today, 12),
                    unit: 'month' as const
                };
            case 'all':
            default:
                // Find earliest and latest payment dates in students
                let earliest = today;
                let latest = addMonths(today, 12); // Default to at least 12m for projection
                students.forEach(s => {
                    s.enrollments?.forEach((e: any) => {
                        e.payments?.forEach((p: any) => {
                            const d = new Date(p.paid_at || p.due_date);
                            if (d < earliest) earliest = d;
                            if (d > latest) latest = d;
                        });
                    });
                });
                return {
                    start: startOfDay(earliest),
                    end: latest,
                    unit: 'month' as const
                };
        }
    }, [range, students]);

    const { metrics, chartData } = useMemo(() => {
        let collected = 0;
        let pending = 0;
        let overdue = 0;

        const now = new Date();
        const today = startOfDay(now);
        const { start, end, unit } = rangeDates;
        const interval = { start, end };

        // Aggregate payments by date
        const aggregations: Record<string, { ingresos: number, proyeccion: number }> = {};

        // Initialize intervals
        const points = unit === 'day'
            ? eachDayOfInterval(interval)
            : eachMonthOfInterval(interval);

        points.forEach(p => {
            const key = format(p, unit === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM');
            aggregations[key] = { ingresos: 0, proyeccion: 0 };
        });

        students.forEach(student => {
            student.enrollments?.forEach((enr: any) => {
                enr.payments?.forEach((pay: any) => {
                    const amount = Number(pay.amount) || 0;
                    const isPaid = pay.verification_status === 'verified';
                    const dueDate = new Date(pay.due_date);
                    const dateStr = isPaid ? (pay.paid_at || pay.due_date) : pay.due_date;
                    const date = new Date(dateStr);

                    // Specific Metrics within interval
                    if (isWithinInterval(date, interval)) {
                        if (isPaid) collected += amount;
                        else {
                            pending += amount;
                            if (dueDate < today) overdue += amount;
                        }
                    }

                    // Chart: accumulate
                    const key = format(date, unit === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM');
                    if (aggregations[key]) {
                        if (isPaid) {
                            aggregations[key].ingresos += amount;
                        } else {
                            aggregations[key].proyeccion += amount;
                        }
                    }
                });
            });
        });

        // Format for Recharts
        const data = points.map(p => {
            const key = format(p, unit === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM');
            const name = format(p, unit === 'day' ? 'd MMM' : 'MMM', { locale: es });
            return {
                name,
                ingresos: aggregations[key].ingresos || null,
                proyeccion: Math.round(aggregations[key].ingresos + aggregations[key].proyeccion)
            };
        });

        return {
            metrics: { collected, pending, overdue, total: collected + pending },
            chartData: data
        };
    }, [students, rangeDates]);


    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Resumen Financiero</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Flujo de caja y proyección</p>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <Select value={range} onValueChange={(val) => val && setRange(val)}>
                        <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-semibold h-9">
                            <SelectValue placeholder="Periodo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="1w">1 Semana</SelectItem>
                            <SelectItem value="1m">1 Mes</SelectItem>
                            <SelectItem value="3m">3 Meses</SelectItem>
                            <SelectItem value="6m">6 Meses</SelectItem>
                            <SelectItem value="1y">1 Año</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="border-none bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 shadow-inner">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-widest">Vendido</p>
                            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                                {formatCurrency(metrics.collected)}
                            </p>
                            <p className="text-xs font-semibold text-emerald-600/60 dark:text-emerald-500/60">Capital ingresado</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-emerald-200/50 dark:bg-emerald-800/50 flex items-center justify-center shrink-0">
                            <Banknote className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/10 shadow-inner">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-indigo-700/70 dark:text-indigo-400/70 uppercase tracking-widest">Por Cobrar</p>
                            <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400 tracking-tight">
                                {formatCurrency(metrics.pending)}
                            </p>
                            <p className="text-xs font-semibold text-indigo-600/60 dark:text-indigo-500/60">Proyección futura</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-indigo-200/50 dark:bg-indigo-800/50 flex items-center justify-center shrink-0">
                            <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/10 shadow-inner">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-red-700/70 dark:text-red-400/70 uppercase tracking-widest">Vencido</p>
                            <p className="text-3xl font-black text-red-700 dark:text-red-400 tracking-tight">
                                {formatCurrency(metrics.overdue)}
                            </p>
                            <p className="text-xs font-semibold text-red-600/60 dark:text-red-500/60">Pagos atrasados</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-200/50 dark:bg-red-800/50 flex items-center justify-center shrink-0">
                            <div className="h-6 w-6 rounded-full border-2 border-red-600 dark:border-red-400 flex items-center justify-center text-[10px] font-black text-red-600 dark:text-red-400">!</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-[250px] w-full mt-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProyeccion" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                            tickFormatter={(value) => value === 0 ? '$0' : `$${value > 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                            dx={-10}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                padding: '12px'
                            }}
                            itemStyle={{ fontWeight: 700, fontSize: '14px' }}
                            formatter={(value: any) => formatCurrency(Number(value))}
                            labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="proyeccion"
                            name="Proyección Total"
                            stroke="#818cf8"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            fillOpacity={1}
                            fill="url(#colorProyeccion)"
                        />
                        <Area
                            type="monotone"
                            dataKey="ingresos"
                            name="Ingresos Reales"
                            stroke="#10b981"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorIngresos)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
