import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './VocabularyQuiz.css';
import { safeString } from '../utils/safeRender';

const VocabularyQuiz = ({ words, onClose, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizType, setQuizType] = useState('mixed'); // 'synonyms', 'definitions', 'context', 'mixed'
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false);
  const [results, setResults] = useState([]);

  const auth = getAuth();
  const user = auth.currentUser;

  const quizTypes = [
    { id: 'context', name: 'Context Usage', icon: '💭', description: 'Choose correct sentence context' }
  ];

  // Generate quiz questions based on type
  const generateQuestions = useCallback((wordsArray, type) => {
    const questions = [];

    wordsArray.forEach((word, index) => {
      const question = generateContextQuestion(word, wordsArray);

      if (question) {
        questions.push({
          ...question,
          id: index,
          word: word.word,
          originalWord: word
        });
      }
    });

    return questions.sort(() => Math.random() - 0.5); // Shuffle questions
  }, []);


  // Generate context question with sentence options (Firebase data only)
  const generateContextQuestion = (word, allWords) => {
    console.log('Generating context question for word:', word.word);
    console.log('Word data:', word);
    
    // Get the correct context sentence from Firebase data
    let correctSentence = '';
    
    // Priority 1: Use contexts array from Firebase (extracted from CSAT passages)
    if (word.contexts && Array.isArray(word.contexts) && word.contexts.length > 0) {
      correctSentence = word.contexts[0];
      console.log('Using contexts from Firebase:', correctSentence);
    }
    // Priority 2: Use examples array from Firebase 
    else if (word.examples && Array.isArray(word.examples) && word.examples.length > 0) {
      if (typeof word.examples[0] === 'object' && word.examples[0].sentence) {
        correctSentence = word.examples[0].sentence;
        console.log('Using examples.sentence from Firebase:', correctSentence);
      } else if (typeof word.examples[0] === 'string') {
        correctSentence = word.examples[0];
        console.log('Using examples string from Firebase:', correctSentence);
      }
    }
    
    // If no context available, skip this word
    if (!correctSentence) {
      console.log('No context sentence available for word:', word.word);
      return null;
    }

    // Create the blanked version of the correct sentence
    const correctBlank = correctSentence.replace(new RegExp(`\\b${word.word}\\b`, 'gi'), '_____');
    
    // Generate 3 incorrect context sentences from other Firebase words
    const wrongSentences = [];
    const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);
    
    for (const otherWord of shuffledWords) {
      if (otherWord.word !== word.word && wrongSentences.length < 3) {
        let wrongSentence = '';
        
        // Get context sentence from another Firebase word
        if (otherWord.contexts && Array.isArray(otherWord.contexts) && otherWord.contexts.length > 0) {
          wrongSentence = otherWord.contexts[0];
        } else if (otherWord.examples && Array.isArray(otherWord.examples) && otherWord.examples.length > 0) {
          if (typeof otherWord.examples[0] === 'object' && otherWord.examples[0].sentence) {
            wrongSentence = otherWord.examples[0].sentence;
          } else if (typeof otherWord.examples[0] === 'string') {
            wrongSentence = otherWord.examples[0];
          }
        }
        
        if (wrongSentence && wrongSentence !== correctSentence && wrongSentence.length > 20) {
          // Replace the other word with blank to create a distractor
          const wrongBlank = wrongSentence.replace(new RegExp(`\\b${otherWord.word}\\b`, 'gi'), '_____');
          wrongSentences.push(wrongBlank);
          console.log('Added wrong sentence from Firebase word', otherWord.word, ':', wrongBlank);
        }
      }
    }

    // If we still don't have enough wrong sentences from Firebase, use generic academic sentences
    while (wrongSentences.length < 3) {
      const genericSentences = [
        'The student carefully analyzed the _____ presented in the research paper.',
        'Modern technology has significantly influenced how we understand _____ concepts.',
        'The professor emphasized the importance of studying _____ patterns in literature.',
        'Researchers have discovered new methods to examine _____ phenomena.',
        'The committee discussed various _____ approaches to solving the problem.',
        'Students must demonstrate their understanding of _____ principles in the examination.'
      ];
      
      const randomSentence = genericSentences[Math.floor(Math.random() * genericSentences.length)];
      if (!wrongSentences.includes(randomSentence)) {
        wrongSentences.push(randomSentence);
        console.log('Added generic sentence:', randomSentence);
      }
    }

    // Create options array with all sentence options
    const sentenceOptions = [correctBlank, ...wrongSentences.slice(0, 3)]
      .sort(() => Math.random() - 0.5);

    console.log('Final question options:', sentenceOptions);

    return {
      type: 'context',
      question: `Which sentence correctly uses the word "${word.word}"?`,
      options: sentenceOptions,
      correctAnswer: correctBlank,
      explanation: `The correct sentence is: "${correctSentence}" - This shows the proper usage of "${word.word}" from real CSAT passages.`
    };
  };


  // Start quiz
  const startQuiz = () => {
    const questions = generateQuestions(words, quizType);
    setQuizQuestions(questions);
    setQuizStarted(true);
    setTimeLeft(30);
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answer);
    setTimeLeft(0); // Stop timer
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    const answerData = {
      questionId: safeString(currentQuestion.id || 'unknown'),
      word: safeString(currentQuestion.word || ''),
      questionText: safeString(currentQuestion.question || 'Unknown question'),
      selectedAnswer: safeString(answer || ''),
      correctAnswer: safeString(currentQuestion.correctAnswer || ''),
      isCorrect,
      timeSpent: 30 - timeLeft,
      type: safeString(currentQuestion.type || 'unknown')
    };

    setAnswers(prev => [...prev, answerData]);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Show result for 2 seconds, then move to next question
    setShowResult(true);
    setTimeout(() => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(30);
      } else {
        finishQuiz();
      }
    }, 2000);
  };

  // Finish quiz
  const finishQuiz = async () => {
    const finalResults = {
      score,
      totalQuestions: quizQuestions.length,
      percentage: Math.round((score / quizQuestions.length) * 100),
      answers,
      quizType,
      completedAt: new Date(),
      words: words.map(w => w.word)
    };

    setResults(finalResults);

    // Save to Firebase if user is logged in
    if (user) {
      try {
        await addDoc(collection(db, 'vocabularyQuizResults'), {
          userId: user.uid,
          ...finalResults
        });
      } catch (error) {
        console.error('Error saving quiz results:', error);
      }
    }

    onComplete(finalResults);
  };

  // Timer effect
  useEffect(() => {
    if (!quizStarted || showResult || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswerSelect(null); // Time's up, no answer selected
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted, showResult]);

  if (!quizStarted) {
    return (
      <div className="quiz-modal">
        <div className="quiz-container setup-container">
          <div className="quiz-header">
            <h2>Setup Your Vocabulary Quiz</h2>
            <button onClick={onClose} className="close-btn">×</button>
          </div>

          <div className="quiz-setup">
            <div className="quiz-info">
              <div className="info-item">
                <span className="info-label">Words:</span>
                <span className="info-value">{words.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Time per question:</span>
                <span className="info-value">30 seconds</span>
              </div>
            </div>

            <div className="quiz-type-selection">
              <h3>Choose Quiz Type</h3>
              <div className="quiz-types">
                {quizTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setQuizType(type.id)}
                    className={`quiz-type-btn ${quizType === type.id ? 'active' : ''}`}
                  >
                    <div className="type-icon">{type.icon}</div>
                    <div className="type-info">
                      <div className="type-name">{type.name}</div>
                      <div className="type-description">{type.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startQuiz} className="start-quiz-btn">
              🚀 Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (results.score !== undefined) {
    return (
      <div className="quiz-modal">
        <div className="quiz-container results-container">
          <div className="quiz-header">
            <h2>Quiz Complete!</h2>
            <button onClick={onClose} className="close-btn">×</button>
          </div>

          <div className="quiz-results">
            <div className="score-display">
              <div className="score-circle">
                <div className="score-text">
                  <span className="score-number">{results.percentage}%</span>
                  <span className="score-label">{results.score}/{results.totalQuestions}</span>
                </div>
              </div>
            </div>

            <div className="performance-message">
              {results.percentage >= 90 && (
                <div className="message excellent">
                  🎉 Excellent! You're mastering vocabulary!
                </div>
              )}
              {results.percentage >= 70 && results.percentage < 90 && (
                <div className="message good">
                  👏 Great job! Keep practicing to improve!
                </div>
              )}
              {results.percentage >= 50 && results.percentage < 70 && (
                <div className="message okay">
                  💪 Good effort! Review the words and try again!
                </div>
              )}
              {results.percentage < 50 && (
                <div className="message needs-work">
                  📚 Keep studying! Practice makes perfect!
                </div>
              )}
            </div>

            <div className="results-breakdown">
              <h3>Question Breakdown</h3>
              <div className="answers-list">
                {answers.map((answer, index) => (
                  <div key={index} className={`answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="answer-header">
                      <span className="question-number">Q{index + 1}</span>
                      <span className={`result-icon ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                        {answer.isCorrect ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="answer-details">
                      <div className="question-text">{answer.questionText}</div>
                      <div className="answer-comparison">
                        <div className="answer-row">
                          <span className="label">Your answer:</span>
                          <span className={`value ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                            {answer.selectedAnswer || 'No answer'}
                          </span>
                        </div>
                        {!answer.isCorrect && (
                          <div className="answer-row">
                            <span className="label">Correct answer:</span>
                            <span className="value correct">{answer.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="results-actions">
              <button onClick={() => window.location.reload()} className="retry-btn">
                🔄 Try Again
              </button>
              <button onClick={onClose} className="finish-btn">
                ✅ Finish
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="quiz-modal">
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-progress">
            <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="quiz-timer">
            <div className={`timer ${timeLeft <= 10 ? 'warning' : ''}`}>
              ⏱️ {timeLeft}s
            </div>
          </div>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="quiz-content">
          <div className="question-section">
            <div className="question-type">
              {currentQuestion.type === 'synonyms' && '🔄 Synonym'}
              {currentQuestion.type === 'definitions' && '📖 Definition'}
              {currentQuestion.type === 'context' && '💭 Context'}
              {currentQuestion.type === 'antonyms' && '↔️ Antonym'}
            </div>
            <h3 className="question-text">{currentQuestion.question}</h3>
          </div>

          <div className="answers-section">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={selectedAnswer !== null}
                className={`answer-option ${
                  selectedAnswer === option ? 
                    (option === currentQuestion.correctAnswer ? 'correct' : 'incorrect') :
                    ''
                } ${
                  showResult && option === currentQuestion.correctAnswer ? 'correct' : ''
                }`}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>

          {showResult && (
            <div className="result-explanation">
              <div className={`result-message ${selectedAnswer === currentQuestion.correctAnswer ? 'correct' : 'incorrect'}`}>
                {selectedAnswer === currentQuestion.correctAnswer ? '🎉 Correct!' : '❌ Incorrect'}
              </div>
              <div className="explanation">
                {currentQuestion.explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyQuiz;