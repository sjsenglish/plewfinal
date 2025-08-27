// Login.js
import React, { useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import './AuthForms.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/profile'); // Redirect to profile on success
    } catch (error) {
      console.error('Login error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/profile'); // Redirect to profile on success
    } catch (error) {
      console.error('Google login error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get readable error messages
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Log In</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleEmailLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button primary-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          className="auth-button google-button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <i className="fab fa-google"></i> Continue with Google
        </button>

        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
          <p>
            <Link to="/">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;