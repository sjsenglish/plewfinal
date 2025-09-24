// src/components/SubmitQuestionForm.js - Updated with auth checks
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import { usePaywall } from '../hooks/usePaywall';

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

const SubmitQuestionForm = () => {
  const { checkUsage, isPaidUser, isGuest } = usePaywall();
  const [formData, setFormData] = useState({
    question: '',
    context: '',
    subject: '',
    urgency: 'Medium'
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const auth = getAuth();
  const user = auth.currentUser;
  const isLoggedIn = !!user;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setError('Please log in to submit a question.');
      return;
    }
    
    const usageCheck = await checkUsage('community_submit');
    if (!usageCheck.allowed) {
      setError(usageCheck.reason === 'Sign up required' 
        ? 'Please sign up or log in to submit questions' 
        : 'Subscription required to submit questions to the community');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Save to Firebase collection for admin review
      const submissionData = {
        question: formData.question,
        context: formData.context,
        subject: formData.subject,
        urgency: formData.urgency,
        submittedBy: user?.email || 'Anonymous',
        submittedAt: new Date(),
        status: 'pending', // pending, reviewed, answered
        userId: user?.uid || null
      };

      await addDoc(collection(db, 'question-submissions'), submissionData);
      
      setSuccess('Question submitted successfully! We\'ll review it and add it to our database soon.');
      
      // Reset form
      setFormData({
        question: '',
        context: '',
        subject: '',
        urgency: 'Medium'
      });

    } catch (error) {
      setError(`Error submitting question: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid and user is logged in
  const isFormValid = formData.question && formData.subject && isLoggedIn;
  const isSubmitDisabled = loading || !isFormValid || !isPaidUser;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            Submit a Question
          </h1>
          <p style={{
            fontSize: '16px',
            color: COLORS.gray,
            margin: '0',
            lineHeight: '1.6'
          }}>
            Can't find what you're looking for? Submit your question and we'll create a video solution for it!
          </p>
        </div>

        {/* Login Required Notice */}
        {!isLoggedIn && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: `2px solid ${COLORS.warning}40`,
            backgroundColor: COLORS.warning + '10'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: COLORS.warning,
              fontSize: '16px',
              fontWeight: '600',
              textAlign: 'center',
              justifyContent: 'center'
            }}>
              🔒 Please log in to submit a question
            </div>
          </div>
        )}

        {/* Form Container */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          opacity: isLoggedIn ? 1 : 0.6,
          pointerEvents: isLoggedIn ? 'auto' : 'none'
        }}>
          {/* Success/Error Messages */}
          {success && (
            <div style={{
              backgroundColor: COLORS.success + '20',
              border: `2px solid ${COLORS.success}40`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              color: COLORS.success,
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ✅ {success}
            </div>
          )}
          
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

          <form onSubmit={handleSubmit}>
            {/* Question Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Your Question *
              </label>
              <textarea
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                required
                rows="5"
                placeholder={isLoggedIn ? "What would you like help with? Be as specific as possible..." : "Please log in to submit a question"}
                maxLength="500"
                disabled={!isLoggedIn}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  backgroundColor: isLoggedIn ? COLORS.white : '#f8fafc',
                  color: isLoggedIn ? '#374151' : COLORS.gray,
                  lineHeight: '1.5',
                  transition: 'border-color 0.2s ease',
                  cursor: isLoggedIn ? 'text' : 'not-allowed'
                }}
                onFocus={(e) => {
                  if (isLoggedIn) {
                    e.target.style.borderColor = COLORS.teal;
                    e.target.style.outline = 'none';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                }}
              />
              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                textAlign: 'right',
                marginTop: '4px'
              }}>
                {formData.question.length}/500
              </div>
            </div>

            {/* Context Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Additional Context
              </label>
              <textarea
                name="context"
                value={formData.context}
                onChange={handleInputChange}
                rows="4"
                placeholder={isLoggedIn ? "Any additional details about your situation that might help us understand your question better..." : "Please log in to add context"}
                maxLength="300"
                disabled={!isLoggedIn}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  backgroundColor: isLoggedIn ? COLORS.white : '#f8fafc',
                  color: isLoggedIn ? '#374151' : COLORS.gray,
                  lineHeight: '1.5',
                  transition: 'border-color 0.2s ease',
                  cursor: isLoggedIn ? 'text' : 'not-allowed'
                }}
                onFocus={(e) => {
                  if (isLoggedIn) {
                    e.target.style.borderColor = COLORS.teal;
                    e.target.style.outline = 'none';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                }}
              />
              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                textAlign: 'right',
                marginTop: '4px'
              }}>
                {formData.context.length}/300
              </div>
            </div>

            {/* Form Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Subject Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Subject Area *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  disabled={!isLoggedIn}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    backgroundColor: isLoggedIn ? COLORS.white : '#f8fafc',
                    color: isLoggedIn ? '#374151' : COLORS.gray,
                    cursor: isLoggedIn ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">{isLoggedIn ? 'Select a subject' : 'Please log in'}</option>
                  <option value="A Level">A Level</option>
                  <option value="Admissions Exams">Admissions Exams</option>
                  <option value="University Applications">University Applications</option>
                  <option value="Personal Statement">Personal Statement</option>
                  <option value="Interview Preparation">Interview Preparation</option>
                  <option value="Supercurriculars">Supercurriculars</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Priority Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Priority
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  disabled={!isLoggedIn}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    backgroundColor: isLoggedIn ? COLORS.white : '#f8fafc',
                    color: isLoggedIn ? '#374151' : COLORS.gray,
                    cursor: isLoggedIn ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="Low">Low - General question</option>
                  <option value="Medium">Medium - Need help soon</option>
                  <option value="High">High - Urgent (deadline approaching)</option>
                </select>
              </div>
            </div>

            {/* Info Section */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 12px 0'
              }}>
                What happens next?
              </h3>
              <ul style={{
                margin: '0',
                paddingLeft: '20px',
                color: '#374151',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                <li style={{ marginBottom: '6px' }}>Our team reviews your question</li>
                <li style={{ marginBottom: '6px' }}>We create a video and written solution</li>
                <li style={{ marginBottom: '6px' }}>Your question becomes searchable for all users</li>
                <li>You'll be notified when it's ready</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button 
                type="submit" 
                disabled={isSubmitDisabled}
                style={{
                  backgroundColor: isSubmitDisabled ? '#f8fafc' : COLORS.teal,
                  color: isSubmitDisabled ? COLORS.gray : 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  minWidth: '180px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitDisabled) {
                    e.target.style.backgroundColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitDisabled) {
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
                    Submitting...
                  </>
                ) : !isLoggedIn ? (
                  <>
                    🔒 Login Required
                  </>
                ) : !isPaidUser ? (
                  <>
                    🔒 {isGuest ? 'Sign up required' : 'Subscription required'}
                  </>
                ) : (
                  'Submit Question'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .grid-two-cols {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SubmitQuestionForm;