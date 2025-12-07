import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricCard from './MetricCard';
import InvoiceTable from './InvoiceTable';
import AIInsights from './AIInsights';
import { RevenueChart, PaymentStatusChart, InvoiceVolumeChart } from './Charts';
import { invoicesAPI, insightsAPI } from '../utils/api';
import { pageTransition } from '../utils/animations';
import {
    DollarSign,
    FileText,
    TrendingUp,
    AlertCircle,
    LogOut,
    RefreshCw,
    BarChart3
} from 'lucide-react';

function Dashboard({ setIsAuthenticated }) {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({});
    const [invoices, setInvoices] = useState([]);
    const [trends, setTrends] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            pageTransition(containerRef.current);
        }
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel
            const [invoicesRes, trendsRes, suggestionsRes] = await Promise.all([
                invoicesAPI.getAll({ limit: 10 }),
                insightsAPI.getTrends(),
                insightsAPI.getSuggestions()
            ]);

            setInvoices(invoicesRes.data.invoices || []);
            setTrends(trendsRes.data.trends || {});
            setSuggestions(suggestionsRes.data.suggestions || []);

            // Calculate metrics
            const totalRevenue = parseFloat(trendsRes.data.trends?.total_revenue || 0);
            const totalInvoices = trendsRes.data.trends?.total_invoices || 0;
            const overdueCount = trendsRes.data.trends?.status_breakdown?.overdue || 0;

            setMetrics({
                totalRevenue,
                totalInvoices,
                avgInvoice: parseFloat(trendsRes.data.trends?.average_invoice_amount || 0),
                overdueCount
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        navigate('/login');
    };

    // Prepare chart data
    const revenueChartData = trends.monthly_revenue
        ? Object.entries(trends.monthly_revenue).map(([month, revenue]) => ({
            month,
            revenue: parseFloat(revenue)
        }))
        : [];

    const paymentStatusData = trends.status_breakdown
        ? Object.entries(trends.status_breakdown).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }))
        : [];

    const invoiceVolumeData = revenueChartData.map(item => ({
        month: item.month,
        count: Math.floor(Math.random() * 50) + 10 // Mock data
    }));

    return (
        <div ref={containerRef} style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '1.5rem 2rem',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{ color: 'white', margin: 0, fontSize: '1.75rem' }}>
                            BillerAGI Dashboard
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                            AI-Powered Billing Automation Platform
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={fetchDashboardData}
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container" style={{ padding: '2rem' }}>
                {/* Metrics Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <MetricCard
                        title="Total Revenue"
                        value={`$${metrics.totalRevenue?.toLocaleString() || 0}`}
                        icon={DollarSign}
                        color="var(--success)"
                        trend={{ value: 12.5, isPositive: true }}
                        isLoading={loading}
                    />
                    <MetricCard
                        title="Total Invoices"
                        value={metrics.totalInvoices || 0}
                        icon={FileText}
                        color="var(--primary-blue)"
                        trend={{ value: 8.3, isPositive: true }}
                        isLoading={loading}
                    />
                    <MetricCard
                        title="Average Invoice"
                        value={`$${metrics.avgInvoice?.toLocaleString() || 0}`}
                        icon={TrendingUp}
                        color="var(--info)"
                        isLoading={loading}
                    />
                    <MetricCard
                        title="Overdue Invoices"
                        value={metrics.overdueCount || 0}
                        icon={AlertCircle}
                        color="var(--danger)"
                        trend={{ value: 3.2, isPositive: false }}
                        isLoading={loading}
                    />
                </div>

                {/* AI Insights */}
                <div style={{ marginBottom: '2rem' }}>
                    <AIInsights suggestions={suggestions} isLoading={loading} />
                </div>

                {/* Charts Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <RevenueChart data={revenueChartData} isLoading={loading} />
                    <PaymentStatusChart data={paymentStatusData} isLoading={loading} />
                </div>

                {/* Invoice Volume Chart */}
                <div style={{ marginBottom: '2rem' }}>
                    <InvoiceVolumeChart data={invoiceVolumeData} isLoading={loading} />
                </div>

                {/* Recent Invoices */}
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Recent Invoices</h2>
                        <button className="btn btn-primary">
                            <FileText size={18} />
                            View All
                        </button>
                    </div>
                    <InvoiceTable
                        invoices={invoices}
                        isLoading={loading}
                        onViewInvoice={(invoice) => console.log('View invoice:', invoice)}
                    />
                </div>
            </div>

            {/* Footer */}
            <footer style={{
                background: 'var(--bg-card)',
                padding: '1.5rem 2rem',
                marginTop: '3rem',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center'
            }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    © 2024 BillerAGI. AI-Powered Billing Automation Platform. All rights reserved.
                </p>
            </footer>
        </div>
    );
}

export default Dashboard;
