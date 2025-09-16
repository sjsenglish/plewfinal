// src/components/LearnTab.js - Complete remake with safe data handling
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
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

// Color constants
const COLORS = {
  primary: '#00ced1',
  primaryLight: '#d8f0ed',
  purple: '#ccccff',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  light: '#f8fafc',
  border: '#e2e8f0'
};

// Difficulty level configuration
const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', color: COLORS.success },
  { id: 'intermediate', label: 'Intermediate', color: COLORS.warning },
  { id: 'advanced', label: 'Advanced', color: COLORS.error }
];

// PackCard subcomponent
const PackCard = ({ pack, onPractice }) => {
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

      {/* Question count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
      </div>

      {/* Practice button */}
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
          e.target.style.backgroundColor = '#00b4b8';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = COLORS.primary;
        }}
      >
        Start Practice
      </button>
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
  
  // InteractiveQuiz states
  const [showInteractiveQuiz, setShowInteractiveQuiz] = useState(false);
  const [currentQuizPack, setCurrentQuizPack] = useState(null);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState([]);

  // Load data on component mount and level change
  useEffect(() => {
    loadData();
  }, [selectedLevel]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading data for level:', selectedLevel);
      
      // Load question packs and videos in parallel
      await Promise.all([
        loadQuestionPacks(),
        loadVideos()
      ]);
      
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
    
    // TODO: Integrate with video player
    alert(`Video player for "${safeRender(video?.title)}" will be available soon!`);
  };

  // Handle quiz completion
  const handleQuizComplete = () => {
    setShowInteractiveQuiz(false);
    setCurrentQuizPack(null);
    setCurrentQuizQuestions([]);
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
      padding: '24px',
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
          margin: '0 0 8px 0'
        }}>
          Learn & Practice
        </h1>
        <p style={{
          fontSize: '16px',
          color: COLORS.gray,
          margin: '0',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Choose your difficulty level and start learning with question packs and video courses
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
          📝 Question Packs
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
              No Question Packs Available
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
          🎥 Video Courses
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
              No Videos Available
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
    </div>
  );
};

export default LearnTab;