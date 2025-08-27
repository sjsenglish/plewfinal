import React, { useState, useEffect } from 'react';
import './VocabularyTest.css';

const VocabularyTest = ({ words, testType, onComplete, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [questions, setQuestions] = useState([]);

  // Initialize test on mount
  useEffect(() => {
    if (words && words.length > 0) {
      generateQuestions();
      setTimeLeft(getTestDuration());
    }
  }, [words, testType]);

  // Timer countdown
  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (testStarted && timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft, testStarted]);

  const getTestDuration = () => {
    switch (testType) {
      case 'synonym-match': return 300; // 5 minutes
      case 'fill-blank': return 600; // 10 minutes
      case 'definition-match': return 240; // 4 minutes
      case 'quick-test': return 180; // 3 minutes
      default: return 300;
    }
  };

  const generateQuestions = () => {
    if (!words || words.length === 0) return;

    const generatedQuestions = [];
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(10, shuffledWords.length); i++) {
      const word = shuffledWords[i];
      const question = generateQuestionByType(word, testType);
      if (question) generatedQuestions.push(question);
    }
    
    setQuestions(generatedQuestions);
  };

  const generateQuestionByType = (word, type) => {
    switch (type) {
      case 'synonym-match':
        return generateSynonymMatchQuestion(word);
      case 'fill-blank':
        return generateFillBlankQuestion(word);
      case 'definition-match':
        return generateDefinitionMatchQuestion(word);
      case 'quick-test':
        return generateQuickTestQuestion(word);
      default:
        return null;
    }
  };

  const generateSynonymMatchQuestion = (word) => {
    if (!word.synonyms || word.synonyms.length === 0) return null;
    
    const correctAnswer = word.synonyms[Math.floor(Math.random() * word.synonyms.length)];
    const wrongAnswers = generateWrongAnswers(word, 3);
    const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    return {
      id: word.objectID || word.id,
      type: 'synonym-match',
      question: `Which word is a synonym of "${word.word}"?`,
      word: word.word,
      definition: word.definition,
      options: allAnswers,
      correctAnswer: correctAnswer,
      explanation: `"${correctAnswer}" is a synonym of "${word.word}" which means: ${word.definition}`
    };
  };

  const generateFillBlankQuestion = (word) => {
    if (!word.examples || word.examples.length === 0) return null;
    
    const example = word.examples[Math.floor(Math.random() * word.examples.length)];
    const sentence = example.sentence || example;
    
    // Create a blank in the sentence
    const wordRegex = new RegExp(`\\b${word.word}\\b`, 'i');
    if (!wordRegex.test(sentence)) return null;
    
    const sentenceWithBlank = sentence.replace(wordRegex, '_____');
    const wrongAnswers = generateWrongAnswers(word, 3);
    const allAnswers = [word.word, ...wrongAnswers].sort(() => Math.random() - 0.5);
    
    return {
      id: word.objectID || word.id,
      type: 'fill-blank',
      question: 'Fill in the blank with the correct word:',
      sentence: sentenceWithBlank,
      options: allAnswers,
      correctAnswer: word.word,
      explanation: `The correct answer is "${word.word}" which means: ${word.definition}`
    };
  };

  const generateDefinitionMatchQuestion = (word) => {
    const wrongDefinitions = generateWrongDefinitions(word, 3);
    const allOptions = [word.definition, ...wrongDefinitions].sort(() => Math.random() - 0.5);
    
    return {
      id: word.objectID || word.id,
      type: 'definition-match',
      question: `What does "${word.word}" mean?`,
      word: word.word,
      options: allOptions,
      correctAnswer: word.definition,
      explanation: `"${word.word}" means: ${word.definition}`
    };
  };

  const generateQuickTestQuestion = (word) => {
    const questionTypes = ['synonym-match', 'definition-match'];
    const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    return generateQuestionByType(word, randomType);
  };

  const generateWrongAnswers = (currentWord, count) => {
    // In a real app, this would fetch similar words from your database
    const commonWrongAnswers = [
      'elaborate', 'magnificent', 'substantial', 'evident', 'sufficient',
      'abundant', 'crucial', 'significant', 'remarkable', 'exceptional',
      'comprehensive', 'fundamental', 'prominent', 'distinctive', 'considerable'
    ];
    
    return commonWrongAnswers
      .filter(answer => answer !== currentWord.word && 
              !currentWord.synonyms?.includes(answer))
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  };

  const generateWrongDefinitions = (currentWord, count) => {
    const commonDefinitions = [
      'to make something clear or easy to understand',
      'having great beauty or elegance',
      'large in size, quantity, or extent',
      'clearly seen or understood; obvious',
      'enough; adequate for a specific purpose',
      'existing in large quantities; plentiful',
      'of great importance; essential',
      'sufficiently great or important to be worthy of attention'
    ];
    
    return commonDefinitions
      .filter(def => def !== currentWord.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  };

  const startTest = () => {
    setTestStarted(true);
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const answerRecord = {
      questionId: currentQuestion.id,
      question: currentQuestion,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timeSpent: getTestDuration() - timeLeft
    };
    
    setUserAnswers([...userAnswers, answerRecord]);
    setSelectedAnswer(null);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResult(false);
    } else {
      completeTest([...userAnswers, answerRecord]);
    }
  };

  const handleShowResult = () => {
    setShowResult(true);
  };

  const handleTimeUp = () => {
    if (selectedAnswer) {
      handleNextQuestion();
    } else {
      completeTest(userAnswers);
    }
  };

  const completeTest = (allAnswers) => {
    const score = allAnswers.filter(answer => answer.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    const testResults = {
      score,
      totalQuestions,
      percentage,
      answers: allAnswers,
      testType,
      completedAt: new Date().toISOString()
    };
    
    onComplete && onComplete(testResults);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!testStarted) {
    return (
      <div className="test-overlay">
        <div className="test-container">
          <div className="test-intro">
            <h2>Vocabulary Test</h2>
            <div className="test-info">
              <div className="test-details">
                <h3>{getTestTypeTitle()}</h3>
                <p>{getTestDescription()}</p>
                
                <div className="test-stats">
                  <div className="stat-item">
                    <span className="stat-label">Questions:</span>
                    <span className="stat-value">{questions.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Time Limit:</span>
                    <span className="stat-value">{formatTime(getTestDuration())}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Type:</span>
                    <span className="stat-value">{getTestTypeTitle()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="test-actions">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={startTest}>
                Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  const getTestTypeTitle = () => {
    switch (testType) {
      case 'synonym-match': return 'Synonym Matching';
      case 'fill-blank': return 'Fill in the Blank';
      case 'definition-match': return 'Definition Matching';
      case 'quick-test': return 'Quick Test';
      default: return 'Vocabulary Test';
    }
  };

  const getTestDescription = () => {
    switch (testType) {
      case 'synonym-match': return 'Match words with their synonyms';
      case 'fill-blank': return 'Complete sentences with the correct words';
      case 'definition-match': return 'Match words with their definitions';
      case 'quick-test': return 'Mixed question types for quick practice';
      default: return 'Test your vocabulary knowledge';
    }
  };

  return (
    <div className="test-overlay">
      <div className="test-container">
        {/* Test Header */}
        <div className="test-header">
          <div className="test-progress">
            <div className="progress-info">
              <span className="question-counter">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="time-remaining">
                Time: {formatTime(timeLeft)}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <button className="close-test-btn" onClick={onClose} title="Close test">
            ✕
          </button>
        </div>

        {/* Question Content */}
        <div className="question-content">
          <div className="question-header">
            <h3 className="question-title">{currentQuestion.question}</h3>
            {currentQuestion.word && (
              <div className="question-word">
                <span className="word-highlight">{currentQuestion.word}</span>
                {currentQuestion.definition && (
                  <span className="word-definition">({currentQuestion.definition})</span>
                )}
              </div>
            )}
            {currentQuestion.sentence && (
              <div className="question-sentence">
                <p>"{currentQuestion.sentence}"</p>
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="answer-options">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`answer-option ${selectedAnswer === option ? 'selected' : ''} ${
                  showResult ? (option === currentQuestion.correctAnswer ? 'correct' : 
                               option === selectedAnswer && option !== currentQuestion.correctAnswer ? 'incorrect' : '') : ''
                }`}
                onClick={() => handleAnswerSelect(option)}
                disabled={showResult}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
                {showResult && option === currentQuestion.correctAnswer && (
                  <span className="option-indicator correct-indicator">✓</span>
                )}
                {showResult && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                  <span className="option-indicator incorrect-indicator">✗</span>
                )}
              </button>
            ))}
          </div>

          {/* Result Explanation */}
          {showResult && (
            <div className="result-explanation">
              <div className="explanation-content">
                <h4>
                  {selectedAnswer === currentQuestion.correctAnswer ? 
                    '✅ Correct!' : '❌ Incorrect'
                  }
                </h4>
                <p>{currentQuestion.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Test Actions */}
        <div className="test-actions">
          {!showResult ? (
            <button 
              className="btn-primary"
              onClick={handleShowResult}
              disabled={!selectedAnswer}
            >
              Submit Answer
            </button>
          ) : (
            <button 
              className="btn-primary"
              onClick={handleNextQuestion}
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Test'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyTest;