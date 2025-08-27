// src/components/PracticeMode.js - Updated for TSA and Maths with proper quiz integration
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getQuestionPack } from '../services/questionPackService';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import InteractiveQuiz from './InteractiveQuiz';

// Algolia search client
const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Subject configurations - matching your QuestionPackPage
const SUBJECTS = {
  tsa: {
    index: 'copy_tsa_questions',
    displayName: 'TSA Questions',
    icon: '🧠',
    avgTimePerQuestion: 1.5 // minutes
  },
  maths: {
    index: 'edexel_mathematics_updated',
    displayName: 'A-Level Maths',
    icon: '📊',
    avgTimePerQuestion: 3 // minutes
  }
};

const PracticeMode = () => {
  const { packId } = useParams();
  const navigate = useNavigate();
  const [pack, setPack] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    loadPack();
  }, [packId]);

  const loadPack = async () => {
    if (!user) {
      setError('Please log in to practice with packs');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get pack metadata from Firestore
      const packResult = await getQuestionPack(user.uid, packId);

      if (!packResult.success) {
        setError('Pack not found or you do not have access to this pack');
        setLoading(false);
        return;
      }

      const packData = packResult.data;
      
      // Check if subject is supported
      const subjectConfig = SUBJECTS[packData.subject];
      if (!subjectConfig) {
        setError(`Unsupported subject: ${packData.subject}. This practice mode supports TSA and A-Level Maths questions.`);
        setLoading(false);
        return;
      }

      setPack(packData);

      // Get the actual questions from Algolia using the stored question IDs
      if (packData.selectedQuestionIds && packData.selectedQuestionIds.length > 0) {
        try {
          const response = await searchClient.search([
            {
              indexName: subjectConfig.index,
              params: {
                query: '',
                filters: packData.selectedQuestionIds.map((id) => `objectID:"${id}"`).join(' OR '),
                hitsPerPage: packData.selectedQuestionIds.length,
              },
            },
          ]);

          const fetchedQuestions = response.results[0].hits;

          if (fetchedQuestions.length === 0) {
            setError('No questions found for this pack');
            setLoading(false);
            return;
          }

          // Sort questions to match the original order
          const sortedQuestions = packData.selectedQuestionIds
            .map((id) => fetchedQuestions.find((q) => q.objectID === id))
            .filter(Boolean);

          setQuestions(sortedQuestions);
        } catch (algoliaError) {
          console.error('Error fetching questions from Algolia:', algoliaError);
          setError('Failed to load questions. Please try again.');
          setLoading(false);
          return;
        }
      } else {
        setError('This pack has no questions');
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error loading pack:', error);
      setError('Failed to load pack: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = () => {
    if (questions.length === 0) {
      alert('No questions available to practice');
      return;
    }
    setShowQuiz(true);
  };

  const handleQuizComplete = (results) => {
    console.log('Quiz completed:', results);
    setShowQuiz(false);
    // You can add more completion logic here (e.g., show results summary, navigate somewhere)
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Get subject configuration
  const subjectConfig = pack ? SUBJECTS[pack.subject] : null;

  // Calculate estimated time
  const getEstimatedTime = () => {
    if (!subjectConfig || !questions.length) return 0;
    return Math.ceil(questions.length * subjectConfig.avgTimePerQuestion);
  };

  // Get question types for preview
  const getQuestionTypes = () => {
    if (!pack || !questions.length) return [];
    
    if (pack.subject === 'tsa') {
      return [...new Set(questions.map(q => q.question_type).filter(Boolean))];
    } else if (pack.subject === 'maths') {
      return [...new Set(questions.map(q => q.question_topic).filter(Boolean))];
    }
    return [];
  };

  // Get years for preview
  const getYears = () => {
    if (!questions.length) return [];
    
    if (pack?.subject === 'tsa') {
      return [...new Set(questions.map(q => q.year).filter(Boolean))];
    } else if (pack?.subject === 'maths') {
      return [...new Set(questions.map(q => q.id ? q.id.split('_')[0] : null).filter(Boolean))];
    }
    return [];
  };

  // Show quiz if it's active
  if (showQuiz && pack && questions.length > 0) {
    return (
      <InteractiveQuiz
        packData={pack}
        questions={questions}
        onClose={handleQuizClose}
        onComplete={handleQuizComplete}
        reviewMode={false}
      />
    );
  }

  if (loading) {
    return (
      <div className="practice-page">
        <div className="practice-container">
          <div className="loading-container">
            <div className="loading-spinner" />
            <h2>Loading Practice Session...</h2>
            <p>Preparing your questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practice-page">
        <div className="practice-container">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Unable to Load Practice Session</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button onClick={() => navigate('/profile')} className="btn-primary">
                ← Back to Profile
              </button>
              <button onClick={loadPack} className="btn-secondary">
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="practice-page">
        <div className="practice-container">
          <div className="error-container">
            <div className="error-icon">📦</div>
            <h2>Pack Not Found</h2>
            <p>The requested pack could not be found.</p>
            <div className="error-actions">
              <button onClick={() => navigate('/profile')} className="btn-primary">
                ← Back to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-page">
      <div className="practice-container">
        {/* Back button */}
        <div className="practice-header">
          <button onClick={() => navigate('/profile')} className="back-button">
            ← Back to Profile
          </button>
        </div>

        {/* Pack Header */}
        <div className="pack-header-card">
          <div className="pack-header-content">
            <div className="pack-icon">{subjectConfig?.icon || '🎯'}</div>
            <h1 className="pack-title">{pack.packName}</h1>
            <p className="pack-subtitle">
              {subjectConfig?.displayName || pack.subject.toUpperCase()} • {questions.length} Questions
            </p>
            <p className="pack-meta">
              Pack ID: {pack.packId} • Created: {formatDate(pack.createdAt)}
            </p>
          </div>
        </div>

        {/* Practice Stats */}
        <div className="practice-stats">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-number">{questions.length}</div>
              <div className="stat-label">Questions</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-number">~{getEstimatedTime()}</div>
              <div className="stat-label">Minutes</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">{subjectConfig?.icon || '📚'}</div>
            <div className="stat-content">
              <div className="stat-number">{pack.subject.toUpperCase()}</div>
              <div className="stat-label">Subject</div>
            </div>
          </div>

          {/* Additional stats for Maths */}
          {pack.subject === 'maths' && (
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-number">
                  {questions.reduce((total, q) => total + (parseInt(q.marks) || 0), 0)}
                </div>
                <div className="stat-label">Total Marks</div>
              </div>
            </div>
          )}
        </div>

        {/* Question Preview */}
        <div className="question-preview-section">
          <h3>Content in This Pack:</h3>
          
          {/* Question Types/Topics */}
          {getQuestionTypes().length > 0 && (
            <div className="question-types">
              <h4>{pack.subject === 'tsa' ? 'Question Types:' : 'Topics:'}</h4>
              <div className="type-badges">
                {getQuestionTypes().map((type, index) => (
                  <span key={index} className="question-type-badge">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Years */}
          {getYears().length > 0 && (
            <div className="question-years">
              <h4>Years:</h4>
              <div className="year-badges">
                {getYears().map((year, index) => (
                  <span key={index} className="question-year-badge">
                    {year}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Maths-specific information */}
          {pack.subject === 'maths' && (
            <div className="maths-info">
              <h4>Exam Types:</h4>
              <div className="exam-badges">
                {[...new Set(questions.map(q => q.id ? q.id.split('_')[1] : null).filter(Boolean))].map((examCode, index) => (
                  <span key={index} className="exam-type-badge">
                    {examCode}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="practice-actions">
          <button 
            onClick={handleStartPractice} 
            className="start-practice-button"
            disabled={questions.length === 0}
          >
            <span className="button-icon">🚀</span>
            Start Practice Session
          </button>
          
          <div className="secondary-actions">
            <button onClick={() => navigate(`/pack/${packId}`)} className="view-pack-button">
              📖 View Pack Details
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="practice-instructions">
          <h4>How Practice Mode Works:</h4>
          <ul>
            <li>Answer all {questions.length} questions at your own pace</li>
            <li>Navigate between questions freely</li>
            {pack.subject === 'tsa' && (
              <>
                <li>Choose the best answer from multiple choice options</li>
                <li>See instant feedback on correct/incorrect answers</li>
              </>
            )}
            {pack.subject === 'maths' && (
              <>
                <li>Show your working and provide final answers</li>
                <li>Review model solutions after completion</li>
              </>
            )}
            <li>Track your progress and performance</li>
            <li>Review detailed explanations and solutions</li>
          </ul>
          
          {/* Subject-specific tips */}
          {pack.subject === 'tsa' && (
            <div className="subject-tips">
              <h4>TSA Tips:</h4>
              <ul>
                <li>Read the passage carefully before answering</li>
                <li>Look for key words and logical connectors</li>
                <li>Eliminate obviously wrong answers first</li>
                <li>Consider what the question is really asking</li>
              </ul>
            </div>
          )}
          
          {pack.subject === 'maths' && (
            <div className="subject-tips">
              <h4>Maths Tips:</h4>
              <ul>
                <li>Show all your working clearly</li>
                <li>Check your answers make sense</li>
                <li>Use appropriate mathematical notation</li>
                <li>State any assumptions you make</li>
              </ul>
            </div>
          )}
        </div>

        {/* Practice Stats Summary */}
        <div className="practice-summary">
          <div className="summary-card">
            <h4>What to Expect:</h4>
            <div className="expectation-list">
              <div className="expectation-item">
                <span className="expectation-icon">📊</span>
                <span>Detailed performance breakdown</span>
              </div>
              <div className="expectation-item">
                <span className="expectation-icon">⏰</span>
                <span>Time tracking and analysis</span>
              </div>
              <div className="expectation-item">
                <span className="expectation-icon">🎯</span>
                <span>Question-by-question review</span>
              </div>
              {pack.subject === 'tsa' && (
                <div className="expectation-item">
                  <span className="expectation-icon">💡</span>
                  <span>Correct answer explanations</span>
                </div>
              )}
              {pack.subject === 'maths' && (
                <div className="expectation-item">
                  <span className="expectation-icon">📝</span>
                  <span>Model solutions and marking</span>
                </div>
              )}
              <div className="expectation-item">
                <span className="expectation-icon">🎥</span>
                <span>Video solutions (where available)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeMode;