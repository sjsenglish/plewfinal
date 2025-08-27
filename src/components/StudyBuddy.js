import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';

// Color palette matching your design system
const COLORS = {
  lightPurple: '#ccccff',
  teal: '#00ced1', 
  lightTeal: '#d8f0ed',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  insight: '#8b5cf6',
  insightBg: '#f3f4f6'
};

const StudyBuddy = ({ profileData }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    insights: 0,
    books: 0,
    activities: 0,
    universities: 0,
    profileUpdates: 0
  });
  const messagesEndRef = useRef(null);

  const FUNCTIONS_BASE_URL = 'https://us-central1-plewcsat1.cloudfunctions.net';
  const AI_AVATAR_URL = 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/ghost_couch.svg?alt=media&token=6def55fb-aa28-48b7-8262-d40e1acc9561';
  const USER_AVATAR_URL = 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fpurple%20ghost.svg?alt=media&token=8f68c264-89dd-4563-8858-07b8f9fd87e0';

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      initializeChat();
    }
  }, [profileData]);

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error('No authenticated user');
  };

  const initializeChat = async () => {
    // Create personalized welcome message based on profile data
    const welcomeMessage = createWelcomeMessage();
    
    setMessages([{
      id: 1,
      sender: 'ai',
      text: welcomeMessage,
      timestamp: new Date(),
      type: 'welcome'
    }]);
  };

  const createWelcomeMessage = () => {
    if (!profileData) {
      return "Welcome back! I'm your comprehensive study mentor. How can I help you today?";
    }

    const universityCount = (profileData.universityTargets || profileData.universities || []).length;
    const subjectCount = (profileData.currentSubjects || profileData.subjects || []).length;
    const bookCount = (profileData.supercurricular?.lowLevel?.books || []).length;
    const userArchetype = profileData.userArchetype;

    let personalizedIntro = "Welcome back! I can see you've been building your academic profile. ";

    // Archetype-specific messaging
    if (userArchetype === 'ready-to-apply') {
      personalizedIntro += "As someone ready to apply, I can help you polish your applications and personal statements. ";
    } else if (userArchetype === 'in-progress') {
      personalizedIntro += "I see you're making good progress on your university journey. Let's keep building your portfolio! ";
    } else if (userArchetype === 'starting-fresh') {
      personalizedIntro += "Great to see you starting your university preparation journey! ";
    }

    // Add specific stats
    const stats = [];
    if (universityCount > 0) stats.push(`${universityCount} university target${universityCount !== 1 ? 's' : ''}`);
    if (subjectCount > 0) stats.push(`${subjectCount} subject${subjectCount !== 1 ? 's' : ''}`);
    if (bookCount > 0) stats.push(`${bookCount} book${bookCount !== 1 ? 's' : ''} in your reading list`);

    if (stats.length > 0) {
      personalizedIntro += `I can see you have ${stats.join(', ')}. `;
    }

    personalizedIntro += "\n\n🎯 **I can help you with:**\n";
    personalizedIntro += "• University research and application strategy\n";
    personalizedIntro += "• Personal statement development and evidence building\n";
    personalizedIntro += "• Supercurricular activity planning\n";
    personalizedIntro += "• Reading recommendations and insight capture\n";
    personalizedIntro += "• Subject-specific academic guidance\n\n";

    personalizedIntro += "What would you like to work on today? Share any insights, questions, or areas you'd like to explore!";

    return personalizedIntro;
  };

  const updateSessionStats = (extractedData) => {
    if (!extractedData) return;

    setSessionStats(prev => ({
      insights: prev.insights + (extractedData.insights?.length || 0),
      books: prev.books + (extractedData.books?.length || 0),
      activities: prev.activities + (extractedData.activities?.length || 0),
      universities: prev.universities + (extractedData.universities?.length || 0),
      profileUpdates: prev.profileUpdates + (extractedData.profileUpdates || extractedData.updates?.length || 0)
    }));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    try {
      const token = await getAuthToken();
      
      // Prepare conversation history for OpenAI (last 15 messages for better context)
      const conversationHistory = (messages || []).slice(-15).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Enhanced context with profile data
      const contextualInfo = {
        userArchetype: profileData?.userArchetype,
        currentSubjects: profileData?.currentSubjects || profileData?.subjects || [],
        universityTargets: profileData?.universityTargets || profileData?.universities || [],
        currentBooks: profileData?.supercurricular?.lowLevel?.books || [],
        recentInsights: (profileData?.knowledgeInsights || profileData?.insights || []).slice(-5)
      };

      const response = await fetch(`${FUNCTIONS_BASE_URL}/studyBuddyChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: conversationHistory,
          contextualInfo: contextualInfo,
          extractInsights: true,
          checkUniversityResearch: true,
          sessionId: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('StudyBuddy response:', result);

      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: result.response,
        timestamp: new Date(),
        profileUpdated: result.profileUpdated,
        updates: result.updates || [],
        extractedCategories: result.extractedCategories || [],
        insights: result.insights || [],
        books: result.books || [],
        activities: result.activities || [],
        universities: result.universities || [],
        suggestions: result.suggestions || [],
        universityResearchPrompts: result.universityResearchPrompts || []
      };

      // Update session statistics
      updateSessionStats({
        insights: result.insights,
        books: result.books,
        activities: result.activities,
        universities: result.universities,
        updates: result.updates
      });

      setMessages(prev => [...prev, aiResponse]);
      setLastResponse(result);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "I'm having trouble processing your message right now. Please try again, and if the issue persists, check your dashboard or refresh the page.",
        timestamp: new Date(),
        type: 'error'
      };
      
      setMessages(prev => [...prev, errorResponse]);
    }
    
    setLoading(false);
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSuggestionPrompts = () => {
    if (!profileData) {
      return [
        "Help me understand what makes a strong university application",
        "I'm interested in exploring different career paths",
        "What should I be reading to prepare for university?"
      ];
    }

    const prompts = [];
    const subjects = profileData.currentSubjects || profileData.subjects || [];
    const universities = profileData.universityTargets || profileData.universities || [];

    // Subject-specific prompts
    if (subjects.some(s => s.name?.toLowerCase().includes('economics') || s.subject?.toLowerCase().includes('economics'))) {
      prompts.push("I've been reading about behavioral economics and how it challenges traditional economic assumptions");
    }
    if (subjects.some(s => s.name?.toLowerCase().includes('history') || s.subject?.toLowerCase().includes('history'))) {
      prompts.push("I'm fascinated by how primary sources can completely change our understanding of historical events");
    }
    if (subjects.some(s => s.name?.toLowerCase().includes('english') || s.subject?.toLowerCase().includes('english'))) {
      prompts.push("I've been analyzing how authors use unreliable narrators to explore themes of truth and perception");
    }

    // University-specific prompts
    if (universities.some(u => u.name?.toLowerCase().includes('cambridge') || u.university?.toLowerCase().includes('cambridge'))) {
      prompts.push("I want to research Cambridge's supervision system and how it differs from other teaching methods");
    }
    if (universities.some(u => u.name?.toLowerCase().includes('oxford') || u.university?.toLowerCase().includes('oxford'))) {
      prompts.push("Help me understand Oxford's tutorial system and what makes it unique for learning");
    }

    // Generic but contextual prompts
    prompts.push("I'm planning my summer activities - what would strengthen my university applications?");
    prompts.push("I found an interesting research paper and want to explore its implications for my subject");
    prompts.push("Help me connect my recent reading to my personal statement themes");

    return prompts.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  const [suggestionPrompts] = useState(getSuggestionPrompts());

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '48px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔐</div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            Authentication Required
          </h3>
          <p style={{
            color: COLORS.gray,
            marginBottom: '32px',
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            Please log in to access your study mentor
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Session Stats Header */}
      {(sessionStats.insights > 0 || sessionStats.books > 0 || sessionStats.activities > 0 || sessionStats.universities > 0) && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          marginTop: '70px' // Account for navigation
        }}>
          {sessionStats.insights > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <span style={{ color: COLORS.insight }}>{sessionStats.insights}</span>
              <span style={{ color: COLORS.gray }}>insights captured</span>
            </div>
          )}
          {sessionStats.books > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '18px' }}>📚</span>
              <span style={{ color: COLORS.teal }}>{sessionStats.books}</span>
              <span style={{ color: COLORS.gray }}>books added</span>
            </div>
          )}
          {sessionStats.activities > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '18px' }}>🎯</span>
              <span style={{ color: COLORS.success }}>{sessionStats.activities}</span>
              <span style={{ color: COLORS.gray }}>activities tracked</span>
            </div>
          )}
          {sessionStats.universities > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span style={{ fontSize: '18px' }}>🏛️</span>
              <span style={{ color: '#9333ea' }}>{sessionStats.universities}</span>
              <span style={{ color: COLORS.gray }}>universities researched</span>
            </div>
          )}
        </div>
      )}

      {/* Messages Container */}
      <div style={{
        flex: 1,
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingBottom: '120px', // Space for fixed input
        paddingTop: sessionStats.insights > 0 || sessionStats.books > 0 || sessionStats.activities > 0 || sessionStats.universities > 0 ? '24px' : '94px' // Account for nav + stats
      }}>
        {messages.map((message) => (
          <div key={message.id} style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
          }}>
            {/* Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: message.sender === 'user' ? COLORS.teal + '20' : COLORS.lightTeal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: message.sender === 'ai' ? '6px' : '0'
            }}>
              {message.sender === 'ai' ? (
                <img 
                  src={AI_AVATAR_URL} 
                  alt="Study Buddy" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <img 
                  src={USER_AVATAR_URL} 
                  alt="You" 
                  style={{
                    width: '32px',
                    height: '32px',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>

            {/* Message Content */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '16px 20px',
              maxWidth: '70%',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: message.sender === 'user' 
                ? `2px solid ${COLORS.teal}40` 
                : '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {message.text}
              </p>

              {/* Captured Insights Display */}
              {message.insights && message.insights.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: COLORS.insight + '10',
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.insight}40`
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: COLORS.insight,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '16px' }}>💡</span>
                    Learning insights captured:
                  </div>
                  {message.insights.map((insight, idx) => (
                    <div key={idx} style={{
                      backgroundColor: 'white',
                      padding: '8px',
                      borderRadius: '6px',
                      marginBottom: '6px',
                      fontSize: '13px',
                      border: `1px solid ${COLORS.insight}20`
                    }}>
                      <div style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                        {insight.concept || insight.title}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>
                        <strong>Source:</strong> {insight.source} <br/>
                        <strong>Connection:</strong> {insight.connection}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Books Added Display */}
              {message.books && message.books.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: COLORS.teal + '10',
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.teal}40`
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: COLORS.teal,
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '16px' }}>📚</span>
                    Books added to reading list:
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {message.books.map((book, idx) => (
                      <span key={idx} style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        backgroundColor: COLORS.teal,
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        {book.title || book}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Universities Added Display */}
              {message.universities && message.universities.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#9333ea10',
                  borderRadius: '8px',
                  border: '1px solid #9333ea40'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#9333ea',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '16px' }}>🏛️</span>
                    University targets added:
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {message.universities.map((uni, idx) => (
                      <span key={idx} style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        backgroundColor: '#9333ea',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        {uni.name} {uni.course}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities Added Display */}
              {message.activities && message.activities.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: COLORS.success + '10',
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.success}40`
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: COLORS.success,
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '16px' }}>🎯</span>
                    Activities tracked:
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {message.activities.map((activity, idx) => (
                      <span key={idx} style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        backgroundColor: COLORS.success,
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        {activity.name || activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Suggestions Display */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: COLORS.warning + '10',
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.warning}40`
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: COLORS.warning,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '16px' }}>🚀</span>
                    Suggested next steps:
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151' }}>
                    {message.suggestions.map((suggestion, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* University Research Prompts */}
              {message.universityResearchPrompts && message.universityResearchPrompts.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#8b5cf610',
                  borderRadius: '8px',
                  border: '1px solid #8b5cf640'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#8b5cf6',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '16px' }}>🔍</span>
                    University research suggestions:
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151' }}>
                    {message.universityResearchPrompts.map((prompt, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        • {prompt}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Updates Indicator */}
              {message.updates && message.updates.length > 0 && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: COLORS.teal,
                  fontWeight: '500'
                }}>
                  ✓ {message.updates.length} profile update{message.updates.length !== 1 ? 's' : ''} made
                </div>
              )}

              <div style={{
                fontSize: '12px',
                color: COLORS.gray,
                marginTop: '8px',
                textAlign: message.sender === 'user' ? 'right' : 'left'
              }}>
                {(() => {
                  try {
                    // Handle both Date objects and ISO strings
                    const date = message.timestamp instanceof Date 
                      ? message.timestamp 
                      : new Date(message.timestamp);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } catch (error) {
                    console.warn('Invalid timestamp format:', message.timestamp);
                    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                })()}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Message */}
        {loading && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: COLORS.lightTeal,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px'
            }}>
              <img 
                src={AI_AVATAR_URL} 
                alt="Study Buddy" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: COLORS.teal,
                    borderRadius: '50%',
                    animation: `bounce 1.4s infinite ease-in-out both`,
                    animationDelay: `${i * 0.16}s`
                  }} />
                ))}
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.gray
              }}>
                Analyzing your message and updating your profile...
              </div>
            </div>
          </div>
        )}

        {/* Suggestion Prompts for returning users */}
        {messages.length === 1 && !loading && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              💡 Ready to continue your journey:
            </h4>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 16px 0',
              lineHeight: '1.5'
            }}>
              Share insights, ask questions, or explore new areas. I'll automatically capture and organize everything for your applications.
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {suggestionPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInput(prompt)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: COLORS.white,
                    border: `2px solid ${COLORS.teal}40`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    lineHeight: '1.4'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = COLORS.teal;
                    e.target.style.backgroundColor = COLORS.teal + '10';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = COLORS.teal + '40';
                    e.target.style.backgroundColor = COLORS.white;
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Container */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px 24px',
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share insights, ask questions, or explore ideas! I'll capture everything important for your academic profile..."
              rows="3"
              disabled={loading}
              maxLength={1000}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                fontSize: '15px',
                lineHeight: '1.5',
                resize: 'none',
                fontFamily: 'inherit',
                backgroundColor: COLORS.white,
                color: '#374151',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COLORS.teal;
                e.target.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '12px',
              fontSize: '12px',
              color: COLORS.gray
            }}>
              {input.length}/1000
            </div>
          </div>
          <button 
            onClick={sendMessage} 
            disabled={loading || !input.trim()}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: (!input.trim() || loading) ? '#f8fafc' : COLORS.teal,
              color: (!input.trim() || loading) ? COLORS.gray : 'white',
              border: 'none',
              cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (input.trim() && !loading) {
                e.target.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (input.trim() && !loading) {
                e.target.style.backgroundColor = COLORS.teal;
              }
            }}
          >
            {loading ? (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e2e8f0',
                borderTop: '2px solid currentColor',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              '➤'
            )}
          </button>
        </div>
        
        <div style={{
          maxWidth: '1000px',
          margin: '8px auto 0 auto',
          fontSize: '12px',
          color: COLORS.gray,
          textAlign: 'center'
        }}>
          Share insights, questions, or university interests - I'll automatically capture and structure everything
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default StudyBuddy;