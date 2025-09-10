import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import './VocabularyQuiz.css';

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
    { id: 'mixed', name: 'Mixed Questions', icon: '🎯', description: 'Variety of question types' },
    { id: 'synonyms', name: 'Synonyms', icon: '🔄', description: 'Choose the correct synonym' },
    { id: 'definitions', name: 'Definitions', icon: '📖', description: 'Match words to definitions' },
    { id: 'context', name: 'Context Usage', icon: '💭', description: 'Best usage in context' },
    { id: 'antonyms', name: 'Antonyms', icon: '↔️', description: 'Choose the opposite meaning' }
  ];

  // Generate quiz questions based on type
  const generateQuestions = useCallback((wordsArray, type) => {
    const questions = [];

    wordsArray.forEach((word, index) => {
      const questionType = type === 'mixed' ? 
        ['synonyms', 'definitions', 'context', 'antonyms'][Math.floor(Math.random() * 4)] : 
        type;

      let question;
      
      switch (questionType) {
        case 'synonyms':
          question = generateSynonymQuestion(word, wordsArray);
          break;
        case 'definitions':
          question = generateDefinitionQuestion(word, wordsArray);
          break;
        case 'context':
          question = generateContextQuestion(word, wordsArray);
          break;
        case 'antonyms':
          question = generateAntonymQuestion(word, wordsArray);
          break;
        default:
          question = generateDefinitionQuestion(word, wordsArray);
      }

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

  // Generate synonym question
  const generateSynonymQuestion = (word, allWords) => {
    if (!word.synonyms || word.synonyms.length === 0) {
      return generateDefinitionQuestion(word, allWords);
    }

    const correctAnswer = word.synonyms[0];
    const wrongAnswers = [];
    
    // Get wrong answers from other words' synonyms or the words themselves
    allWords.forEach(w => {
      if (w.word !== word.word && wrongAnswers.length < 3) {
        if (w.synonyms && w.synonyms.length > 0) {
          wrongAnswers.push(w.synonyms[0]);
        } else {
          wrongAnswers.push(w.word);
        }
      }
    });

    // Fill with random common words if needed
    const commonWords = ['happy', 'sad', 'big', 'small', 'good', 'bad', 'fast', 'slow'];
    while (wrongAnswers.length < 3) {
      const randomWord = commonWords[Math.floor(Math.random() * commonWords.length)];
      if (!wrongAnswers.includes(randomWord) && randomWord !== correctAnswer) {
        wrongAnswers.push(randomWord);
      }
    }

    const options = [correctAnswer, ...wrongAnswers.slice(0, 3)]
      .sort(() => Math.random() - 0.5);

    return {
      type: 'synonyms',
      question: `What is a synonym for "${word.word}"?`,
      options,
      correctAnswer,
      explanation: `"${correctAnswer}" is a synonym for "${word.word}". ${word.definition}`
    };
  };

  // Generate definition question
  const generateDefinitionQuestion = (word, allWords) => {
    const correctAnswer = word.definition;
    const wrongAnswers = [];

    allWords.forEach(w => {
      if (w.word !== word.word && w.definition && wrongAnswers.length < 3) {
        wrongAnswers.push(w.definition);
      }
    });

    if (wrongAnswers.length < 3) {
      const genericDefinitions = [
        'A type of measurement used in science',
        'An emotional state of being',
        'A physical object or item',
        'A process or action',
        'A concept related to time',
        'A form of communication'
      ];
      
      while (wrongAnswers.length < 3) {
        const randomDef = genericDefinitions[Math.floor(Math.random() * genericDefinitions.length)];
        if (!wrongAnswers.includes(randomDef)) {
          wrongAnswers.push(randomDef);
        }
      }
    }

    const options = [correctAnswer, ...wrongAnswers.slice(0, 3)]
      .sort(() => Math.random() - 0.5);

    return {
      type: 'definitions',
      question: `What does "${word.word}" mean?`,
      options,
      correctAnswer,
      explanation: `"${word.word}" means: ${correctAnswer}`
    };
  };

  // Generate context question
  const generateContextQuestion = (word, allWords) => {
    if (!word.examples || word.examples.length === 0) {
      return generateDefinitionQuestion(word, allWords);
    }

    const example = word.examples[0];
    const blankExample = example.replace(new RegExp(word.word, 'gi'), '_____');
    
    const wrongWords = [];
    allWords.forEach(w => {
      if (w.word !== word.word && wrongWords.length < 3) {
        wrongWords.push(w.word);
      }
    });

    const options = [word.word, ...wrongWords.slice(0, 3)]
      .sort(() => Math.random() - 0.5);

    return {
      type: 'context',
      question: `Fill in the blank: "${blankExample}"`,
      options,
      correctAnswer: word.word,
      explanation: `The correct word is "${word.word}". Full sentence: "${example}"`
    };
  };

  // Generate antonym question
  const generateAntonymQuestion = (word, allWords) => {
    if (!word.antonyms || word.antonyms.length === 0) {
      return generateSynonymQuestion(word, allWords);
    }

    const correctAnswer = word.antonyms[0];
    const wrongAnswers = [];
    
    allWords.forEach(w => {
      if (w.word !== word.word && wrongAnswers.length < 3) {
        if (w.antonyms && w.antonyms.length > 0) {
          wrongAnswers.push(w.antonyms[0]);
        } else {
          wrongAnswers.push(w.word);
        }
      }
    });

    const commonWords = ['opposite', 'similar', 'different', 'same', 'reverse', 'contrary'];
    while (wrongAnswers.length < 3) {
      const randomWord = commonWords[Math.floor(Math.random() * commonWords.length)];
      if (!wrongAnswers.includes(randomWord) && randomWord !== correctAnswer) {
        wrongAnswers.push(randomWord);
      }
    }

    const options = [correctAnswer, ...wrongAnswers.slice(0, 3)]
      .sort(() => Math.random() - 0.5);

    return {
      type: 'antonyms',
      question: `What is an antonym for "${word.word}"?`,
      options,
      correctAnswer,
      explanation: `"${correctAnswer}" is an antonym for "${word.word}". ${word.definition}`
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
      questionId: currentQuestion.id,
      word: currentQuestion.word,
      question: currentQuestion.question,
      selectedAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent: 30 - timeLeft,
      type: currentQuestion.type
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
                      <div className="question-text">{answer.question}</div>
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