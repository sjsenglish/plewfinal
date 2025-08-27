import React, { useState, useEffect } from 'react';
import { userStorage } from '../utils/userStorage';

// Custom Color Palette
const COLORS = {
  mint: '#d8f0ed',
  darkGreen: '#2a4442',
  lavenderLight: '#e1dfff',
  purpleDark: '#221468',
  lavender: '#d4d0ff',
  teal: '#00ced1',
  mediumGreen: '#5b8f8a',
  mediumPurple: '#9691c4',
  navyBlue: '#1e3a8a',
  lightPurple: '#ccccff'
};

// Custom Icons
const ICONS = {
  trophy: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftrophy.svg?alt=media&token=ac0b5d6a-9b79-4cb4-afd2-0fa07f70d443',
  toaster: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftoaster.svg?alt=media&token=744ba4bf-336d-4dd2-b2dc-25bd4df85af6',
  ghost: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20white.svg?alt=media&token=599d4414-99cf-4084-858b-5b3512557023',
  bulb: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbulb.svg?alt=media&token=1f21ae0e-764d-4b03-ba1d-f1423329c325',
  bookYellow: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook_yellow.svg?alt=media&token=d951aa02-015d-45eb-9782-9ed989aa549c',
  bookPink: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook_pink.svg?alt=media&token=eca318d2-2785-4ffe-b806-e15381734a28',
  bagback: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbagback.svg?alt=media&token=65739e08-36db-4810-951c-91641f5d0084'
};

