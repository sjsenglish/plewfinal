// src/components/LearnTab.js - Complete remake with safe data handling
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import InteractiveQuiz from './InteractiveQuiz';
import { deepSanitize } from '../utils/sanitizeData';

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Subject configurations for getting the right index
const SUBJECTS = {
  'korean-english': { index: 'korean-english-question-pairs' },
};

// Safe data access utility - CRITICAL for preventing React error #31
const safeGet = (obj, path, fallback = '') => {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      result = result?.[key];
    }
    return String(result || fallback);
  } catch {
    return String(fallback);
  }
};

// Safe render utility for any value
const safeRender = (value, fallback = '') => {
  if (value === null || value === undefined) return String(fallback);
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    // Extract text from common object patterns
    if (value.sentence) return String(value.sentence);
    if (value.text) return String(value.text);
    if (value.content) return String(value.content);
    if (value.value) return String(value.value);
    return String(fallback || '[Complex Object]');
  }
  return String(value || fallback);
};

// Safe array processing for question IDs
const extractQuestionIds = (selectedQuestionIds) => {
  try {
    if (!Array.isArray(selectedQuestionIds)) return [];
    
    return selectedQuestionIds.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return String(item.objectID || item.questionId || item.id || '');
      }
      return String(item || '');
    }).filter(id => id.length > 0);
  } catch (error) {
    console.error('Error extracting question IDs:', error);
    return [];
  }
};

// Color constants - Updated to match purple theme
const COLORS = {
  primary: '#221468',
  primaryLight: '#e1dfff',
  purple: '#d4d0ff',
  white: '#ffffff',
  gray: '#9691c4',
  darkGray: '#221468',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  light: '#f5f3ff',
  border: '#d4d0ff'
};

// Difficulty level configuration
const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', color: COLORS.success },
  { id: 'intermediate', label: 'Intermediate', color: COLORS.warning },
  { id: 'advanced', label: 'Advanced', color: COLORS.error }
];

// PackCard subcomponent
const PackCard = ({ pack, onPractice, onReview, quizAttempts, user }) => {
  // Safe data extraction
  const packName = safeRender(pack?.packName, 'Unnamed Pack');
  const description = safeRender(pack?.description, 'No description available');
  const difficulty = safeRender(pack?.difficulty, 'beginner').toLowerCase();
  const subject = safeRender(pack?.subject, 'general').toLowerCase();
  
  // Safe question count calculation
  const getQuestionCount = () => {
    try {
      const ids = extractQuestionIds(pack?.selectedQuestionIds);
      return ids.length;
    } catch {
      return 0;
    }
  };

  const questionCount = getQuestionCount();
  const difficultyConfig = DIFFICULTY_LEVELS.find(level => level.id === difficulty) || DIFFICULTY_LEVELS[0];
  
  // Check if pack is completed
  const latestAttempt = user && quizAttempts ? quizAttempts.find(attempt => 
    attempt.packId === pack.id || attempt.packId === pack.packId
  ) : null;
  
  const isCompleted = Boolean(latestAttempt);

  return (
    <div style={{
      backgroundColor: COLORS.white,
      borderRadius: '16px',
      padding: '24px',
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }}>
      
      {/* Header with difficulty badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{
          backgroundColor: difficultyConfig.color + '20',
          color: difficultyConfig.color,
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          {safeRender(difficultyConfig.label)}
        </div>
        
        <div style={{
          backgroundColor: COLORS.primary + '20',
          color: COLORS.primary,
          padding: '4px 8px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: '500',
          textTransform: 'uppercase'
        }}>
          {safeRender(subject)}
        </div>
      </div>

      {/* Pack name */}
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: COLORS.darkGray,
        margin: '0 0 12px 0',
        lineHeight: '1.4'
      }}>
        {packName}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: COLORS.gray,
        margin: '0 0 16px 0',
        lineHeight: '1.5',
        flex: 1
      }}>
        {description}
      </p>

      {/* Question count and completion status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: COLORS.light,
        borderRadius: '8px'
      }}>
        <span style={{
          fontSize: '14px',
          color: COLORS.gray,
          fontWeight: '500'
        }}>
          📝 {String(questionCount)} questions
        </span>
        
        {isCompleted && (
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: COLORS.success,
            backgroundColor: COLORS.success + '20',
            padding: '4px 8px',
            borderRadius: '12px',
            textTransform: 'uppercase'
          }}>
            ✓ Complete
          </span>
        )}
      </div>

      {/* Action buttons */}
      {isCompleted ? (
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReview(pack, latestAttempt);
            }}
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.white,
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flex: 1
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#5c4ba5';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = COLORS.primary;
            }}
          >
            📝 Review
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPractice(pack);
            }}
            style={{
              backgroundColor: COLORS.light,
              color: COLORS.darkGray,
              border: `1px solid ${COLORS.border}`,
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flex: 1
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = COLORS.border;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = COLORS.light;
            }}
          >
            재시도
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPractice(pack);
          }}
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.white,
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#5c4ba5';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = COLORS.primary;
          }}
        >
          Start Practice
        </button>
      )}
    </div>
  );
};

