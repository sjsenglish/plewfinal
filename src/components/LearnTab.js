import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const LearnTab = () => {
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [weeklyContent, setWeeklyContent] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState(null);
  const [learnedWords, setLearnedWords] = useState(new Set());
  
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Calculate current week number for content rotation
  const getCurrentWeek = () => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const today = new Date();
    const daysSinceStart = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
    return Math.floor(daysSinceStart / 7) + 1;
  };

  // Load user's level preference and progress
  useEffect(() => {
    if (!user) return;
    
    const loadUserData = async () => {
      try {
        // Load user's level preference
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.learningLevel) {
            setSelectedLevel(userData.learningLevel);
          }
        }

        // Load user's progress
        const progressDoc = await getDoc(doc(db, 'userProgress', user.uid));
        if (progressDoc.exists()) {
          const progressData = progressDoc.data();
          setUserProgress(progressData);
          if (progressData.learnedWords) {
            setLearnedWords(new Set(progressData.learnedWords));
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user, db]);

  // Load weekly content based on level
  useEffect(() => {
    const loadWeeklyContent = async () => {
      setLoading(true);
      try {
        const currentWeek = getCurrentWeek();
        
        // For now, using dummy data - this would come from Firestore
        const dummyContent = {
          beginner: {
            questionPacks: [
              { id: 'pack1', title: 'Basic Vocabulary', questionCount: 25, difficulty: 'Easy', completedCount: 0, totalQuestions: 25 },
              { id: 'pack2', title: 'Simple Grammar', questionCount: 20, difficulty: 'Easy', completedCount: 0, totalQuestions: 20 },
              { id: 'pack3', title: 'Daily Phrases', questionCount: 30, difficulty: 'Easy', completedCount: 0, totalQuestions: 30 },
            ],
            videos: [
              { id: 'vid1', title: 'Introduction to Korean', duration: '15:30', thumbnail: 'https://via.placeholder.com/320x180', completed: false },
              { id: 'vid2', title: 'Basic Pronunciation Guide', duration: '12:45', thumbnail: 'https://via.placeholder.com/320x180', completed: false },
              { id: 'vid3', title: 'Essential Grammar Patterns', duration: '20:15', thumbnail: 'https://via.placeholder.com/320x180', completed: false },
            ],
            vocabulary: [
              { word: '안녕하세요', definition: 'Hello (formal)', synonym: 'greeting', learned: false },
              { word: '감사합니다', definition: 'Thank you', synonym: 'gratitude', learned: false },
              { word: '미안합니다', definition: 'Sorry', synonym: 'apology', learned: false },
              { word: '네', definition: 'Yes', synonym: 'affirmative', learned: false },
              { word: '아니요', definition: 'No', synonym: 'negative', learned: false },
            ]
          },
          intermediate: {
            questionPacks: [
              { id: 'pack4', title: 'Complex Sentences', questionCount: 35, difficulty: 'Medium', completedCount: 0, totalQuestions: 35 },
              { id: 'pack5', title: 'Business Korean', questionCount: 40, difficulty: 'Medium', completedCount: 0, totalQuestions: 40 },
              { id: 'pack6', title: 'Reading Comprehension', questionCount: 25, difficulty: 'Medium', completedCount: 0, totalQuestions: 25 },
            ],
            videos: [
              { id: 'vid4', title: 'Intermediate Conversation', duration: '25:00', thumbnail: 'https://via.placeholder.com/320x180', completed: false },
              { id: 'vid5', title: 'Korean Culture & Context', duration: '18:30', thumbnail: 'https://via.placeholder.com/320x180', completed: false },
              { id: 'vid6', title: 'Advanced Grammar Structures', duration: '30:00', thumbnail: 'https://via.placeholder.com/320x180', completed: false },
            ],
            vocabulary: [
              { word: '회사', definition: 'Company', synonym: 'business', learned: false },
              { word: '계약', definition: 'Contract', synonym: 'agreement', learned: false },
              { word: '회의', definition: 'Meeting', synonym: 'conference', learned: false },
              { word: '프로젝트', definition: 'Project', synonym: 'task', learned: false },
              { word: '마감일', definition: 'Deadline', synonym: 'due date', learned: false },
            ]
          },
          advanced: {
            questionPacks: [
              { id: 'pack7', title: 'Academic Writing', questionCount: 45, difficulty: 'Hard', completedCount: 0, totalQuestions: 45 },
              { id: 'pack8', title: 'Literature Analysis', questionCount: 50, difficulty: 'Hard', completedCount: 0, totalQuestions: 50 },
              { id: 'pack9', title: 'TOPIK II Preparation', questionCount: 60, difficulty: 'Hard', completedCount: 0, totalQuestions: 60 },
            ],
            videos: [
              { id: 'vid7', title: 'Academic Korean', duration: '35:00', thumbnail: 'https://via.placeholder.com/320x180', completed: false },
              { id: 'vid8', title: 'Korean Literature Overview', duration: '40:00', thumbnail: 'https://via.placeholder.com/320x180', completed: false },
              { id: 'vid9', title: 'Advanced Writing Techniques', duration: '28:00', thumbnail: 'https://via.placeholder.com/320x180', completed: false },
            ],
            vocabulary: [
              { word: '논문', definition: 'Thesis/Paper', synonym: 'dissertation', learned: false },
              { word: '연구', definition: 'Research', synonym: 'study', learned: false },
              { word: '분석', definition: 'Analysis', synonym: 'examination', learned: false },
              { word: '가설', definition: 'Hypothesis', synonym: 'theory', learned: false },
              { word: '결론', definition: 'Conclusion', synonym: 'ending', learned: false },
            ]
          }
        };

        // Apply user progress to content
        const content = dummyContent[selectedLevel];
        if (userProgress && userProgress[selectedLevel]) {
          const levelProgress = userProgress[selectedLevel];
          
          // Update completed status for packs
          if (levelProgress.completedPacks) {
            content.questionPacks = content.questionPacks.map(pack => ({
              ...pack,
              completedCount: levelProgress.completedPacks[pack.id] || 0
            }));
          }
          
          // Update completed status for videos
          if (levelProgress.completedVideos) {
            content.videos = content.videos.map(video => ({
              ...video,
              completed: levelProgress.completedVideos.includes(video.id)
            }));
          }
        }

        // Update learned words
        content.vocabulary = content.vocabulary.map(word => ({
          ...word,
          learned: learnedWords.has(word.word)
        }));

        setWeeklyContent(content);
        setLoading(false);
      } catch (error) {
        console.error('Error loading weekly content:', error);
        setLoading(false);
      }
    };

    loadWeeklyContent();
  }, [selectedLevel, userProgress, learnedWords, db]);

  // Save level preference
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

  // Mark word as learned
  const toggleWordLearned = async (word) => {
    const newLearnedWords = new Set(learnedWords);
    if (newLearnedWords.has(word)) {
      newLearnedWords.delete(word);
    } else {
      newLearnedWords.add(word);
    }
    setLearnedWords(newLearnedWords);

    if (user) {
      try {
        await setDoc(doc(db, 'userProgress', user.uid), {
          learnedWords: Array.from(newLearnedWords),
          updatedAt: Timestamp.now()
        }, { merge: true });
      } catch (error) {
        console.error('Error saving learned words:', error);
      }
    }
  };

  // Mark video as completed
  const markVideoCompleted = async (videoId) => {
    if (!user) return;
    
    try {
      await setDoc(doc(db, 'userProgress', user.uid), {
        [`${selectedLevel}.completedVideos`]: arrayUnion(videoId),
        updatedAt: Timestamp.now()
      }, { merge: true });

      // Update local state
      setWeeklyContent(prev => ({
        ...prev,
        videos: prev.videos.map(v => 
          v.id === videoId ? { ...v, completed: true } : v
        )
      }));
    } catch (error) {
      console.error('Error marking video as completed:', error);
    }
  };

  // Navigate to practice mode for question pack
  const handlePackClick = (packId) => {
    navigate(`/practice/${packId}?level=${selectedLevel}`);
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
    <div style={{ height: '100%' }}>
      {/* Header */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.5)', 
        backdropFilter: 'blur(10px)',
        padding: '32px 24px', 
        border: '1px solid #a8dcc6',
        marginBottom: '24px',
        borderRadius: '12px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '2rem', fontWeight: '700' }}>
                Your Weekly Learning Path
              </h1>
              <p style={{ margin: '0', color: '#64748b', fontSize: '1rem' }}>
                Week {getCurrentWeek()} • Personalized content updated weekly
              </p>
            </div>
            
            {/* Level Selector */}
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.8)', padding: '4px', borderRadius: '8px' }}>
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  style={{
                    padding: '8px 20px',
                    background: selectedLevel === level ? '#d8f0ed' : 'transparent',
                    color: selectedLevel === level ? '#1e293b' : '#64748b',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: selectedLevel === level ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize'
                  }}
                  onMouseOver={(e) => {
                    if (selectedLevel !== level) {
                      e.target.style.background = '#f1f5f9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedLevel !== level) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Question Packs Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.5)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          border: '1px solid #a8dcc6'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📚</span> This Week's Question Packs
          </h2>
          
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            overflowX: 'auto', 
            paddingBottom: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}>
            {weeklyContent?.questionPacks.map((pack) => (
              <div
                key={pack.id}
                onClick={() => handlePackClick(pack.id)}
                style={{
                  minWidth: '280px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: '600' }}>
                    {pack.title}
                  </h3>
                  <span style={{
                    background: pack.difficulty === 'Easy' ? '#dcfce7' : pack.difficulty === 'Medium' ? '#fed7aa' : '#fecaca',
                    color: pack.difficulty === 'Easy' ? '#166534' : pack.difficulty === 'Medium' ? '#c2410c' : '#991b1b',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {pack.difficulty}
                  </span>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>
                    <span>{pack.completedCount} / {pack.totalQuestions} completed</span>
                    <span>{Math.round((pack.completedCount / pack.totalQuestions) * 100)}%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(pack.completedCount / pack.totalQuestions) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                
                <button style={{
                  width: '100%',
                  padding: '8px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#4f46e5'}
                onMouseOut={(e) => e.target.style.background = '#6366f1'}
                >
                  {pack.completedCount > 0 ? 'Continue Practice' : 'Start Practice'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Videos Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.5)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          border: '1px solid #a8dcc6'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎥</span> Recommended Videos
          </h2>
          
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            overflowX: 'auto', 
            paddingBottom: '8px'
          }}>
            {weeklyContent?.videos.map((video) => (
              <div
                key={video.id}
                style={{
                  minWidth: '320px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => setExpandedVideo(video)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />
                  {video.completed && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#10b981',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ✓ Completed
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    {video.duration}
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#1e293b', fontWeight: '600' }}>
                    {video.title}
                  </h3>
                  <button style={{
                    width: '100%',
                    padding: '8px',
                    background: video.completed ? '#e2e8f0' : '#6366f1',
                    color: video.completed ? '#64748b' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!video.completed) {
                      e.target.style.background = '#4f46e5';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!video.completed) {
                      e.target.style.background = '#6366f1';
                    }
                  }}
                  >
                    {video.completed ? 'Watch Again' : 'Watch Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vocabulary to Memorize Section */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.5)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          border: '1px solid #a8dcc6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📝</span> Vocabulary to Memorize
            </h2>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {weeklyContent?.vocabulary.filter(w => w.learned).length} / {weeklyContent?.vocabulary.length} learned
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '12px'
          }}>
            {weeklyContent?.vocabulary.map((item) => (
              <div
                key={item.word}
                style={{
                  background: item.learned ? 'rgba(220, 252, 231, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                  border: `1px solid ${item.learned ? '#86efac' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => toggleWordLearned(item.word)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#1e293b', fontWeight: '600' }}>
                    {item.word}
                  </h3>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${item.learned ? '#10b981' : '#cbd5e1'}`,
                    background: item.learned ? '#10b981' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {item.learned && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                  </div>
                </div>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#475569' }}>
                  {item.definition}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  Synonym: {item.synonym}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {expandedVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => {
          setExpandedVideo(null);
          if (!expandedVideo.completed) {
            markVideoCompleted(expandedVideo.id);
          }
        }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '900px',
            background: '#000',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => {
                setExpandedVideo(null);
                if (!expandedVideo.completed) {
                  markVideoCompleted(expandedVideo.id);
                }
              }}
            >
              ✕
            </button>
            <div style={{ aspectRatio: '16 / 9', background: '#000' }}>
              <video
                controls
                autoPlay
                style={{ width: '100%', height: '100%' }}
                onEnded={() => {
                  if (!expandedVideo.completed) {
                    markVideoCompleted(expandedVideo.id);
                  }
                }}
              >
                <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div style={{ padding: '16px', background: 'white' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                {expandedVideo.title}
              </h3>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default LearnTab;