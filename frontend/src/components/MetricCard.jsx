import { useEffect, useRef } from 'react';
import { countUp, scaleIn } from '../utils/animations';

function MetricCard({ title, value, icon: Icon, color, trend, isLoading }) {
    const valueRef = useRef(null);
    const cardRef = useRef(null);

    useEffect(() => {
        if (!isLoading && cardRef.current) {
            scaleIn(cardRef.current, 0.5);
        }
    }, [isLoading]);

    useEffect(() => {
        if (!isLoading && valueRef.current && typeof value === 'number') {
            countUp(valueRef.current, value, 2);
        }
    }, [value, isLoading]);

    if (isLoading) {
        return (
            <div className="card" style={{ minHeight: '150px' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
        );
    }

    return (
        <div
            ref={cardRef}
            className="card"
            style={{
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Background gradient */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100px',
                    height: '100px',
                    background: `linear-gradient(135deg, ${color}20, ${color}05)`,
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)'
                }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                }}>
                    <div>
                        <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem',
                            fontWeight: '500'
                        }}>
                            {title}
                        </p>
                        <h2
                            ref={valueRef}
                            style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: 'var(--text-primary)',
                                margin: 0
                            }}
                        >
                            {typeof value === 'number' ? '0' : value}
                        </h2>
                    </div>
                    <div
                        style={{
                            background: `${color}15`,
                            padding: '0.75rem',
                            borderRadius: '12px'
                        }}
                    >
                        <Icon size={24} color={color} />
                    </div>
                </div>

                {trend && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <span style={{
                            color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
                            fontWeight: '600'
                        }}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}%
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            vs last month
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MetricCard;
