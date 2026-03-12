'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';
import type { Payment } from '@/core/entities/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Extended type based on query join
type PaymentWithStudent = Payment & {
    enrollment?: {
        student?: { first_name: string; last_name: string };
    };
};

interface CalendarARProps {
    payments: PaymentWithStudent[];
    // Callback when clicking an event to open verification modal
    onEventClick?: (paymentId: string, status: string) => void;
}

export function CalendarAR({ payments, onEventClick }: CalendarARProps) {

    // Transform domain entities to FullCalendar events
    const events = payments.map((payment) => {
        let color = '#eab308'; // amarillo: pending
        let statusText = 'Pendiente';

        if (payment.verification_status === 'verified') {
            color = '#22c55e'; // verde: paid
            statusText = 'Pagado';
        } else if (new Date(payment.due_date) < new Date()) {
            color = '#ef4444'; // rojo: overdue
            statusText = 'Atrasado';
        }

        const studentName = payment.enrollment?.student
            ? `${payment.enrollment.student.first_name} ${payment.enrollment.student.last_name}`
            : 'Estudiante Desconocido';

        return {
            id: payment.id,
            title: `$${payment.amount} - ${studentName}`,
            date: payment.due_date,
            backgroundColor: color,
            borderColor: color,
            extendedProps: {
                status: statusText,
                reference: payment.reference_code,
                method: payment.payment_method,
                rawStatus: payment.verification_status,
            },
        };
    });

    return (
        <Card className="w-full shadow-lg border-primary/10 bg-white dark:bg-zinc-950 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-zinc-50">
                    Cuentas por Cobrar (Vencimientos)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="calendar-wrapper rounded-xl overflow-hidden border">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin]}
                        initialView="dayGridMonth"
                        locale={esLocale}
                        events={events}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek',
                        }}
                        height="auto"
                        eventClick={(info) => {
                            if (onEventClick) {
                                onEventClick(
                                    info.event.id,
                                    info.event.extendedProps.rawStatus
                                );
                            }
                        }}
                        eventContent={(eventInfo) => (
                            <div className="flex flex-col p-1 text-xs cursor-pointer hover:opacity-80 transition-opacity">
                                <span className="font-semibold truncate">{eventInfo.event.title}</span>
                                <span className="text-[10px] opacity-90">{eventInfo.event.extendedProps.status}</span>
                            </div>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
