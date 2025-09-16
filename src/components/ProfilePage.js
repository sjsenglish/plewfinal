// ProfilePage.js - Updated with new badge system and simplified header
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserQuestionPacks } from '../services/questionPackService';
import { getLeaderboard } from '../services/quizService';
import { generateQuestionPackPDF, downloadPDF } from '../services/pdfGenerator';
import InteractiveQuiz from './InteractiveQuiz';
import { liteClient as algoliasearch } from 'algoliasearch/lite';

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Color palette matching QuestionPackPage
const COLORS = {
  lightPurple: '#ccccff',
  teal: '#00ced1', 
  lightTeal: '#d8f0ed',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151'
};

// Icons
const ICONS = {
  ghost: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fpurple%20ghost.svg?alt=media&token=8f68c264-89dd-4563-8858-07b8f9fd87e0',
  note: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ffile%20icon.svg?alt=media&token=19369fc7-4d0c-499a-ad43-d47372a13b09'
};

// Subject configurations for getting the right index
const SUBJECTS = {
  tsa: { index: 'copy_tsa_questions' },
  'korean-english': { index: 'korean-english-question-pairs' },
  maths: { index: 'edexel_mathematics_updated' },
};

export const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [userPacks, setUserPacks] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packs');
  const [reviewData, setReviewData] = useState(null);
  
  // New states for direct actions
  const [showInteractiveQuiz, setShowInteractiveQuiz] = useState(false);
  const [currentQuizPack, setCurrentQuizPack] = useState(null);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState([]);
  const [generatingPDF, setGeneratingPDF] = useState(null);

  const auth = getAuth();
  const navigate = (path) => window.location.href = path;

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      loadUserData(currentUser.uid);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserData = async (userId) => {
    setLoading(true);
    
    // Load packs
    const packsResult = await getUserQuestionPacks(userId);
    if (packsResult.success) {
      const sortedPacks = packsResult.data.sort(
        (a, b) => new Date(b.createdAt?.seconds * 1000) - new Date(a.createdAt?.seconds * 1000)
      );
      setUserPacks(sortedPacks);
    }

    // Load quiz attempts
    try {
      const attemptsRef = collection(db, 'users', userId, 'quizAttempts');
      const attemptsQuery = query(attemptsRef, orderBy('completedAt', 'desc'));
      const snapshot = await getDocs(attemptsQuery);
      
      const attempts = [];
      snapshot.forEach((doc) => {
        attempts.push({ id: doc.id, ...doc.data() });
      });
      
      setQuizAttempts(attempts);
      
      // Calculate user stats from quiz attempts and packs
      if (attempts.length > 0 || packsResult.success) {
        await calculateUserStats(userId, attempts, packsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading quiz attempts:', error);
      setQuizAttempts([]);
    }

    setLoading(false);
  };

  // Helper function to fetch questions for a pack
  const fetchQuestionsForPack = async (pack) => {
    try {
      if (!pack.selectedQuestionIds || pack.selectedQuestionIds.length === 0) {
        console.error('No question IDs found for pack:', pack.id);
        return [];
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

  const calculateUserStats = async (userId, attempts, packs) => {
    if (attempts.length === 0) {
      setUserStats({
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        subjectsPlayed: 0,
        totalPacks: packs.length,
        badge: getNewBadge(0, packs.length)
      });
      return;
    }

    const totalAttempts = attempts.length;
    const averageScore = Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalAttempts);
    const bestScore = Math.max(...attempts.map(a => a.percentage));
    const subjectsPlayed = new Set(attempts.map(a => a.subject)).size;
    const totalPacks = packs.length;

    let bestRank = null;
    let bestRankSubject = null;
    let totalParticipants = 0;

    try {
      const subjects = [...new Set(attempts.map(a => a.subject))];
      
      for (const subject of subjects) {
        try {
          const subjectAttempts = attempts.filter(a => a.subject === subject);
          const latestAttempt = subjectAttempts[0];
          
          if (latestAttempt.quizId) {
            const leaderboardResult = await getLeaderboard(latestAttempt.quizId);
            if (leaderboardResult.success && leaderboardResult.data) {
              const leaderboard = leaderboardResult.data;
              const userEntry = leaderboard.allScores?.find(entry => entry.userId === userId) ||
                              leaderboard.topTen?.find(entry => entry.userId === userId);
              
              if (userEntry && userEntry.rank) {
                if (!bestRank || userEntry.rank < bestRank) {
                  bestRank = userEntry.rank;
                  bestRankSubject = subject;
                  totalParticipants = leaderboard.totalParticipants || 0;
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error getting leaderboard for ${subject}:`, error);
        }
      }
    } catch (error) {
      console.error('Error calculating user rank:', error);
    }

    setUserStats({
      totalAttempts,
      averageScore,
      bestScore,
      subjectsPlayed,
      bestRank,
      bestRankSubject,
      totalParticipants,
      totalPacks,
      badge: getNewBadge(averageScore, totalPacks)
    });
  };

  const getNewBadge = (averageScore, totalPacks) => {
    if (averageScore >= 90 && totalPacks >= 30) {
      return {
        name: 'Ghost Master',
        achievement: 'Completed 30+ packs with 90%+ average',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20yellow.svg?alt=media&token=816a1190-9e2c-4ba4-a4e2-18578658fb5a',
        color: '#FFD700'
      };
    } else if (averageScore >= 80 && totalPacks >= 20) {
      return {
        name: 'Ghost Scholar',
        achievement: 'Completed 20+ packs with 80%+ average',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20blue.svg?alt=media&token=aadb885b-8372-45c4-8e1b-eaed70bcdc87',
        color: '#3B82F6'
      };
    } else {
      return {
        name: 'Ghost Learner',
        achievement: 'Keep practicing to unlock higher badges!',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20white.svg?alt=media&token=599d4414-99cf-4084-858b-5b3512557023',
        color: '#6B7280'
      };
    }
  };

  // Handle pack actions
  const handleViewPack = (packId) => {
    navigate(`/pack/${packId}`);
  };

  const handleDownloadPDF = async (pack) => {
    if (!pack || !pack.selectedQuestionIds || pack.selectedQuestionIds.length === 0) {
      console.error('PDF Download Error: Invalid pack data', pack);
      alert('No questions available to download. Please check that this pack has questions.');
      return;
    }

    console.log('Starting PDF download for pack:', {
      packId: pack.id,
      packName: pack.packName,
      subject: pack.subject,
      questionIds: pack.selectedQuestionIds?.length || 0
    });

    setGeneratingPDF(pack.id);

    try {
      console.log('Fetching questions for pack...');
      const questions = await fetchQuestionsForPack(pack);
      
      console.log('Fetched questions:', {
        requested: pack.selectedQuestionIds?.length || 0,
        received: questions.length,
        subject: pack.subject
      });
      
      if (questions.length === 0) {
        console.error('No questions received from fetchQuestionsForPack');
        alert('Failed to load questions for PDF generation. Please try refreshing the page and try again.');
        return;
      }

      // Enhanced options for library downloads
      const downloadOptions = {
        includeAnswers: pack.styling?.includeAnswers ?? true,
        separateAnswerSheet: pack.styling?.separateAnswerSheet ?? false,
        layout: pack.styling?.template || 'basic',
        fontSize: pack.styling?.fontSize || 11,
        margin: 20,
        includeImages: true,
        debug: true // Enable debug mode for library downloads
      };

      console.log('PDF generation options:', downloadOptions);

      const packDataForPDF = {
        ...pack,
        selectedQuestions: questions,
        generatedAt: new Date().toISOString(),
        source: 'library_download'
      };

      console.log('Generating PDF...');
      const pdfResult = await generateQuestionPackPDF(
        packDataForPDF,
        questions,
        downloadOptions
      );

      if (!pdfResult || !pdfResult.success) {
        throw new Error(pdfResult?.error || 'PDF generation failed');
      }

      // Enhanced filename handling
      const sanitizedName = (pack.packName || 'question_pack')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${sanitizedName}_library_${dateStr}.pdf`;
      
      console.log('Downloading PDF:', filename);
      downloadPDF(pdfResult.pdf, filename);
      
      console.log('Library PDF download completed successfully');

    } catch (error) {
      console.error('Error generating PDF from library:', error);
      console.error('Error stack:', error.stack);
      
      // Enhanced error messages for library downloads
      let errorMessage = 'Failed to generate PDF from library. ';
      
      if (error.message?.includes('fetch')) {
        errorMessage += 'Unable to load questions from database. Please check your connection and try again.';
      } else if (error.message?.includes('null')) {
        errorMessage += 'PDF generation failed. Please try again or contact support.';
      } else if (error.message?.includes('image')) {
        errorMessage += 'Issue with question images. The PDF will be generated without images.';
      } else {
        errorMessage += error.message || 'Please try again or contact support.';
      }
      
      alert(errorMessage);
      
    } finally {
      setGeneratingPDF(null);
    }
  };

  const handlePractice = async (pack) => {
    if (!pack || !pack.selectedQuestionIds || pack.selectedQuestionIds.length === 0) {
      alert('No questions available for practice');
      return;
    }

    try {
      const questions = await fetchQuestionsForPack(pack);
      
      if (questions.length === 0) {
        alert('Failed to load questions for practice');
        return;
      }

      // Debug log for maths questions
      if (pack.subject === 'maths') {
        console.log('Maths questions loaded:', questions);
        console.log('Sample maths question structure:', questions[0]);
      }

      setCurrentQuizPack(pack);
      setCurrentQuizQuestions(questions);
      setShowInteractiveQuiz(true);

    } catch (error) {
      console.error('Error loading questions for practice:', error);
      alert('Failed to load questions for practice. Please try again.');
    }
  };

  const handleReviewQuiz = async (attempt) => {
    const pack = userPacks.find(p => p.id === attempt.packId || p.packId === attempt.packId);
    if (!pack) {
      alert('Pack not found for this quiz attempt');
      return;
    }

    try {
      const questions = await fetchQuestionsForPack(pack);
      
      if (questions.length === 0) {
        alert('Failed to load questions for review');
        return;
      }

      setReviewData({
        pack: pack,
        questions: questions,
        attempt: attempt
      });
    } catch (error) {
      console.error('Error loading questions for review:', error);
      alert('Failed to load questions for review. Please try again.');
    }
  };

  const handleQuizComplete = (results) => {
    console.log('Quiz completed with results:', results);
    setShowInteractiveQuiz(false);
    setCurrentQuizPack(null);
    setCurrentQuizQuestions([]);
    
    if (user) {
      loadUserData(user.uid);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubjectDisplayName = (subject) => {
    switch (subject) {
      case 'tsa':
        return 'TSA Questions';
      case 'plew':
        return '수능영어';
      case 'maths':
        return 'Maths A Level';
      default:
        return subject;
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  const getScoreEmoji = (percentage) => {
    if (percentage >= 90) return '🌟';
    if (percentage >= 80) return '🎉';
    if (percentage >= 70) return '👏';
    if (percentage >= 60) return '👍';
    return '💪';
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
        padding: '0'
      }}>
        {/* Main Content */}
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
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 16px 0'
            }}>
              Profile
            </h1>
            <p style={{
              color: COLORS.gray,
              marginBottom: '24px'
            }}>
              Please log in to view your profile.
            </p>
            <a href="/login" style={{
              backgroundColor: COLORS.teal,
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Log In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      padding: '0'
    }}>
      {/* Review Quiz Modal */}
      {reviewData && (
        <InteractiveQuiz
          packData={reviewData.pack}
          questions={reviewData.questions}
          onClose={() => setReviewData(null)}
          onComplete={() => {}}
          reviewMode={true}
          existingAttempt={reviewData.attempt}
        />
      )}

      {/* Interactive Quiz Modal */}
      {showInteractiveQuiz && currentQuizPack && currentQuizQuestions.length > 0 && (
        <InteractiveQuiz
          packData={currentQuizPack}
          questions={currentQuizQuestions}
          onClose={() => {
            setShowInteractiveQuiz(false);
            setCurrentQuizPack(null);
            setCurrentQuizQuestions([]);
          }}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px 40px 24px'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#111827',
            margin: '0'
          }}>
            Hi, {user.displayName || 'User'}!
          </h1>
          
          {userStats?.badge && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: `2px solid ${userStats.badge.color}40`
            }}>
              <img 
                src={userStats.badge.imageUrl} 
                alt={userStats.badge.name}
                style={{ 
                  width: '60px', 
                  height: '60px',
                  objectFit: 'contain'
                }}
              />
              <div>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#1e293b',
                  fontSize: '16px'
                }}>
                  {userStats.badge.name}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: COLORS.gray
                }}>
                  {userStats.badge.achievement}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setActiveTab('packs')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: activeTab === 'packs' ? COLORS.teal : 'rgba(255, 255, 255, 0.7)',
              color: activeTab === 'packs' ? 'white' : COLORS.gray
            }}
          >
            My Question Packs ({userPacks.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: activeTab === 'results' ? COLORS.teal : 'rgba(255, 255, 255, 0.7)',
              color: activeTab === 'results' ? 'white' : COLORS.gray
            }}
          >
            Quiz Results ({quizAttempts.length})
          </button>
        </div>

        {/* Question Packs Tab */}
        {activeTab === 'packs' && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: '0'
              }}>
                Question Packs
              </h2>
              <button
                onClick={() => navigate('/question-pack')}
                style={{
                  backgroundColor: COLORS.teal,
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Create New Pack
              </button>
            </div>

            {loading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: `3px solid ${COLORS.teal}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '16px'
                }} />
                <p style={{ color: COLORS.gray, fontSize: '14px' }}>Loading your packs...</p>
              </div>
            ) : userPacks.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
                textAlign: 'center'
              }}>
                <img 
                  src={ICONS.note} 
                  alt="File Icon"
                  style={{
                    width: '64px',
                    height: '64px',
                    marginBottom: '16px',
                    opacity: 0.7
                  }}
                />
                <h3 style={{ 
                  color: COLORS.gray, 
                  margin: '0 0 8px 0',
                  fontWeight: '500'
                }}>
                  No packs created yet
                </h3>
                <p style={{ 
                  color: '#9ca3af', 
                  margin: '0 0 20px 0',
                  fontSize: '14px'
                }}>
                  Create your first question pack to get started with personalized practice sessions
                </p>
                <button
                  onClick={() => navigate('/question-pack')}
                  style={{
                    backgroundColor: COLORS.teal,
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Create Your First Pack
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {userPacks.map((pack) => {
                  const latestAttempt = quizAttempts.find(attempt => 
                    attempt.packId === pack.id || attempt.packId === pack.packId
                  );
                  const isGeneratingPDFForThisPack = generatingPDF === pack.id;

                  return (
                    <div key={pack.id} style={{
                      backgroundColor: COLORS.white,
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0 0 8px 0'
                          }}>
                            {pack.packName}
                          </h3>
                          
                          <div style={{
                            fontSize: '14px',
                            color: COLORS.gray,
                            marginBottom: '8px'
                          }}>
                            {getSubjectDisplayName(pack.subject)} • {pack.totalQuestions || pack.selectedQuestionIds?.length || 0} questions
                            {latestAttempt && (
                              <span style={{ 
                                marginLeft: '12px', 
                                color: getScoreColor(latestAttempt.percentage),
                                fontWeight: '500'
                              }}>
                                Latest: {latestAttempt.percentage}%
                              </span>
                            )}
                          </div>

                          <div style={{
                            fontSize: '13px',
                            color: '#9ca3af'
                          }}>
                            Created: {formatDate(pack.createdAt)} • Status: {pack.status || 'completed'}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => handleViewPack(pack.packId || pack.id)}
                          style={{
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            border: '1px solid #bae6fd',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          View Pack
                        </button>

                        {/* Hide PDF button for Korean-English questions */}
                        {pack.subject !== 'korean-english' && (
                          <button
                            onClick={() => handleDownloadPDF(pack)}
                            disabled={isGeneratingPDFForThisPack}
                            style={{
                              backgroundColor: '#f8fafc',
                              color: COLORS.darkGray,
                              border: '1px solid #e2e8f0',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: isGeneratingPDFForThisPack ? 'not-allowed' : 'pointer',
                              opacity: isGeneratingPDFForThisPack ? 0.6 : 1
                            }}
                          >
                            {isGeneratingPDFForThisPack ? 'Generating...' : 'Download PDF'}
                          </button>
                        )}

                        <button
                          onClick={() => handlePractice(pack)}
                          style={{
                            backgroundColor: COLORS.teal,
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Practice
                        </button>

                        {latestAttempt && (
                          <button
                            onClick={() => handleReviewQuiz(latestAttempt)}
                            style={{
                              backgroundColor: '#f8fafc',
                              color: COLORS.darkGray,
                              border: '1px solid #e2e8f0',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            Review Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quiz Results Tab */}
        {activeTab === 'results' && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 24px 0'
            }}>
              Quiz Results
            </h2>
            
            {loading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: `3px solid ${COLORS.teal}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '16px'
                }} />
                <p style={{ color: COLORS.gray, fontSize: '14px' }}>Loading quiz results...</p>
              </div>
            ) : quizAttempts.length === 0 ? (
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
                  📊
                </div>
                <h3 style={{ 
                  color: COLORS.gray, 
                  margin: '0 0 8px 0',
                  fontWeight: '500'
                }}>
                  No quiz attempts yet
                </h3>
                <p style={{ 
                  color: '#9ca3af', 
                  margin: '0 0 20px 0',
                  fontSize: '14px'
                }}>
                  Take some interactive quizzes to see your results and track your progress here
                </p>
                <button
                  onClick={() => setActiveTab('packs')}
                  style={{
                    backgroundColor: COLORS.teal,
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  View My Packs
                </button>
              </div>
            ) : (
              <div>
                {/* Summary Stats */}
                {userStats && (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '16px', 
                    marginBottom: '32px',
                    padding: '20px',
                    backgroundColor: COLORS.white,
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: COLORS.teal }}>
                        {userStats.totalAttempts}
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.gray }}>Total Attempts</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>
                        {userStats.averageScore}%
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.gray }}>Average Score</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#3b82f6' }}>
                        {userStats.bestScore}%
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.gray }}>Best Score</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>
                        {userStats.totalPacks}
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.gray }}>Total Packs</div>
                    </div>
                  </div>
                )}

                {/* Quiz Attempts List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {quizAttempts.map((attempt) => (
                    <div key={attempt.id} style={{
                      backgroundColor: COLORS.white,
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0 0 8px 0'
                          }}>
                            {attempt.packName}
                          </h3>
                          
                          <div style={{
                            fontSize: '14px',
                            color: COLORS.gray,
                            marginBottom: '8px'
                          }}>
                            {getSubjectDisplayName(attempt.subject)} • {attempt.totalQuestions} questions
                            <span style={{ 
                              marginLeft: '12px', 
                              color: getScoreColor(attempt.percentage),
                              fontWeight: '500'
                            }}>
                              Score: {attempt.percentage}% ({attempt.score}/{attempt.totalQuestions})
                            </span>
                          </div>

                          <div style={{
                            fontSize: '13px',
                            color: '#9ca3af'
                          }}>
                            Completed: {formatDate(attempt.completedAt)} • Time: {formatTime(attempt.timeElapsed)}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => handleReviewQuiz(attempt)}
                          style={{
                            backgroundColor: COLORS.teal,
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Review Answers
                        </button>

                        <button
                          onClick={() => {
                            const pack = userPacks.find(p => p.id === attempt.packId || p.packId === attempt.packId);
                            if (pack) {
                              handlePractice(pack);
                            } else {
                              alert('Pack not found');
                            }
                          }}
                          style={{
                            backgroundColor: '#f8fafc',
                            color: COLORS.darkGray,
                            border: '1px solid #e2e8f0',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Retake Quiz
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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