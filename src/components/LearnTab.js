import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './LearnTab.css';

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
    <div className="learn-tab">
      {/* Minimal Header */}
      <div className="learn-header">
        <div className="learn-header-content">
          <div className="learn-title-section">
            <h1>Week {getCurrentWeek()}</h1>
            <p>Your personalized learning path</p>
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
        
        {/* Question Packs Section */}
        <section className="learn-section">
          <div className="section-header">
            <h2>📚 Practice Packs</h2>
          </div>
          
          <div className="cards-grid">
            {weeklyContent?.questionPacks.map((pack) => (
              <div
                key={pack.id}
                onClick={() => handlePackClick(pack.id)}
                className="pack-card"
              >
                <div className="pack-header">
                  <h3>{pack.title}</h3>
                  <span className={`difficulty-badge ${pack.difficulty.toLowerCase()}`}>
                    {pack.difficulty}
                  </span>
                </div>
                
                <div className="pack-progress">
                  <div className="progress-info">
                    <span>{pack.completedCount} / {pack.totalQuestions}</span>
                    <span>{Math.round((pack.completedCount / pack.totalQuestions) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(pack.completedCount / pack.totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
                
                <button className="pack-btn">
                  {pack.completedCount > 0 ? 'Continue' : 'Start'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Videos Section */}
        <section className="learn-section">
          <div className="section-header">
            <h2>🎥 Video Lessons</h2>
          </div>
          
          <div className="video-grid">
            {weeklyContent?.videos.map((video) => (
              <div
                key={video.id}
                className="video-card"
                onClick={() => setExpandedVideo(video)}
              >
                <div className="video-thumbnail">
                  <img src={video.thumbnail} alt={video.title} />
                  {video.completed && <div className="completed-badge">✓</div>}
                  <div className="duration-badge">{video.duration}</div>
                  <div className="play-overlay">▶</div>
                </div>
                <div className="video-info">
                  <h3>{video.title}</h3>
                  <button className={`video-btn ${video.completed ? 'completed' : ''}`}>
                    {video.completed ? 'Rewatch' : 'Watch'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vocabulary Section */}
        <section className="learn-section">
          <div className="section-header">
            <h2>📝 Vocabulary</h2>
            <div className="vocab-progress">
              {weeklyContent?.vocabulary.filter(w => w.learned).length} / {weeklyContent?.vocabulary.length} learned
            </div>
          </div>
          
          <div className="vocab-grid">
            {weeklyContent?.vocabulary.map((item) => (
              <div
                key={item.word}
                className={`vocab-card ${item.learned ? 'learned' : ''}`}
                onClick={() => toggleWordLearned(item.word)}
              >
                <div className="vocab-header">
                  <h3>{item.word}</h3>
                  <div className={`check-circle ${item.learned ? 'checked' : ''}`}>
                    {item.learned && <span>✓</span>}
                  </div>
                </div>
                <p className="definition">{item.definition}</p>
                <p className="synonym">Synonym: {item.synonym}</p>
              </div>
            ))}
          </div>
        </section>
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