// VideoCard subcomponent
const VideoCard = ({ video, onWatch }) => {
  // Safe data extraction
  const title = safeRender(video?.title, 'Untitled Video');
  const description = safeRender(video?.description, 'No description available');
  const duration = safeRender(video?.duration, '0:00');
  const difficulty = safeRender(video?.difficulty, 'beginner').toLowerCase();
  const thumbnail = safeRender(video?.thumbnail, '');

  const difficultyConfig = DIFFICULTY_LEVELS.find(level => level.id === difficulty) || DIFFICULTY_LEVELS[0];

  return (
    <div style={{
      backgroundColor: COLORS.white,
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }}>
      
      {/* Thumbnail */}
      <div style={{
        width: '100%',
        height: '150px',
        backgroundColor: COLORS.light,
        borderRadius: '8px',
        marginBottom: '16px',
        backgroundImage: thumbnail ? `url(${thumbnail})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {!thumbnail && (
          <span style={{ color: COLORS.gray, fontSize: '14px' }}>
            📹 Video Preview
          </span>
        )}
        
        {/* Play overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '50px',
          height: '50px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px'
        }}>
          ▶
        </div>
      </div>

      {/* Header with difficulty and duration */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          backgroundColor: difficultyConfig.color + '20',
          color: difficultyConfig.color,
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}>
          {safeRender(difficultyConfig.label)}
        </div>
        
        <span style={{
          fontSize: '12px',
          color: COLORS.gray,
          fontWeight: '500'
        }}>
          ⏱️ {duration}
        </span>
      </div>

      {/* Video title */}
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: COLORS.darkGray,
        margin: '0 0 10px 0',
        lineHeight: '1.4'
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '13px',
        color: COLORS.gray,
        margin: '0 0 20px 0',
        lineHeight: '1.5',
        flex: 1
      }}>
        {description}
      </p>

      {/* Watch button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onWatch(video);
        }}
        style={{
          backgroundColor: COLORS.primary,
          color: COLORS.white,
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#00b4b8';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = COLORS.primary;
        }}
      >
        ▶️ Watch Video
      </button>
    </div>
  );
};

// Main LearnTab component
const LearnTab = () => {
  // State management
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [questionPacks, setQuestionPacks] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  
  // Auth
  const auth = getAuth();
  const user = auth.currentUser;
  
  // InteractiveQuiz states
  const [showInteractiveQuiz, setShowInteractiveQuiz] = useState(false);
  const [currentQuizPack, setCurrentQuizPack] = useState(null);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState([]);
  
  // Quiz completion states
  const [showQuizCompletion, setShowQuizCompletion] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [showQuizReview, setShowQuizReview] = useState(false);
  
  // Video modal states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  // Load data on component mount and level change
  useEffect(() => {
    loadData();
  }, [selectedLevel, user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading data for level:', selectedLevel);
      
      // Load question packs, videos, and quiz attempts in parallel
      const promises = [
        loadQuestionPacks(),
        loadVideos()
      ];
      
      // Load quiz attempts only if user is logged in
      if (user) {
        promises.push(loadQuizAttempts());
      }
      
      await Promise.all(promises);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionPacks = async () => {
    try {
      const packsRef = collection(db, 'adminQuestionPacks');
      const packsQuery = query(
        packsRef,
        where('difficulty', '==', selectedLevel),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(packsQuery);
      const packs = [];
      
      snapshot.forEach(doc => {
        try {
          const data = doc.data();
          console.log('Raw pack data:', data);
          
          // Safe data processing
          const pack = {
            id: String(doc.id || ''),
            packId: String(data.packId || doc.id || ''),
            packName: safeRender(data.packName, 'Unnamed Pack'),
            description: safeRender(data.description, 'No description available'),
            difficulty: safeRender(data.difficulty, 'beginner'),
            subject: safeRender(data.subject, 'general'),
            selectedQuestionIds: data.selectedQuestionIds || [],
            isActive: Boolean(data.isActive),
            createdAt: data.createdAt || null
          };
          
          console.log('Processed pack:', pack);
          packs.push(pack);
        } catch (packError) {
          console.error('Error processing pack:', packError, doc.data());
        }
      });
      
      console.log(`Loaded ${packs.length} question packs for ${selectedLevel}`);
      setQuestionPacks(packs);
      
    } catch (error) {
      console.error('Error loading question packs:', error);
      setQuestionPacks([]);
    }
  };

  const loadVideos = async () => {
    try {
      const videosRef = collection(db, 'adminVideos');
      const videosQuery = query(
        videosRef,
        where('difficulty', '==', selectedLevel),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(videosQuery);
      const videoList = [];
      
      snapshot.forEach(doc => {
        try {
          const data = doc.data();
          console.log('Raw video data:', data);
          
          // Safe data processing
          const video = {
            id: String(doc.id || ''),
            title: safeRender(data.title, 'Untitled Video'),
            description: safeRender(data.description, 'No description available'),
            duration: safeRender(data.duration, '0:00'),
            difficulty: safeRender(data.difficulty, 'beginner'),
            thumbnail: safeRender(data.thumbnail, ''),
            videoUrl: safeRender(data.videoUrl, ''),
            isActive: Boolean(data.isActive),
            createdAt: data.createdAt || null
          };
          
          console.log('Processed video:', video);
          videoList.push(video);
        } catch (videoError) {
          console.error('Error processing video:', videoError, doc.data());
        }
      });
      
      console.log(`Loaded ${videoList.length} videos for ${selectedLevel}`);
      setVideos(videoList);
      
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
    }
  };

  const loadQuizAttempts = async () => {
    if (!user) {
      setQuizAttempts([]);
      return;
    }

    try {
      const attemptsRef = collection(db, 'users', user.uid, 'quizAttempts');
      const attemptsQuery = query(attemptsRef, orderBy('completedAt', 'desc'));
      const snapshot = await getDocs(attemptsQuery);
      
      const attempts = [];
      snapshot.forEach((doc) => {
        attempts.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`Loaded ${attempts.length} quiz attempts for user`);
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

  // Event handlers
  const handlePractice = async (pack) => {
    if (!pack || !pack.selectedQuestionIds || pack.selectedQuestionIds.length === 0) {
      alert('No questions available for practice');
      return;
    }

    try {
      console.log('Starting practice with pack:', {
        packId: safeRender(pack?.packId),
        packName: safeRender(pack?.packName),
        difficulty: safeRender(pack?.difficulty),
        subject: safeRender(pack?.subject),
        questionCount: extractQuestionIds(pack?.selectedQuestionIds).length
      });

      const rawQuestions = await fetchQuestionsForPack(pack);
      
      if (rawQuestions.length === 0) {
        alert('Failed to load questions for practice. Please try again.');
        return;
      }

      // Apply deep sanitization to prevent any nested objects from reaching React
      const sanitizedQuestions = rawQuestions.map(question => deepSanitize(question));
      
      console.log('Questions after deep sanitization:', sanitizedQuestions);

      setCurrentQuizPack(pack);
      setCurrentQuizQuestions(sanitizedQuestions);
      setShowInteractiveQuiz(true);
    } catch (error) {
      console.error('Error starting practice:', error);
      alert('Failed to load questions for practice. Please try again.');
    }
  };

  const handleWatch = (video) => {
    console.log('Watching video:', {
      videoId: safeRender(video?.id),
      title: safeRender(video?.title),
      difficulty: safeRender(video?.difficulty),
      duration: safeRender(video?.duration)
    });
    
    setCurrentVideo(video);
    setShowVideoModal(true);
  };

  // Handle quiz completion
  const handleQuizComplete = (results = null) => {
    setShowInteractiveQuiz(false);
    
    if (results) {
      // Quiz was completed with results
      setQuizResults(results);
      setShowQuizCompletion(true);
    } else {
      // Quiz was closed/cancelled
      setCurrentQuizPack(null);
      setCurrentQuizQuestions([]);
    }
  };

  // Handle video modal close
  const handleVideoClose = () => {
    setShowVideoModal(false);
    setCurrentVideo(null);
  };

  // Handle quiz completion screen actions
  const handleQuizCompletionClose = () => {
    setShowQuizCompletion(false);
    setQuizResults(null);
    setCurrentQuizPack(null);
    setCurrentQuizQuestions([]);
    
    // Reload quiz attempts to show updated completion status
    if (user) {
      loadQuizAttempts();
    }
  };

  const handleShowQuizReview = () => {
    setShowQuizCompletion(false);
    setShowQuizReview(true);
  };

  const handleQuizReviewClose = () => {
    setShowQuizReview(false);
    setQuizResults(null);
    setCurrentQuizPack(null);
    setCurrentQuizQuestions([]);
  };

  // Handle review mode from completed pack card
  const handleReviewPack = async (pack, attempt) => {
    try {
      console.log('Starting review for pack:', pack.packName, 'attempt:', attempt.id);
      
      const rawQuestions = await fetchQuestionsForPack(pack);
      
      if (rawQuestions.length === 0) {
        alert('Failed to load questions for review. Please try again.');
        return;
      }

      // Apply deep sanitization to prevent any nested objects from reaching React
      const sanitizedQuestions = rawQuestions.map(question => deepSanitize(question));
      
      setCurrentQuizPack(pack);
      setCurrentQuizQuestions(sanitizedQuestions);
      setQuizResults(attempt);
      setShowQuizReview(true);
    } catch (error) {
      console.error('Error starting review:', error);
      alert('Failed to load questions for review. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `4px solid ${COLORS.border}`,
          borderTop: `4px solid ${COLORS.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{
          fontSize: '16px',
          color: COLORS.gray,
          fontWeight: '500'
        }}>
          Loading content...
        </span>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px',
        padding: '40px'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          ⚠️
        </div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: COLORS.error,
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          Error Loading Content
        </h3>
        <p style={{
          fontSize: '14px',
          color: COLORS.gray,
          margin: '0 0 24px 0',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          {safeRender(error)}
        </p>
        <button
          onClick={loadData}
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.white,
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px 24px 120px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: COLORS.darkGray,
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fdino-books-pencil.svg?alt=media&token=1ca7c953-1f5d-43df-af64-0558f17fe93a"
            alt="Study Helper Icon"
            style={{
              width: '150px',
              height: '150px',
              objectFit: 'contain'
            }}
          />
          학습 도우미
        </h1>
        <p style={{
          fontSize: '16px',
          color: COLORS.gray,
          margin: '0',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          내 레벨을 선택하면 학습 자료들을 볼 수 있어요. 
        </p>
      </div>

      {/* Level selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '40px',
        flexWrap: 'wrap'
      }}>
        {DIFFICULTY_LEVELS.map(level => (
          <button
            key={level.id}
            onClick={() => setSelectedLevel(level.id)}
            style={{
              padding: '12px 24px',
              borderRadius: '25px',
              border: selectedLevel === level.id ? `2px solid ${level.color}` : `2px solid ${COLORS.border}`,
              backgroundColor: selectedLevel === level.id ? level.color + '20' : COLORS.white,
              color: selectedLevel === level.id ? level.color : COLORS.gray,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'capitalize'
            }}
            onMouseEnter={(e) => {
              if (selectedLevel !== level.id) {
                e.target.style.borderColor = level.color;
                e.target.style.color = level.color;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedLevel !== level.id) {
                e.target.style.borderColor = COLORS.border;
                e.target.style.color = COLORS.gray;
              }
            }}
          >
            {safeRender(level.label)}
          </button>
        ))}
      </div>

      {/* Question Packs Section */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: COLORS.darkGray,
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fdino-with-books.svg?alt=media&token=b654042b-993e-484e-b465-b78793756e26"
            alt="Question Pack Icon"
            style={{
              width: '108px',
              height: '108px',
              objectFit: 'contain'
            }}
          />
          문제지
          <span style={{
            fontSize: '14px',
            color: COLORS.gray,
            fontWeight: '400'
          }}>
            ({String(questionPacks.length)} available)
          </span>
        </h2>
        
        {questionPacks.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {questionPacks.map(pack => (
              <PackCard
                key={safeRender(pack?.id)}
                pack={pack}
                onPractice={handlePractice}
                onReview={handleReviewPack}
                quizAttempts={quizAttempts}
                user={user}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: COLORS.light,
            borderRadius: '12px',
            border: `1px solid ${COLORS.border}`
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: COLORS.darkGray,
              margin: '0 0 8px 0'
            }}>
              문제지 팩이 없음
            </h3>
            <p style={{
              fontSize: '14px',
              color: COLORS.gray,
              margin: '0'
            }}>
              No {String(selectedLevel)} level question packs found. Try a different difficulty level.
            </p>
          </div>
        )}
      </section>

      {/* Videos Section */}
      <section>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: COLORS.darkGray,
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fdino-donut.svg?alt=media&token=d1bbc1db-aa0e-4adc-84ef-11a0bede2fe4"
            alt="Video Icon"
            style={{
              width: '108px',
              height: '108px',
              objectFit: 'contain'
            }}
          />
          비디오
          <span style={{
            fontSize: '14px',
            color: COLORS.gray,
            fontWeight: '400'
          }}>
            ({String(videos.length)} available)
          </span>
        </h2>
        
        {videos.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {videos.map(video => (
              <VideoCard
                key={safeRender(video?.id)}
                video={video}
                onWatch={handleWatch}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: COLORS.light,
            borderRadius: '12px',
            border: `1px solid ${COLORS.border}`
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: COLORS.darkGray,
              margin: '0 0 8px 0'
            }}>
              비디오 없음
            </h3>
            <p style={{
              fontSize: '14px',
              color: COLORS.gray,
              margin: '0'
            }}>
              No {String(selectedLevel)} level videos found. Try a different difficulty level.
            </p>
          </div>
        )}
      </section>

      {/* InteractiveQuiz Modal */}
      {showInteractiveQuiz && currentQuizPack && currentQuizQuestions.length > 0 && (
        <InteractiveQuiz
          packData={currentQuizPack}
          questions={currentQuizQuestions}
          onComplete={handleQuizComplete}
          onClose={handleQuizComplete}
        />
      )}

      {/* Video Modal */}
      {showVideoModal && currentVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: COLORS.white,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: '800px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Close button */}
            <button
              onClick={handleVideoClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: COLORS.gray,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = COLORS.light;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>

            {/* Video title */}
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: COLORS.darkGray,
              margin: '0 0 16px 0',
              paddingRight: '40px'
            }}>
              {safeRender(currentVideo.title)}
            </h2>

            {/* Video description */}
            {currentVideo.description && (
              <p style={{
                fontSize: '14px',
                color: COLORS.gray,
                margin: '0 0 20px 0',
                lineHeight: '1.5'
              }}>
                {safeRender(currentVideo.description)}
              </p>
            )}

            {/* Video player */}
            <div style={{
              flex: 1,
              backgroundColor: COLORS.light,
              borderRadius: '12px',
              overflow: 'hidden',
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {currentVideo.videoUrl ? (
                // Check if it's a YouTube URL
                currentVideo.videoUrl.includes('youtube.com') || currentVideo.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={currentVideo.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    style={{
                      width: '100%',
                      height: '400px',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    allowFullScreen
                    title={safeRender(currentVideo.title)}
                  />
                ) : (
                  <video
                    controls
                    style={{
                      width: '100%',
                      height: '400px',
                      borderRadius: '8px'
                    }}
                    src={safeRender(currentVideo.videoUrl)}
                  >
                    Your browser does not support the video tag.
                  </video>
                )
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: COLORS.gray,
                  fontSize: '16px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                  Video URL not available
                </div>
              )}
            </div>

            {/* Video info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              padding: '12px',
              backgroundColor: COLORS.light,
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <span style={{
                  backgroundColor: COLORS.primary + '20',
                  color: COLORS.primary,
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {safeRender(currentVideo.difficulty)}
                </span>
                {currentVideo.duration && (
                  <span style={{
                    fontSize: '14px',
                    color: COLORS.gray,
                    fontWeight: '500'
                  }}>
                    ⏱️ {safeRender(currentVideo.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Completion Modal */}
      {showQuizCompletion && quizResults && currentQuizPack && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: COLORS.white,
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '500px',
            width: '90vw',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Close button */}
            <button
              onClick={handleQuizCompletionClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: COLORS.gray,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = COLORS.light;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>

            {/* Completion icon */}
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              {quizResults.percentage >= 80 ? '' : quizResults.percentage >= 60 ? '' : ''}
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: COLORS.darkGray,
              margin: '0 0 16px 0'
            }}>
              시험 완료
            </h2>

            {/* Pack name */}
            <p style={{
              fontSize: '16px',
              color: COLORS.gray,
              margin: '0 0 24px 0'
            }}>
              {safeRender(currentQuizPack.packName)}
            </p>

            {/* Score display */}
            <div style={{
              backgroundColor: quizResults.percentage >= 80 ? COLORS.success + '20' : 
                             quizResults.percentage >= 60 ? COLORS.warning + '20' : COLORS.error + '20',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: '700',
                color: quizResults.percentage >= 80 ? COLORS.success : 
                       quizResults.percentage >= 60 ? COLORS.warning : COLORS.error,
                margin: '0 0 8px 0'
              }}>
                {String(quizResults.percentage)}%
              </div>
              <div style={{
                fontSize: '18px',
                color: COLORS.darkGray,
                fontWeight: '600'
              }}>
                {String(quizResults.score)} / {String(quizResults.totalQuestions)} 정답률
              </div>
              {quizResults.timeElapsed && (
                <div style={{
                  fontSize: '14px',
                  color: COLORS.gray,
                  marginTop: '8px'
                }}>
                  Time: {Math.floor(quizResults.timeElapsed / 60)}:{String(quizResults.timeElapsed % 60).padStart(2, '0')}
                </div>
              )}
            </div>

            {/* Performance message */}
            <p style={{
              fontSize: '16px',
              color: COLORS.gray,
              margin: '0 0 32px 0',
              lineHeight: '1.5'
            }}>
              {quizResults.percentage >= 80 ? 
                '아주 좋은 입니다. 학습 내용을 잘 이해하고 있습니다.' :
                quizResults.percentage >= 60 ?
                '실력이 계속 향상되고 있으니 문제들을 복습하고 실력을 더 다져 보세요.' :
                '꾸준한 연습과 복습으로 실력을 늘려 보세요. '
              }
            </p>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleShowQuizReview}
                style={{
                  backgroundColor: COLORS.primary,
                  color: COLORS.white,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#00b4b8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = COLORS.primary;
                }}
              >
                복습
              </button>
              
              <button
                onClick={handleQuizCompletionClose}
                style={{
                  backgroundColor: COLORS.light,
                  color: COLORS.darkGray,
                  border: `1px solid ${COLORS.border}`,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = COLORS.border;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = COLORS.light;
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Review Modal */}
      {showQuizReview && quizResults && currentQuizQuestions && currentQuizPack && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: COLORS.white,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Review header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: `2px solid ${COLORS.border}`
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: COLORS.darkGray,
                  margin: '0 0 4px 0'
                }}>
                  Quiz Review
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: COLORS.gray,
                  margin: '0'
                }}>
                  {safeRender(currentQuizPack.packName)} • {String(quizResults.score)}/{String(quizResults.totalQuestions)} 정답률 ({String(quizResults.percentage)}%)
                </p>
              </div>
              
              <button
                onClick={handleQuizReviewClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: COLORS.gray,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = COLORS.light;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                ✕
              </button>
            </div>

            {/* Use InteractiveQuiz in review mode */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <InteractiveQuiz
                packData={currentQuizPack}
                questions={currentQuizQuestions}
                onClose={handleQuizReviewClose}
                onComplete={handleQuizReviewClose}
                reviewMode={true}
                existingAttempt={quizResults}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnTab;