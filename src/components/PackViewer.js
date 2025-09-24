// src/components/PackViewer.js - Updated to match ProfilePage design
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getQuestionPack } from '../services/questionPackService';
import { liteClient as algoliasearch } from 'algoliasearch/lite';

// Algolia search client
const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Color palette matching ProfilePage
const COLORS = {
  lightPurple: '#ccccff',
  teal: '#00ced1', 
  lightTeal: '#d8f0ed',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151'
};

// Helper function to convert Firebase Storage URLs to direct URLs
const getImageUrl = (url) => {
  if (!url) return '';
  
  // If it's a Firebase Storage gs:// URL, convert it
  if (url.startsWith('gs://')) {
    // Extract bucket and path from gs://bucket/path format
    const gsMatch = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (gsMatch) {
      const bucket = gsMatch[1];
      const path = gsMatch[2];
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    }
  }
  
  return url;
};

// Subject configurations - matching your QuestionPackPage
const SUBJECTS = {
  tsa: {
    index: 'copy_tsa_questions',
    displayName: 'TSA Questions'
  },
  maths: {
    index: 'edexel_mathematics_updated',
    displayName: 'A-Level Maths'
  },
  'korean-english': {
    index: 'csat_final',
    displayName: 'Korean-English'
  }
};

const PackViewer = () => {
  const { packId } = useParams();
  const navigate = useNavigate();
  const [pack, setPack] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    loadPack();
  }, [packId]);

  const loadPack = async () => {
    if (!user) {
      setError('Please log in to view packs');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get pack metadata from Firestore
      const packResult = await getQuestionPack(user.uid, packId);

      if (!packResult.success) {
        setError('Pack not found');
        setLoading(false);
        return;
      }

      const packData = packResult.data;
      
      // Check if subject is supported
      const subjectConfig = SUBJECTS[packData.subject];
      if (!subjectConfig) {
        setError(`Unsupported subject: ${packData.subject}. This viewer supports TSA, A-Level Maths, and Korean-English questions.`);
        setLoading(false);
        return;
      }

      setPack(packData);

      // Get the actual questions from Algolia using the stored question IDs
      if (packData.selectedQuestionIds && packData.selectedQuestionIds.length > 0) {
        try {
          const response = await searchClient.search([
            {
              indexName: subjectConfig.index,
              params: {
                query: '',
                filters: packData.selectedQuestionIds.map((id) => `objectID:"${id}"`).join(' OR '),
                hitsPerPage: packData.selectedQuestionIds.length,
              },
            },
          ]);

          const fetchedQuestions = response.results[0].hits;

          // Sort questions to match the original order
          const sortedQuestions = packData.selectedQuestionIds
            .map((id) => fetchedQuestions.find((q) => q.objectID === id))
            .filter(Boolean);

          setQuestions(sortedQuestions);
        } catch (algoliaError) {
          console.error('Error fetching questions from Algolia:', algoliaError);
          setError('Failed to load questions from search index');
        }
      }
    } catch (error) {
      console.error('Error loading pack:', error);
      setError('Failed to load pack: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
        padding: '0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e5e7eb',
              borderTop: `3px solid ${COLORS.teal}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px auto'
            }} />
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              Loading Pack...
            </h1>
            <p style={{ color: COLORS.gray, margin: '0' }}>
              Please wait while we load your question pack.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
        padding: '0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.7
            }}>
              ⚠️
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 16px 0'
            }}>
              Error
            </h1>
            <p style={{ 
              color: '#dc3545', 
              marginBottom: '24px',
              fontSize: '16px'
            }}>
              {error}
            </p>
            <Link 
              to="/profile" 
              style={{
                backgroundColor: COLORS.teal,
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
        padding: '0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.7
            }}>
              📄
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 16px 0'
            }}>
              Pack Not Found
            </h1>
            <p style={{ 
              color: COLORS.gray, 
              marginBottom: '24px',
              fontSize: '16px'
            }}>
              The requested pack could not be found.
            </p>
            <Link 
              to="/profile" 
              style={{
                backgroundColor: COLORS.teal,
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subjectConfig = SUBJECTS[pack.subject];

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      padding: '0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px 40px 24px'
      }}>
        {/* Back button */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/profile"
            style={{
              color: COLORS.teal,
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← Back to Profile
          </Link>
        </div>

        {/* Pack Header */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            {pack.packName}
          </h1>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '16px'
          }}>
            <span style={{
              fontSize: '14px',
              padding: '6px 12px',
              backgroundColor: COLORS.teal,
              color: 'white',
              borderRadius: '20px',
              fontWeight: '500'
            }}>
              {subjectConfig.displayName}
            </span>
            <span style={{
              fontSize: '14px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              color: COLORS.darkGray,
              borderRadius: '20px',
              fontWeight: '500'
            }}>
              {questions.length} Questions
            </span>
          </div>
          <p style={{
            color: COLORS.gray,
            fontSize: '14px',
            margin: '0'
          }}>
            Pack ID: {pack.packId} • Created: {formatDate(pack.createdAt)}
          </p>
        </div>

        {/* Questions Display */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '32px'
        }}>
          {questions.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                opacity: 0.7
              }}>
                📝
              </div>
              <h3 style={{ 
                color: COLORS.gray, 
                margin: '0 0 8px 0',
                fontWeight: '500'
              }}>
                No questions found
              </h3>
              <p style={{ 
                color: '#9ca3af', 
                margin: '0',
                fontSize: '14px'
              }}>
                This pack doesn't contain any questions yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {questions.map((question, index) => {
                // Get image URL from question data
                const rawImageUrl = question?.image_url || question?.imageFile || question?.image_file || question?.imageUrl;
                const imageUrl = rawImageUrl && rawImageUrl !== 'default_image.jpg' ? rawImageUrl : null;
                
                return (
                  <div
                    key={question.objectID}
                    style={{
                      backgroundColor: COLORS.white,
                      borderRadius: '12px',
                      padding: '24px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        Question {index + 1}
                        {imageUrl && (
                          <span style={{ fontSize: '16px' }}>📷</span>
                        )}
                      </h3>
                      
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {/* TSA Tags */}
                        {pack.subject === 'tsa' && question.question_type && (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {question.question_type}
                          </span>
                        )}
                        {pack.subject === 'tsa' && question.year && (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {question.year}
                          </span>
                        )}
                        
                        {/* Maths Tags */}
                        {pack.subject === 'maths' && question.spec_topic && (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            backgroundColor: '#ddd6fe',
                            color: '#5b21b6',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {question.spec_topic}
                          </span>
                        )}
                        {pack.subject === 'maths' && question.question_topic && (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {question.question_topic}
                          </span>
                        )}
                        {pack.subject === 'maths' && question.marks && (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {question.marks} marks
                          </span>
                        )}
                        {pack.subject === 'maths' && question.id && (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {question.id.split('_')[0]}
                          </span>
                        )}

                        {/* Korean-English Tags */}
                        {pack.subject === 'korean-english' && question.difficulty && (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            backgroundColor: '#fef0cd',
                            color: '#92400e',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {question.difficulty}
                          </span>
                        )}
                        {pack.subject === 'korean-english' && question.type && (
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {question.type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Content - TSA Format */}
                    {pack.subject === 'tsa' && (
                      <>
                        {question.question_content && (
                          <div style={{
                            marginBottom: '16px',
                            padding: '16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            lineHeight: '1.6',
                            color: COLORS.darkGray
                          }}>
                            {question.question_content}
                          </div>
                        )}

                        {/* Image Display */}
                        {imageUrl && (
                          <div style={{
                            marginBottom: '16px',
                            textAlign: 'center',
                            padding: '16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}>
                            <img
                              src={getImageUrl(imageUrl)}
                              alt={`Question ${index + 1} diagram`}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '400px',
                                height: 'auto',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                const errorMsg = document.createElement('div');
                                errorMsg.textContent = 'Image temporarily unavailable';
                                errorMsg.style.color = COLORS.gray;
                                errorMsg.style.fontStyle = 'italic';
                                errorMsg.style.padding = '20px';
                                e.target.parentNode.appendChild(errorMsg);
                              }}
                            />
                          </div>
                        )}

                        {question.question && (
                          <div style={{
                            marginBottom: '16px',
                            fontWeight: '500',
                            fontSize: '16px',
                            color: COLORS.darkGray,
                            lineHeight: '1.6'
                          }}>
                            {String(question.question || '')}
                          </div>
                        )}

                        {question.options && question.options.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                style={{
                                  padding: '12px 16px',
                                  marginBottom: '8px',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '8px',
                                  border: '1px solid #f1f5f9',
                                  color: COLORS.darkGray
                                }}
                              >
                                <strong style={{ color: COLORS.teal }}>{option.id}.</strong> {option.text}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{
                          marginTop: '16px',
                          padding: '16px',
                          backgroundColor: '#dcfce7',
                          borderRadius: '8px',
                          borderLeft: `4px solid #16a34a`
                        }}>
                          <strong style={{ color: '#166534' }}>Answer:</strong>{' '}
                          <span style={{ color: '#166534', fontWeight: '600' }}>
                            {question.correct_answer}
                          </span>
                          {question.options &&
                            question.options.find((opt) => opt.id === question.correct_answer) && (
                              <span style={{ color: '#166534' }}>
                                {' '}
                                -{' '}
                                {
                                  question.options.find((opt) => opt.id === question.correct_answer)
                                    .text
                                }
                              </span>
                            )}
                        </div>
                      </>
                    )}

                    {/* Question Content - Maths Format */}
                    {pack.subject === 'maths' && (
                      <>
                        {/* Maths Info */}
                        <div style={{ marginBottom: '16px' }}>
                          {question.id && (
                            <div style={{
                              fontSize: '14px',
                              color: COLORS.gray,
                              marginBottom: '8px'
                            }}>
                              <strong>Year:</strong> {question.id.split('_')[0]} • <strong>Exam:</strong> {question.id.split('_')[1]}
                            </div>
                          )}
                          {question.spec_topic && (
                            <div style={{
                              fontSize: '14px',
                              color: COLORS.gray,
                              marginBottom: '8px'
                            }}>
                              <strong>Spec Topic:</strong> {question.spec_topic}
                              {question.spec_point && ` (${question.spec_point})`}
                            </div>
                          )}
                          {question.question_topic && (
                            <div style={{
                              fontSize: '14px',
                              color: COLORS.gray,
                              marginBottom: '8px'
                            }}>
                              <strong>Topic:</strong> {question.question_topic}
                            </div>
                          )}
                          {question.marks && (
                            <div style={{
                              fontSize: '14px',
                              color: COLORS.gray,
                              marginBottom: '16px'
                            }}>
                              <strong>Marks:</strong> {question.marks}
                            </div>
                          )}
                        </div>

                        {/* Image for maths if present */}
                        {imageUrl && (
                          <div style={{
                            marginBottom: '16px',
                            textAlign: 'center',
                            padding: '16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                          }}>
                            <img
                              src={getImageUrl(imageUrl)}
                              alt={`Question ${index + 1} diagram`}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '400px',
                                height: 'auto',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                const errorMsg = document.createElement('div');
                                errorMsg.textContent = 'Image temporarily unavailable';
                                errorMsg.style.color = COLORS.gray;
                                errorMsg.style.fontStyle = 'italic';
                                errorMsg.style.padding = '20px';
                                e.target.parentNode.appendChild(errorMsg);
                              }}
                            />
                          </div>
                        )}

                        {/* Answer space for maths */}
                        <div style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '24px',
                          marginTop: '16px',
                          backgroundColor: '#f8fafc',
                          minHeight: '100px'
                        }}>
                          <div style={{ 
                            fontSize: '14px',
                            color: COLORS.gray,
                            fontStyle: 'italic'
                          }}>
                            Answer space for working and solution
                          </div>
                        </div>

                        {/* Show correct answer if available */}
                        {question.correct_answer && (
                          <div style={{
                            marginTop: '16px',
                            padding: '16px',
                            backgroundColor: '#dcfce7',
                            borderRadius: '8px',
                            borderLeft: `4px solid #16a34a`
                          }}>
                            <strong style={{ color: '#166534' }}>Answer:</strong>{' '}
                            <span style={{ color: '#166534', fontWeight: '600' }}>
                              {question.correct_answer}
                            </span>
                          </div>
                        )}

                        {/* PDF Markscheme Viewer */}
                        {question.markscheme_url && (
                          <div style={{ marginTop: '16px' }}>
                            <h4 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: COLORS.darkGray,
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{ color: '#dc2626' }}>📄</span>
                              Markscheme:
                            </h4>
                            <div style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '16px',
                              backgroundColor: COLORS.white,
                              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                            }}>
                              <iframe
                                src={getImageUrl(question.markscheme_url)}
                                title={`Markscheme for Question ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '400px',
                                  border: 'none',
                                  borderRadius: '8px'
                                }}
                                onLoad={(e) => {
                                  console.log('PDF loaded successfully');
                                  // Hide any error message if PDF loads
                                  const errorDiv = e.target.parentNode.querySelector('.pdf-error');
                                  if (errorDiv) errorDiv.style.display = 'none';
                                }}
                                onError={(e) => {
                                  console.error('PDF failed to load:', question.markscheme_url);
                                  // Show fallback link
                                  e.target.style.display = 'none';
                                  let errorDiv = e.target.parentNode.querySelector('.pdf-error');
                                  if (!errorDiv) {
                                    errorDiv = document.createElement('div');
                                    errorDiv.className = 'pdf-error';
                                    errorDiv.style.cssText = `
                                      text-align: center;
                                      padding: 40px 20px;
                                      background-color: #fef2f2;
                                      border: 1px solid #fecaca;
                                      border-radius: 8px;
                                      color: #dc2626;
                                    `;
                                    errorDiv.innerHTML = `
                                      <p style="margin: 0 0 12px 0; font-weight: 600;">
                                        Unable to display PDF inline
                                      </p>
                                      <a 
                                        href="${getImageUrl(question.markscheme_url)}" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style="
                                          display: inline-flex;
                                          align-items: center;
                                          gap: 6px;
                                          color: #dc2626;
                                          text-decoration: none;
                                          font-weight: 600;
                                          padding: 8px 16px;
                                          border: 2px solid #dc2626;
                                          border-radius: 6px;
                                          transition: all 0.2s ease;
                                        "
                                        onmouseover="this.style.backgroundColor='#dc2626'; this.style.color='white';"
                                        onmouseout="this.style.backgroundColor='transparent'; this.style.color='#dc2626';"
                                      >
                                        <span>🔗</span>
                                        Open PDF in New Tab
                                      </a>
                                    `;
                                    e.target.parentNode.appendChild(errorDiv);
                                  }
                                  errorDiv.style.display = 'block';
                                }}
                              />
                              
                              {/* Fallback link (initially hidden) */}
                              <div style={{
                                marginTop: '12px',
                                textAlign: 'center'
                              }}>
                                <a 
                                  href={getImageUrl(question.markscheme_url)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    color: COLORS.teal,
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <span>🔗</span>
                                  Open PDF in New Tab
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Question Content - Korean-English Format */}
                    {pack.subject === 'korean-english' && (
                      <>
                        {/* Korean-English Info */}
                        <div style={{ marginBottom: '16px' }}>
                          {question.difficulty && (
                            <div style={{
                              fontSize: '14px',
                              color: COLORS.gray,
                              marginBottom: '8px'
                            }}>
                              <strong>Difficulty:</strong> {question.difficulty}
                            </div>
                          )}
                          {question.type && (
                            <div style={{
                              fontSize: '14px',
                              color: COLORS.gray,
                              marginBottom: '16px'
                            }}>
                              <strong>Type:</strong> {question.type}
                            </div>
                          )}
                        </div>

                        {/* Korean Text Display */}
                        {(question.questionText || question.korean) && (
                          <div style={{
                            marginBottom: '16px',
                            padding: '16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'left'
                          }}>
                            <div style={{
                              fontSize: '13px',
                              color: COLORS.gray,
                              marginBottom: '8px',
                              fontWeight: '500'
                            }}>
                              Korean Text:
                            </div>
                            <div style={{
                              fontSize: '15px',
                              fontWeight: '500',
                              color: '#374151',
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              lineHeight: '1.4'
                            }}>
                              {String(question.questionText || question.korean || '')}
                            </div>
                          </div>
                        )}

                        {/* Question Display */}
                        {(question.actualQuestion || question.question) && (
                          <div style={{
                            marginBottom: '16px',
                            fontSize: '14px',
                            color: COLORS.gray,
                            lineHeight: '1.5',
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{ marginBottom: '8px', fontWeight: '500' }}>
                              Question:
                            </div>
                            {String(question.actualQuestion || question.question || '')}
                          </div>
                        )}

                        {/* Options Display */}
                        {(question.answerOptions || question.options) && (question.answerOptions || question.options).length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{
                              fontSize: '14px',
                              color: COLORS.gray,
                              marginBottom: '12px',
                              fontWeight: '500'
                            }}>
                              Choose the best English translation:
                            </div>
                            {(question.answerOptions || question.options).map((option, optIndex) => (
                              <div
                                key={optIndex}
                                style={{
                                  padding: '12px 16px',
                                  marginBottom: '8px',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '8px',
                                  border: '1px solid #f1f5f9',
                                  color: COLORS.darkGray,
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <strong style={{ color: COLORS.teal }}>
                                  {String.fromCharCode(65 + optIndex)}.
                                </strong> {option}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* English Translation Display */}
                        {/* Show correct answer if available */}
                        {((question.correctAnswer !== undefined && (question.answerOptions || question.options)) || (question.english || question.actualQuestion)) && (
                          <div style={{
                            marginTop: '16px',
                            padding: '16px',
                            backgroundColor: '#dcfce7',
                            borderRadius: '8px',
                            borderLeft: `4px solid #16a34a`
                          }}>
                            <strong style={{ color: '#166534' }}>Correct Answer:</strong>{' '}
                            <span style={{ color: '#166534', fontWeight: '600' }}>
                              {question.correctAnswer !== undefined && (question.answerOptions || question.options) ? (() => {
                                // Helper function to convert Korean numbering symbols to indices (matching InteractiveQuiz.js)
                                const getKoreanAnswerIndex = (correctAnswer) => {
                                  if (typeof correctAnswer === 'number') {
                                    return correctAnswer;
                                  }
                                  if (typeof correctAnswer === 'string') {
                                    const koreanNumberMap = { '①': 0, '②': 1, '③': 2, '④': 3, '⑤': 4 };
                                    for (const [symbol, index] of Object.entries(koreanNumberMap)) {
                                      if (correctAnswer.startsWith(symbol)) {
                                        return index;
                                      }
                                    }
                                  }
                                  return null;
                                };
                                
                                const correctIndex = getKoreanAnswerIndex(question.correctAnswer);
                                if (correctIndex !== null && (question.answerOptions || question.options)[correctIndex]) {
                                  return `${String.fromCharCode(65 + correctIndex)} - ${(question.answerOptions || question.options)[correctIndex]}`;
                                }
                                return question.correctAnswer;
                              })() : (
                                question.english || question.actualQuestion || 'Answer not available'
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '32px 0 0 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.3)',
          marginTop: '32px'
        }}>
          <p style={{
            color: COLORS.gray,
            fontSize: '14px',
            margin: '0'
          }}>
            Created with Examrizzsearch • {questions.length} Questions • {subjectConfig.displayName}
            {pack.styling?.color &&
              ` • ${pack.styling.color.charAt(0).toUpperCase() + pack.styling.color.slice(1)} Theme`}
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

export default PackViewer;