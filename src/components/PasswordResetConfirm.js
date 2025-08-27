// PasswordResetConfirm.js - Password reset confirmation page
import React, { useState, useEffect } from 'react';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from './ui';
import './AuthForms.css';

const PasswordResetConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [resetComplete, setResetComplete] = useState(false);

  const auth = getAuth();
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    // Verify the reset code when component mounts
    const verifyResetCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setError('Invalid or expired password reset link.');
        setVerifying(false);
        return;
      }

      try {
        // Verify the code and get the associated email
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setVerifying(false);
      } catch (error) {
        console.error('Error verifying reset code:', error);
        if (error.code === 'auth/expired-action-code') {
          setError('This password reset link has expired. Please request a new one.');
        } else if (error.code === 'auth/invalid-action-code') {
          setError('Invalid password reset link. Please request a new one.');
        } else {
          setError('Error verifying reset link: ' + error.message);
        }
        setVerifying(false);
      }
    };

    verifyResetCode();
  }, [oobCode, mode, auth]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, password);
      setResetComplete(true);
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.code === 'auth/expired-action-code') {
        setError('This password reset link has expired. Please request a new one.');
      } else if (error.code === 'auth/invalid-action-code') {
        setError('Invalid password reset link. Please request a new one.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError('Error resetting password: ' + error.message);
      }
      setLoading(false);
    }
  };

  // Show loading state while verifying code
  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-form-container">
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ color: '#6b7280' }}>Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show success screen after password reset
  if (resetComplete) {
    return (
      <div className="auth-container">
        <div className="auth-form-container">
          <h2>Password Reset Complete</h2>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              Your password has been successfully reset!
            </p>
            <p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '0.9rem' }}>
              You can now log in with your new password.
            </p>
            
            <Button
              onClick={() => navigate('/login')}
              variant="primary"
              theme="tsa"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if code verification failed
  if (error && !password && !confirmPassword) {
    return (
      <div className="auth-container">
        <div className="auth-form-container">
          <h2>Password Reset Error</h2>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <div className="auth-error" style={{ marginBottom: '2rem' }}>
              {error}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <Link to="/login">
                <Button variant="secondary" theme="tsa">
                  Back to Login
                </Button>
              </Link>
              
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                Need to reset your password again?{' '}
                <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none' }}>
                  Request a new reset link
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show password reset form
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Set New Password</h2>
        
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Setting new password for: <strong>{email}</strong>
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handlePasswordReset} className="auth-form">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            theme="tsa"
            placeholder="Enter your new password"
            helpText="Password must be at least 6 characters"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
            theme="tsa"
            placeholder="Confirm your new password"
            error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
          />

          <Button type="submit" variant="primary" fullWidth loading={loading} theme="tsa">
            Reset Password
          </Button>
        </form>

        <div className="auth-links">
          <p>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetConfirm;