import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { userStorage } from '../utils/userStorage';
import { EnhancedInsightExtractor } from './EnhancedInsightExtractor';
import DOMPurify from 'dompurify';

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
  insightBg: '#f3f4f6',
  conceptual: '#3b82f6',
  connection: '#10b981',
  application: '#f59e0b',
  reflective: '#8b5cf6'
};

// Helper function to detect subject from AI response
const detectSubjectFromResponse = (responseText) => {
  if (!responseText) return 'General';
  
  const text = responseText.toLowerCase();
  const subjects = {
    'mathematics': ['math', 'mathematics', 'algebra', 'calculus', 'geometry', 'statistics', 'probability'],
    'physics': ['physics', 'quantum', 'mechanics', 'thermodynamics', 'relativity', 'electromagnetic'],
    'chemistry': ['chemistry', 'organic', 'inorganic', 'chemical', 'molecules', 'atoms', 'reactions'],
    'biology': ['biology', 'biological', 'genetics', 'evolution', 'ecology', 'cellular', 'molecular'],
    'history': ['history', 'historical', 'ancient', 'medieval', 'modern', 'civilization', 'dynasty'],
    'english': ['literature', 'shakespeare', 'poetry', 'novel', 'author', 'writing', 'literary'],
    'politics': ['politics', 'government', 'democracy', 'political', 'policy', 'election', 'parliament'],
    'economics': ['economics', 'economic', 'market', 'trade', 'inflation', 'gdp', 'capitalism'],
    'philosophy': ['philosophy', 'philosophical', 'ethics', 'moral', 'consciousness', 'existential'],
    'psychology': ['psychology', 'psychological', 'behavior', 'cognitive', 'mental', 'brain', 'mind']
  };
  
  for (const [subject, keywords] of Object.entries(subjects)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return subject.charAt(0).toUpperCase() + subject.slice(1);
    }
  }
  
  return 'General';
};

