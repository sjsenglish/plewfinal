import React, { useState } from 'react';

const DemoPackCreation = ({ onComplete, questions, packData }) => {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  const handleQuestionToggle = (question) => {
    if (selectedQuestions.some(q => q.objectID === question.objectID)) {
      setSelectedQuestions(prev => prev.filter(q => q.objectID !== question.objectID));
    } else if (selectedQuestions.length < 3) {
      setSelectedQuestions(prev => [...prev, question]);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Auto-select all questions for demo
      setSelectedQuestions(questions);
      setCurrentStep(2);
    } else {
      onComplete({ selectedQuestions });
    }
  };

  const getQuestionPreview = (question) => {
    return question.question || question.question_content || 'TSA Question';
  };

  return (
    <div className="demo-pack-creation">
      <div className="demo-explanation">
        <h2>Demo: Create a Question Pack</h2>
        <p>In real mode, you'd filter from all TSA questions. For this demo, we've pre-selected 3 great questions!</p>
      </div>

      {currentStep === 1 && (
        <div className="demo-selection">
          <h3>Available Demo Questions:</h3>
          <div className="demo-questions">
            {questions.map((question, index) => {
              const isSelected = selectedQuestions.some(q => q.objectID === question.objectID);
              
              return (
                <div 
                  key={question.objectID} 
                  className={`demo-question-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleQuestionToggle(question)}
                >
                  <div className="question-header">
                    <div className="question-checkbox">
                      {isSelected && '✓'}
                    </div>
                    <div className="question-meta">
                      <span className="question-num">Q{index + 1}</span>
                      <span className="question-year">{question.year}</span>
                    </div>
                  </div>
                  
                  <div className="question-preview">
                    <strong>Question:</strong> {String(getQuestionPreview(question) || '').substring(0, 100)}...
                  </div>
                  
                  <div className="question-tags">
                    <span className="question-type">{question.question_type}</span>
                    {question.sub_types && (
                      <span className="question-subtype">{question.sub_types[0]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            onClick={handleNextStep} 
            className="demo-next-btn"
            disabled={selectedQuestions.length === 0}
          >
            {selectedQuestions.length === 0 ? 'Select questions above' : `✅ Use These Questions (${selectedQuestions.length}/3 selected)`}
          </button>
        </div>
      )}

      {currentStep === 2 && (
        <div className="demo-final">
          <h3>📚 Pack Ready!</h3>
          <div className="pack-summary">
            <h4>{packData.packName}</h4>
            <p>{selectedQuestions.length} TSA questions selected</p>
            <div className="selected-questions-preview">
              {selectedQuestions.map((q, index) => (
                <div key={q.objectID} className="mini-question">
                  Q{index + 1}: {q.question_type} - {q.year}
                </div>
              ))}
            </div>
            <p>Ready to take your quiz!</p>
          </div>
          <button onClick={handleNextStep} className="demo-start-quiz">
            🚀 Start Demo Quiz
          </button>
        </div>
      )}

      <style jsx>{`
        .demo-pack-creation {
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          margin-top: 20px;
        }

        .demo-explanation {
          text-align: center;
          margin-bottom: 40px;
        }

        .demo-explanation h2 {
          color: #00ced1;
          margin-bottom: 16px;
          font-size: 24px;
        }

        .demo-explanation p {
          color: #6b7280;
          font-size: 16px;
        }

        .demo-selection h3 {
          color: #374151;
          margin-bottom: 24px;
          font-size: 20px;
        }

        .demo-questions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .demo-question-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .demo-question-card:hover {
          border-color: #00ced1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 206, 209, 0.15);
        }

        .demo-question-card.selected {
          border-color: #00ced1;
          background: rgba(0, 206, 209, 0.05);
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .question-checkbox {
          width: 24px;
          height: 24px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: #00ced1;
          font-weight: 600;
        }

        .demo-question-card.selected .question-checkbox {
          border-color: #00ced1;
          background: #00ced1;
          color: white;
        }

        .question-meta {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .question-num {
          background: #f3f4f6;
          color: #374151;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .question-year {
          background: #dcfce7;
          color: #16a34a;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .question-preview {
          color: #374151;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .question-tags {
          display: flex;
          gap: 8px;
        }

        .question-type {
          background: #ddd6fe;
          color: #7c3aed;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .question-subtype {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .demo-next-btn {
          width: 100%;
          padding: 16px 24px;
          background: #00ced1;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .demo-next-btn:hover:not(:disabled) {
          background: #0891b2;
          transform: translateY(-2px);
        }

        .demo-next-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          transform: none;
        }

        .demo-final {
          text-align: center;
        }

        .demo-final h3 {
          color: #16a34a;
          font-size: 28px;
          margin-bottom: 24px;
        }

        .pack-summary {
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .pack-summary h4 {
          color: #374151;
          font-size: 24px;
          margin-bottom: 12px;
        }

        .pack-summary p {
          color: #6b7280;
          font-size: 16px;
          margin-bottom: 16px;
        }

        .selected-questions-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 16px 0;
        }

        .mini-question {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          color: #374151;
        }

        .demo-start-quiz {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .demo-start-quiz:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        @media (max-width: 768px) {
          .demo-pack-creation {
            padding: 20px;
            margin: 10px;
          }
          
          .question-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default DemoPackCreation;