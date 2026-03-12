import * as React from 'react';

interface PaymentReminderTemplateProps {
    studentName: string;
    amount: number;
    dueDate: string;
}

export const PaymentReminderTemplate: React.FC<Readonly<PaymentReminderTemplateProps>> = ({
    studentName,
    amount,
    dueDate,
}) => (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', color: '#333' }}>
        <h2 style={{ color: '#2563eb' }}>Recordatorio de Pago</h2>
        <p>Hola <strong>{studentName}</strong>,</p>
        <p>
            Este es un recordatorio amigable sobre tu próxima cuota en nuestro programa.
        </p>
        <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', margin: '15px 0' }}>
            <p style={{ margin: '0 0 10px 0' }}><strong>Monto:</strong> ${amount.toFixed(2)}</p>
            <p style={{ margin: 0 }}><strong>Fecha de Vencimiento:</strong> {new Date(dueDate).toLocaleDateString()}</p>
        </div>
        <p>
            Si ya realizaste el pago a través de transferencia (Zelle, Binance o Pago Móvil), por favor repórtalo en nuestra plataforma y no olvides incluir el código de referencia.
        </p>
        <p style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
            Saludos cordiales,<br />
            El equipo de Administración.
        </p>
    </div>
);
