import React, { useState, useEffect } from 'react';

const PersonalStatementBuilder = ({ profile, currentSubjects, universityTargets, onClose }) => {
  const [activeSection, setActiveSection] = useState('evidence-picker');
  const [selectedEvidence, setSelectedEvidence] = useState({
    books: [],
    insights: [],
    projects: [],
    activities: [],
    lectures: [],
    moocs: []
  });
  const [generatedStatement, setGeneratedStatement] = useState('');
  const [statementVersion, setStatementVersion] = useState('universal');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [scoringAnalysis, setScoringAnalysis] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [targetCourse, setTargetCourse] = useState('');

  // Extract all available evidence
  const supercurricular = profile?.supercurricular || {};
  const highLevelProjects = supercurricular.highLevel || [];
  const mediumLevelActivities = supercurricular.mediumLevel || [];
  const lowLevelActivities = supercurricular.lowLevel || {};
  const books = lowLevelActivities.books || [];
  const lectures = lowLevelActivities.lectures || [];
  const moocs = lowLevelActivities.moocs || [];
  const insights = profile?.knowledgeInsights || profile?.insights || [];

  // Calculate word and character counts
  useEffect(() => {
    const words = generatedStatement.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(generatedStatement.length);
  }, [generatedStatement]);

  // Get university-specific recommendations
  const getUniversitySpecificRecommendations = (targetUni) => {
    const course = targetUni?.course?.toLowerCase() || '';
    const university = targetUni?.name?.toLowerCase() || '';
    
    const recommendations = {
      structure: '',
      emphasize: [],
      avoid: [],
      keyQualities: []
    };

    // Oxford/Cambridge specific
    if (university.includes('oxford') || university.includes('cambridge')) {
      recommendations.structure = 'Academic depth over breadth - show intellectual curiosity and independent thinking';
      recommendations.emphasize = ['Academic reading beyond syllabus', 'Independent research', 'Critical thinking'];
      recommendations.avoid = ['Generic volunteering', 'Basic work experience', 'Popular science only'];
      recommendations.keyQualities = ['Tutorial readiness', 'Intellectual maturity', 'Academic passion'];
    }
    
    // Economics/PPE specific
    if (course.includes('economics') || course.includes('ppe')) {
      recommendations.structure = 'Start with economic curiosity, show analytical progression, connect theory to real world';
      recommendations.emphasize = ['Economic theory understanding', 'Data analysis skills', 'Current affairs engagement'];
      recommendations.avoid = ['Surface-level current events', 'Business-focused content', 'Generic math skills'];
      recommendations.keyQualities = ['Analytical thinking', 'Quantitative skills', 'Policy awareness'];
    }
    
    // STEM subjects
    if (course.includes('engineering') || course.includes('computer science') || course.includes('physics')) {
      recommendations.structure = 'Problem-solving focus, technical depth, practical application';
      recommendations.emphasize = ['Technical projects', 'Mathematical rigor', 'Innovation mindset'];
      recommendations.avoid = ['Generic STEM content', 'Popular technology trends', 'Basic coding mentions'];
      recommendations.keyQualities = ['Problem-solving', 'Technical curiosity', 'Engineering mindset'];
    }
    
    return recommendations;
  };

  // Evidence scoring system
  const scoreEvidence = (evidence, type) => {
    let score = 0;
    
    // Academic level appropriateness
    if (evidence.universityLevel || evidence.academic) score += 3;
    if (evidence.beyondCurriculum) score += 2;
    
    // Specificity
    if (evidence.specificConcepts || evidence.technicalTerms) score += 2;
    if (evidence.concreteExamples) score += 1;
    
    // Personal connection
    if (evidence.personalReflection || evidence.insight) score += 2;
    if (evidence.growthShown) score += 1;
    
    // Relevance to target
    universityTargets?.forEach(uni => {
      const course = uni.course?.toLowerCase() || '';
      if (evidence.subject?.toLowerCase().includes(course) || 
          evidence.relevantTo?.includes(course)) {
        score += 2;
      }
    });
    
    return Math.min(score, 10);
  };

  // AI-powered statement generation (simulation)
  const generatePersonalStatement = async () => {
    setIsGenerating(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const selectedBooks = books.filter(book => selectedEvidence.books.includes(book.title));
    const selectedInsights = insights.filter((insight, idx) => selectedEvidence.insights.includes(idx));
    const selectedProjects = highLevelProjects.filter(project => selectedEvidence.projects.includes(project.name));
    
    // Generate statement based on evidence and university target
    const targetUni = universityTargets?.[0] || {};
    const course = targetUni.course || 'your chosen field';
    
    const statement = `My fascination with ${course.toLowerCase()} began when ${selectedBooks[0] ? `reading '${selectedBooks[0].title}'` : 'encountering a challenging concept in class'}. ${selectedInsights[0] ? selectedInsights[0].learning : 'This initial spark of curiosity led me to explore the field more deeply.'} The way ${selectedInsights[0]?.concept || 'complex systems'} ${selectedInsights[0]?.connection || 'interconnect and influence real-world outcomes'} immediately captured my imagination.

Determined to understand these concepts more rigorously, I ${selectedBooks.length > 0 ? `immersed myself in academic literature, particularly ${selectedBooks.map(b => `'${b.title}'`).join(' and ')}` : 'began systematic self-study through university-level resources'}. ${selectedInsights[1] ? selectedInsights[1].learning : 'Through this reading, I discovered the mathematical elegance underlying seemingly chaotic systems.'} This academic foundation proved invaluable when I ${selectedProjects[0] ? `undertook ${selectedProjects[0].name}` : 'began my first independent research project'}.

${selectedProjects[0] ? `Working on ${selectedProjects[0].name} taught me ${selectedProjects[0].description || 'the importance of systematic methodology in academic inquiry'}. I found myself particularly drawn to ${selectedProjects[0].technicalSkills || 'the analytical challenges involved'}.` : 'My practical engagement with the subject has reinforced my theoretical understanding.'} ${lectures.length > 0 ? `Attending lectures on ${lectures[0]?.title || 'advanced topics'} further expanded my perspective, particularly regarding ${lectures[0]?.insight || 'current research directions'}.` : ''}

${selectedInsights[2] ? selectedInsights[2].application : 'These experiences have convinced me that university study will provide the rigorous academic environment necessary for deeper exploration.'} I am particularly eager to ${targetUni.modules?.year1Core?.length > 0 ? `study modules such as ${targetUni.modules.year1Core[0]}` : 'engage with cutting-edge research in the field'}, and I hope to contribute to ${targetUni.department?.research?.length > 0 ? targetUni.department.research[0] : 'ongoing academic discourse'} during my degree studies.

My goal is to ${universityTargets?.[0]?.career || 'pursue advanced research'} where I can apply the analytical skills and theoretical knowledge I am developing. The combination of my current foundation and future university study will prepare me to tackle the complex challenges facing ${course.toLowerCase()} in the coming decades.`;

    setGeneratedStatement(statement);
    
    // Generate scoring analysis
    const scoring = analyzeStatement(statement);
    setScoringAnalysis(scoring);
    
    setIsGenerating(false);
  };

  // OpenAI-powered statement analysis
  const analyzeStatementWithAI = async (statement) => {
    if (!statement || statement.trim().length < 100) {
      setAnalysisError('Statement must be at least 100 characters long for analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statement: statement,
          targetCourse: targetCourse,
          wordCount: wordCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const analysis = await response.json();
      setScoringAnalysis(analysis);
      setActiveSection('detailed-feedback');
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error.message || 'Failed to analyze statement. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Legacy dummy analysis for backward compatibility
  const analyzeStatement = (statement) => {
    const analysis = {
      academicCriteria: 8.5,
      intellectualQualities: 8.0,
      subjectEngagement: 8.5,
      communicationStructure: 9.0,
      personalDevelopment: 4.0,
      factualAccuracy: 5.0,
      overallScore: 8.2,
      strengths: [
        'Strong academic engagement with university-level content',
        'Clear intellectual progression and development',
        'Specific evidence and concrete examples',
        'Excellent narrative structure and flow'
      ],
      improvements: [
        'Could show more personal reflection on growth',
        'Consider adding more diverse evidence types',
        'Strengthen connection between activities and future goals'
      ],
      redFlags: [],
      grade: 'A - Strong university readiness demonstrated'
    };
    
    return analysis;
  };

  const EvidencePickerSection = () => (
    <div>
      <h4 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
        🎯 Evidence Selection for Personal Statement
      </h4>
      
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '2px solid #f59e0b'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '14px', fontWeight: '600' }}>
          📊 Evidence Quality Scoring Guide
        </h5>
        <div style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
          <strong>High Value:</strong> University-level content, specific concepts, personal insights<br/>
          <strong>Medium Value:</strong> A-level+ material, analytical thinking, concrete examples<br/>
          <strong>Low Value:</strong> Generic activities, surface-level engagement, no reflection
        </div>
      </div>

      {/* Books Evidence */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.5)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #a8dcc6'
      }}>
        <h5 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
          📚 Academic Reading Evidence ({books.length} available)
        </h5>
        
        {books.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {books.map((book, index) => {
              const score = scoreEvidence(book, 'book');
              const isSelected = selectedEvidence.books.includes(book.title);
              
              return (
                <div key={index} style={{
                  background: isSelected ? '#dcfce7' : '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const newBooks = isSelected 
                    ? selectedEvidence.books.filter(title => title !== book.title)
                    : [...selectedEvidence.books, book.title];
                  setSelectedEvidence(prev => ({ ...prev, books: newBooks }));
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h6 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '14px', fontWeight: '600' }}>
                        {book.title}
                      </h6>
                      {book.author && (
                        <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px' }}>
                          by {book.author}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{
                        background: score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#ef4444',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        Score: {score}/10
                      </div>
                      
                      {isSelected && (
                        <span style={{
                          background: '#10b981',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          ✓ SELECTED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
            No books available. Add books through your reading tracker first.
          </p>
        )}
      </div>

      {/* Insights Evidence */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.5)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #a8dcc6'
      }}>
        <h5 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
          💡 Learning Insights ({insights.length} available)
        </h5>
        
        {insights.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((insight, index) => {
              const score = scoreEvidence(insight, 'insight');
              const isSelected = selectedEvidence.insights.includes(index);
              
              return (
                <div key={index} style={{
                  background: isSelected ? '#dcfce7' : '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const newInsights = isSelected 
                    ? selectedEvidence.insights.filter(idx => idx !== index)
                    : [...selectedEvidence.insights, index];
                  setSelectedEvidence(prev => ({ ...prev, insights: newInsights }));
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h6 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '14px', fontWeight: '600' }}>
                        {insight.title || insight.concept || 'Learning Insight'}
                      </h6>
                      <p style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '13px', lineHeight: '1.4' }}>
                        {insight.learning || insight.description || insight.insight}
                      </p>
                      
                      {insight.source && (
                        <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
                          <strong>Source:</strong> {insight.source}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{
                        background: score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#ef4444',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        Score: {score}/10
                      </div>
                      
                      {isSelected && (
                        <span style={{
                          background: '#10b981',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          ✓ SELECTED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
            No insights available. Share your learning with your study buddy to build insights.
          </p>
        )}
      </div>

      {/* Generate Button */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center',
        border: '1px solid #8b5cf6'
      }}>
        <h5 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '16px', fontWeight: '600' }}>
          Ready to Generate Your Personal Statement?
        </h5>
        <p style={{ margin: '0 0 16px 0', color: 'white', fontSize: '13px', opacity: '0.9' }}>
          Selected: {selectedEvidence.books.length} books, {selectedEvidence.insights.length} insights, {selectedEvidence.projects.length} projects
        </p>
        
        <button
          onClick={generatePersonalStatement}
          disabled={selectedEvidence.books.length === 0 && selectedEvidence.insights.length === 0 && selectedEvidence.projects.length === 0}
          style={{
            background: 'white',
            color: '#8b5cf6',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '600',
            opacity: (selectedEvidence.books.length === 0 && selectedEvidence.insights.length === 0 && selectedEvidence.projects.length === 0) ? '0.5' : '1'
          }}
        >
          Generate Personal Statement
        </button>
      </div>
    </div>
  );

  const StatementViewerSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
          📝 Generated Personal Statement
        </h4>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            background: wordCount > 4000 ? '#fef2f2' : wordCount > 3500 ? '#fef3c7' : '#f0f9ff',
            color: wordCount > 4000 ? '#dc2626' : wordCount > 3500 ? '#d97706' : '#2563eb',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {wordCount}/4,000 characters
          </div>
        </div>
      </div>

      {isGenerating ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.5)',
          padding: '60px 20px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <h5 style={{ margin: '0 0 8px 0', color: '#111827' }}>Generating Your Personal Statement</h5>
          <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
            Analyzing your evidence and creating a compelling narrative...
          </p>
        </div>
      ) : generatedStatement ? (
        <div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #a8dcc6',
            marginBottom: '20px'
          }}>
            <textarea
              value={generatedStatement}
              onChange={(e) => setGeneratedStatement(e.target.value)}
              style={{
                width: '100%',
                minHeight: '400px',
                border: 'none',
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'inherit',
                resize: 'vertical',
                background: 'transparent',
                color: '#374151',
                boxSizing: 'border-box'
              }}
              placeholder="Your generated personal statement will appear here..."
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <button style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              Regenerate Version
            </button>
            <button style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              Export to Word
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.5)',
          padding: '40px 20px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <p style={{ margin: '0', color: '#6b7280' }}>
            Select evidence and generate your personal statement to view it here
          </p>
        </div>
      )}
    </div>
  );

  const ScoringAnalysisSection = () => (
    <div>
      <h4 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
        📊 Personal Statement Analysis
      </h4>

      {scoringAnalysis ? (
        <div>
          <div style={{
            background: scoringAnalysis.overallScore >= 8 ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 
                       scoringAnalysis.overallScore >= 6 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' :
                       'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: `2px solid ${
              scoringAnalysis.overallScore >= 8 ? '#10b981' : 
              scoringAnalysis.overallScore >= 6 ? '#f59e0b' : '#ef4444'
            }`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '24px', 
                  fontWeight: '700',
                  color: scoringAnalysis.overallScore >= 8 ? '#059669' : 
                         scoringAnalysis.overallScore >= 6 ? '#d97706' : '#dc2626'
                }}>
                  {scoringAnalysis.overallScore}/10
                </h3>
                <p style={{ 
                  margin: '0', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: scoringAnalysis.overallScore >= 8 ? '#059669' : 
                         scoringAnalysis.overallScore >= 6 ? '#d97706' : '#dc2626'
                }}>
                  {scoringAnalysis.grade}
                </p>
              </div>
              <div style={{
                background: scoringAnalysis.overallScore >= 8 ? '#059669' : 
                           scoringAnalysis.overallScore >= 6 ? '#d97706' : '#dc2626',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                {scoringAnalysis.overallScore >= 9 ? 'EXCEPTIONAL' :
                 scoringAnalysis.overallScore >= 7.5 ? 'STRONG' :
                 scoringAnalysis.overallScore >= 6 ? 'ADEQUATE' :
                 scoringAnalysis.overallScore >= 4.5 ? 'WEAK' : 'POOR'}
              </div>
            </div>
          </div>

          <div style={{
            background: '#dcfce7',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '1px solid #10b981'
          }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#059669', fontSize: '14px', fontWeight: '600' }}>
              ✅ Strengths
            </h5>
            <ul style={{ margin: '0', paddingLeft: '16px', color: '#059669' }}>
              {scoringAnalysis.strengths.map((strength, index) => (
                <li key={index} style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '4px' }}>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div style={{
            background: '#fef3c7',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #f59e0b'
          }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#d97706', fontSize: '14px', fontWeight: '600' }}>
              🔄 Areas for Improvement
            </h5>
            <ul style={{ margin: '0', paddingLeft: '16px', color: '#d97706' }}>
              {scoringAnalysis.improvements.map((improvement, index) => (
                <li key={index} style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '4px' }}>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.5)',
          padding: '40px 20px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p style={{ margin: '0', color: '#6b7280' }}>
            Generate a personal statement to see detailed scoring analysis
          </p>
        </div>
      )}
    </div>
  );

  // Helper functions for scoring and colors
  const getScoreColor = (score) => {
    if (score >= 9) return '#10b981';
    if (score >= 7.5) return '#00ced1';
    if (score >= 6) return '#f59e0b';
    if (score >= 4.5) return '#fb923c';
    return '#ef4444';
  };

  const getCharCountColor = () => {
    if (charCount > 4000) return '#ef4444';
    if (charCount > 3800) return '#f59e0b';
    if (charCount > 3000) return '#10b981';
    return '#6b7280';
  };

  // AI Analysis Section
  const AIAnalysisSection = () => (
    <div>
      <h4 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
        🤖 University-Level AI Analysis
      </h4>

      {/* Target Course Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Target Course (for specialized analysis)
        </label>
        <select
          value={targetCourse}
          onChange={(e) => setTargetCourse(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="">Select target course</option>
          <option value="Economics">Economics</option>
          <option value="Philosophy, Politics and Economics">Philosophy, Politics and Economics (PPE)</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Engineering">Engineering</option>
          <option value="Medicine">Medicine</option>
          <option value="Law">Law</option>
          <option value="Psychology">Psychology</option>
          <option value="Philosophy">Philosophy</option>
          <option value="History">History</option>
          <option value="English Literature">English Literature</option>
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
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Personal Statement
          </label>
          <span style={{
            fontSize: '12px',
            color: getCharCountColor(),
            fontWeight: '500'
          }}>
            {wordCount} words • {charCount}/4,000 characters
          </span>
        </div>
        <textarea
          value={generatedStatement}
          onChange={(e) => setGeneratedStatement(e.target.value)}
          placeholder="Paste your personal statement here for comprehensive AI analysis..."
          style={{
            width: '100%',
            height: '300px',
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${charCount > 4000 ? '#ef4444' : '#d1d5db'}`,
            fontSize: '14px',
            lineHeight: '1.6',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {analysisError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          {analysisError}
        </div>
      )}

      <div style={{
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #a8dcc6'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
        <h5 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '12px'
        }}>
          Professional University Analysis
        </h5>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          Get detailed feedback using the same standards as top UK universities. Analysis includes specific quotes from your statement and targeted improvement suggestions.
        </p>

        <button
          onClick={() => analyzeStatementWithAI(generatedStatement)}
          disabled={isAnalyzing || !generatedStatement.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: isAnalyzing ? '#6b7280' : '#00ced1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isAnalyzing || !generatedStatement.trim() ? 'not-allowed' : 'pointer',
            opacity: isAnalyzing || !generatedStatement.trim() ? 0.6 : 1,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            margin: '0 auto'
          }}
        >
          {isAnalyzing ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Analyzing with AI...
            </>
          ) : (
            <>
              <span>🔍</span>
              Analyze with AI (~$0.01)
            </>
          )}
        </button>

        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          marginTop: '8px'
        }}>
          Analysis typically takes 15-30 seconds
        </div>
      </div>
    </div>
  );

  // Detailed Feedback Section
  const DetailedFeedbackSection = () => {
    if (!scoringAnalysis || !scoringAnalysis.detailedFeedback) {
      return (
        <div>
          <h4 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
            📊 Detailed Feedback Results
          </h4>
          <div style={{
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '40px 20px',
            borderRadius: '12px',
            border: '1px solid #a8dcc6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <p style={{ margin: '0', color: '#6b7280' }}>
              Run an AI analysis first to see detailed feedback here.
            </p>
          </div>
        </div>
      );
    }

    const { detailedFeedback, strengths, improvements, redFlags, overallScore, grade } = scoringAnalysis;

    return (
      <div>
        <h4 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
          📊 Detailed Analysis Results
        </h4>

        {/* Overall Score Header */}
        <div style={{
          background: `linear-gradient(135deg, ${getScoreColor(overallScore)}20, ${getScoreColor(overallScore)}10)`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: `1px solid ${getScoreColor(overallScore)}40`,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '36px',
            fontWeight: '700',
            color: getScoreColor(overallScore),
            marginBottom: '8px'
          }}>
            {overallScore.toFixed(1)}/10
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px'
          }}>
            {grade}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {wordCount} words • {charCount} characters
          </div>
        </div>

        {/* Red Flags */}
        {redFlags && redFlags.length > 0 && (
          <div style={{
            background: '#fef2f2',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #fecaca'
          }}>
            <h5 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#dc2626',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ Issues Identified
            </h5>
            {redFlags.map((flag, index) => (
              <div key={index} style={{
                padding: '10px',
                background: 'white',
                borderRadius: '6px',
                marginBottom: '8px',
                borderLeft: `3px solid ${flag.severity === 'major' ? '#dc2626' : '#f59e0b'}`
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  {flag.severity === 'major' ? '🚨 Major Issue' : '⚠️ Minor Issue'} ({flag.impact} points)
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {flag.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Criteria Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {Object.entries(detailedFeedback).map(([criterion, data]) => (
            <div key={criterion} style={{
              background: 'white',
              borderRadius: '8px',
              padding: '16px',
              border: `1px solid ${getScoreColor(data.score)}40`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <h5 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  margin: 0,
                  textTransform: 'capitalize'
                }}>
                  {criterion.replace(/([A-Z])/g, ' $1').trim()}
                </h5>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: getScoreColor(data.score),
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: `${getScoreColor(data.score)}20`
                }}>
                  {data.score.toFixed(1)}
                </div>
              </div>

              {/* Sub-scores */}
              {data.subScores && (
                <div style={{ marginBottom: '10px' }}>
                  {Object.entries(data.subScores).map(([subCriterion, score]) => (
                    <div key={subCriterion} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: '#6b7280',
                      marginBottom: '2px'
                    }}>
                      <span>{subCriterion.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span style={{ fontWeight: '600' }}>{score}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                fontSize: '12px',
                color: '#374151',
                lineHeight: '1.4'
              }}>
                {data.feedback}
              </div>
            </div>
          ))}
        </div>

        {/* Strengths and Improvements */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Strengths */}
          <div>
            <h5 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              ✅ Key Strengths
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {strengths.map((strength, index) => (
                <div key={index} style={{
                  padding: '10px',
                  background: '#f0fdf4',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#374151',
                  borderLeft: '3px solid #10b981'
                }}>
                  {strength}
                </div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div>
            <h5 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#f59e0b',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              💡 Areas for Improvement
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {improvements.map((improvement, index) => (
                <div key={index} style={{
                  padding: '10px',
                  background: '#fffbeb',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#374151',
                  borderLeft: '3px solid #f59e0b'
                }}>
                  {improvement}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0', color: '#111827', fontSize: '20px', fontWeight: '600' }}>
          Personal Statement Builder
        </h3>
      </div>

      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.3)',
        padding: '4px',
        marginBottom: '20px',
        borderRadius: '8px',
        border: '1px solid #a8dcc6'
      }}>
        {[
          { id: 'evidence-picker', label: '🎯 Evidence', desc: 'Select your best content' },
          { id: 'statement-viewer', label: '📝 Statement', desc: 'Generate & edit drafts' },
          { id: 'ai-analysis', label: '🤖 AI Analysis', desc: 'OpenAI-powered feedback' },
          { id: 'detailed-feedback', label: '📊 Detailed Results', desc: 'Comprehensive breakdown' }
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: activeSection === section.id ? '#2a4442' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== section.id) {
                e.target.style.background = '#5b8f8a';
                e.target.querySelector('.label').style.color = '#ffffff';
                e.target.querySelector('.desc').style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== section.id) {
                e.target.style.background = 'transparent';
                e.target.querySelector('.label').style.color = '#2a4442';
                e.target.querySelector('.desc').style.color = '#6b7280';
              }
            }}
          >
            <div 
              className="label"
              style={{
                fontWeight: '500',
                fontSize: '13px',
                color: activeSection === section.id ? '#ffffff' : '#2a4442',
                marginBottom: '2px'
              }}
            >
              {section.label}
            </div>
            <div 
              className="desc"
              style={{
                fontSize: '11px',
                color: activeSection === section.id ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'
              }}
            >
              {section.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ minHeight: '500px' }}>
        {activeSection === 'evidence-picker' && <EvidencePickerSection />}
        {activeSection === 'statement-viewer' && <StatementViewerSection />}
        {activeSection === 'ai-analysis' && <AIAnalysisSection />}
        {activeSection === 'detailed-feedback' && <DetailedFeedbackSection />}
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PersonalStatementBuilder;