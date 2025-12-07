import { useEffect, useRef } from 'react';
import { fadeIn, slideInRight } from '../utils/animations';
import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';

function AIInsights({ suggestions, isLoading }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isLoading && containerRef.current) {
            fadeIn(containerRef.current, 0.8);
        }
    }, [isLoading]);

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'critical':
                return <AlertTriangle size={20} color="var(--danger)" />;
            case 'high':
                return <AlertTriangle size={20} color="var(--warning)" />;
            case 'info':
                return <TrendingUp size={20} color="var(--info)" />;
            default:
                return <Lightbulb size={20} color="var(--primary-blue)" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical':
                return 'var(--danger)';
            case 'high':
                return 'var(--warning)';
            case 'info':
                return 'var(--info)';
            default:
                return 'var(--primary-blue)';
        }
    };

    if (isLoading) {
        return (
            <div className="card">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="card" style={{ opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Lightbulb size={24} color="var(--primary-blue)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>AI-Powered Insights</h3>
            </div>

            {!suggestions || suggestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>
                        All systems operating smoothly! No immediate actions required.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '1rem',
                                background: 'var(--gray-50)',
                                borderLeft: `4px solid ${getPriorityColor(suggestion.priority)}`,
                                borderRadius: '8px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(5px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                {getPriorityIcon(suggestion.priority)}
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        margin: '0 0 0.5rem 0',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {suggestion.message}
                                    </p>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {suggestion.action}
                                    </p>
                                    {suggestion.count && (
                                        <span className="badge badge-info" style={{ marginTop: '0.5rem' }}>
                                            {suggestion.count} items
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AIInsights;
