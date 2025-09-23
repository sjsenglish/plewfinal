// SignUp.js - Updated with modern design system
import React, { useState } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  const handleEmailSignUp = async (e) => {
    e.preventDefault();

    // Validate password match
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Step 2: Set display name
      await updateProfile(userCredential.user, { displayName: name });

      // Step 3: Create Firestore document with subscription schema
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        // Existing bookmark fields
        tsaBookmarks: [],
        plewBookmarks: [],

        // New subscription fields
        subscription: {
          status: 'free', // 'free', 'active', 'canceled', 'past_due'
          plan: null, // 'study', 'pro', or null
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },

        // Usage tracking for free tier limits
        usage: {
          questionsViewedToday: 0,
          lastResetDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          questionPacksCreated: 0,
        },

        // Metadata
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true, // No email verification required
      });

      console.log('User created with subscription schema');

      // After successful user creation, initialize profile
try {
  const initResponse = await fetch('https://initializestudyprofile-vw3ejjfc5a-uc.a.run.app', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await userCredential.user.getIdToken()}`
    }
  });
} catch (error) {
  console.log('Profile initialization will happen later');
}

      // Redirect directly to sign in page without email verification
      setError('');
      window.location.href = '/login?message=account-created';

    } catch (error) {
      console.error('Sign up error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('이 이메일로 이미 계정이 등록되어 있습니다. 로그인해 주세요.');
      } else if (error.code === 'auth/weak-password') {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
      } else if (error.code === 'auth/invalid-email') {
        setError('올바른 이메일 주소를 입력해 주세요.');
      } else {
        setError('회원가입 중 문제가 발생했습니다. 다시 시도해 주세요.');
      }
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // Create user document in Firestore with subscription schema
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(
        userDocRef,
        {
          // Existing bookmark fields
          tsaBookmarks: [],
          plewBookmarks: [],

          // New subscription fields
          subscription: {
            status: 'free',
            plan: null,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },

          // Usage tracking for free tier limits
          usage: {
            questionsViewedToday: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
            questionPacksCreated: 0,
          },

          // Metadata
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: true, // Google accounts are pre-verified
        },
        { merge: true }
      ); // Use merge to avoid overwriting existing data

      console.log('Google user created with subscription schema');

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Google sign up error:', error);
      setError(error.message || '구글 회원가입 중 오류가 발생했습니다');
      setLoading(false);
    }
  };


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
          계정 만들기
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

        <form onSubmit={handleEmailSignUp}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
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
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
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
              이메일 주소
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소를 입력하세요"
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
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
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
              placeholder="Create a password"
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
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COLORS.teal;
                e.target.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
              }}
            />
            <p style={{
              fontSize: '12px',
              color: COLORS.gray,
              margin: '4px 0 0 0'
            }}>
              Password must be at least 6 characters
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              style={{
                width: '100%',
                padding: '16px',
                border: `2px solid ${confirmPassword && password !== confirmPassword ? COLORS.error : '#e2e8f0'}`,
                borderRadius: '12px',
                fontSize: '16px',
                fontFamily: 'inherit',
                backgroundColor: COLORS.white,
                color: '#374151',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!(confirmPassword && password !== confirmPassword)) {
                  e.target.style.borderColor = COLORS.teal;
                }
                e.target.style.outline = 'none';
              }}
              onBlur={(e) => {
                if (!(confirmPassword && password !== confirmPassword)) {
                  e.target.style.borderColor = '#e2e8f0';
                }
              }}
            />
            {confirmPassword && password !== confirmPassword && (
              <p style={{
                fontSize: '12px',
                color: COLORS.error,
                margin: '4px 0 0 0'
              }}>
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (confirmPassword && password !== confirmPassword)}
            style={{
              width: '100%',
              backgroundColor: (loading || (confirmPassword && password !== confirmPassword)) ? '#f8fafc' : COLORS.teal,
              color: (loading || (confirmPassword && password !== confirmPassword)) ? COLORS.gray : 'white',
              border: 'none',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (loading || (confirmPassword && password !== confirmPassword)) ? 'not-allowed' : 'pointer',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading && !(confirmPassword && password !== confirmPassword)) {
                e.target.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !(confirmPassword && password !== confirmPassword)) {
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
                Creating Account...
              </>
            ) : (
              '계정 만들기'
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
          onClick={handleGoogleSignUp}
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
          구글로 계속하기
        </button>

        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          color: COLORS.gray,
          lineHeight: '1.6'
        }}>
          <p style={{ marginBottom: '8px' }}>
            이미 계정이 있으신가요?{' '}
            <Link 
              to="/login"
              style={{
                color: COLORS.teal,
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              로그인
            </Link>
          </p>
          
          <p>
            <Link 
              to="/"
              style={{
                color: COLORS.gray,
                textDecoration: 'none'
              }}
            >
              ← 홈으로 돌아가기
            </Link>
          </p>
        </div>
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

export default SignUp;