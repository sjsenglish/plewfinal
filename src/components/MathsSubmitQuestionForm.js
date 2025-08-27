// src/components/MathsSubmitQuestionForm.js - Updated with auth checks
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { getAuth } from 'firebase/auth';

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

const MathsSubmitQuestionForm = () => {
  const [formData, setFormData] = useState({
    question: '',
    context: '',
    subject: '',
    examBoard: '',
    year: '',
    questionNumber: '',
    urgency: 'Medium'
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const auth = getAuth();
  const user = auth.currentUser;
  const isLoggedIn = !!user;

  // A Level subjects
  const aLevelSubjects = [
    'Mathematics',
    'Further Mathematics',
    'Statistics',
    'Pure Mathematics',
    'Applied Mathematics',
    'Mechanics',
    'Other'
  ];

  // Common exam boards
  const examBoards = [
    'AQA',
    'Edexcel (Pearson)',
    'OCR',
    'WJEC',
    'CIE (Cambridge)',
    'IB (International Baccalaureate)',
    'Other',
    'Not sure'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (!isLoggedIn) {
      setError('Please log in to upload files.');
      return;
    }

    const files = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        setError(`${file.name} is not a valid file type. Please upload images or PDFs only.`);
        return false;
      }
      if (!isValidSize) {
        setError(`${file.name} is too large. Please keep files under 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length + selectedFiles.length > 3) {
      setError('You can upload a maximum of 3 files.');
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setError('');
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return [];

    const uploadPromises = selectedFiles.map(async (file, index) => {
      const fileRef = ref(storage, `question-attachments/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update progress (simplified)
      setUploadProgress(((index + 1) / selectedFiles.length) * 100);
      
      return {
        name: file.name,
        url: downloadURL,
        type: file.type
      };
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setError('Please log in to submit a question.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // Upload files first if any
      let attachments = [];
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles();
      }

      // Save to Firebase collection for admin review
      const submissionData = {
        question: formData.question,
        context: formData.context,
        subject: formData.subject,
        examBoard: formData.examBoard,
        year: formData.year,
        questionNumber: formData.questionNumber,
        urgency: formData.urgency,
        attachments: attachments,
        submittedBy: user?.email || 'Anonymous',
        submittedAt: new Date(),
        status: 'pending', // pending, reviewed, answered
        userId: user?.uid || null,
        formType: 'maths' // To distinguish from community questions
      };

      await addDoc(collection(db, 'maths-question-submissions'), submissionData);
      
      setSuccess('Maths question submitted successfully! We\'ll review it and create a video solution soon.');
      
      // Reset form
      setFormData({
        question: '',
        context: '',
        subject: '',
        examBoard: '',
        year: '',
        questionNumber: '',
        urgency: 'Medium'
      });
      setSelectedFiles([]);
      setUploadProgress(0);

    } catch (error) {
      setError(`Error submitting question: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if form is valid and user is logged in
  const isFormValid = formData.question && formData.subject && isLoggedIn;
  const isSubmitDisabled = loading || !isFormValid;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '900px',
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
            Submit a Maths Question
          </h1>
          <p style={{
            fontSize: '16px',
            color: COLORS.gray,
            margin: '0',
            lineHeight: '1.6'
          }}>
            Can't find the maths solution you're looking for? Submit your question and we'll create a comprehensive video solution!
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
              🔒 Please log in to submit a maths question
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
                placeholder={isLoggedIn ? "Describe your maths question. Be as specific as possible about what you need help with..." : "Please log in to submit a question"}
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

            {/* File Upload Section */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Question Images/Files
              </label>
              
              <div style={{
                border: '2px dashed #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: isLoggedIn ? '#f8fafc' : '#f1f5f9',
                transition: 'border-color 0.2s ease',
                opacity: isLoggedIn ? 1 : 0.5
              }}>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  disabled={!isLoggedIn}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="file-upload" 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: isLoggedIn ? COLORS.teal : COLORS.gray,
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (isLoggedIn) e.target.style.backgroundColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    if (isLoggedIn) e.target.style.backgroundColor = COLORS.teal;
                  }}
                >
                  📎 {isLoggedIn ? 'Choose Images or PDF' : 'Login Required'}
                </label>
                <div style={{
                  fontSize: '13px',
                  color: COLORS.gray,
                  marginTop: '8px'
                }}>
                  {isLoggedIn 
                    ? 'Upload images of your question (JPG, PNG, etc.) or PDF files. Max 3 files, 10MB each.'
                    : 'Please log in to upload files'
                  }
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  backgroundColor: COLORS.white,
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 12px 0'
                  }}>
                    Selected Files:
                  </h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      marginBottom: index < selectedFiles.length - 1 ? '8px' : '0'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '16px' }}>
                          {file.type.startsWith('image/') ? '🖼️' : '📄'}
                        </span>
                        <span style={{
                          fontSize: '13px',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {file.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: COLORS.gray
                        }}>
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={{
                          backgroundColor: COLORS.error,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{
                  marginTop: '12px',
                  backgroundColor: COLORS.white,
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: COLORS.teal,
                      transition: 'width 0.3s ease',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: COLORS.gray
                  }}>
                    Uploading... {Math.round(uploadProgress)}%
                  </span>
                </div>
              )}
            </div>

            {/* Form Fields Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                  {aLevelSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {/* Exam Board Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Exam Board
                </label>
                <select
                  name="examBoard"
                  value={formData.examBoard}
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
                  <option value="">{isLoggedIn ? 'Select exam board (if known)' : 'Please log in'}</option>
                  {examBoards.map(board => (
                    <option key={board} value={board}>{board}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Second Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Year Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Year
                </label>
                <input
                  type="text"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder={isLoggedIn ? "e.g. 2023, 2022 (if known)" : "Please log in"}
                  maxLength="4"
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
              </div>

              {/* Question Number Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Question Number
                </label>
                <input
                  type="text"
                  name="questionNumber"
                  value={formData.questionNumber}
                  onChange={handleInputChange}
                  placeholder={isLoggedIn ? "e.g. 1, 2a, 3(ii) (if known)" : "Please log in"}
                  maxLength="10"
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
                  <option value="High">High - Urgent (exam coming up)</option>
                </select>
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
                placeholder={isLoggedIn ? "Any additional details that might help us create a better solution (your current level, specific areas you're struggling with, etc.)..." : "Please log in to add context"}
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
                <li style={{ marginBottom: '6px' }}>Our team review your question and any uploaded files</li>
                <li style={{ marginBottom: '6px' }}>We create a video solution with step-by-step explanations</li>
                <li style={{ marginBottom: '6px' }}>Your question becomes searchable for all users</li>
                <li>You'll be notified when the solution is ready</li>
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
                  minWidth: '200px',
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
                ) : (
                  'Submit Maths Question'
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
          .grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MathsSubmitQuestionForm;