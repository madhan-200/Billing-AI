import { useEffect, useRef } from 'react';
import { staggerFadeIn } from '../utils/animations';
import { FileText, Download, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';

function InvoiceTable({ invoices, isLoading, onViewInvoice }) {
    const rowsRef = useRef([]);

    useEffect(() => {
        if (!isLoading && rowsRef.current.length > 0) {
            staggerFadeIn(rowsRef.current, 0.05);
        }
    }, [invoices, isLoading]);

    const getStatusBadge = (status) => {
        const statusConfig = {
            paid: { class: 'badge-success', icon: CheckCircle, text: 'Paid' },
            sent: { class: 'badge-info', icon: Send, text: 'Sent' },
            pending: { class: 'badge-warning', icon: Clock, text: 'Pending' },
            overdue: { class: 'badge-danger', icon: AlertCircle, text: 'Overdue' },
            validated: { class: 'badge-info', icon: CheckCircle, text: 'Validated' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`badge ${config.class}`} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
            }}>
                <Icon size={12} />
                {config.text}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="card">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                        Loading invoices...
                    </p>
                </div>
            </div>
        );
    }

    if (!invoices || invoices.length === 0) {
        return (
            <div className="card">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <FileText size={48} color="var(--gray-400)" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>No invoices found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>AI Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((invoice, index) => (
                            <tr
                                key={invoice.id}
                                ref={(el) => (rowsRef.current[index] = el)}
                                style={{
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                                onClick={() => onViewInvoice && onViewInvoice(invoice)}
                            >
                                <td style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>
                                    {invoice.invoice_number}
                                </td>
                                <td>{invoice.customer_name}</td>
                                <td style={{ fontWeight: '600' }}>
                                    ${parseFloat(invoice.total_amount).toFixed(2)}
                                </td>
                                <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                                <td>{getStatusBadge(invoice.status)}</td>
                                <td>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '6px',
                                            background: 'var(--gray-200)',
                                            borderRadius: '3px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${100 - (invoice.ai_anomaly_score || 0)}%`,
                                                height: '100%',
                                                background: invoice.ai_anomaly_score > 70 ? 'var(--danger)' :
                                                    invoice.ai_anomaly_score > 40 ? 'var(--warning)' :
                                                        'var(--success)',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {invoice.ai_anomaly_score || 0}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {invoice.pdf_url && (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(invoice.pdf_url, '_blank');
                                                }}
                                            >
                                                <Download size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InvoiceTable;
