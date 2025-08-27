// Login.js - Updated with modern design system
import React, { useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { Link } from 'react-router-dom';

// Color palette matching your design system
const COLORS = {
  lightPurple: '#ccccff',
  teal: '#00ced1', 
  lightTeal: '#d8f0ed',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const auth = getAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      window.location.href = '/';
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('Oops! No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Oops! Incorrect password.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Oops! Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Oops! Invalid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('Oops! Something went wrong. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      window.location.href = '/';
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google login failed: ' + error.message);
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      
      setResetEmailSent(true);
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError('Error sending reset email: ' + error.message);
      }
    }
    
    setLoading(false);
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setError('');
    setResetEmailSent(false);
  };

  // Show password reset success screen
  if (resetEmailSent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '48px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 32px 0'
          }}>
            Password Reset Email Sent
          </h2>
          
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔐</div>
          
          <p style={{
            marginBottom: '16px',
            color: COLORS.gray,
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            We've sent a password reset email to <strong>{email}</strong>
          </p>
          
          <p style={{
            marginBottom: '32px',
            color: COLORS.gray,
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            Please check your inbox and click the reset link to create a new password.
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setResetEmailSent(false)}
              style={{
                backgroundColor: COLORS.teal,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.teal}
            >
              Back to Login
            </button>
            
            <button
              onClick={handlePasswordReset}
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.teal,
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Resend Reset Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '48px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 32px 0',
          textAlign: 'center'
        }}>
          {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
        </h2>

        {error && (
          <div style={{
            backgroundColor: COLORS.error + '20',
            border: `2px solid ${COLORS.error}40`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: COLORS.error,
            fontSize: '14px',
            fontWeight: '500'
          }}>
            ⚠️ {error}
          </div>
        )}

        {showForgotPassword ? (
          // Password Reset Form
          <form onSubmit={handlePasswordReset}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  backgroundColor: COLORS.white,
                  color: '#374151',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.teal;
                  e.target.style.outline = 'none';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#f8fafc' : COLORS.teal,
                color: loading ? COLORS.gray : 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#059669';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = COLORS.teal;
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e2e8f0',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Sending...
                </>
              ) : (
                'Send Reset Email'
              )}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={toggleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.teal,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          // Login Form
          <>
            <form onSubmit={handleEmailLogin}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    backgroundColor: COLORS.white,
                    color: '#374151',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.teal;
                    e.target.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    backgroundColor: COLORS.white,
                    color: '#374151',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.teal;
                    e.target.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#f8fafc' : COLORS.teal,
                  color: loading ? COLORS.gray : 'white',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = COLORS.teal;
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #e2e8f0',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '24px 0',
              textAlign: 'center'
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#e2e8f0'
              }} />
              <span style={{
                padding: '0 16px',
                fontSize: '14px',
                color: COLORS.gray,
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }}>
                OR
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#e2e8f0'
              }} />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: COLORS.white,
                color: COLORS.darkGray,
                border: '2px solid #e2e8f0',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.borderColor = COLORS.teal;
                  e.target.style.backgroundColor = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.backgroundColor = COLORS.white;
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: COLORS.gray,
              lineHeight: '1.6'
            }}>
              <p style={{ marginBottom: '8px' }}>
                Don't have an account?{' '}
                <Link 
                  to="/signup"
                  style={{
                    color: COLORS.teal,
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Sign Up
                </Link>
              </p>
              
              <p style={{ marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.teal,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Forgot Password?
                </button>
              </p>
              
              <p>
                <Link 
                  to="/"
                  style={{
                    color: COLORS.gray,
                    textDecoration: 'none'
                  }}
                >
                  ← Back to Home
                </Link>
              </p>
            </div>
          </>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;