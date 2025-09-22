import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './SimpleVocabularyTest.css';

const SimpleVocabularyTest = ({ onClose }) => {
  const [allWords, setAllWords] = useState([]);
  const [testWords, setTestWords] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [testStarted, setTestStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testCompleted, setTestCompleted] = useState(false);

  // Load vocabulary data from Firebase
  const loadVocabularyData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📚 Loading vocabulary data for test...');
      const vocabularyRef = collection(db, 'vocabulary_words');
      const querySnapshot = await getDocs(vocabularyRef);
      
      const vocabularyData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include words that have contexts/examples
        if (data.contexts && data.contexts.length > 0) {
          vocabularyData.push({
            id: doc.id,
            word: data.word,
            contexts: data.contexts,
            definition: data.definition || '',
            difficulty: data.difficulty || 5
          });
        }
      });

      setAllWords(vocabularyData);
      console.log(`✅ Loaded ${vocabularyData.length} words with contexts`);
    } catch (error) {
      console.error('❌ Error loading vocabulary data:', error);
      setAllWords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate test questions
  const generateTest = useCallback(() => {
    if (allWords.length < 5) return;
    
    // Select 5 random words
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, 5);
    
    // Create questions for each word
    const questions = selectedWords.map(word => createQuestion(word, allWords));
    setTestWords(questions.filter(q => q !== null));
  }, [allWords]);

  // Create a question for a word
  const createQuestion = (targetWord, wordPool) => {
    if (!targetWord.contexts || targetWord.contexts.length === 0) return null;
    
    // Get the correct context (with the word in it)
    const correctContext = targetWord.contexts.find(context => 
      context.toLowerCase().includes(targetWord.word.toLowerCase())
    );
    
    if (!correctContext) return null;
    
    // Create blank version of correct context
    const correctWithBlank = correctContext.replace(
      new RegExp(`\\b${targetWord.word}\\b`, 'gi'), 
      '______'
    );
    
    // Get 3 wrong contexts from other words
    const otherWords = wordPool.filter(w => w.id !== targetWord.id && w.contexts.length > 0);
    const wrongContexts = [];
    
    while (wrongContexts.length < 3 && otherWords.length > 0) {
      const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
      const randomContext = randomWord.contexts[Math.floor(Math.random() * randomWord.contexts.length)];
      
      // Create blank version and make sure it doesn't contain target word
      const contextWithBlank = randomContext.replace(/\b\w+\b/, '______');
      
      if (!wrongContexts.includes(contextWithBlank) && 
          !contextWithBlank.toLowerCase().includes(targetWord.word.toLowerCase())) {
        wrongContexts.push(contextWithBlank);
      }
      
      // Remove this word to avoid infinite loop
      const index = otherWords.indexOf(randomWord);
      otherWords.splice(index, 1);
    }
    
    // Mix all options
    const allOptions = [correctWithBlank, ...wrongContexts].sort(() => Math.random() - 0.5);
    
    return {
      word: targetWord.word,
      definition: targetWord.definition,
      difficulty: targetWord.difficulty,
      options: allOptions,
      correctAnswer: correctWithBlank,
      correctContext: correctContext
    };
  };

  const handleTimeUp = useCallback(() => {
    completeTest();
  }, []);

  // Timer effect
  useEffect(() => {
    if (testStarted && !testCompleted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (testStarted && timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft, testStarted, testCompleted, handleTimeUp]);

  // Load data on mount
  useEffect(() => {
    loadVocabularyData();
  }, [loadVocabularyData]);

  // Generate test when words are loaded
  useEffect(() => {
    if (allWords.length > 0) {
      generateTest();
    }
  }, [allWords, generateTest]);

  const startTest = () => {
    setTestStarted(true);
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    const currentQ = testWords[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    setAnswers([...answers, {
      word: currentQ.word,
      selectedAnswer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect
    }]);
    
    setSelectedAnswer(null);
    setShowResult(false);
    
    if (currentQuestion < testWords.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeTest();
    }
  };

  const completeTest = () => {
    setTestCompleted(true);
  };

  const restartTest = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setTimeLeft(300);
    setTestStarted(false);
    setTestCompleted(false);
    generateTest();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScore = () => {
    const correct = answers.filter(a => a.isCorrect).length;
    return { correct, total: answers.length, percentage: Math.round((correct / answers.length) * 100) };
  };

  if (loading) {
    return (
      <div className="simple-test-overlay">
        <div className="simple-test-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading vocabulary test...</p>
          </div>
        </div>
      </div>
    );
  }

  if (testWords.length === 0) {
    return (
      <div className="simple-test-overlay">
        <div className="simple-test-container">
          <div className="error-state">
            <h3>Unable to generate test</h3>
            <p>Not enough vocabulary words with contexts available.</p>
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="simple-test-overlay">
        <div className="simple-test-container">
          <div className="test-intro">
            <h2>Vocabulary Context Test</h2>
            <p>Choose the correct context for each word. You'll see 5 words with 4 context options each.</p>
            
            <div className="test-info">
              <div className="info-item">
                <span className="info-label">Questions:</span>
                <span className="info-value">5</span>
              </div>
              <div className="info-item">
                <span className="info-label">Time Limit:</span>
                <span className="info-value">5 minutes</span>
              </div>
              <div className="info-item">
                <span className="info-label">Format:</span>
                <span className="info-value">Multiple Choice</span>
              </div>
            </div>
            
            <div className="test-actions">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={startTest}>Start Test</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    const score = getScore();
    return (
      <div className="simple-test-overlay">
        <div className="simple-test-container">
          <div className="test-results">
            <h2>Test Complete!</h2>
            <div className="score-display">
              <div className="score-main">
                <span className="score-number">{score.correct}/{score.total}</span>
                <span className="score-percentage">{score.percentage}%</span>
              </div>
            </div>
            
            <div className="results-breakdown">
              <h3>Results Breakdown:</h3>
              {answers.map((answer, index) => (
                <div key={index} className={`result-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                  <span className="result-word">{answer.word}</span>
                  <span className="result-status">
                    {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="test-actions">
              <button className="btn-secondary" onClick={restartTest}>Try Again</button>
              <button className="btn-primary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = testWords[currentQuestion];

  return (
    <div className="simple-test-overlay">
      <div className="simple-test-container">
        {/* Header with progress and timer */}
        <div className="test-header">
          <div className="test-progress">
            <span className="question-number">Question {currentQuestion + 1} of {testWords.length}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestion + 1) / testWords.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="timer">
            <span className="timer-label">Time:</span>
            <span className={`timer-value ${timeLeft < 60 ? 'warning' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Question */}
        <div className="question-content">
          <div className="question-header">
            <h3>Which context best fits the word:</h3>
            <div className="target-word">
              <span className="word">{currentQ.word}</span>
              {currentQ.definition && (
                <span className="definition">({currentQ.definition})</span>
              )}
            </div>
          </div>

          {/* Answer options */}
          <div className="answer-options">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                className={`answer-option ${selectedAnswer === option ? 'selected' : ''} ${
                  showResult ? (
                    option === currentQ.correctAnswer ? 'correct' : 
                    option === selectedAnswer && option !== currentQ.correctAnswer ? 'incorrect' : ''
                  ) : ''
                }`}
                onClick={() => handleAnswerSelect(option)}
                disabled={showResult}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
                {showResult && option === currentQ.correctAnswer && (
                  <span className="option-indicator">✓</span>
                )}
                {showResult && option === selectedAnswer && option !== currentQ.correctAnswer && (
                  <span className="option-indicator">✗</span>
                )}
              </button>
            ))}
          </div>

          {/* Show correct answer after submission */}
          {showResult && (
            <div className="result-explanation">
              <h4>{selectedAnswer === currentQ.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}</h4>
              <p><strong>Correct context:</strong> {currentQ.correctContext}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="test-actions">
          {!showResult ? (
            <button 
              className="btn-primary"
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
            >
              Submit Answer
            </button>
          ) : (
            <button 
              className="btn-primary"
              onClick={handleNextQuestion}
            >
              {currentQuestion < testWords.length - 1 ? 'Next Question' : 'Finish Test'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleVocabularyTest;