import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './LearnTab.css';

// Generate Korean-English questions based on level
const generateKoreanQuestions = (level, count) => {
  const questionTemplates = {
    beginner: [
      {
        korean: '안녕하세요',
        english: 'Hello',
        options: ['Hello', 'Goodbye', 'Thank you', 'Excuse me'],
        correct: 0,
        type: 'translation'
      },
      {
        korean: '감사합니다',
        english: 'Thank you',
        options: ['Thank you', 'Sorry', 'Hello', 'Goodbye'],
        correct: 0,
        type: 'translation'
      },
      {
        korean: '미안합니다',
        english: 'Sorry',
        options: ['Hello', 'Sorry', 'Thank you', 'Please'],
        correct: 1,
        type: 'translation'
      },
      // Add more beginner questions...
    ],
    intermediate: [
      {
        korean: '회사에서 일하고 있습니다',
        english: 'I am working at a company',
        options: ['I am working at a company', 'I am studying at school', 'I am eating lunch', 'I am going home'],
        correct: 0,
        type: 'translation'
      },
      // Add more intermediate questions...
    ],
    advanced: [
      {
        korean: '이 논문의 결론은 매우 흥미롭다',
        english: 'The conclusion of this paper is very interesting',
        options: ['The conclusion of this paper is very interesting', 'The introduction of this book is boring', 'The summary of this article is short', 'The analysis of this data is complex'],
        correct: 0,
        type: 'translation'
      },
      // Add more advanced questions...
    ]
  };

  const templates = questionTemplates[level] || questionTemplates.beginner;
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    questions.push({
      id: `q_${level}_${i}`,
      question: `Translate: ${template.korean}`,
      korean: template.korean,
      english: template.english,
      options: template.options,
      correctAnswer: template.correct,
      type: template.type,
      difficulty: level,
      points: level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3
    });
  }
  
  return questions;
};

