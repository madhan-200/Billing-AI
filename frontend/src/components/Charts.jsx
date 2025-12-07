import { useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fadeIn } from '../utils/animations';

export function RevenueChart({ data, isLoading }) {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!isLoading && chartRef.current) {
            fadeIn(chartRef.current, 0.8);
        }
    }, [isLoading]);

    if (isLoading) {
        return (
            <div className="card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div ref={chartRef} className="card" style={{ opacity: 0 }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                    <XAxis dataKey="month" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px'
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--primary-blue)"
                        strokeWidth={3}
                        dot={{ fill: 'var(--primary-blue)', r: 5 }}
                        activeDot={{ r: 7 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function PaymentStatusChart({ data, isLoading }) {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!isLoading && chartRef.current) {
            fadeIn(chartRef.current, 0.8, 0.2);
        }
    }, [isLoading]);

    const COLORS = {
        paid: '#10b981',
        sent: '#06b6d4',
        pending: '#f59e0b',
        overdue: '#ef4444'
    };

    if (isLoading) {
        return (
            <div className="card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div ref={chartRef} className="card" style={{ opacity: 0 }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Payment Status</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || '#8884d8'} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function InvoiceVolumeChart({ data, isLoading }) {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!isLoading && chartRef.current) {
            fadeIn(chartRef.current, 0.8, 0.4);
        }
    }, [isLoading]);

    if (isLoading) {
        return (
            <div className="card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div ref={chartRef} className="card" style={{ opacity: 0 }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Invoice Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                    <XAxis dataKey="month" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px'
                        }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="var(--primary-blue)" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