const EnhancedStudyBuddy = ({ profileData, onProfileUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [recentAdditions, setRecentAdditions] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    insights: 0,
    conclusions: 0,
    arguments: 0,
    methodology: 0,
    // Legacy stats for backward compatibility
    conceptualInsights: 0,
    connectionInsights: 0,
    applicationInsights: 0,
    reflectiveInsights: 0,
    books: 0,
    activities: 0,
    universities: 0,
    profileUpdates: 0
  });
  const [messageFeedback, setMessageFeedback] = useState({});
  const [insightExtractor, setInsightExtractor] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Feedback system functions
  const handleMessageFeedback = useCallback((messageId, feedbackType) => {
    const user = getAuth().currentUser;
    if (!user) return;

    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: feedbackType
    }));

    // Store feedback in localStorage for persistence
    const feedbackData = {
      messageId,
      feedbackType,
      timestamp: new Date(),
      userId: user.uid
    };

    const existingFeedback = userStorage.getItem('aiMessageFeedback', []);
    const updatedFeedback = existingFeedback.filter(item => item.messageId !== messageId);
    updatedFeedback.push(feedbackData);
    userStorage.setItem('aiMessageFeedback', updatedFeedback);

    console.log(`Feedback recorded: ${feedbackType} for message ${messageId}`);
  }, []);

  // Load saved feedback on component mount
  useEffect(() => {
    userStorage.migrateExistingData(['aiMessageFeedback', 'studyBuddyChatHistory']);
    const savedFeedback = userStorage.getItem('aiMessageFeedback', []);
    const feedbackMap = {};
    savedFeedback.forEach(item => {
      feedbackMap[item.messageId] = item.feedbackType;
    });
    setMessageFeedback(feedbackMap);
  }, []);

  const FUNCTIONS_BASE_URL = 'https://us-central1-plewcsat1.cloudfunctions.net';
  const AI_AVATAR_URL = 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/ghost_couch.svg?alt=media&token=6def55fb-aa28-48b7-8262-d40e1acc9561';
  const USER_AVATAR_URL = 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fpurple%20ghost.svg?alt=media&token=8f68c264-89dd-4563-8858-07b8f9fd87e0';

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error('No authenticated user');
  };

  // Markdown processing function
  const processMarkdown = useCallback((text) => {
    if (!text) return text;
    
    // Process bold text - handle both **text** and *text* patterns
    let processed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<strong>$1</strong>'); // *bold* (not already part of **)
    
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(processed, {
      ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'u', 'br', 'p'],
      ALLOWED_ATTR: []
    });
  }, []);

  // Enhanced subject recognition for custom A-levels
  const recognizeCustomSubjects = useCallback((message) => {
    const standardALevels = [
      'mathematics', 'maths', 'physics', 'chemistry', 'biology', 'english', 'history', 
      'geography', 'economics', 'psychology', 'sociology', 'philosophy', 'politics',
      'french', 'spanish', 'german', 'art', 'drama', 'music', 'pe', 'computer science',
      'business', 'media studies', 'law', 'religious studies', 'further maths'
    ];

    const customSubjectPatterns = [
      /studying\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /taking\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+A[-\s]?level/gi,
      /my\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+course/gi,
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+class/gi
    ];

    const recognizedSubjects = new Set();
    
    // Check for custom subjects in the message
    customSubjectPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        const subject = match[1].toLowerCase().trim();
        if (subject.length > 2 && !standardALevels.includes(subject)) {
          recognizedSubjects.add(subject);
        }
      }
    });

    return Array.from(recognizedSubjects);
  }, []);

  const detectBookContext = useCallback((text) => {
    // Patterns to detect book references in conversation
    const bookPatterns = [
      // Direct book mentions with quotes or titles
      /(?:reading|read|book|novel)\s*[":"]([^"]{5,50})[":"](?:\s*by\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*))?/gi,
      // "I read [Title]" or "I'm reading [Title]"
      /(?:I'?m?\s*(?:reading|read|finished|started))\s*([A-Z][a-z]+(?:\s+[A-Za-z]+){1,5})(?:\s*by\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*))?/gi,
      // "The book [Title]" or "This book"
      /(?:the\s*book|this\s*book)\s*([A-Z][a-z]+(?:\s+[A-Za-z]+){1,4})?/gi,
      // Author + book pattern
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'?s\s*(?:book|novel|work)\s*([A-Z][a-z]+(?:\s+[A-Za-z]+){1,4})/gi
    ];

    for (const pattern of bookPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        return {
          title: match[1]?.trim() || 'Unknown Title',
          author: match[2]?.trim() || null,
          detectedFrom: match[0],
          confidence: 0.7
        };
      }
    }

    // Check against known books if we have profile data
    if (profileData?.supercurricular?.lowLevel?.books) {
      const userBooks = profileData.supercurricular.lowLevel.books;
      for (const book of userBooks) {
        if (text.toLowerCase().includes(book.title.toLowerCase().substring(0, 15))) {
          return {
            title: book.title,
            author: book.author,
            detectedFrom: book.title,
            confidence: 0.9,
            fromProfile: true
          };
        }
      }
    }

    return null;
  }, [profileData]);

  // Chat history persistence functions
  const saveChatHistory = useCallback((messagesToSave) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const chatData = {
          messages: messagesToSave,
          timestamp: new Date(),
          userId: user.uid
        };
        userStorage.setItem('studyBuddyChatHistory', chatData);
      }
    } catch (error) {
      console.warn('Failed to save chat history:', error);
    }
  }, []);

  const loadChatHistory = useCallback(() => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return null;

      const chatData = userStorage.getItem('studyBuddyChatHistory', null);
      if (chatData) {
        // Verify it's for the current user
        if (chatData.userId === user.uid && chatData.messages) {
          return chatData.messages;
        }
      }
    } catch (error) {
      console.warn('Failed to load chat history:', error);
    }
    return null;
  }, []);

  const clearChatHistory = useCallback(() => {
    try {
      userStorage.removeItem('studyBuddyChatHistory');
    } catch (error) {
      console.warn('Failed to clear chat history:', error);
    }
  }, []);

  const createWelcomeMessage = useCallback(() => {
    if (!profileData) {
      return "Welcome! I'm your enhanced study mentor. Share your thoughts and I'll extract valuable insights for your university applications.";
    }

    const universityCount = (profileData.universityTargets || []).length;
    const subjectCount = (profileData.currentSubjects || []).length;
    const bookCount = (profileData.supercurricular?.lowLevel?.books || []).length;
    const insightCount = (profileData.knowledgeInsights || profileData.insights || []).length;
    const userArchetype = profileData.userArchetype;

    let personalizedIntro = "Welcome back! ";

    // Add concise stats
    const stats = [];
    if (universityCount > 0) stats.push(`${universityCount} unis`);
    if (subjectCount > 0) stats.push(`${subjectCount} subjects`);
    if (bookCount > 0) stats.push(`${bookCount} books`);
    if (insightCount > 0) stats.push(`${insightCount} insights`);

    if (stats.length > 0) {
      personalizedIntro += `You have ${stats.join(', ')} tracked. `;
    }

    // Archetype-specific messaging - much shorter
    if (userArchetype === 'ready-to-apply') {
      personalizedIntro += "Ready to polish your applications with enhanced insights!";
    } else if (userArchetype === 'in-progress') {
      personalizedIntro += "Let's capture more insights to strengthen your portfolio!";
    } else if (userArchetype === 'starting-fresh') {
      personalizedIntro += "Let's start building high-quality evidence!";
    } else {
      personalizedIntro += "Share your thoughts and I'll extract valuable insights for your applications.";
    }

    return personalizedIntro;
  }, [profileData]);

  const startFreshConversation = useCallback(() => {
    clearChatHistory();
    const welcomeMessage = createWelcomeMessage();
    const freshMessages = [{
      id: Date.now(),
      sender: 'ai',
      text: welcomeMessage,
      timestamp: new Date(),
      type: 'welcome'
    }];
    
    setMessages(freshMessages);
    setSessionStats({
      insights: 0,
      conclusions: 0,
      arguments: 0,
      methodology: 0,
      // Legacy stats for backward compatibility
      conceptualInsights: 0,
      connectionInsights: 0,
      applicationInsights: 0,
      reflectiveInsights: 0,
      books: 0,
      activities: 0,
      universities: 0,
      profileUpdates: 0
    });
  }, [clearChatHistory, createWelcomeMessage]);

  const initializeChat = useCallback(async () => {
    // Only initialize if we haven't loaded history yet
    if (hasLoadedHistory) return;
    
    // Try to load existing chat history first
    const savedMessages = loadChatHistory();
    
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
      setHasLoadedHistory(true);
      return;
    }
    
    // If no saved history, create welcome message
    const welcomeMessage = createWelcomeMessage();
    const initialMessages = [{
      id: Date.now(),
      sender: 'ai',
      text: welcomeMessage,
      timestamp: new Date(),
      type: 'welcome'
    }];
    
    setMessages(initialMessages);
    setHasLoadedHistory(true);
  }, [createWelcomeMessage, loadChatHistory, hasLoadedHistory]);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      initializeChat();
    }
    
    // Initialize insight extractor with profile data
    if (profileData) {
      setInsightExtractor(new EnhancedInsightExtractor(profileData));
    }
  }, [profileData, initializeChat]);

  useEffect(() => {
    // Delay scroll to ensure DOM updates are complete
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (hasLoadedHistory && messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages, hasLoadedHistory, saveChatHistory]);

  const addRecentAddition = useCallback((type, count, items = []) => {
    const newAddition = {
      id: Date.now(),
      type,
      count,
      items,
      timestamp: new Date()
    };
    
    setRecentAdditions(prev => {
      const updated = [newAddition, ...prev.slice(0, 4)]; // Keep only last 5
      // Auto-remove after 8 seconds
      setTimeout(() => {
        setRecentAdditions(current => current.filter(item => item.id !== newAddition.id));
      }, 8000);
      return updated;
    });
  }, []);

  const updateSessionStats = (extractedData) => {
    if (!extractedData) return;

    const insights = extractedData.insights || [];
    const books = extractedData.books || [];
    const activities = extractedData.activities || [];
    const universities = extractedData.universities || [];
    const updates = extractedData.updates || [];

    // Map insights to new engagement system
    const engagementsByType = {
      conclusions: insights.filter(i => i.type === 'conceptual' || i.type === 'connection' || i.engagementType === 'conclusions').length,
      arguments: insights.filter(i => i.type === 'application' || i.engagementType === 'arguments').length,
      methodology: insights.filter(i => i.type === 'reflective' || i.engagementType === 'methodology').length
    };
    
    // Legacy compatibility
    const insightsByType = {
      conceptual: insights.filter(i => i.type === 'conceptual').length,
      connection: insights.filter(i => i.type === 'connection').length,
      application: insights.filter(i => i.type === 'application').length,
      reflective: insights.filter(i => i.type === 'reflective').length
    };

    // Add real-time indicators for new additions
    if (insights.length > 0) {
      addRecentAddition('insights', insights.length, insights);
    }
    if (books.length > 0) {
      addRecentAddition('books', books.length, books);
    }
    if (activities.length > 0) {
      addRecentAddition('activities', activities.length, activities);
    }
    if (universities.length > 0) {
      addRecentAddition('universities', universities.length, universities);
    }
    if (updates.length > 0) {
      addRecentAddition('profile', updates.length, updates);
    }

    setSessionStats(prev => ({
      ...prev,
      insights: prev.insights + insights.length,
      // New engagement system stats
      conclusions: prev.conclusions + engagementsByType.conclusions,
      arguments: prev.arguments + engagementsByType.arguments,
      methodology: prev.methodology + engagementsByType.methodology,
      // Legacy stats for backward compatibility
      conceptualInsights: prev.conceptualInsights + insightsByType.conceptual,
      connectionInsights: prev.connectionInsights + insightsByType.connection,
      applicationInsights: prev.applicationInsights + insightsByType.application,
      reflectiveInsights: prev.reflectiveInsights + insightsByType.reflective,
      books: prev.books + books.length,
      activities: prev.activities + activities.length,
      universities: prev.universities + universities.length,
      profileUpdates: prev.profileUpdates + updates.length
    }));
  };

  // New function to actually save data to profile
  const saveToProfile = async (result, userInput = '', fullResponse = '') => {
    try {
      console.log('saveToProfile called with:', { result, userInput });
      
      // Get current profile data
      const currentProfile = userStorage.get('profileData') || {};
      console.log('Current profile before update:', currentProfile);
      
      // Initialize arrays to match StudyProgressDashboard expectations
      const updatedProfile = {
        ...currentProfile,
        // Core profile fields that StudyProgressDashboard expects
        currentSubjects: Array.isArray(currentProfile.currentSubjects) ? currentProfile.currentSubjects : (Array.isArray(currentProfile.subjects) ? currentProfile.subjects : []),
        universityTargets: Array.isArray(currentProfile.universityTargets) ? currentProfile.universityTargets : (Array.isArray(currentProfile.universities) ? currentProfile.universities : []),
        knowledgeInsights: Array.isArray(currentProfile.knowledgeInsights) ? currentProfile.knowledgeInsights : (Array.isArray(currentProfile.insights) ? currentProfile.insights : []),
        personalStatementElements: Array.isArray(currentProfile.personalStatementElements) ? currentProfile.personalStatementElements : [],
        
        // Supercurricular structure matching StudyProgressDashboard
        supercurricular: {
          ...currentProfile.supercurricular,
          highLevel: Array.isArray(currentProfile.supercurricular?.highLevel) ? currentProfile.supercurricular.highLevel : [],
          mediumLevel: Array.isArray(currentProfile.supercurricular?.mediumLevel) ? currentProfile.supercurricular.mediumLevel : [],
          lowLevel: {
            ...currentProfile.supercurricular?.lowLevel,
            books: Array.isArray(currentProfile.supercurricular?.lowLevel?.books) ? currentProfile.supercurricular.lowLevel.books : [],
            activities: Array.isArray(currentProfile.supercurricular?.lowLevel?.activities) ? currentProfile.supercurricular.lowLevel.activities : []
          }
        }
      };
      
      console.log('Initialized profile structure:', updatedProfile);

      // Add book recommendations
      if (result.bookRecommendations && result.bookRecommendations.length > 0) {
        // Initialize the book structure if it doesn't exist
        if (!updatedProfile.supercurricular.lowLevel) {
          updatedProfile.supercurricular.lowLevel = {};
        }
        if (!updatedProfile.supercurricular.lowLevel.books) {
          updatedProfile.supercurricular.lowLevel.books = [];
        }
        
        result.bookRecommendations.forEach(book => {
          // Check if book already exists
          const bookTitle = typeof book === 'string' ? book : book.title || book.name;
          const exists = updatedProfile.supercurricular.lowLevel.books.find(b => 
            (b.title || b.name) === bookTitle
          );
          
          if (!exists) {
            const bookObj = typeof book === 'string'
              ? {
                  id: Date.now() + Math.random(),
                  title: book,
                  name: book,
                  status: 'planned',
                  addedAt: new Date().toISOString(),
                  source: 'Study Buddy'
                }
              : {
                  ...book,
                  id: Date.now() + Math.random(),
                  name: book.title || book.name || book,
                  status: 'planned',
                  addedAt: new Date().toISOString(),
                  source: 'Study Buddy'
                };
            
            updatedProfile.supercurricular.lowLevel.books.push(bookObj);
          }
        });
      }

      // Add project suggestions to appropriate supercurricular categories with detailed content
      if (result.projectSuggestions) {
        const { immediate = [], mediumTerm = [] } = result.projectSuggestions;
        
        // Process immediate suggestions (medium-level activities)
        immediate.forEach(activity => {
          if (!updatedProfile.supercurricular.mediumLevel) {
            updatedProfile.supercurricular.mediumLevel = [];
          }
          
          // Check if activity already exists
          const activityName = typeof activity === 'string' ? activity : activity.title || activity.name;
          const exists = updatedProfile.supercurricular.mediumLevel.find(
            a => (a.title || a.name || a) === activityName
          );
          
          if (!exists) {
            const activityObj = typeof activity === 'string' 
              ? { 
                  id: Date.now() + Math.random(),
                  name: activity,
                  title: activity, 
                  status: 'planned',
                  description: `Engage with this medium-level activity to enhance your academic profile.`,
                  addedAt: new Date().toISOString(),
                  source: 'Study Buddy',
                  engagements: []
                }
              : { 
                  ...activity,
                  id: Date.now() + Math.random(),
                  name: activity.title || activity.name || activity,
                  title: activity.title || activity.name || activity,
                  description: activity.description || `Engage with this medium-level activity to enhance your academic profile.`,
                  status: 'planned', 
                  addedAt: new Date().toISOString(),
                  source: 'Study Buddy',
                  engagements: []
                };
            
            // Add detailed engagement content if available
            if (activity.conclusion || activity.application || activity.nextSteps) {
              const engagement = {
                id: Date.now() + Math.random(),
                type: 'conclusions',
                content: activity.conclusion || `Key insights from engaging with ${activityObj.name}`,
                application: activity.application,
                nextSteps: activity.nextSteps,
                dateAdded: new Date().toISOString(),
                source: 'Study Buddy'
              };
              activityObj.engagements.push(engagement);
            }
            
            updatedProfile.supercurricular.mediumLevel.push(activityObj);
          }
        });

        // Process medium-term suggestions (high-level activities)
        mediumTerm.forEach(activity => {
          if (!updatedProfile.supercurricular.highLevel) {
            updatedProfile.supercurricular.highLevel = [];
          }
          
          const activityName = typeof activity === 'string' ? activity : activity.title || activity.name;
          const exists = updatedProfile.supercurricular.highLevel.find(
            a => (a.title || a.name || a) === activityName
          );
          
          if (!exists) {
            const activityObj = typeof activity === 'string' 
              ? { 
                  id: Date.now() + Math.random(),
                  name: activity,
                  title: activity, 
                  status: 'planned',
                  description: `Engage with this high-level project to significantly enhance your academic profile.`,
                  addedAt: new Date().toISOString(),
                  source: 'Study Buddy',
                  engagements: []
                }
              : { 
                  ...activity,
                  id: Date.now() + Math.random(),
                  name: activity.title || activity.name || activity,
                  title: activity.title || activity.name || activity,
                  description: activity.description || `Engage with this high-level project to significantly enhance your academic profile.`,
                  status: 'planned', 
                  addedAt: new Date().toISOString(),
                  source: 'Study Buddy',
                  engagements: []
                };
            
            // Add detailed engagement content if available
            if (activity.conclusion || activity.application || activity.nextSteps) {
              const engagement = {
                id: Date.now() + Math.random(),
                type: 'conclusions',
                content: activity.conclusion || `Key insights from engaging with ${activityObj.name}`,
                application: activity.application,
                nextSteps: activity.nextSteps,
                dateAdded: new Date().toISOString(),
                source: 'Study Buddy'
              };
              activityObj.engagements.push(engagement);
            }
            
            updatedProfile.supercurricular.highLevel.push(activityObj);
          }
        });
      }

      // Add personal statement elements
      if (result.personalStatementElements && result.personalStatementElements.length > 0) {
        result.personalStatementElements.forEach(element => {
          if (!updatedProfile.personalStatementElements.find(e => e === element || e.content === element)) {
            const elementObj = typeof element === 'string'
              ? { 
                  content: element, 
                  addedAt: new Date().toISOString(),
                  source: 'Study Buddy'
                }
              : { 
                  ...element,
                  addedAt: new Date().toISOString(),
                  source: 'Study Buddy'
                };
            
            updatedProfile.personalStatementElements.push(elementObj);
          }
        });
      }

      // Ensure knowledgeInsights array is properly initialized
      if (!updatedProfile.knowledgeInsights) {
        updatedProfile.knowledgeInsights = [];
      }

      // Add insights to knowledge insights with proper categorization
      const insights = result.insights || [];
      console.log('Processing insights:', insights);
      
      if (insights.length > 0) {
        insights.forEach(insight => {
          console.log('Processing individual insight:', insight);
          
          if (!updatedProfile.knowledgeInsights.find(i => i.content === insight.content || i.concept === insight.concept)) {
            const processedInsight = {
              id: Date.now() + Math.random(),
              content: insight.content || insight.concept || insight.text || 'Insight captured',
              originalThought: insight.originalThought || insight.original || '',
              subject: insight.subject || insight.topic || '',
              application: insight.application || insight.connections || '',
              evidence: insight.evidence || insight.examples || '',
              category: insight.category || 'general',
              type: insight.type || 'insight',
              addedAt: new Date().toISOString(),
              source: 'Study Buddy',
              taggedAsEvidence: false,
              taggedForPS: false
            };
            
            console.log('Adding processed insight:', processedInsight);
            updatedProfile.knowledgeInsights.push(processedInsight);
          }
        });
      }

      // Automatically save the full AI response as a knowledge insight
      if (fullResponse && fullResponse.length > 50) { // Only save substantial responses
        const fullResponseInsight = {
          id: Date.now() + Math.random(),
          content: fullResponse,
          originalThought: userInput || '',
          subject: detectSubjectFromResponse(fullResponse) || 'General',
          application: 'Full conversational insight from Study Buddy discussion',
          evidence: fullResponse,
          category: 'conversation',
          type: 'full_response',
          addedAt: new Date().toISOString(),
          source: 'Study Buddy - Full Response',
          taggedAsEvidence: true, // Automatically tag for evidence analysis
          taggedForPS: false
        };
        
        // Only add if we don't already have this exact response
        if (!updatedProfile.knowledgeInsights.find(i => i.content === fullResponse)) {
          console.log('Adding full response insight:', fullResponseInsight);
          updatedProfile.knowledgeInsights.push(fullResponseInsight);
        }
      }

      // Add insight improvements to knowledge insights
      if (result.insightImprovements && result.insightImprovements.length > 0) {
        console.log('Processing insight improvements:', result.insightImprovements);
        result.insightImprovements.forEach(improvement => {
          console.log('Processing insight improvement:', improvement);
          
          // Add the academic refinement as an insight
          if (improvement.academic && !updatedProfile.knowledgeInsights.find(i => i.content === improvement.academic)) {
            const newInsight = {
              id: Date.now() + Math.random(),
              content: improvement.academic,
              originalThought: improvement.original,
              personalStatementVersion: improvement.personalStatement,
              relatedConcepts: improvement.connections || [],
              application: improvement.application || '',
              evidence: improvement.evidence || '',
              category: 'academic-refinement',
              type: 'insight-refinement',
              addedAt: new Date().toISOString(),
              source: 'Study Buddy - Insight Refinement',
              taggedAsEvidence: false,
              taggedForPS: true // These are specifically for personal statements
            };
            console.log('Adding insight refinement:', newInsight);
            updatedProfile.knowledgeInsights.push(newInsight);
          }
        });
      }

      // Add book conclusions as insights and update book records
      if (result.bookConclusions && result.bookConclusions.length > 0) {
        console.log('Processing book conclusions:', result.bookConclusions);
        
        // Initialize book structure if it doesn't exist
        if (!updatedProfile.supercurricular.lowLevel) {
          updatedProfile.supercurricular.lowLevel = {};
        }
        if (!updatedProfile.supercurricular.lowLevel.books) {
          updatedProfile.supercurricular.lowLevel.books = [];
        }
        
        result.bookConclusions.forEach(conclusion => {
          // Find or create the book record
          let bookRecord = updatedProfile.supercurricular.lowLevel.books.find(b => 
            b.title?.toLowerCase().includes(conclusion.book.toLowerCase())
          );
          console.log('Found existing book record:', bookRecord);
          
          if (!bookRecord) {
            // Create new book record
            bookRecord = {
              id: Date.now() + Math.random(),
              title: conclusion.book,
              name: conclusion.book,
              status: 'completed',
              insights: [],
              addedAt: new Date().toISOString(),
              source: 'Study Buddy'
            };
            console.log('Creating new book record:', bookRecord);
            updatedProfile.supercurricular.lowLevel.books.push(bookRecord);
          }

          // Add the conclusion as an insight to the book
          if (!bookRecord.insights) bookRecord.insights = [];
          const bookInsight = {
            content: conclusion.conclusion,
            application: conclusion.application,
            nextSteps: conclusion.nextSteps,
            type: 'book-conclusion',
            addedAt: new Date().toISOString()
          };
          console.log('Adding book insight:', bookInsight);
          bookRecord.insights.push(bookInsight);

          // Also add to general knowledge insights
          if (!updatedProfile.knowledgeInsights) {
            updatedProfile.knowledgeInsights = [];
          }
          if (!updatedProfile.knowledgeInsights.find(i => i.content === conclusion.conclusion)) {
            const generalInsight = {
              id: Date.now() + Math.random(),
              content: conclusion.conclusion,
              originalThought: conclusion.originalThought || '',
              bookSource: conclusion.book,
              application: conclusion.application,
              evidence: conclusion.evidence || conclusion.examples || '',
              nextSteps: conclusion.nextSteps,
              category: 'reading',
              type: 'book-insight',
              addedAt: new Date().toISOString(),
              source: 'Study Buddy - Book Analysis',
              taggedAsEvidence: false,
              taggedForPS: false
            };
            console.log('Adding general knowledge insight:', generalInsight);
            updatedProfile.knowledgeInsights.push(generalInsight);
          }
        });
      }

      // Add project conclusions similar to book conclusions
      if (result.projectConclusions && result.projectConclusions.length > 0) {
        console.log('Processing project conclusions:', result.projectConclusions);
        
        result.projectConclusions.forEach(conclusion => {
          // Find the project in either high-level or medium-level
          let projectRecord = updatedProfile.supercurricular.highLevel?.find(p => 
            p.name?.toLowerCase().includes(conclusion.project.toLowerCase()) ||
            p.title?.toLowerCase().includes(conclusion.project.toLowerCase())
          );
          
          if (!projectRecord) {
            projectRecord = updatedProfile.supercurricular.mediumLevel?.find(p => 
              p.name?.toLowerCase().includes(conclusion.project.toLowerCase()) ||
              p.title?.toLowerCase().includes(conclusion.project.toLowerCase())
            );
          }
          
          console.log('Found existing project record:', projectRecord);
          
          if (projectRecord) {
            // Add engagement to existing project
            if (!projectRecord.engagements) projectRecord.engagements = [];
            
            const projectEngagement = {
              id: Date.now() + Math.random(),
              type: 'conclusions',
              content: conclusion.conclusion,
              application: conclusion.application,
              nextSteps: conclusion.nextSteps,
              dateAdded: new Date().toISOString(),
              source: 'Study Buddy'
            };
            console.log('Adding project engagement:', projectEngagement);
            projectRecord.engagements.push(projectEngagement);
            
            // Update project description with detailed content if available
            if (conclusion.description && !projectRecord.description) {
              projectRecord.description = conclusion.description;
            }
            
            // Also add to general knowledge insights
            if (!updatedProfile.knowledgeInsights.find(i => i.content === conclusion.conclusion)) {
              const generalInsight = {
                id: Date.now() + Math.random(),
                content: conclusion.conclusion,
                originalThought: conclusion.originalThought || '',
                projectSource: conclusion.project,
                application: conclusion.application,
                evidence: conclusion.evidence || '',
                nextSteps: conclusion.nextSteps,
                category: 'project',
                type: 'project-insight',
                addedAt: new Date().toISOString(),
                source: 'Study Buddy - Project Analysis',
                taggedAsEvidence: false,
                taggedForPS: false
              };
              console.log('Adding general project insight:', generalInsight);
              updatedProfile.knowledgeInsights.push(generalInsight);
            }
          }
        });
      }

      // Parse the conversation to extract additional data mentioned by user
      await extractConversationData(userInput, updatedProfile);

      // Save updated profile
      console.log('Final profile before saving:', updatedProfile);
      userStorage.set('profileData', updatedProfile);
      console.log('Profile saved to localStorage');
      
      // Verify the save worked
      const verifyProfile = userStorage.get('profileData');
      console.log('Verified saved profile:', verifyProfile);
      
      // Update parent component
      if (onProfileUpdate) {
        console.log('Calling onProfileUpdate with:', updatedProfile);
        onProfileUpdate(updatedProfile);
      }
      
      console.log('Profile updated with Study Buddy data:', {
        books: result.bookRecommendations?.length || 0,
        activities: (result.projectSuggestions?.immediate?.length || 0) + (result.projectSuggestions?.mediumTerm?.length || 0),
        personalStatementElements: result.personalStatementElements?.length || 0,
        insights: insights.length,
        insightRefinements: result.insightImprovements?.length || 0,
        bookConclusions: result.bookConclusions?.length || 0,
        totalKnowledgeInsights: updatedProfile.knowledgeInsights.length,
        totalBooks: updatedProfile.supercurricular.lowLevel.books.length
      });
      
    } catch (error) {
      console.error('Error saving to profile:', error);
    }
  };

  // Extract conversation data for direct mentions
  const extractConversationData = async (userMessage, profile) => {
    const message = userMessage.toLowerCase();
    
    // Extract university mentions - save to universityTargets to match StudyProgressDashboard
    const universityNames = [
      'cambridge', 'oxford', 'harvard', 'mit', 'stanford', 'ucl', 'imperial', 
      'lse', 'warwick', 'durham', 'bristol', 'edinburgh', 'manchester', 'leeds'
    ];
    
    universityNames.forEach(uni => {
      if (message.includes(uni)) {
        if (!profile.universityTargets) profile.universityTargets = [];
        if (!profile.universityTargets.find(u => u.name?.toLowerCase().includes(uni))) {
          profile.universityTargets.push({
            name: uni.charAt(0).toUpperCase() + uni.slice(1),
            addedAt: new Date().toISOString(),
            source: 'Study Buddy'
          });
        }
      }
    });

    // Extract subject mentions - save to currentSubjects to match StudyProgressDashboard
    const subjectNames = [
      'economics', 'mathematics', 'physics', 'chemistry', 'biology', 'english', 
      'history', 'geography', 'psychology', 'sociology', 'philosophy', 'politics',
      'computer science', 'engineering', 'medicine', 'law', 'business'
    ];
    
    subjectNames.forEach(subject => {
      if (message.includes(subject)) {
        if (!profile.currentSubjects) profile.currentSubjects = [];
        if (!profile.currentSubjects.find(s => s.name?.toLowerCase().includes(subject) || s === subject)) {
          // Add as object to match StudyProgressDashboard structure or string if that's what's expected
          profile.currentSubjects.push({
            name: subject.charAt(0).toUpperCase() + subject.slice(1),
            addedAt: new Date().toISOString(),
            source: 'Study Buddy'
          });
        }
      }
    });

    // Extract course/MOOC mentions
    const coursePatterns = [
      /(?:add|take|enroll|start)\s+(.+?)\s+(?:course|mooc|class)/gi,
      /(?:principles of|introduction to|advanced)\s+(\w+)/gi,
      /(\w+)\s+(?:mooc|course|online course)/gi
    ];

    coursePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(userMessage)) !== null) {
        const courseName = match[1].trim();
        if (courseName.length > 2) {
          if (!profile.supercurricular.mediumLevelActivities) {
            profile.supercurricular.mediumLevelActivities = [];
          }
          
          const exists = profile.supercurricular.mediumLevelActivities.find(
            a => a.title?.toLowerCase().includes(courseName.toLowerCase())
          );
          
          if (!exists) {
            profile.supercurricular.mediumLevelActivities.push({
              title: courseName.charAt(0).toUpperCase() + courseName.slice(1) + ' Course',
              status: 'planned',
              addedAt: new Date().toISOString(),
              source: 'Study Buddy'
            });
          }
        }
      }
    });
  };

  const processMessageWithEnhancedInsights = async (messageText) => {
    if (!insightExtractor) return { insights: [] };

    // Extract insights using the enhanced system
    const extractedInsights = insightExtractor.extractInsights(
      messageText,
      {
        currentActivity: 'Study session',
        timestamp: new Date().toISOString()
      }
    );

    // Process insights for saving - map to new engagement system
    if (extractedInsights.length > 0 && onProfileUpdate) {
      const processedInsights = extractedInsights.map(insight => {
        // Map legacy insight types to new engagement types
        let engagementType;
        switch (insight.type) {
          case 'conceptual':
          case 'connection':
            engagementType = 'conclusions';
            break;
          case 'application':
            engagementType = 'arguments';
            break;
          case 'reflective':
            engagementType = 'methodology';
            break;
          default:
            engagementType = 'conclusions';
        }
        
        return { 
          ...insight,
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          engagementType: engagementType,
          addedFromStudyBuddy: true,
          timestamp: new Date().toISOString()
        };
      });
      
      const currentProfile = { ...profileData };
      
      // Ensure engagement arrays exist
      if (!currentProfile.supercurricular) currentProfile.supercurricular = {};
      if (!currentProfile.supercurricular.engagements) currentProfile.supercurricular.engagements = {};
      if (!currentProfile.supercurricular.engagements.conclusions) currentProfile.supercurricular.engagements.conclusions = [];
      if (!currentProfile.supercurricular.engagements.arguments) currentProfile.supercurricular.engagements.arguments = [];
      if (!currentProfile.supercurricular.engagements.methodology) currentProfile.supercurricular.engagements.methodology = [];
      
      // Add insights to appropriate engagement categories
      processedInsights.forEach(insight => {
        const engagementObj = {
          id: insight.id,
          content: insight.learning || insight.concept || insight.text,
          project: insight.source || 'Study Buddy Conversation',
          personalStatement: insight.universityRelevance > 7,
          timestamp: insight.timestamp,
          evidenceStrength: insight.evidenceStrength || 5,
          addedFromStudyBuddy: true
        };
        
        currentProfile.supercurricular.engagements[insight.engagementType].push(engagementObj);
      });
      
      // Keep legacy insights for backward compatibility
      const currentInsights = profileData?.knowledgeInsights || profileData?.insights || [];
      const updatedInsights = [...currentInsights, ...processedInsights];
      currentProfile.knowledgeInsights = updatedInsights;
      currentProfile.insights = updatedInsights; // Keep both for compatibility
      
      onProfileUpdate(currentProfile);
      
      // Save to user-specific storage as backup
      userStorage.setItem('userInsights', updatedInsights);
    }

    return {
      insights: extractedInsights,
      profileUpdated: extractedInsights.length > 0
    };
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // First, process message with enhanced insight extraction
      const insightResults = await processMessageWithEnhancedInsights(input.trim());

      // Prepare conversation history for enhanced API
      const recentMessages = messages.slice(-10);
      const conversationMessages = [...recentMessages, userMessage].map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Call the new enhanced OpenAI API
      const response = await fetch('/api/enhanced-study-buddy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: conversationMessages,
          userProfile: {
            currentSubjects: profileData?.currentSubjects || [],
            supercurricular: profileData?.supercurricular || {},
            knowledgeInsights: profileData?.knowledgeInsights || [],
            userArchetype: profileData?.userArchetype
          },
          conversationContext: `Recent conversation with ${conversationMessages.length} messages`,
          analysisType: 'comprehensive',
          universityTargets: profileData?.universityTargets || []
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Use the direct conversational reply from the API
      const aiResponseText = result.reply || "I'm here to help with your academic development. Could you share more details about what you're working on?";
      
      // Detect book context in the conversation for insight linking
      const bookContext = detectBookContext(input.trim());
      
      // Combine local insights with any insights from the response
      const combinedInsights = [...(insightResults.insights || [])];
      
      // Add book context to insights if detected
      const enhancedInsights = (insightResults.insights || []).map(insight => ({
        ...insight,
        relatedBook: bookContext,
        timestamp: new Date().toISOString()
      }));

      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date(),
        profileUpdated: insightResults.profileUpdated || (result.personalStatementElements && result.personalStatementElements.length > 0),
        updates: [],
        extractedCategories: [],
        insights: combinedInsights,
        enhancedInsights: enhancedInsights,
        enhancedAnalysis: result, // Store the full response
        books: result.bookRecommendations || [],
        activities: result.projectSuggestions?.immediate || [],
        universities: [],
        suggestions: [...(result.projectSuggestions?.immediate || []), ...(result.projectSuggestions?.mediumTerm || [])],
        universityResearchPrompts: [],
        bookContext: bookContext,
        mentorAdvice: result.mentorAdvice,
        personalStatementElements: result.personalStatementElements || [],
        insightImprovements: result.insightImprovements || [],
        bookConclusions: result.bookConclusions || [],
        projectConclusions: result.projectConclusions || []
      };

      // Save to profile first
      console.log('About to save to profile:', {
        insightImprovements: result.insightImprovements,
        bookConclusions: result.bookConclusions,
        bookRecommendations: result.bookRecommendations,
        personalStatementElements: result.personalStatementElements
      });
      
      try {
        await saveToProfile(result, input.trim(), aiResponseText);
        console.log('Profile save completed successfully');
      } catch (saveError) {
        console.error('Error in saveToProfile:', saveError);
      }

      // Update session statistics with enhanced data
      updateSessionStats({
        insights: combinedInsights,
        books: result.bookRecommendations,
        activities: result.projectSuggestions?.immediate,
        universities: [],
        updates: result.personalStatementElements
      });

      setMessages(prev => [...prev, aiResponse]);
      setLastResponse(result);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Even if backend fails, we can still show local insights
      const insightResults = await processMessageWithEnhancedInsights(input.trim());
      
      const errorResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: insightResults.insights.length > 0 
          ? `I extracted ${insightResults.insights.length} insights from your message, though I'm having trouble connecting to get additional analysis. Your insights have been saved to your profile!`
          : "I'm having trouble processing your message right now. Please try again, and if the issue persists, check your dashboard or refresh the page.",
        timestamp: new Date(),
        type: 'error',
        insights: insightResults.insights,
        enhancedInsights: insightResults.insights
      };
      
      if (insightResults.insights.length > 0) {
        updateSessionStats({ insights: insightResults.insights });
      }
      
      setMessages(prev => [...prev, errorResponse]);
    }
    
    setLoading(false);
    setInput('');
    
    // Restore focus to input field for better UX
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  const getEnhancedSuggestionPrompts = () => {
    const prompts = [];
    const subjects = profileData?.currentSubjects || [];
    const universities = profileData?.universityTargets || [];

    // High-value insight generation prompts
    prompts.push("I've been reading about [topic] and it made me realize how [connection/insight]");
    prompts.push("Working on my project, I discovered that [specific learning] which connects to [broader concept]");
    prompts.push("This lecture on [subject] challenged my understanding because [reflection]");

    // Subject-specific high-value prompts
    if (subjects.some(s => s.name?.toLowerCase().includes('economics'))) {
      prompts.push("I've been analyzing market behavior and noticed how behavioral economics challenges traditional models - the concept of bounded rationality particularly resonates");
      prompts.push("Reading about income inequality, I'm fascinated by how Piketty's r > g formula connects mathematical modeling with social policy implications");
    }
    
    if (subjects.some(s => s.name?.toLowerCase().includes('history'))) {
      prompts.push("Studying primary sources from the Industrial Revolution, I'm struck by how worker testimonies reveal gaps in traditional historical narratives");
      prompts.push("Analyzing historiographical debates about causation, I'm learning how historians' theoretical frameworks shape their interpretations of evidence");
    }

    if (subjects.some(s => s.name?.toLowerCase().includes('english'))) {
      prompts.push("Exploring unreliable narrators in modernist literature, I see how authors use narrative technique to question the nature of truth and perception");
      prompts.push("Reading postcolonial criticism, I understand how literary theory can reveal power structures embedded in seemingly neutral texts");
    }

    // University-specific insight prompts
    if (universities.some(u => u.name?.toLowerCase().includes('cambridge'))) {
      prompts.push("I've been researching Cambridge's supervision system and how close academic mentorship differs from traditional lecture-based learning");
    }

    if (universities.some(u => u.name?.toLowerCase().includes('oxford'))) {
      prompts.push("Learning about Oxford's tutorial system, I'm intrigued by how Socratic dialogue develops critical thinking skills");
    }

    return prompts.slice(0, 6); // Return top 6 most relevant
  };

  const getInsightTypeIcon = (type) => {
    switch (type) {
      case 'conceptual': return '💡';
      case 'connection': return '🔗';
      case 'application': return '🎯';
      case 'reflective': return '🪞';
      default: return '✨';
    }
  };

  const getInsightTypeColor = (type) => {
    switch (type) {
      case 'conceptual': return COLORS.conceptual;
      case 'connection': return COLORS.connection;
      case 'application': return COLORS.application;
      case 'reflective': return COLORS.reflective;
      default: return COLORS.insight;
    }
  };

  const renderEnhancedInsights = (insights) => {
    if (!insights || insights.length === 0) return null;

    return (
      <div style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: COLORS.insightBg,
        borderRadius: '12px',
        border: `2px solid ${COLORS.insight}40`
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: COLORS.insight,
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>🧠</span>
          Enhanced Insights Captured: {insights.length}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {insights.map((insight, idx) => (
            <div key={idx} style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: `2px solid ${getInsightTypeColor(insight.type)}20`,
              borderLeft: `6px solid ${getInsightTypeColor(insight.type)}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>{getInsightTypeIcon(insight.type)}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: getInsightTypeColor(insight.type),
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {insight.type}
                  </span>
                </div>
                <div style={{
                  background: insight.evidenceStrength >= 8 ? '#10b981' : insight.evidenceStrength >= 6 ? '#f59e0b' : '#6b7280',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {insight.evidenceStrength}/10
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <div style={{
                  fontWeight: '600',
                  color: '#111827',
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  {insight.concept || insight.primaryConcept || 'Key Concept'}
                </div>
                <div style={{
                  color: '#374151',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}>
                  {insight.learning || insight.connection || insight.application || insight.reflection}
                </div>
              </div>

              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                {insight.source && (
                  <span><strong>Source:</strong> {insight.source}</span>
                )}
                {insight.subjectArea && (
                  <span><strong>Subject:</strong> {insight.subjectArea}</span>
                )}
                {insight.universityRelevance > 7 && (
                  <span style={{ color: '#059669' }}>
                    <strong>🎯 High University Relevance</strong>
                  </span>
                )}
                {insight.psRecommended && (
                  <span style={{ color: '#8b5cf6' }}>
                    <strong>📝 PS Recommended</strong>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{
          marginTop: '12px',
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          All insights automatically saved to your profile for personal statement building
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      margin: 0,
      padding: 0,
      paddingTop: '70px', // Account for fixed navigation
      boxSizing: 'border-box'
    }}>
      {/* Enhanced Session Stats Header */}
      {Object.values(sessionStats).some(stat => stat > 0) && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '12px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          marginTop: '0', // Remove extra margin
          position: 'sticky',
          top: '0',
          zIndex: 100
        }}>
          {sessionStats.insights > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
              <span style={{ fontSize: '18px' }}>🧠</span>
              <span style={{ color: COLORS.insight }}>{sessionStats.insights}</span>
              <span style={{ color: COLORS.gray }}>total insights</span>
            </div>
          )}
          {/* New engagement system stats */}
          {sessionStats.conclusions > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span>💡</span>
              <span style={{ color: '#10b981' }}>{sessionStats.conclusions}</span>
              <span style={{ color: COLORS.gray }}>conclusions</span>
            </div>
          )}
          {sessionStats.arguments > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span>🎯</span>
              <span style={{ color: '#8b5cf6' }}>{sessionStats.arguments}</span>
              <span style={{ color: COLORS.gray }}>arguments</span>
            </div>
          )}
          {sessionStats.methodology > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span>🔬</span>
              <span style={{ color: '#1e40af' }}>{sessionStats.methodology}</span>
              <span style={{ color: COLORS.gray }}>methodology</span>
            </div>
          )}
          {/* Legacy stats - only show if new system stats are 0 */}
          {(sessionStats.conclusions === 0 && sessionStats.arguments === 0 && sessionStats.methodology === 0) && (
            <>
              {sessionStats.conceptualInsights > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span>💡</span>
                  <span style={{ color: COLORS.conceptual }}>{sessionStats.conceptualInsights}</span>
                  <span style={{ color: COLORS.gray }}>conceptual</span>
                </div>
              )}
              {sessionStats.connectionInsights > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span>🔗</span>
                  <span style={{ color: COLORS.connection }}>{sessionStats.connectionInsights}</span>
                  <span style={{ color: COLORS.gray }}>connections</span>
                </div>
              )}
              {sessionStats.applicationInsights > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span>🎯</span>
                  <span style={{ color: COLORS.application }}>{sessionStats.applicationInsights}</span>
                  <span style={{ color: COLORS.gray }}>applications</span>
                </div>
              )}
              {sessionStats.reflectiveInsights > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span>🪞</span>
                  <span style={{ color: COLORS.reflective }}>{sessionStats.reflectiveInsights}</span>
                  <span style={{ color: COLORS.gray }}>reflective</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingBottom: messages.length <= 1 ? (showSuggestions ? '220px' : '170px') : '160px',
        paddingTop: Object.values(sessionStats).some(stat => stat > 0) ? '16px' : '20px', // Reduced padding
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Continue Previous Conversation Indicator */}
        {(() => {
          const savedHistory = loadChatHistory();
          const hasPreviousConversation = savedHistory && savedHistory.length > 1;
          const isShowingHistory = messages.length > 1 && messages[0]?.type === 'welcome';
          
          if (hasPreviousConversation && isShowingHistory) {
            return (
              <div style={{
                background: `linear-gradient(135deg, ${COLORS.lavenderLight} 0%, ${COLORS.mint} 100%)`,
                border: `2px solid ${COLORS.lightPurple}`,
                borderRadius: '20px',
                padding: '20px 28px',
                margin: '0 auto 24px',
                maxWidth: '900px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: COLORS.shadowLarge,
                backdropFilter: 'blur(20px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: COLORS.teal,
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px'
                  }}>
                    🔄
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', color: COLORS.darkGreen, fontSize: '16px', fontWeight: '600', lineHeight: '1.5' }}>
                      Continuing Previous Conversation
                    </h4>
                    <p style={{ margin: '0', color: COLORS.mediumGreen, fontSize: '14px', fontWeight: '400', lineHeight: '1.6', letterSpacing: '0.01em' }}>
                      Your chat history has been restored • {messages.length - 1} previous messages
                    </p>
                  </div>
                </div>
                <button
                  onClick={startFreshConversation}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${COLORS.lightPurple}`,
                    borderRadius: '12px',
                    padding: '12px 20px',
                    color: COLORS.darkGreen,
                    fontSize: '14px',
                    fontWeight: '600',
                    lineHeight: '1.6',
                    letterSpacing: '0.01em',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 1)';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = COLORS.shadowLarge;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = COLORS.shadowMedium;
                  }}
                >
                  Start Fresh
                </button>
              </div>
            );
          }
          return null;
        })()}

        {messages.map((message) => (
          <div key={message.id} style={{
            display: 'flex',
            gap: '12px',
            flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
          }}>
            <img
              src={message.sender === 'user' ? USER_AVATAR_URL : AI_AVATAR_URL}
              alt={message.sender}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                flexShrink: 0
              }}
            />
            
            <div style={{
              flex: 1,
              maxWidth: message.sender === 'user' ? '70%' : '85%'
            }}>
              <div style={{
                background: message.sender === 'user' 
                  ? `linear-gradient(135deg, ${COLORS.teal} 0%, #20B2AA 100%)`
                  : message.type === 'error' 
                  ? COLORS.error
                  : 'rgba(255, 255, 255, 0.95)',
                color: message.sender === 'user' || message.type === 'error' ? COLORS.white : COLORS.darkGray,
                padding: '16px 20px',
                borderRadius: message.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                backdropFilter: message.sender !== 'user' ? 'blur(10px)' : 'none',
                border: message.sender !== 'user' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
              }}>
                <div 
                  className="message-content"
                  style={{
                    margin: '0',
                    lineHeight: '1.5',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: processMarkdown(message.text)
                  }}
                />

                {/* Enhanced Insights Display */}
                {message.enhancedInsights && renderEnhancedInsights(message.enhancedInsights)}
                
                {/* Legacy insights fallback */}
                {message.insights && !message.enhancedInsights && message.insights.length > 0 && (
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

                {/* Project Progression Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '12px',
                    border: '2px solid #3b82f620'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#3b82f6',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>🚀</span>
                      Project Progression Recommendations
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {message.suggestions.slice(0, 3).map((suggestion, idx) => {
                        // Handle both string and object formats
                        const suggestionTitle = typeof suggestion === 'string' ? suggestion : (suggestion.title || suggestion.name || suggestion);
                        const suggestionLevel = suggestion.level || 'medium';
                        const suggestionDescription = suggestion.description || `Engage with this ${suggestionLevel}-level activity to enhance your academic profile.`;
                        
                        return (
                          <div key={idx} style={{
                            backgroundColor: 'white',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '2px solid #e5e7eb',
                            borderLeft: `6px solid ${suggestionLevel === 'high' ? '#ef4444' : suggestionLevel === 'medium' ? '#f59e0b' : '#10b981'}`
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '8px'
                            }}>
                              <div style={{
                                fontWeight: '600',
                                color: '#111827',
                                fontSize: '14px'
                              }}>
                                {suggestionTitle}
                              </div>
                              <div style={{
                                background: suggestionLevel === 'high' ? '#ef4444' : suggestionLevel === 'medium' ? '#f59e0b' : '#10b981',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                              }}>
                                {suggestionLevel} Level
                              </div>
                            </div>
                            
                            <div style={{
                              color: '#374151',
                              fontSize: '13px',
                              lineHeight: '1.4',
                              marginBottom: '8px'
                            }}>
                              {suggestionDescription}
                            </div>
                          
                          <div style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap'
                          }}>
                            {suggestion.timeframe && (
                              <span><strong>Timeframe:</strong> {suggestion.timeframe}</span>
                            )}
                            {suggestion.universityRelevance && (
                              <span style={{ color: '#059669' }}>
                                <strong>🎯 University Benefit:</strong> {suggestion.universityRelevance}
                              </span>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Book Recommendations */}
                {message.books && message.books.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#faf5ff',
                    borderRadius: '12px',
                    border: '2px solid #8b5cf620'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#8b5cf6',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>📚</span>
                      Intelligent Book Recommendations
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {message.books.slice(0, 2).map((book, idx) => (
                        <div key={idx} style={{
                          backgroundColor: 'white',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          borderLeft: `6px solid ${book.priority === 'high' ? '#8b5cf6' : book.priority === 'medium' ? '#3b82f6' : '#6b7280'}`
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                          }}>
                            <div>
                              <div style={{
                                fontWeight: '600',
                                color: '#111827',
                                fontSize: '14px'
                              }}>
                                {book.title}
                              </div>
                              {book.author && (
                                <div style={{
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  fontStyle: 'italic'
                                }}>
                                  by {book.author}
                                </div>
                              )}
                            </div>
                            <div style={{
                              background: book.priority === 'high' ? '#8b5cf6' : book.priority === 'medium' ? '#3b82f6' : '#6b7280',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {book.category || 'Recommended'}
                            </div>
                          </div>
                          
                          <div style={{
                            color: '#374151',
                            fontSize: '13px',
                            lineHeight: '1.4',
                            marginBottom: '8px'
                          }}>
                            <strong>Why now:</strong> {book.relevance || book.progressionLevel}
                          </div>
                          
                          {book.psEvidence && (
                            <div style={{
                              fontSize: '12px',
                              color: '#059669',
                              backgroundColor: '#f0fdf4',
                              padding: '8px',
                              borderRadius: '6px',
                              marginTop: '8px',
                              border: '1px solid #05966920'
                            }}>
                              <strong>📝 PS Potential:</strong> {book.psEvidence}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personal Statement Elements */}
                {message.personalStatementElements && message.personalStatementElements.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '12px',
                    border: '2px solid #10b98120'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#059669',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>📝</span>
                      Personal Statement Evidence Identified
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {message.personalStatementElements.slice(0, 2).map((element, idx) => {
                        // Handle both string and object formats
                        const elementText = typeof element === 'string' ? element : (element.insight || element.content || element);
                        const usageGuidance = element.usageGuidance || "This experience demonstrates your engagement with the subject and can be developed into a compelling personal statement narrative.";
                        const evidenceType = element.evidenceType || "Academic engagement";
                        const strengthArea = element.strengthArea || "Subject commitment";
                        
                        return (
                          <div key={idx} style={{
                            backgroundColor: 'white',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '2px solid #e5e7eb',
                            borderLeft: '6px solid #059669'
                          }}>
                            <div style={{
                              fontWeight: '600',
                              color: '#111827',
                              fontSize: '14px',
                              marginBottom: '8px'
                            }}>
                              {elementText}
                            </div>
                            
                            <div style={{
                              color: '#374151',
                              fontSize: '13px',
                              lineHeight: '1.4',
                              marginBottom: '8px'
                            }}>
                              <strong>How to use:</strong> {usageGuidance}
                            </div>
                            
                            <div style={{
                              fontSize: '11px',
                              color: '#6b7280',
                              display: 'flex',
                              gap: '12px',
                              flexWrap: 'wrap'
                            }}>
                              <span><strong>Evidence Type:</strong> {evidenceType}</span>
                              <span><strong>Demonstrates:</strong> {strengthArea}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Insight Improvements */}
                {message.insightImprovements && message.insightImprovements.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#fefce8',
                    borderRadius: '12px',
                    border: '2px solid #eab30820'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#d97706',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>✨</span>
                      Insight Refinements
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {message.insightImprovements.map((improvement, idx) => (
                        <div key={idx} style={{
                          backgroundColor: 'white',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          borderLeft: '6px solid #d97706'
                        }}>
                          <div style={{
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              marginBottom: '6px'
                            }}>
                              Your Original Insight:
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#374151',
                              fontStyle: 'italic',
                              padding: '8px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '6px'
                            }}>
                              "{improvement.original}"
                            </div>
                          </div>

                          <div style={{
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              color: '#d97706',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              marginBottom: '6px'
                            }}>
                              Academic Refinement:
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#111827',
                              fontWeight: '500',
                              padding: '8px',
                              backgroundColor: '#fefce8',
                              borderRadius: '6px'
                            }}>
                              {improvement.academic}
                            </div>
                          </div>

                          {improvement.personalStatement && (
                            <div style={{
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                fontSize: '12px',
                                color: '#059669',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                marginBottom: '6px'
                              }}>
                                Personal Statement Version:
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: '#047857',
                                padding: '8px',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '6px',
                                border: '1px solid #05966920'
                              }}>
                                {improvement.personalStatement}
                              </div>
                            </div>
                          )}

                          {improvement.connections && improvement.connections.length > 0 && (
                            <div>
                              <div style={{
                                fontSize: '12px',
                                color: '#7c3aed',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                marginBottom: '6px'
                              }}>
                                Related Concepts:
                              </div>
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px'
                              }}>
                                {improvement.connections.map((connection, connIdx) => (
                                  <span key={connIdx} style={{
                                    fontSize: '11px',
                                    backgroundColor: '#ede9fe',
                                    color: '#7c3aed',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontWeight: '500'
                                  }}>
                                    {connection}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Book Conclusions */}
                {message.bookConclusions && message.bookConclusions.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '12px',
                    border: '2px solid #10b98120'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#059669',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>📖</span>
                      Book Analysis & Conclusions
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {message.bookConclusions.map((conclusion, idx) => (
                        <div key={idx} style={{
                          backgroundColor: 'white',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          borderLeft: '6px solid #059669'
                        }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#111827',
                            fontSize: '14px',
                            marginBottom: '8px'
                          }}>
                            📚 {conclusion.book}
                          </div>

                          <div style={{
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              color: '#059669',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              marginBottom: '6px'
                            }}>
                              Key Conclusion:
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#047857',
                              lineHeight: '1.4'
                            }}>
                              {conclusion.conclusion}
                            </div>
                          </div>

                          {conclusion.application && (
                            <div style={{
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                fontSize: '12px',
                                color: '#7c3aed',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                marginBottom: '6px'
                              }}>
                                Application to Your Goals:
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: '#6b46c1',
                                lineHeight: '1.4'
                              }}>
                                {conclusion.application}
                              </div>
                            </div>
                          )}

                          {conclusion.nextSteps && (
                            <div style={{
                              fontSize: '12px',
                              color: '#dc2626',
                              backgroundColor: '#fef2f2',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #dc262620'
                            }}>
                              <strong>🎯 Next Steps:</strong> {conclusion.nextSteps}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Analysis & Conclusions */}
                {message.projectConclusions && message.projectConclusions.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(99, 102, 241, 0.1)'
                  }}>
                    <div style={{
                      color: '#4338ca',
                      fontWeight: '700',
                      fontSize: '14px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '18px' }}>🚀</span>
                      Project Analysis & Conclusions
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {message.projectConclusions.map((conclusion, idx) => (
                        <div key={idx} style={{
                          backgroundColor: 'white',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          borderLeft: '6px solid #6366f1'
                        }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#111827',
                            fontSize: '14px',
                            marginBottom: '8px'
                          }}>
                            🚀 {conclusion.project}
                          </div>

                          <div style={{
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              color: '#4338ca',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              marginBottom: '6px'
                            }}>
                              Key Conclusion:
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#3730a3',
                              lineHeight: '1.4'
                            }}>
                              {conclusion.conclusion}
                            </div>
                          </div>

                          {conclusion.application && (
                            <div style={{
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                fontSize: '12px',
                                color: '#7c3aed',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                marginBottom: '6px'
                              }}>
                                Application to Your Goals:
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: '#6b46c1',
                                lineHeight: '1.4'
                              }}>
                                {conclusion.application}
                              </div>
                            </div>
                          )}

                          {conclusion.nextSteps && (
                            <div style={{
                              fontSize: '12px',
                              color: '#dc2626',
                              backgroundColor: '#fef2f2',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #dc262620'
                            }}>
                              <strong>🎯 Next Steps:</strong> {conclusion.nextSteps}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                fontSize: '11px',
                color: COLORS.gray,
                textAlign: message.sender === 'user' ? 'right' : 'left',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '8px'
              }}>
                <span>{
                  (() => {
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
                  })()
                }</span>
                {message.profileUpdated && (
                  <span style={{
                    background: COLORS.success,
                    color: COLORS.white,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}>
                    Profile Updated
                  </span>
                )}
                
                {/* Feedback buttons for AI messages */}
                {message.sender === 'ai' && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                    marginLeft: '8px'
                  }}>
                    <button
                      onClick={() => handleMessageFeedback(message.id, 'positive')}
                      style={{
                        background: messageFeedback[message.id] === 'positive' ? COLORS.success : 'transparent',
                        color: messageFeedback[message.id] === 'positive' ? COLORS.white : COLORS.gray,
                        border: `1px solid ${messageFeedback[message.id] === 'positive' ? COLORS.success : COLORS.gray}`,
                        borderRadius: '12px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.2s ease',
                        minWidth: '24px',
                        height: '20px',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (messageFeedback[message.id] !== 'positive') {
                          e.target.style.background = COLORS.success + '20';
                          e.target.style.borderColor = COLORS.success;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (messageFeedback[message.id] !== 'positive') {
                          e.target.style.background = 'transparent';
                          e.target.style.borderColor = COLORS.gray;
                        }
                      }}
                      title="This response was helpful"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleMessageFeedback(message.id, 'negative')}
                      style={{
                        background: messageFeedback[message.id] === 'negative' ? COLORS.error : 'transparent',
                        color: messageFeedback[message.id] === 'negative' ? COLORS.white : COLORS.gray,
                        border: `1px solid ${messageFeedback[message.id] === 'negative' ? COLORS.error : COLORS.gray}`,
                        borderRadius: '12px',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.2s ease',
                        minWidth: '24px',
                        height: '20px',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (messageFeedback[message.id] !== 'negative') {
                          e.target.style.background = COLORS.error + '20';
                          e.target.style.borderColor = COLORS.error;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (messageFeedback[message.id] !== 'negative') {
                          e.target.style.background = 'transparent';
                          e.target.style.borderColor = COLORS.gray;
                        }
                      }}
                      title="This response could be improved"
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Recent Additions Indicators */}
      {recentAdditions.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          {recentAdditions.map((addition) => {
            const getIndicatorConfig = (type) => {
              switch (type) {
                case 'insights':
                  return { icon: '✅', label: 'Insight captured', color: COLORS.success, bg: '#f0f9ff' };
                case 'books':
                  return { icon: '📚', label: 'Added to reading list', color: '#8b5cf6', bg: '#faf5ff' };
                case 'universities':
                  return { icon: '🏛️', label: 'University research added', color: '#3b82f6', bg: '#eff6ff' };
                case 'activities':
                  return { icon: '🎯', label: 'Activity tracked', color: '#f59e0b', bg: '#fffbeb' };
                case 'profile':
                  return { icon: '✅', label: 'Profile updated', color: COLORS.teal, bg: '#f0fdfa' };
                default:
                  return { icon: '✅', label: 'Item added', color: COLORS.success, bg: '#f0f9ff' };
              }
            };

            const config = getIndicatorConfig(addition.type);
            
            return (
              <div
                key={addition.id}
                style={{
                  background: config.bg,
                  border: `2px solid ${config.color}20`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  animation: 'slideInFromRight 0.5s ease-out',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{
                  fontSize: '20px',
                  minWidth: '24px',
                  textAlign: 'center'
                }}>
                  {config.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: config.color,
                    fontWeight: '600',
                    fontSize: '14px',
                    marginBottom: '2px'
                  }}>
                    {config.label}
                  </div>
                  <div style={{
                    color: '#6b7280',
                    fontSize: '12px'
                  }}>
                    {addition.count} {addition.count === 1 ? 'item' : 'items'} • Just now
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Input Area */}
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        padding: '16px 20px',
        zIndex: 1000
      }}>
        {/* Compact suggestion prompts */}
        {messages.length <= 1 && (
          <div style={{ marginBottom: '8px' }}>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              style={{
                background: 'linear-gradient(135deg, #e1dfff 0%, #f0f9ff 100%)',
                border: '2px solid #ccccff',
                color: '#2a4442',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '12px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
                transition: 'all 0.3s ease',
                maxWidth: '280px',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.25)';
                e.target.style.background = 'linear-gradient(135deg, #d4d0ff 0%, #e0f2fe 100%)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
                e.target.style.background = 'linear-gradient(135deg, #e1dfff 0%, #f0f9ff 100%)';
              }}
            >
              <span style={{ fontSize: '18px' }}>💡</span>
              <span>{showSuggestions ? 'Hide' : 'Get'} Writing Prompts</span>
              <span style={{ fontSize: '14px', opacity: 0.7 }}>
                {showSuggestions ? '▼' : '▶'}
              </span>
            </button>
            
            {showSuggestions && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: '900px',
                margin: '0 auto 20px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                border: '2px solid #ccccff',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.1)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{
                    margin: '0 0 4px 0',
                    color: '#2a4442',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    ✨ Writing Prompts
                  </h4>
                  <p style={{
                    margin: '0',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    Click any prompt to get started with meaningful content
                  </p>
                </div>
                {getEnhancedSuggestionPrompts().slice(0, 3).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(prompt);
                      setShowSuggestions(false);
                    }}
                    style={{
                      background: 'white',
                      border: '2px solid #e1dfff',
                      padding: '16px 20px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      color: '#374151',
                      cursor: 'pointer',
                      textAlign: 'left',
                      lineHeight: '1.4',
                      transition: 'all 0.3s ease',
                      fontWeight: '500',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f8f7ff';
                      e.target.style.borderColor = '#ccccff';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.borderColor = '#e1dfff';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.05)';
                    }}
                  >
                    <span style={{ fontSize: '16px', marginRight: '8px' }}>💭</span>
                    {prompt.length > 120 ? prompt.substring(0, 120) + '...' : prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share detailed learning experiences, book reflections, or project insights. The more thoughtful your input, the higher-quality insights I can extract for your university applications..."
              rows="3"
              disabled={loading}
              maxLength={2000}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: `2px solid ${COLORS.teal}40`,
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                color: COLORS.darkGray,
                lineHeight: '1.5',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COLORS.teal;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${COLORS.teal}40`;
              }}
            />
            
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '12px',
              fontSize: '11px',
              color: input.length > 1800 ? COLORS.warning : COLORS.gray
            }}>
              {input.length}/2000
            </div>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              background: loading || !input.trim() 
                ? COLORS.gray 
                : `linear-gradient(135deg, ${COLORS.teal} 0%, #20B2AA 100%)`,
              color: COLORS.white,
              border: 'none',
              borderRadius: '12px',
              padding: '16px 20px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              minWidth: '120px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: !loading && input.trim() ? '0 4px 12px rgba(0, 206, 209, 0.3)' : 'none'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Analyzing...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>

      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInFromRight {
          0% { 
            opacity: 0;
            transform: translateX(100px) scale(0.9);
          }
          100% { 
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
      
      {/* Global CSS for markdown styling */}
      <style jsx global>{`
        .message-content strong {
          font-weight: 600;
          color: inherit;
        }
      `}</style>
    </div>
  );
};

export default EnhancedStudyBuddy;