const EnhancedGoalsTab = ({ profile, currentSubjects, universityTargets }) => {
  const [activeSection, setActiveSection] = useState('subjects');
  
  // Simple todo list state
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [showAddTodoModal, setShowAddTodoModal] = useState(false);

  // Initialize todos from user-specific storage on component mount
  useEffect(() => {
    try {
      // Migrate existing data once
      userStorage.migrateExistingData(['todoList']);
      
      const savedTodos = userStorage.getItem('todoList', []);
      if (savedTodos.length > 0) {
        setTodos(Array.isArray(savedTodos) ? savedTodos : []);
      } else if (profile?.todoList) {
        // Fallback to profile data if no user storage data
        setTodos(Array.isArray(profile.todoList) ? profile.todoList : []);
      }
    } catch (error) {
      console.error('Error loading todos from user storage:', error);
      // Fallback to profile data if user storage fails
      setTodos(Array.isArray(profile?.todoList) ? profile.todoList : []);
    }
  }, [profile]);

  // Sample A-Level topic structures (you can update these later)
  const aLevelSyllabi = {
    "Mathematics": {
      "Pure Mathematics": [
        "Algebra & Functions", "Coordinate Geometry", "Sequences & Series", 
        "Trigonometry", "Exponentials & Logarithms", "Differentiation", 
        "Integration", "Numerical Methods", "Vectors"
      ],
      "Statistics": [
        "Data Collection", "Probability", "Binomial Distribution", 
        "Normal Distribution", "Hypothesis Testing"
      ],
      "Mechanics": [
        "Kinematics", "Forces & Newton's Laws", "Moments", 
        "Work Energy & Power", "Collisions"
      ]
    },
    "Economics": {
      "Microeconomics": [
        "Supply & Demand", "Market Failure", "Competition & Monopoly", 
        "Price Discrimination", "Labor Markets", "Externalities"
      ],
      "Macroeconomics": [
        "GDP & Economic Growth", "Inflation & Deflation", "Employment & Unemployment", 
        "Fiscal Policy", "Monetary Policy", "International Trade"
      ]
    },
    "Physics": {
      "Mechanics": [
        "Motion", "Forces", "Work Energy & Power", "Materials", "Waves"
      ],
      "Electricity": [
        "Current & Voltage", "Resistance", "DC Circuits", "Quantum Physics"
      ]
    },
    "Chemistry": {
      "Physical Chemistry": [
        "Atomic Structure", "Bonding", "Energetics", "Kinetics", "Equilibria"
      ],
      "Organic Chemistry": [
        "Alkanes", "Alkenes", "Alcohols", "Carbonyls", "Aromatic Chemistry"
      ],
      "Inorganic Chemistry": [
        "Periodicity", "Group 2", "Group 7", "Transition Metals"
      ]
    },
    "History": {
      "British History": [
        "Tudor England", "Stuart Britain", "Industrial Revolution", "20th Century Britain"
      ],
      "European History": [
        "French Revolution", "Napoleon", "German Unification", "Russian Revolution"
      ]
    },
    "Biology": {
      "Cell Biology": [
        "Cell Structure", "Biological Molecules", "Enzymes", "Cell Membranes"
      ],
      "Physiology": [
        "Gas Exchange", "Circulation", "Digestion", "Excretion"
      ],
      "Genetics": [
        "DNA & RNA", "Protein Synthesis", "Inheritance", "Evolution"
      ]
    }
  };

  // Extract progress data from profile - FIXED: Handle different data structures
  const subjectProgress = profile?.subjectProgress || {};
  const weeklyGoals = profile?.weeklyGoals || [];
  const readingGoals = profile?.readingGoals || {};
  const academicGoals = profile?.academicGoals || [];
  const gradeTargets = profile?.gradeTargets || {};
  
  // Calculate subject progress
  const calculateSubjectProgress = (subject) => {
    const subjectData = subjectProgress[subject] || {};
    const syllabusStructure = aLevelSyllabi[subject];
    
    if (!syllabusStructure) return { overall: 0, sections: [] };
    
    let totalTopics = 0;
    let completedTopics = 0;
    const sections = [];
    
    Object.entries(syllabusStructure).forEach(([section, topics]) => {
      let sectionCompleted = 0;
      topics.forEach(topic => {
        totalTopics++;
        const topicData = subjectData.topics?.[topic];
        if (topicData?.confidence === 'confident') {
          completedTopics++;
          sectionCompleted++;
        }
      });
      
      sections.push({
        name: section,
        progress: topics.length > 0 ? Math.round((sectionCompleted / topics.length) * 100) : 0,
        topics: topics.map(topic => ({
          name: topic,
          confidence: subjectData.topics?.[topic]?.confidence || 'not-started',
          lastUpdated: subjectData.topics?.[topic]?.lastUpdated
        }))
      });
    });
    
    return {
      overall: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      sections
    };
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'confident': return '#10b981';
      case 'need-to-revise': return '#f59e0b';
      case 'need-to-learn-again': return '#ef4444';
      default: return '#e5e7eb';
    }
  };

  const getConfidenceLabel = (confidence) => {
    switch (confidence) {
      case 'confident': return '😊 Confident';
      case 'need-to-revise': return '📚 Need to Revise';
      case 'need-to-learn-again': return '🔄 Need to Learn Again';
      default: return '⭕ Not Started';
    }
  };

  // Todo handlers
  const handleAddTodo = (todoText, dueDate = null) => {
    if (!todoText.trim()) return;
    
    const newTodoItem = {
      id: Date.now(),
      text: todoText,
      completed: false,
      dateAdded: new Date().toISOString(),
      dueDate: dueDate,
      category: 'general'
    };
    
    const updatedTodos = [...todos, newTodoItem];
    setTodos(updatedTodos);
    
    // Save to user-specific storage
    userStorage.setItem('todoList', updatedTodos);
    
    setNewTodo('');
    setShowAddTodoModal(false);
  };

  const handleToggleTodo = (todoId) => {
    const updatedTodos = todos.map(todo => {
      if (todo.id === todoId) {
        return { ...todo, completed: !todo.completed, completedDate: !todo.completed ? new Date().toISOString() : null };
      }
      return todo;
    });
    
    setTodos(updatedTodos);
    userStorage.setItem('todoList', updatedTodos);
  };

  const handleDeleteTodo = (todoId) => {
    const updatedTodos = todos.filter(todo => todo.id !== todoId);
    setTodos(updatedTodos);
    userStorage.setItem('todoList', updatedTodos);
  };

  // FIXED: Safe goal text extraction
  const getGoalText = (goal) => {
    if (typeof goal === 'string') return goal;
    if (typeof goal === 'object' && goal !== null) {
      return goal.title || goal.task || goal.goal || goal.text || 'Unnamed goal';
    }
    return 'Unnamed goal';
  };

  const OverviewSection = () => {
    // Calculate overall stats
    const totalSubjects = currentSubjects?.length || 0;
    const completedGoals = weeklyGoals.filter(goal => goal.completed).length;
    const totalGoals = weeklyGoals.length;
    const averageProgress = currentSubjects?.length > 0 
      ? Math.round(currentSubjects.reduce((sum, subject) => 
          sum + calculateSubjectProgress(subject.name || subject).overall, 0) / currentSubjects.length)
      : 0;

    return (
      <div>
        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: '#2a4442',
            color: 'white',
            padding: '24px 20px',
            borderRadius: '12px',
            textAlign: 'center',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600' }}>{averageProgress}%</h3>
            <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>Average Progress</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '24px 20px',
            borderRadius: '12px',
            border: '1px solid #a8dcc6',
            textAlign: 'center',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600', color: '#111827' }}>
              {completedGoals}/{totalGoals}
            </h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Goals Complete</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '24px 20px',
            borderRadius: '12px',
            border: '1px solid #a8dcc6',
            textAlign: 'center',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600', color: '#111827' }}>
              {Object.keys(readingGoals).length || 0}
            </h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Reading Goals</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '24px 20px',
            borderRadius: '12px',
            border: '1px solid #a8dcc6',
            textAlign: 'center',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600', color: '#111827' }}>
              {Object.keys(gradeTargets).length || totalSubjects}
            </h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Grade Targets</p>
          </div>
        </div>

        {/* Subject Progress Overview */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          marginBottom: '24px'
        }}>
          <h4 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
            📊 Subject Progress Overview
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(currentSubjects || []).map((subject, index) => {
              const subjectName = subject.name || subject;
              const progress = calculateSubjectProgress(subjectName);
              
              return (
                <div key={index} style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h5 style={{ margin: '0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                      {subjectName}
                    </h5>
                    <span style={{
                      background: progress.overall >= 70 ? '#10b981' : progress.overall >= 40 ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {progress.overall}% Complete
                    </span>
                  </div>
                  
                  <div style={{
                    background: '#e5e7eb',
                    height: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      background: progress.overall >= 70 ? '#10b981' : progress.overall >= 40 ? '#f59e0b' : '#ef4444',
                      height: '100%',
                      width: `${progress.overall}%`,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {progress.sections.length} sections • {gradeTargets[subjectName] || 'No target set'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Week Goals */}
        {weeklyGoals.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #a8dcc6'
          }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
              📅 This Week's Goals
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {weeklyGoals.slice(0, 5).map((goal, index) => (
                <div key={index} style={{
                  background: goal.completed ? '#f0fdf4' : '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  border: `1px solid ${goal.completed ? '#bbf7d0' : '#e2e8f0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: goal.completed ? '#10b981' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {goal.completed ? '✓' : ''}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0',
                      color: goal.completed ? '#059669' : '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      textDecoration: goal.completed ? 'line-through' : 'none'
                    }}>
                      {getGoalText(goal)}
                    </p>
                    
                    {goal.category && (
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        background: '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        display: 'inline-block'
                      }}>
                        {goal.category}
                      </span>
                    )}
                  </div>
                  
                  {goal.deadline && (
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      textAlign: 'right'
                    }}>
                      {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SubjectProgressSection = () => (
    <div>
      <h4 style={{ margin: '0 0 24px 0', color: '#111827', fontSize: '20px', fontWeight: '600' }}>
        📚 Subject Progress Tracking
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {(currentSubjects || []).map((subject, index) => {
          const subjectName = subject.name || subject;
          const progress = calculateSubjectProgress(subjectName);
          
          return (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #a8dcc6'
            }}>
              {/* Subject Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                    {subjectName} A-Level
                  </h5>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Overall Progress: {progress.overall}%
                    </span>
                    {gradeTargets[subjectName] && (
                      <span style={{
                        background: '#e1dfff',
                        color: '#221468',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Target: {gradeTargets[subjectName]}
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: `conic-gradient(${progress.overall >= 70 ? '#10b981' : progress.overall >= 40 ? '#f59e0b' : '#ef4444'} ${progress.overall * 3.6}deg, #e5e7eb 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {progress.overall}%
                  </div>
                </div>
              </div>

              {/* Subject Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {progress.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h6 style={{ margin: '0', color: '#111827', fontSize: '15px', fontWeight: '600' }}>
                        {section.name}
                      </h6>
                      <span style={{
                        background: section.progress >= 70 ? '#dcfce7' : section.progress >= 40 ? '#fef3c7' : '#fef2f2',
                        color: section.progress >= 70 ? '#166534' : section.progress >= 40 ? '#92400e' : '#dc2626',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {section.progress}%
                      </span>
                    </div>
                    
                    <div style={{
                      background: '#e5e7eb',
                      height: '6px',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        background: section.progress >= 70 ? '#10b981' : section.progress >= 40 ? '#f59e0b' : '#ef4444',
                        height: '100%',
                        width: `${section.progress}%`,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    {/* Topics Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '8px'
                    }}>
                      {section.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: `2px solid ${getConfidenceColor(topic.confidence)}`,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ color: '#374151', fontWeight: '500' }}>{topic.name}</span>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: getConfidenceColor(topic.confidence)
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {(!currentSubjects || currentSubjects.length === 0) && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>No subjects found</p>
          <p style={{ margin: '0', fontSize: '14px' }}>
            Tell your study buddy about your A-Level subjects to start tracking progress!
          </p>
        </div>
      )}
    </div>
  );

  const WeeklyGoalsSection = () => (
    <div>
      <h4 style={{ margin: '0 0 24px 0', color: '#111827', fontSize: '20px', fontWeight: '600' }}>
        🎯 Weekly Goals & Milestones
      </h4>
      
      {weeklyGoals.length > 0 ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h5 style={{ margin: '0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
              Current Goals ({weeklyGoals.filter(g => g.completed).length}/{weeklyGoals.length} Complete)
            </h5>
            <div style={{
              background: weeklyGoals.filter(g => g.completed).length === weeklyGoals.length ? '#10b981' : '#f59e0b',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {Math.round((weeklyGoals.filter(g => g.completed).length / weeklyGoals.length) * 100)}%
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {weeklyGoals.map((goal, index) => (
              <div key={index} style={{
                background: goal.completed ? '#f0fdf4' : '#ffffff',
                padding: '20px',
                borderRadius: '8px',
                border: goal.completed ? '2px solid #10b981' : '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: goal.completed ? '#10b981' : '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginTop: '2px'
                }}>
                  {goal.completed ? '✓' : ''}
                </div>
                
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: '0 0 8px 0',
                    color: goal.completed ? '#059669' : '#111827',
                    fontSize: '15px',
                    fontWeight: '500',
                    textDecoration: goal.completed ? 'line-through' : 'none'
                  }}>
                    {getGoalText(goal)}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {goal.category && (
                      <span style={{
                        background: '#f3f4f6',
                        color: '#6b7280',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {goal.category}
                      </span>
                    )}
                    
                    {goal.priority && (
                      <span style={{
                        background: goal.priority === 'high' ? '#fef2f2' : goal.priority === 'medium' ? '#fef3c7' : '#f0fdf4',
                        color: goal.priority === 'high' ? '#dc2626' : goal.priority === 'medium' ? '#d97706' : '#059669',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {goal.priority} priority
                      </span>
                    )}
                    
                    {goal.deadline && (
                      <span style={{
                        fontSize: '12px',
                        color: '#9ca3af'
                      }}>
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>No weekly goals set</p>
          <p style={{ margin: '0', fontSize: '14px' }}>
            Set study goals with your study buddy to track your weekly progress!
          </p>
        </div>
      )}
    </div>
  );

  const ReadingMilestonesSection = () => {
    const books = profile?.supercurricular?.lowLevel?.books || [];
    const completedBooks = books.filter(book => book.completed || book.status === 'completed');
    const monthlyTarget = readingGoals.monthlyTarget || 3;
    const currentMonthBooks = completedBooks.filter(book => {
      const bookDate = new Date(book.completedDate || book.date || Date.now());
      const now = new Date();
      return bookDate.getMonth() === now.getMonth() && bookDate.getFullYear() === now.getFullYear();
    });

    return (
      <div>
        <h4 style={{ margin: '0 0 24px 0', color: '#111827', fontSize: '20px', fontWeight: '600' }}>
          📖 Reading Milestones
        </h4>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          marginBottom: '24px'
        }}>
          <h5 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
            Monthly Reading Goal
          </h5>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `conic-gradient(#10b981 ${(currentMonthBooks.length / monthlyTarget) * 360}deg, #e5e7eb 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: '#111827',
                textAlign: 'center'
              }}>
                {currentMonthBooks.length}/{monthlyTarget}
              </div>
            </div>
            
            <div>
              <h6 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                {currentMonthBooks.length} of {monthlyTarget} books
              </h6>
              <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                {Math.round((currentMonthBooks.length / monthlyTarget) * 100)}% of monthly target
              </p>
            </div>
          </div>

          <div style={{
            background: '#e5e7eb',
            height: '8px',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              background: '#10b981',
              height: '100%',
              width: `${Math.min((currentMonthBooks.length / monthlyTarget) * 100, 100)}%`,
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {currentMonthBooks.length > 0 && (
            <div>
              <h6 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: '14px', fontWeight: '600' }}>
                Books completed this month:
              </h6>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentMonthBooks.map((book, index) => (
                  <span key={index} style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {book.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reading Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #a8dcc6',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: '#111827' }}>
              {books.length}
            </h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Total Books</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #a8dcc6',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: '#111827' }}>
              {completedBooks.length}
            </h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Completed</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #a8dcc6',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: '#111827' }}>
              {books.filter(book => book.type === 'academic').length}
            </h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Academic Books</p>
          </div>
        </div>
      </div>
    );
  };

  const GradeTargetsSection = () => (
    <div>
      <h4 style={{ margin: '0 0 24px 0', color: '#111827', fontSize: '20px', fontWeight: '600' }}>
        🎯 Grade Targets & Performance
      </h4>
      
      {Object.keys(gradeTargets).length > 0 || currentSubjects.length > 0 ? (
        <div>
          {/* Grade Targets Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {currentSubjects.map((subject, index) => {
              const subjectName = subject.name || subject;
              const target = gradeTargets[subjectName] || 'Not set';
              const currentGrade = subject.currentGrade || subject.grade || 'Not assessed';
              const progress = calculateSubjectProgress(subjectName);
              
              return (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #a8dcc6',
                  textAlign: 'center'
                }}>
                  <h5 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                    {subjectName}
                  </h5>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Target</div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#2a4442'
                      }}>
                        {target}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Current</div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: currentGrade === 'Not assessed' ? '#9ca3af' : '#111827'
                      }}>
                        {currentGrade}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#f3f4f6',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Progress</div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{
                        background: '#e5e7eb',
                        height: '6px',
                        borderRadius: '3px',
                        flex: 1,
                        marginRight: '8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: progress.overall >= 70 ? '#10b981' : progress.overall >= 40 ? '#f59e0b' : '#ef4444',
                          height: '100%',
                          width: `${progress.overall}%`,
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                        {progress.overall}%
                      </span>
                    </div>
                  </div>
                  
                  {subject.nextExam && (
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      background: '#f9fafb',
                      padding: '8px',
                      borderRadius: '6px'
                    }}>
                      Next exam: {new Date(subject.nextExam).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* University Requirements */}
          {universityTargets && universityTargets.length > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #a8dcc6'
            }}>
              <h5 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                🏛️ University Entry Requirements
              </h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {universityTargets.map((uni, index) => (
                  <div key={index} style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h6 style={{ margin: '0', color: '#111827', fontSize: '14px', fontWeight: '600' }}>
                        {uni.name} - {uni.course}
                      </h6>
                      <span style={{
                        background: '#e1dfff',
                        color: '#221468',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {uni.priority || 'Target'}
                      </span>
                    </div>
                    
                    {uni.requirements?.grades && (
                      <div style={{ fontSize: '13px', color: '#374151' }}>
                        <strong>Required:</strong> {uni.requirements.grades}
                      </div>
                    )}
                    
                    {uni.additionalRequirements && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {uni.additionalRequirements}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>No grade targets set</p>
          <p style={{ margin: '0', fontSize: '14px' }}>
            Tell your study buddy about your grade goals to start tracking performance!
          </p>
        </div>
      )}
    </div>
  );

  // Todo List Section
  const TodoListSection = () => {
    // Sort todos by date (newest first) and group by completion status
    const sortedTodos = [...todos].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    const pendingTodos = sortedTodos.filter(t => !t.completed);
    const completedTodos = sortedTodos.filter(t => t.completed);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: '0', color: COLORS.darkGreen, fontSize: '18px', fontWeight: '600' }}>
            ✅ Goal Checklist
          </h4>
          <button
            onClick={() => setShowAddTodoModal(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px 0 rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.3)';
            }}
          >
            + Add New Task
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: COLORS.mint,
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: `2px solid ${COLORS.darkGreen}`
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.darkGreen, marginBottom: '4px' }}>
              {todos.length}
            </div>
            <div style={{ fontSize: '12px', color: COLORS.darkGreen, fontWeight: '600' }}>Total Tasks</div>
          </div>
          <div style={{
            background: COLORS.lavender,
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: `2px solid ${COLORS.mediumPurple}`
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.mediumPurple, marginBottom: '4px' }}>
              {pendingTodos.length}
            </div>
            <div style={{ fontSize: '12px', color: COLORS.mediumPurple, fontWeight: '600' }}>Pending</div>
          </div>
          <div style={{
            background: '#dcfce7',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px solid #10b981'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
              {completedTodos.length}
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Completed</div>
          </div>
        </div>

        {/* Pending Tasks */}
        {pendingTodos.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: COLORS.shadowMedium,
            marginBottom: '20px'
          }}>
            <h5 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
              🎯 Pending Tasks ({pendingTodos.length})
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingTodos.map((todo, index) => (
                <div key={todo.id || index} style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease-in-out'
                }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '14px', fontWeight: '500' }}>
                      {todo.text}
                    </p>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
                      Added {new Date(todo.dateAdded).toLocaleDateString()}
                      {todo.dueDate && ` • Due ${new Date(todo.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTodos.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: COLORS.shadowMedium
          }}>
            <h5 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
              ✅ Completed Tasks ({completedTodos.length})
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {completedTodos.map((todo, index) => (
                <div key={todo.id || index} style={{
                  background: 'rgba(220, 252, 231, 0.8)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: 0.8
                }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '14px', fontWeight: '500', textDecoration: 'line-through' }}>
                      {todo.text}
                    </p>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
                      Completed {todo.completedDate ? new Date(todo.completedDate).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todos.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '16px',
            border: '1px solid #a8dcc6'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundImage: `url(${ICONS.trophy})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              margin: '0 auto 16px',
              opacity: 0.6
            }}></div>
            <h4 style={{ margin: '0 0 8px 0', color: COLORS.darkGreen, fontSize: '18px', fontWeight: '600' }}>
              Start Your Goal Checklist
            </h4>
            <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
              Add tasks and milestones to track your progress towards university applications
            </p>
            <button
              onClick={() => setShowAddTodoModal(true)}
              style={{
                background: COLORS.teal,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Add First Task
            </button>
          </div>
        )}

        {/* Add Todo Modal */}
        {showAddTodoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>Add New Task</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
                  Task Description
                </label>
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="e.g., Complete personal statement draft, Practice interview questions..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddTodoModal(false);
                    setNewTodo('');
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddTodo(newTodo)}
                  disabled={!newTodo.trim()}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: newTodo.trim() ? '#10b981' : '#e5e7eb',
                    color: newTodo.trim() ? 'white' : '#9ca3af',
                    fontSize: '14px',
                    cursor: newTodo.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          backgroundImage: `url(${ICONS.trophy})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          marginRight: '20px'
        }}></div>
        <h3 style={{ margin: '0', color: COLORS.darkGreen, fontSize: '28px', fontWeight: '700' }}>
          Goals & Progress Tracking
        </h3>
      </div>

      {/* Enhanced Tab Navigation */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.3)',
        padding: '4px',
        marginBottom: '20px',
        borderRadius: '8px',
        border: '1px solid #a8dcc6'
      }}>
        {[
          { id: 'subjects', label: '📚 Subject Progress', desc: 'A-Level topic tracking' },
          { id: 'todo-list', label: '✅ Goal Checklist', desc: 'Tasks & milestones' }
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
        {activeSection === 'subjects' && <SubjectProgressSection />}
        {activeSection === 'todo-list' && <TodoListSection />}
      </div>
    </div>
  );
};

export default EnhancedGoalsTab;