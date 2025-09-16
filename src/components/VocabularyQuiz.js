import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Modern color palette matching the site design
const COLORS = {
  primary: '#00ced1',
  primaryLight: '#d8f0ed',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151',
  light: '#f8fafc',
  border: '#e2e8f0',
  purple: '#8b5cf6',
  gradient: 'linear-gradient(135deg, #00ced1 0%, #8b5cf6 100%)'
};

// Safe render utility
const safeRender = (value, fallback = '') => {
  if (value === null || value === undefined) return String(fallback);
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value.sentence) return String(value.sentence);
    if (value.text) return String(value.text);
    if (value.content) return String(value.content);
    return String(fallback || '[Complex Object]');
  }
  return String(value || fallback);
};

// Context-based quiz mode only
const QUIZ_MODE = 'context';

const VocabularyQuiz = ({ words: propWords, onClose, onComplete }) => {
  // State management
  const [words, setWords] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizWords, setQuizWords] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [quizMode] = useState(QUIZ_MODE);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  // Load vocabulary words from Firebase
  const loadVocabularyWords = useCallback(async () => {
    setLoading(true);
    try {
      const wordsRef = collection(db, 'vocabulary');
      const wordsQuery = query(wordsRef, orderBy('frequency', 'desc'), limit(100));
      const snapshot = await getDocs(wordsQuery);
      
      const loadedWords = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.word && (data.contexts || data.definition || data.synonyms)) {
          loadedWords.push({
            id: doc.id,
            word: safeRender(data.word),
            definition: safeRender(data.definition),
            contexts: Array.isArray(data.contexts) ? data.contexts : [],
            synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
            difficulty: safeRender(data.difficulty, 'medium'),
            frequency: data.frequency || 0
          });
        }
      });
      
      console.log(`Loaded ${loadedWords.length} vocabulary words`);
      setWords(loadedWords);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load words on component mount or use provided words
  useEffect(() => {
    if (propWords && propWords.length > 0) {
      // Use words provided from parent component
      const formattedWords = propWords.map(word => ({
        id: word.id || word.word,
        word: safeRender(word.word),
        definition: safeRender(word.definition),
        contexts: Array.isArray(word.contexts) ? word.contexts : [],
        synonyms: Array.isArray(word.synonyms) ? word.synonyms : [],
        difficulty: safeRender(word.difficulty, 'medium'),
        frequency: word.frequency || 0
      }));
      setWords(formattedWords);
      // Auto-start quiz with provided words
      setTimeout(() => generateQuiz(Math.min(formattedWords.length, 10)), 100);
    } else {
      // Load from Firebase
      loadVocabularyWords();
    }
  }, [propWords, loadVocabularyWords]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Handle time up
  const handleTimeUp = () => {
    setTimerActive(false);
    if (selectedAnswer === null) {
      handleAnswerSelect(-1); // Mark as wrong due to timeout
    }
  };

  // Generate random quiz questions
  const generateQuiz = (questionCount = 10) => {
    if (words.length < questionCount) {
      alert(`Not enough words loaded. Only ${words.length} words available.`);
      return;
    }

    // Randomly select words
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, questionCount);
    
    setQuizWords(selectedWords);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setQuizStarted(true);
    setShowResult(false);
    generateQuestionOptions(selectedWords[0], selectedWords);
    setTimeLeft(30);
    setTimerActive(true);
  };

  // Generate options for current question
  const generateQuestionOptions = (currentWord, allWords) => {
    let options = [];
    let correctAnswer = '';

    // Context-based question only
    if (currentWord.contexts && currentWord.contexts.length > 0) {
      const randomContext = currentWord.contexts[Math.floor(Math.random() * currentWord.contexts.length)];
      correctAnswer = currentWord.word;
      
      // Get 3 other random words as wrong options
      const otherWords = allWords.filter(w => w.word !== currentWord.word);
      const wrongOptions = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
      
      options = [
        { text: correctAnswer, isCorrect: true },
        ...wrongOptions.map(w => ({ text: w.word, isCorrect: false }))
      ];
      
      // Store the context for display
      currentWord.questionContext = safeRender(randomContext);
    }

    // Shuffle options
    options = options.sort(() => Math.random() - 0.5);
    setCurrentOptions(options);
  };

  // Handle answer selection
  const handleAnswerSelect = (optionIndex) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setTimerActive(false);
    setSelectedAnswer(optionIndex);
    
    const isCorrect = optionIndex >= 0 && currentOptions[optionIndex]?.isCorrect;
    const newAnswer = {
      word: quizWords[currentQuestion].word,
      selectedIndex: optionIndex,
      isCorrect: isCorrect,
      correctAnswer: currentOptions.find(opt => opt.isCorrect)?.text,
      selectedAnswer: optionIndex >= 0 ? currentOptions[optionIndex]?.text : 'No answer (timeout)',
      timeLeft: timeLeft
    };
    
    setAnswers([...answers, newAnswer]);
    
    if (isCorrect) {
      setScore(score + 1);
    }

    // Auto advance after 2 seconds
    setTimeout(() => {
      if (currentQuestion + 1 < quizWords.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        generateQuestionOptions(quizWords[currentQuestion + 1], quizWords);
        setTimeLeft(30);
        setTimerActive(true);
      } else {
        finishQuiz();
      }
    }, 2000);
  };

  // Finish quiz
  const finishQuiz = () => {
    setTimerActive(false);
    setShowResult(true);
    
    // Call onComplete callback if provided
    if (onComplete) {
      const results = {
        score,
        totalQuestions: quizWords.length,
        percentage: Math.round((score / quizWords.length) * 100),
        answers,
        completedAt: new Date(),
        words: quizWords.map(w => w.word)
      };
      onComplete(results);
    }
  };

  // Reset quiz
  const resetQuiz = () => {
    setQuizStarted(false);
    setShowResult(false);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setCurrentOptions([]);
    setTimerActive(false);
    setTimeLeft(30);
  };

  // Get performance message
  const getPerformanceMessage = () => {
    const percentage = (score / quizWords.length) * 100;
    if (percentage >= 90) return { message: "Outstanding! 🎉", color: COLORS.success };
    if (percentage >= 80) return { message: "Excellent work! 👏", color: COLORS.success };
    if (percentage >= 70) return { message: "Good job! 👍", color: COLORS.warning };
    if (percentage >= 60) return { message: "Not bad! 💪", color: COLORS.warning };
    return { message: "Keep practicing! 📚", color: COLORS.error };
  };

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
          width: '48px',
          height: '48px',
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
          Loading vocabulary...
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

  if (!quizStarted) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 24px',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{
          background: COLORS.gradient,
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px',
          color: COLORS.white,
          position: 'relative'
        }}>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'transparent',
                border: `1px solid ${COLORS.white}40`,
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '16px',
                color: COLORS.white,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = COLORS.white + '20';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              ✕
            </button>
          )}
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>📚</div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 12px 0'
          }}>
            Vocabulary Quiz
          </h1>
          <p style={{
            fontSize: '16px',
            margin: '0',
            opacity: '0.9'
          }}>
            Test your knowledge of CSAT vocabulary words
          </p>
        </div>

        {/* Quiz Info */}
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: COLORS.primary + '10',
            borderRadius: '12px',
            border: `2px solid ${COLORS.primary}`
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '8px'
            }}>📖</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: COLORS.primary,
              margin: '0 0 8px 0'
            }}>
              Context Quiz
            </h3>
            <p style={{
              fontSize: '14px',
              color: COLORS.gray,
              margin: '0'
            }}>
              Identify the correct word from context sentences
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.primary,
                margin: '0 0 4px 0'
              }}>
                {words.length}
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                fontWeight: '500'
              }}>
                Words Available
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.warning,
                margin: '0 0 4px 0'
              }}>
                10
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                fontWeight: '500'
              }}>
                Questions
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.error,
                margin: '0 0 4px 0'
              }}>
                30s
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                fontWeight: '500'
              }}>
                Per Question
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => generateQuiz(10)}
          disabled={words.length === 0}
          style={{
            background: words.length === 0 ? COLORS.gray : COLORS.gradient,
            color: COLORS.white,
            border: 'none',
            padding: '16px 32px',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: words.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            if (words.length > 0) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
          }}
        >
          🚀 Start Quiz
        </button>
      </div>
    );
  }

  if (showResult) {
    const performance = getPerformanceMessage();
    const percentage = Math.round((score / quizWords.length) * 100);
    
    return (
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 24px',
        textAlign: 'center'
      }}>
        {/* Results Header */}
        <div style={{
          background: COLORS.gradient,
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px',
          color: COLORS.white
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px'
          }}>
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 12px 0'
          }}>
            Quiz Complete!
          </h1>
          <p style={{
            fontSize: '18px',
            margin: '0',
            opacity: '0.9'
          }}>
            {performance.message}
          </p>
        </div>

        {/* Score Display */}
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            color: performance.color,
            margin: '0 0 8px 0'
          }}>
            {percentage}%
          </div>
          <div style={{
            fontSize: '18px',
            color: COLORS.darkGray,
            fontWeight: '600',
            margin: '0 0 16px 0'
          }}>
            {score} out of {quizWords.length} correct
          </div>
          
          {/* Detailed Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            padding: '20px',
            backgroundColor: COLORS.light,
            borderRadius: '12px'
          }}>
            <div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: COLORS.success,
                margin: '0 0 4px 0'
              }}>
                {score}
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                fontWeight: '500'
              }}>
                Correct
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: COLORS.error,
                margin: '0 0 4px 0'
              }}>
                {quizWords.length - score}
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                fontWeight: '500'
              }}>
                Incorrect
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: COLORS.primary,
                margin: '0 0 4px 0'
              }}>
                {Math.round(answers.reduce((sum, ans) => sum + (30 - ans.timeLeft), 0) / answers.length)}s
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                fontWeight: '500'
              }}>
                Avg Time
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => generateQuiz(10)}
            style={{
              background: COLORS.gradient,
              color: COLORS.white,
              border: 'none',
              padding: '14px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🔄 Try Again
          </button>
          
          <button
            onClick={onClose || resetQuiz}
            style={{
              backgroundColor: COLORS.light,
              color: COLORS.darkGray,
              border: `1px solid ${COLORS.border}`,
              padding: '14px 24px',
              borderRadius: '12px',
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
            {onClose ? '✕ Close' : '🏠 Main Menu'}
          </button>
        </div>
      </div>
    );
  }

  // Quiz Questions UI
  const currentWord = quizWords[currentQuestion];
  
  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '24px'
    }}>
      {/* Quiz Header */}
      <div style={{
        backgroundColor: COLORS.white,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.darkGray
          }}>
            Question {currentQuestion + 1} of {quizWords.length}
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Timer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: timeLeft <= 10 ? COLORS.error + '20' : COLORS.primary + '20',
              color: timeLeft <= 10 ? COLORS.error : COLORS.primary,
              padding: '8px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              ⏱️ {timeLeft}s
            </div>
            
            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  backgroundColor: COLORS.light,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '16px',
                  color: COLORS.gray,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = COLORS.border;
                  e.target.style.color = COLORS.darkGray;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = COLORS.light;
                  e.target.style.color = COLORS.gray;
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: COLORS.light,
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((currentQuestion + 1) / quizWords.length) * 100}%`,
            height: '100%',
            background: COLORS.gradient,
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        {/* Score */}
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '14px',
          color: COLORS.gray
        }}>
          Score: <span style={{ fontWeight: '600', color: COLORS.primary }}>{score}</span>
        </div>
      </div>

      {/* Question Card */}
      <div style={{
        backgroundColor: COLORS.white,
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px',
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: COLORS.darkGray,
          margin: '0 0 16px 0',
          textAlign: 'center'
        }}>
          Which word fits best in this context?
        </h2>
        
        <div style={{
          backgroundColor: COLORS.light,
          borderRadius: '12px',
          padding: '20px',
          fontSize: '16px',
          lineHeight: '1.6',
          color: COLORS.darkGray,
          fontStyle: 'italic',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          "{safeRender(currentWord.questionContext)}"
        </div>

        {/* Answer Options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {currentOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: selectedAnswer === null 
                  ? `2px solid ${COLORS.border}`
                  : selectedAnswer === index
                    ? `2px solid ${option.isCorrect ? COLORS.success : COLORS.error}`
                    : option.isCorrect
                      ? `2px solid ${COLORS.success}`
                      : `2px solid ${COLORS.border}`,
                backgroundColor: selectedAnswer === null 
                  ? COLORS.white
                  : selectedAnswer === index
                    ? option.isCorrect ? COLORS.success + '20' : COLORS.error + '20'
                    : option.isCorrect
                      ? COLORS.success + '20'
                      : COLORS.white,
                color: COLORS.darkGray,
                fontSize: '15px',
                fontWeight: '500',
                cursor: selectedAnswer === null ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (selectedAnswer === null) {
                  e.target.style.backgroundColor = COLORS.primary + '10';
                  e.target.style.borderColor = COLORS.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedAnswer === null) {
                  e.target.style.backgroundColor = COLORS.white;
                  e.target.style.borderColor = COLORS.border;
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.light,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: COLORS.gray
                }}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{safeRender(option.text)}</span>
                
                {selectedAnswer !== null && (
                  <div style={{
                    marginLeft: 'auto',
                    fontSize: '18px'
                  }}>
                    {selectedAnswer === index && option.isCorrect ? '✅' :
                     selectedAnswer === index && !option.isCorrect ? '❌' :
                     option.isCorrect ? '✅' : ''}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VocabularyQuiz;