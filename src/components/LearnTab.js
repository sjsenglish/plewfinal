import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, Timestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { generateQuestionPackPDF, downloadPDF } from '../services/pdfGenerator';
import InteractiveQuiz from './InteractiveQuiz';
import VocabularyStudy from './VocabularyStudy';
import { safeString } from '../utils/safeRender';
import './LearnTab.css';

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Subject configurations for getting the right index
const SUBJECTS = {
  'korean-english': { index: 'korean-english-question-pairs' },
};

// Color palette matching ProfilePage
const COLORS = {
  lightPurple: '#ccccff',
  teal: '#00ced1', 
  lightTeal: '#d8f0ed',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151'
};


const LearnTab = () => {
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [adminPacks, setAdminPacks] = useState([]);
  const [adminVideos, setAdminVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizAttempts, setQuizAttempts] = useState([]);
  
  // InteractiveQuiz states
  const [showInteractiveQuiz, setShowInteractiveQuiz] = useState(false);
  const [currentQuizPack, setCurrentQuizPack] = useState(null);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState([]);
  const [generatingPDF, setGeneratingPDF] = useState(null);
  
  // Video modal states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  // Calculate current week number for content rotation
  const getCurrentWeek = () => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const today = new Date();
    const daysSinceStart = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
    return Math.floor(daysSinceStart / 7) + 1;
  };

  // Load admin packs and user progress
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load admin packs and videos for the selected difficulty level
        await loadAdminPacks();
        await loadAdminVideos();
        
        if (user) {
          // Load user's level preference and progress
          await loadUserData();
          // Load quiz attempts
          await loadQuizAttempts();
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedLevel, user, db]);

  const loadAdminPacks = async () => {
    try {
      const q = query(
        collection(db, 'adminQuestionPacks'),
        where('difficulty', '==', selectedLevel),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const packs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdminPacks(packs);
    } catch (error) {
      console.error('Error loading admin packs:', error);
      setAdminPacks([]);
    }
  };

  const loadAdminVideos = async () => {
    try {
      const q = query(
        collection(db, 'adminVideos'),
        where('difficulty', '==', selectedLevel),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const videos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdminVideos(videos);
    } catch (error) {
      console.error('Error loading admin videos:', error);
      setAdminVideos([]);
    }
  };

  const loadUserData = async () => {
    try {
      // Load user's level preference
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.learningLevel && userData.learningLevel !== selectedLevel) {
          setSelectedLevel(userData.learningLevel);
          return; // This will trigger a re-render and reload with new level
        }
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadQuizAttempts = async () => {
    try {
      const attemptsRef = collection(db, 'users', user.uid, 'quizAttempts');
      const q = query(attemptsRef, orderBy('completedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const attempts = [];
      snapshot.forEach((doc) => {
        attempts.push({ id: doc.id, ...doc.data() });
      });
      
      setQuizAttempts(attempts);
    } catch (error) {
      console.error('Error loading quiz attempts:', error);
      setQuizAttempts([]);
    }
  };

  // Helper function to fetch questions for a pack from Algolia
  const fetchQuestionsForPack = async (pack) => {
    try {
      if (!pack.selectedQuestionIds || pack.selectedQuestionIds.length === 0) {
        console.error('No question IDs found for pack:', pack.id);
        return [];
      }

      // Debug: Check what selectedQuestionIds contains
      console.log('Pack selectedQuestionIds:', pack.selectedQuestionIds);
      console.log('First ID type:', typeof pack.selectedQuestionIds[0]);
      
      // Check if selectedQuestionIds contains objects instead of strings
if (pack.selectedQuestionIds[0] && typeof pack.selectedQuestionIds[0] === 'object') {
  console.error('ERROR: selectedQuestionIds contains objects instead of strings!');
  console.log('First ID object:', pack.selectedQuestionIds[0]);
  
  // Try to extract IDs from objects if they have objectID property
  const extractedIds = pack.selectedQuestionIds.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      return String(item.objectID || item.questionId || '');
    }
    console.error('Cannot extract ID from:', item);
    return null;
  }).filter(Boolean);
  
  if (extractedIds.length > 0) {
    pack = { ...pack, selectedQuestionIds: extractedIds };
    console.log('Extracted IDs:', extractedIds);
  }
}

      const subjectConfig = SUBJECTS[pack.subject];
      if (!subjectConfig) {
        console.error('Unknown subject:', pack.subject);
        return [];
      }

      const response = await searchClient.search([
        {
          indexName: subjectConfig.index,
          params: {
            query: '',
            filters: pack.selectedQuestionIds.map((id) => `objectID:"${id}"`).join(' OR '),
            hitsPerPage: pack.selectedQuestionIds.length,
          },
        },
      ]);

      const fetchedQuestions = response.results[0].hits;
      
      // Debug: Check the structure of fetched questions
      if (fetchedQuestions.length > 0) {
        console.log('Sample fetched question:', fetchedQuestions[0]);
        console.log('questionText type:', typeof fetchedQuestions[0].questionText);
        console.log('actualQuestion type:', typeof fetchedQuestions[0].actualQuestion);
      }

      // Sort questions to match the original order
      const sortedQuestions = pack.selectedQuestionIds
        .map((id) => fetchedQuestions.find((q) => q.objectID === id))
        .filter(Boolean);

      return sortedQuestions;
    } catch (error) {
      console.error('Error fetching questions for pack:', error);
      return [];
    }
  };

  // Save level preference and reload packs
  const handleLevelChange = async (newLevel) => {
    setSelectedLevel(newLevel);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          learningLevel: newLevel,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        console.error('Error saving level preference:', error);
      }
    }
  };

  // Handle PDF download for admin packs
  const handleDownloadPDF = async (pack) => {
    if (!pack || !pack.selectedQuestionIds || pack.selectedQuestionIds.length === 0) {
      console.error('PDF Download Error: Invalid pack data', pack);
      alert('No questions available to download. Please check that this pack has questions.');
      return;
    }

    setGeneratingPDF(pack.id);
    
    try {
      const questions = await fetchQuestionsForPack(pack);
      
      if (questions.length === 0) {
        alert('Failed to fetch questions for PDF generation');
        return;
      }

      const pdfResult = await generateQuestionPackPDF({
        ...pack,
        packName: pack.packName,
        totalQuestions: pack.totalQuestions
      }, questions);

      if (!pdfResult || !pdfResult.pdf) {
        throw new Error('PDF generation failed - no PDF returned');
      }

      const sanitizedName = pack.packName
        .replace(/[^a-zA-Z0-9\s\-_]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${sanitizedName}_learn_pack_${dateStr}.pdf`;
      
      downloadPDF(pdfResult.pdf, filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGeneratingPDF(null);
    }
  };

  // Handle practice quiz start
  const handlePractice = async (pack) => {
    if (!pack || !pack.selectedQuestionIds || pack.selectedQuestionIds.length === 0) {
      alert('No questions available for practice');
      return;
    }

    try {
      const questions = await fetchQuestionsForPack(pack);
      
      if (questions.length === 0) {
        alert('Failed to load questions for practice. Please try again.');
        return;
      }

      setCurrentQuizPack(pack);
      setCurrentQuizQuestions(questions);
      setShowInteractiveQuiz(true);
    } catch (error) {
      console.error('Error starting practice:', error);
      alert('Failed to load questions for practice. Please try again.');
    }
  };

  // Handle quiz completion
  const handleQuizComplete = () => {
    setShowInteractiveQuiz(false);
    setCurrentQuizPack(null);
    setCurrentQuizQuestions([]);
    
    if (user) {
      loadQuizAttempts(); // Reload to show new attempt
    }
  };



  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid #f3f3f3',
            borderTop: '4px solid #6b5ca5', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto',
          }} />
          <div>Loading your learning content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-tab">
      {/* Minimal Header */}
      <div className="learn-header">
        <div className="learn-header-content">
          <div className="learn-title-section">
            <h1>Week {getCurrentWeek()}</h1>
            <p>당신의 개인 맞춤 학습 경로</p>
          </div>
          
          <div className="level-selector">
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                className={`level-btn ${selectedLevel === level ? 'active' : ''}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="learn-content">
        
        {/* Admin Curated Packs Section */}
        <section className="learn-section">
          <div className="section-header">
            <h2>📚 큐레이트된 연습 팩</h2>
            <span className="pack-count">
              {adminPacks.length}개 팩 이용 가능
            </span>
          </div>
          
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid var(--accent-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Loading practice packs...
              </p>
            </div>
          ) : adminPacks.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem',
              textAlign: 'center',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                opacity: 0.7
              }}>
                📚
              </div>
              <h3 style={{ 
                color: 'var(--text-secondary)', 
                margin: '0 0 0.5rem 0',
                fontWeight: '500'
              }}>
                No packs available for {selectedLevel} level
              </h3>
              <p style={{ 
                color: 'var(--text-tertiary)', 
                margin: '0',
                fontSize: '0.875rem'
              }}>
                Check back later or try a different difficulty level
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {adminPacks.map((pack) => {
                const latestAttempt = quizAttempts.find(attempt => 
                  attempt.packId === pack.id
                );
                const isGeneratingPDFForThisPack = generatingPDF === pack.id;

                return (
                  <div key={pack.id} style={{
                    backgroundColor: COLORS.white,
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                          <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0'
                          }}>
                            {pack.packName}
                          </h3>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            background: pack.difficulty === 'beginner' ? '#dbeafe' : 
                                       pack.difficulty === 'intermediate' ? '#fef3c7' : '#fecaca',
                            color: pack.difficulty === 'beginner' ? '#1e40af' : 
                                   pack.difficulty === 'intermediate' ? '#92400e' : '#dc2626'
                          }}>
                            {pack.difficulty}
                          </span>
                        </div>
                        
                        {pack.description && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: COLORS.gray,
                            margin: '0 0 0.5rem 0',
                            lineHeight: '1.4'
                          }}>
                            {pack.description}
                          </p>
                        )}
                        
                        <div style={{
                          fontSize: '0.875rem',
                          color: COLORS.gray,
                          marginBottom: '0.5rem'
                        }}>
                          Korean-English • {pack.totalQuestions} questions
                          {latestAttempt && (
                            <span style={{ 
                              marginLeft: '12px', 
                              color: latestAttempt.percentage >= 80 ? '#10b981' : 
                                     latestAttempt.percentage >= 60 ? '#f59e0b' : '#ef4444',
                              fontWeight: '500'
                            }}>
                              Best: {latestAttempt.percentage}%
                            </span>
                          )}
                        </div>

                        <div style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af'
                        }}>
                          Created: {new Date(pack.createdAt.toDate()).toLocaleDateString()}
                          {pack.tags && pack.tags.length > 0 && (
                            <span style={{ marginLeft: '8px' }}>
                              • Tags: {pack.tags.slice(0, 3).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => handleDownloadPDF(pack)}
                        disabled={isGeneratingPDFForThisPack}
                        style={{
                          backgroundColor: '#f8fafc',
                          color: COLORS.darkGray,
                          border: '1px solid #e2e8f0',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: isGeneratingPDFForThisPack ? 'not-allowed' : 'pointer',
                          opacity: isGeneratingPDFForThisPack ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isGeneratingPDFForThisPack ? 'Generating...' : 'Download PDF'}
                      </button>

                      <button
                        onClick={() => handlePractice(pack)}
                        style={{
                          backgroundColor: COLORS.teal,
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#00b4c5'}
                        onMouseOut={(e) => e.target.style.backgroundColor = COLORS.teal}
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Videos Section */}
        <section className="learn-section">
          <div className="section-header">
            <h2>🎥 비디오 수업</h2>
          </div>
          
          {adminVideos.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginTop: '1rem'
            }}>
              {adminVideos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    background: COLORS.white,
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onClick={() => {
                    setCurrentVideo(video);
                    setShowVideoModal(true);
                  }}
                >
                  {/* Video Thumbnail */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '180px',
                    background: video.thumbnailUrl ? `url(${video.thumbnailUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {!video.thumbnailUrl && (
                      <div style={{
                        fontSize: '3rem',
                        color: 'white',
                        opacity: 0.8
                      }}>
                        🎥
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {video.duration || 'N/A'}
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      background: 'rgba(0, 0, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = 1;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = 0;
                    }}
                    >
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: COLORS.teal
                      }}>
                        ▶
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: COLORS.darkGray,
                      margin: '0 0 0.5rem 0',
                      lineHeight: '1.4'
                    }}>
                      {video.title}
                    </h3>
                    
                    {video.description && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: COLORS.gray,
                        margin: '0 0 1rem 0',
                        lineHeight: '1.5',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {video.description}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          background: COLORS.lightTeal,
                          color: COLORS.teal,
                          borderRadius: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {video.difficulty}
                        </span>
                      </div>
                      
                      <button
                        style={{
                          background: COLORS.teal,
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#00a3a3';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = COLORS.teal;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentVideo(video);
                          setShowVideoModal(true);
                        }}
                      >
                        Watch Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem',
              textAlign: 'center',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                opacity: 0.7
              }}>
                🎥
              </div>
              <h3 style={{ 
                color: 'var(--text-secondary)', 
                margin: '0 0 0.5rem 0',
                fontWeight: '500'
              }}>
                No video lessons available
              </h3>
              <p style={{ 
                color: 'var(--text-tertiary)', 
                margin: '0',
                fontSize: '0.875rem'
              }}>
                Check back later for {selectedLevel} level video content
              </p>
            </div>
          )}
        </section>

        {/* Vocabulary Section */}
        <section className="learn-section">
          <VocabularyStudy />
        </section>
      </div>


      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar styles */
        div::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        
        div::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
      
      {/* Video Modal */}
      {showVideoModal && currentVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            background: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Close button */}
            <button
              onClick={() => {
                setShowVideoModal(false);
                setCurrentVideo(null);
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>

            {/* Video container */}
            <div style={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%', // 16:9 aspect ratio
              background: '#000'
            }}>
              {/* Check if it's a YouTube URL */}
              {currentVideo.videoUrl.includes('youtube.com') || currentVideo.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={(() => {
                    let videoId = '';
                    if (currentVideo.videoUrl.includes('youtube.com')) {
                      const urlParams = new URLSearchParams(new URL(currentVideo.videoUrl).search);
                      videoId = urlParams.get('v');
                    } else if (currentVideo.videoUrl.includes('youtu.be')) {
                      videoId = currentVideo.videoUrl.split('/').pop();
                    }
                    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                  })()}
                  title={currentVideo.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  autoPlay
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <source src={currentVideo.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            {/* Video info bar */}
            <div style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              padding: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{
                color: 'white',
                margin: '0 0 0.5rem 0',
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>
                {currentVideo.title}
              </h2>
              {currentVideo.description && (
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: '0',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  {currentVideo.description}
                </p>
              )}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <span style={{
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  textTransform: 'capitalize'
                }}>
                  {currentVideo.difficulty}
                </span>
                {currentVideo.duration && (
                  <span style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '12px'
                  }}>
                    Duration: {currentVideo.duration}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* InteractiveQuiz Modal */}
      {showInteractiveQuiz && currentQuizPack && currentQuizQuestions.length > 0 && (
        <InteractiveQuiz
          questions={currentQuizQuestions}
          packName={currentQuizPack.packName}
          packId={currentQuizPack.id}
          onComplete={handleQuizComplete}
          onClose={handleQuizComplete}
          showResults={true}
        />
      )}
    </div>
  );
};

export default LearnTab;