const LearnTab = () => {
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [weeklyContent, setWeeklyContent] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState(null);
  const [learnedWords, setLearnedWords] = useState(new Set());
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [completedPacks, setCompletedPacks] = useState(new Map());
  
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
        
        // Real Korean-English question pack data
        const contentData = {
          beginner: {
            questionPacks: [
              { 
                id: 'learn_pack_b1', 
                title: 'Basic Vocabulary', 
                subject: 'korean_english',
                questionCount: 25, 
                difficulty: 'Easy', 
                completedCount: 0, 
                totalQuestions: 25,
                timeLimit: 30, // 30 minutes
                created: new Date(),
                questions: generateKoreanQuestions('beginner', 25),
                completed: false,
                score: null,
                timeTaken: null
              },
              { 
                id: 'learn_pack_b2', 
                title: 'Simple Grammar', 
                subject: 'korean_english',
                questionCount: 20, 
                difficulty: 'Easy', 
                completedCount: 0, 
                totalQuestions: 20,
                timeLimit: 25, // 25 minutes
                created: new Date(),
                questions: generateKoreanQuestions('beginner', 20),
                completed: false,
                score: null,
                timeTaken: null
              },
              { 
                id: 'learn_pack_b3', 
                title: 'Daily Phrases', 
                subject: 'korean_english',
                questionCount: 30, 
                difficulty: 'Easy', 
                completedCount: 0, 
                totalQuestions: 30,
                timeLimit: 35, // 35 minutes
                created: new Date(),
                questions: generateKoreanQuestions('beginner', 30),
                completed: false,
                score: null,
                timeTaken: null
              },
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
              { 
                id: 'learn_pack_i1', 
                title: 'Complex Sentences', 
                subject: 'korean_english',
                questionCount: 35, 
                difficulty: 'Medium', 
                completedCount: 0, 
                totalQuestions: 35,
                timeLimit: 50, // 50 minutes
                created: new Date(),
                questions: generateKoreanQuestions('intermediate', 35),
                completed: false,
                score: null,
                timeTaken: null
              },
              { 
                id: 'learn_pack_i2', 
                title: 'Business Korean', 
                subject: 'korean_english',
                questionCount: 40, 
                difficulty: 'Medium', 
                completedCount: 0, 
                totalQuestions: 40,
                timeLimit: 60, // 60 minutes
                created: new Date(),
                questions: generateKoreanQuestions('intermediate', 40),
                completed: false,
                score: null,
                timeTaken: null
              },
              { 
                id: 'learn_pack_i3', 
                title: 'Reading Comprehension', 
                subject: 'korean_english',
                questionCount: 25, 
                difficulty: 'Medium', 
                completedCount: 0, 
                totalQuestions: 25,
                timeLimit: 40, // 40 minutes
                created: new Date(),
                questions: generateKoreanQuestions('intermediate', 25),
                completed: false,
                score: null,
                timeTaken: null
              },
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
              { 
                id: 'learn_pack_a1', 
                title: 'Academic Writing', 
                subject: 'korean_english',
                questionCount: 45, 
                difficulty: 'Hard', 
                completedCount: 0, 
                totalQuestions: 45,
                timeLimit: 70, // 70 minutes
                created: new Date(),
                questions: generateKoreanQuestions('advanced', 45),
                completed: false,
                score: null,
                timeTaken: null
              },
              { 
                id: 'learn_pack_a2', 
                title: 'Literature Analysis', 
                subject: 'korean_english',
                questionCount: 50, 
                difficulty: 'Hard', 
                completedCount: 0, 
                totalQuestions: 50,
                timeLimit: 80, // 80 minutes
                created: new Date(),
                questions: generateKoreanQuestions('advanced', 50),
                completed: false,
                score: null,
                timeTaken: null
              },
              { 
                id: 'learn_pack_a3', 
                title: 'TOPIK II Preparation', 
                subject: 'korean_english',
                questionCount: 60, 
                difficulty: 'Hard', 
                completedCount: 0, 
                totalQuestions: 60,
                timeLimit: 90, // 90 minutes
                created: new Date(),
                questions: generateKoreanQuestions('advanced', 60),
                completed: false,
                score: null,
                timeTaken: null
              },
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
        const content = contentData[selectedLevel];
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

  // Start practice pack quiz
  const handlePackClick = (pack) => {
    // Check if pack is already completed
    const completed = completedPacks.get(pack.id);
    if (completed) {
      // Show review options
      const reviewChoice = window.confirm(
        `You've already completed this pack with a score of ${completed.score}%!\n\nClick OK to review your results, or Cancel to retake the quiz.`
      );
      if (reviewChoice) {
        // Show review mode
        setActiveQuiz({
          ...pack,
          mode: 'review',
          results: completed
        });
      } else {
        // Retake quiz
        setActiveQuiz({
          ...pack,
          mode: 'quiz'
        });
      }
    } else {
      // Start new quiz
      setActiveQuiz({
        ...pack,
        mode: 'quiz'
      });
    }
  };

  // Handle quiz completion
  const handleQuizComplete = async (results) => {
    const { packId, score, timeTaken, correctAnswers, totalQuestions } = results;
    
    // Save completion data
    const completionData = {
      score,
      timeTaken,
      correctAnswers,
      totalQuestions,
      completedAt: new Date(),
      percentage: Math.round((correctAnswers / totalQuestions) * 100)
    };
    
    // Update local state
    setCompletedPacks(prev => new Map(prev.set(packId, completionData)));
    
    // Save to Firebase
    if (user) {
      try {
        await setDoc(doc(db, 'userProgress', user.uid), {
          [`learnPacks.${packId}`]: completionData,
          updatedAt: Timestamp.now()
        }, { merge: true });
      } catch (error) {
        console.error('Error saving pack completion:', error);
      }
    }
    
    // Close quiz
    setActiveQuiz(null);
  };

  // Close quiz
  const handleCloseQuiz = () => {
    setActiveQuiz(null);
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
                onClick={() => handlePackClick(pack)}
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
      
      {/* Quiz Modal */}
      {activeQuiz && (
        <QuizModal 
          pack={activeQuiz}
          onComplete={handleQuizComplete}
          onClose={handleCloseQuiz}
        />
      )}
    </div>
  );
};

// Simple Quiz Modal Component
const QuizModal = ({ pack, onComplete, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(pack.timeLimit * 60); // Convert to seconds
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmit = () => {
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    
    let correctAnswers = 0;
    pack.questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const results = {
      packId: pack.id,
      score: Math.round((correctAnswers / pack.questions.length) * 100),
      timeTaken,
      correctAnswers,
      totalQuestions: pack.questions.length,
      answers
    };

    onComplete(results);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (pack.mode === 'review') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>📊 {pack.title} - Review</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Final Score:</span>
              <span style={{ fontWeight: 'bold', color: pack.results.percentage >= 80 ? '#10b981' : pack.results.percentage >= 60 ? '#f59e0b' : '#ef4444' }}>
                {pack.results.percentage}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Time Taken:</span>
              <span>{Math.floor(pack.results.timeTaken / 60)}:{String(pack.results.timeTaken % 60).padStart(2, '0')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Correct Answers:</span>
              <span>{pack.results.correctAnswers} / {pack.results.totalQuestions}</span>
            </div>
            <button 
              onClick={onClose} 
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Close Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = pack.questions[currentQuestion];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{pack.title}</h2>
            <span style={{ color: 'var(--text-secondary)' }}>Question {currentQuestion + 1} of {pack.questions.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: timeLeft < 300 ? '#ef4444' : 'var(--text-primary)', fontWeight: 'bold' }}>
              {formatTime(timeLeft)}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
        </div>
        
        <div>
          <h3 style={{ marginBottom: '1.5rem' }}>{currentQ.question}</h3>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQ.id, index)}
                style={{
                  padding: '1rem',
                  border: `2px solid ${answers[currentQ.id] === index ? 'var(--accent-primary)' : 'var(--border-light)'}`,
                  borderRadius: '8px',
                  background: answers[currentQ.id] === index ? 'rgba(79, 70, 229, 0.1)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                {option}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button 
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                background: 'white',
                cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                opacity: currentQuestion === 0 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            
            {currentQuestion === pack.questions.length - 1 ? (
              <button 
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== pack.questions.length}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: Object.keys(answers).length === pack.questions.length ? 'var(--accent-primary)' : 'var(--border-medium)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: Object.keys(answers).length === pack.questions.length ? 'pointer' : 'not-allowed'
                }}
              >
                Submit Quiz
              </button>
            ) : (
              <button 
                onClick={() => setCurrentQuestion(prev => Math.min(pack.questions.length - 1, prev + 1))}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnTab;