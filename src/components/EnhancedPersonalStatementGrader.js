// Enhanced Personal Statement Grader Component
import React, { useState, useEffect } from 'react';
import { analyzePersonalStatement } from '../services/personalStatementAnalyzer';

const EnhancedPersonalStatementGrader = ({ onClose }) => {
  const [statement, setStatement] = useState('');
  const [targetCourse, setTargetCourse] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  // Color scheme matching the app
  const COLORS = {
    lightPurple: '#ccccff',
    teal: '#00ced1',
    lightTeal: '#d8f0ed',
    white: '#ffffff',
    gray: '#6b7280',
    darkGray: '#374151',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  useEffect(() => {
    setCharacterCount(statement.length);
  }, [statement]);

  const handleAnalyze = async () => {
    console.log('=== Personal Statement Grader Analysis Started ===');
    console.log('Statement length:', statement.length);
    console.log('Target course:', targetCourse);
    console.log('Statement preview:', statement.substring(0, 200) + '...');
    
    if (!statement.trim()) {
      alert('Please enter your personal statement first.');
      return;
    }

    if (statement.trim().length < 100) {
      alert('Personal statement must be at least 100 characters long.');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('Calling analyzePersonalStatement...');
      
      const result = await analyzePersonalStatement(statement, targetCourse);
      
      console.log('Analysis result received:', result);
      console.log('Overall score:', result?.overallScore);
      console.log('Using OpenAI:', result?.overallScore ? 'YES' : 'UNKNOWN');
      
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing statement:', error);
      console.error('Error details:', error.message);
      alert(`Error analyzing statement: ${error.message}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return COLORS.success;
    if (score >= 6) return COLORS.warning;
    return COLORS.error;
  };

  const getCharacterColor = () => {
    if (characterCount > 4000) return COLORS.error;
    if (characterCount > 3800) return COLORS.warning;
    if (characterCount > 3000) return COLORS.success;
    return COLORS.gray;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: COLORS.white,
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: `2px solid ${COLORS.lightTeal}`,
          paddingBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: COLORS.darkGray,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '28px' }}>📝</span>
            Personal Statement Grader
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              color: COLORS.gray,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
          >
            ×
          </button>
        </div>

        {!analysis ? (
          // Input Section
          <>
            {/* Course Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: COLORS.darkGray,
                marginBottom: '8px'
              }}>
                Target Course (Optional)
              </label>
              <select
                value={targetCourse}
                onChange={(e) => setTargetCourse(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '16px',
                  backgroundColor: COLORS.white
                }}
              >
                <option value="">Select a course for specialized analysis</option>
                <option value="economics">Economics</option>
                <option value="physics">Physics</option>
                <option value="mathematics">Mathematics</option>
                <option value="philosophy">Philosophy</option>
                <option value="psychology">Psychology</option>
                <option value="medicine">Medicine</option>
                <option value="law">Law</option>
                <option value="history">History</option>
                <option value="english">English Literature</option>
                <option value="engineering">Engineering</option>
                <option value="computer science">Computer Science</option>
              </select>
            </div>

            {/* Statement Input */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: COLORS.darkGray
                }}>
                  Your Personal Statement
                </label>
                <span style={{
                  fontSize: '14px',
                  color: getCharacterColor(),
                  fontWeight: '500'
                }}>
                  {characterCount}/4,000 characters
                </span>
              </div>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Paste your personal statement here for comprehensive analysis..."
                style={{
                  width: '100%',
                  height: '300px',
                  padding: '16px',
                  borderRadius: '8px',
                  border: `2px solid ${characterCount > 4000 ? COLORS.error : '#e5e7eb'}`,
                  fontSize: '16px',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !statement.trim()}
              style={{
                width: '100%',
                padding: '16px 24px',
                backgroundColor: isAnalyzing ? COLORS.gray : COLORS.teal,
                color: COLORS.white,
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: isAnalyzing || !statement.trim() ? 'not-allowed' : 'pointer',
                opacity: isAnalyzing || !statement.trim() ? 0.6 : 1,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              {isAnalyzing ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Analyzing Statement...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Analyze My Statement
                </>
              )}
            </button>
          </>
        ) : (
          // Results Section
          <div>
            {/* Overall Score */}
            <div style={{
              background: `linear-gradient(135deg, ${getScoreColor(analysis.overallScore)}20, ${getScoreColor(analysis.overallScore)}10)`,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              border: `2px solid ${getScoreColor(analysis.overallScore)}40`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: '700',
                color: getScoreColor(analysis.overallScore),
                marginBottom: '8px'
              }}>
                {analysis.insights.keyMetrics.gradeLetter}
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '600',
                color: COLORS.darkGray,
                marginBottom: '4px'
              }}>
                Overall Score: {analysis.overallScore}/10
              </div>
              <div style={{
                fontSize: '14px',
                color: COLORS.gray
              }}>
                {analysis.insights.keyMetrics.characterCount} characters • {analysis.insights.keyMetrics.sentenceCount} sentences
              </div>
            </div>

            {/* Key Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.success}40`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.success }}>
                  {analysis.insights.keyMetrics.academicTerms}
                </div>
                <div style={{ fontSize: '12px', color: COLORS.gray }}>Academic Terms</div>
              </div>
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.teal}40`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.teal }}>
                  {analysis.insights.keyMetrics.subjectTerms}
                </div>
                <div style={{ fontSize: '12px', color: COLORS.gray }}>Subject Terms</div>
              </div>
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.warning}40`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.warning }}>
                  {analysis.insights.keyMetrics.personalityTraits}
                </div>
                <div style={{ fontSize: '12px', color: COLORS.gray }}>Personality Traits</div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {/* Strengths */}
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: COLORS.success,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>✅</span> Strengths
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.insights.strengths.length > 0 ? analysis.insights.strengths.map((strength, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      background: `${COLORS.success}10`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: COLORS.darkGray,
                      borderLeft: `4px solid ${COLORS.success}`
                    }}>
                      {strength}
                    </div>
                  )) : (
                    <div style={{ fontSize: '14px', color: COLORS.gray, fontStyle: 'italic' }}>
                      No specific strengths identified
                    </div>
                  )}
                </div>
              </div>

              {/* Improvements */}
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: COLORS.warning,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>💡</span> Areas for Improvement
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.insights.improvements.length > 0 ? analysis.insights.improvements.map((improvement, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      background: `${COLORS.warning}10`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: COLORS.darkGray,
                      borderLeft: `4px solid ${COLORS.warning}`
                    }}>
                      {improvement}
                    </div>
                  )) : (
                    <div style={{ fontSize: '14px', color: COLORS.gray, fontStyle: 'italic' }}>
                      No specific improvements identified
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setAnalysis(null);
                  setStatement('');
                  setTargetCourse('');
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: COLORS.gray,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Analyze Another Statement
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: COLORS.teal,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* CSS Animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default EnhancedPersonalStatementGrader;