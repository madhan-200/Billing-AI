import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { fadeIn, slideInLeft } from '../utils/animations';
import { Lock, Mail, LogIn } from 'lucide-react';

function LoginPage({ setIsAuthenticated }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const containerRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => {
        // Animate on mount
        if (containerRef.current) {
            fadeIn(containerRef.current, 0.8);
        }
        if (formRef.current) {
            slideInLeft(formRef.current, 0.6, 0.2);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login({ username, password });

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setIsAuthenticated(true);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2rem'
            }}
        >
            <div
                ref={formRef}
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '3rem',
                    maxWidth: '450px',
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>
                        BillerAGI
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        AI-Powered Billing Automation Platform
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                            color: '#374151',
                            fontSize: '0.875rem'
                        }}>
                            Username
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af'
                                }}
                            />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                style={{
                                    paddingLeft: '3rem'
                                }}
                                placeholder="Enter your username"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '500',
                            color: '#374151',
                            fontSize: '0.875rem'
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af'
                                }}
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    paddingLeft: '3rem'
                                }}
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            padding: '0.875rem',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        {loading ? (
                            'Signing in...'
                        ) : (
                            <>
                                <LogIn size={20} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                }}>
                    <p style={{ margin: 0 }}>
                        <strong>Demo Credentials:</strong><br />
                        Username: admin<br />
                        Password: admin123
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
