import React, { useState, useEffect } from 'react';

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
  lightPurple: '#ccccff',
  pastelAmber: '#fef3c7',
  primary: '#00ced1',
  secondary: '#5b8f8a',
  glassBg: 'rgba(255, 255, 255, 0.95)',
  shadowLight: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowMedium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  shadowLarge: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

// Apple-inspired Typography System
const TYPOGRAPHY = {
  h1: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1.25',
    letterSpacing: '-0.025em'
  },
  h2: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '1.3',
    letterSpacing: '-0.02em'
  },
  h3: {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.35',
    letterSpacing: '-0.01em'
  },
  h4: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '1.4',
    letterSpacing: '-0.005em'
  },
  h5: {
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '1.45'
  },
  h6: {
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.5'
  },
  body: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.55',
    letterSpacing: '0.01em'
  },
  bodySmall: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.6',
    letterSpacing: '0.01em'
  },
  caption: {
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '1.5',
    letterSpacing: '0.02em'
  }
};

const ANIMATIONS = {
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  hover: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  fadeIn: 'opacity 0.5s ease-in-out'
};

// Custom Icons
const ICONS = {
  trophy: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftrophy.svg?alt=media&token=ac0b5d6a-9b79-4cb4-afd2-0fa07f70d443',
  toaster: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftoaster.svg?alt=media&token=744ba4bf-336d-4dd2-b2dc-25bd4df85af6',
  ghost: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20white.svg?alt=media&token=599d4414-99cf-4084-858b-5b3512557023',
  bulb: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbulb.svg?alt=media&token=1f21ae0e-764d-4b03-ba1d-f1423329c325',
  bookYellow: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook_yellow.svg?alt=media&token=d951aa02-015d-45eb-9782-9ed989aa549c',
  bookPink: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook_pink.svg?alt=media&token=eca318d2-2785-4ffe-b806e15381734a28',
  bagback: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbagback.svg?alt=media&token=65739e08-36db-4810-951c-91641f5d0084'
};

const EnhancedSupercurricularTab = ({ profile, currentSubjects, universityTargets, onProfileUpdate }) => {
  const [activeSection, setActiveSection] = useState('portfolio');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [projectType, setProjectType] = useState('high-level');
  const [newSource, setNewSource] = useState({
    type: 'book', // 'book', 'article', 'documentary', 'lecture', 'interview', 'podcast', 'website'
    author: '',
    year: '',
    title: '',
    publication: '',
    citations: '',
    doi: '',
    pages: '',
    url: '',
    description: ''
  });
  
  // Enhanced Source Modal State
  const [sourceData, setSourceData] = useState({});
  const [sourceType, setSourceType] = useState('book');
  const [sourceProjectId, setSourceProjectId] = useState(null);
  
  // Use profile data directly - no localStorage
  const conclusions = profile?.supercurricularConclusions || [];
  const argumentsList = profile?.supercurricularArguments || [];
  const methodology = profile?.supercurricularMethodology || [];
  const books = profile?.supercurricular?.lowLevel?.books || [];
  const insights = profile?.knowledgeInsights || profile?.insights || [];
  
  // Check for books without IDs and fix them
  React.useEffect(() => {
    const booksNeedingIds = books.filter(book => !book.id);
    if (booksNeedingIds.length > 0) {
      console.log('DEBUG: Found books without IDs, fixing...', booksNeedingIds.map(b => b.title));
      const booksWithIds = books.map((book, index) => {
        if (!book.id) {
          return { ...book, id: Date.now() + index };
        }
        return book;
      });
      
      // Update the profile with books that have IDs
      if (onProfileUpdate) {
        const updatedProfile = {
          ...profile,
          supercurricular: {
            ...profile?.supercurricular,
            lowLevel: {
              ...profile?.supercurricular?.lowLevel,
              books: booksWithIds
            }
          }
        };
        onProfileUpdate(updatedProfile);
      }
    }
  }, [books.length]); // Only run when books array length changes
  
  const [showAddEngagementModal, setShowAddEngagementModal] = useState(false);
  const [engagementType, setEngagementType] = useState('conclusions'); // 'conclusions', 'arguments', 'methodology'
  const [newEngagement, setNewEngagement] = useState('');
  const [engagementProjectId, setEngagementProjectId] = useState(null);
  
  // Book-related state
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    status: 'planned', // 'planned', 'reading', 'completed'
    genre: '',
    pages: '',
    startDate: '',
    endDate: '',
    rating: 0,
    notes: '',
    personalStatement: false
  });
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  
  // Book insight state
  const [showAddBookInsightModal, setShowAddBookInsightModal] = useState(false);
  const [selectedBookForInsight, setSelectedBookForInsight] = useState(null);
  const [newBookInsight, setNewBookInsight] = useState('');

  // Edit/Delete functionality state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null); // 'project', 'book', 'insight'
  
  // Feedback notification state
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  
  // Form states
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'planned',
    category: '',
    startDate: '',
    endDate: '',
    skills: [],
    sources: [],
    personalStatement: false
  });

  // Extract data from profile
  const supercurricular = profile?.supercurricular || {};
  const highLevelProjects = supercurricular.highLevel || [];
  const mediumLevelActivities = supercurricular.mediumLevel || [];
  const lowLevelActivities = supercurricular.lowLevel || {};
  
  const lectures = lowLevelActivities.lectures || [];
  const moocs = lowLevelActivities.moocs || [];
  const societies = lowLevelActivities.societies || [];
  const blogs = lowLevelActivities.blogs || [];
  const documentaries = lowLevelActivities.documentaries || [];
  const museums = lowLevelActivities.museums || [];
  const newsletters = lowLevelActivities.newsletters || [];

  // Handlers
  const handleAddProject = () => {
    if (!newProject.name.trim()) return;
    
    const project = {
      ...newProject,
      id: Date.now(),
      type: projectType,
      dateAdded: new Date().toISOString()
    };
    
    let updatedProfile;
    
    if (projectType === 'high-level') {
      const updatedHighLevel = [...highLevelProjects, project];
      updatedProfile = {
        ...profile,
        supercurricular: {
          ...supercurricular,
          highLevel: updatedHighLevel,
          mediumLevel: mediumLevelActivities,
          lowLevel: lowLevelActivities
        }
      };
    } else if (projectType === 'medium-level') {
      const updatedMediumLevel = [...mediumLevelActivities, project];
      updatedProfile = {
        ...profile,
        supercurricular: {
          ...supercurricular,
          highLevel: highLevelProjects,
          mediumLevel: updatedMediumLevel,
          lowLevel: lowLevelActivities
        }
      };
    } else if (projectType === 'low-level') {
      // Add to low-level activities array
      const updatedLowLevel = { ...lowLevelActivities };
      if (!updatedLowLevel.activities) updatedLowLevel.activities = [];
      updatedLowLevel.activities.push(project);
      
      updatedProfile = {
        ...profile,
        supercurricular: {
          ...supercurricular,
          highLevel: highLevelProjects,
          mediumLevel: mediumLevelActivities,
          lowLevel: updatedLowLevel
        }
      };
    }
    
    // Update parent component
    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    }
    
    setNewProject({
      name: '',
      description: '',
      status: 'planned',
      category: '',
      startDate: '',
      endDate: '',
      skills: [],
      sources: [],
      personalStatement: false
    });
    setShowAddProjectModal(false);
  };

  const handleAddSource = (projectId, sourceData) => {
    if (!sourceData.title?.trim() || !sourceData.authors?.trim() || !sourceData.year) return;
    
    const source = {
      id: Date.now(),
      type: sourceData.type,
      authors: sourceData.authors,
      year: sourceData.year,
      title: sourceData.title,
      venue: sourceData.venue,
      pages: sourceData.pages,
      doi: sourceData.doi,
      citations: sourceData.citations,
      insights: sourceData.insights,
      dateAdded: new Date().toISOString()
    };
    
    const updatedHighLevel = highLevelProjects.map(project => {
      if (project.id === projectId) {
        return { 
          ...project, 
          sources: [...(project.sources || []), source] 
        };
      }
      return project;
    });
    
    const updatedMedium = mediumLevelActivities.map(activity => {
      if (activity.id === projectId) {
        return { 
          ...activity, 
          sources: [...(activity.sources || []), source] 
        };
      }
      return activity;
    });
    
    // Update parent component
    const updatedProfile = {
      ...profile,
      supercurricular: {
        ...supercurricular,
        highLevel: updatedHighLevel,
        mediumLevel: updatedMedium
      }
    };
    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    }
    
    // Reset form
    setSourceData({});
    setSourceType('book');
    setSourceProjectId(null);
    setShowAddSourceModal(false);
  };

  const handleTogglePSTag = (projectId) => {
    const updatedHighLevel = highLevelProjects.map(project => {
      if (project.id === projectId) {
        return { ...project, personalStatement: !project.personalStatement };
      }
      return project;
    });
    
    const updatedMedium = mediumLevelActivities.map(activity => {
      if (activity.id === projectId) {
        return { ...activity, personalStatement: !activity.personalStatement };
      }
      return activity;
    });
    
    // Update profile using the proper callback
    const updatedProfile = {
      ...profile,
      supercurricular: {
        ...supercurricular,
        highLevel: updatedHighLevel,
        mediumLevel: updatedMedium
      }
    };
    
    // Call onProfileUpdate to update parent component
    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile);
    }
    
    // Show visual feedback
    const item = [...updatedHighLevel, ...updatedMedium].find(item => item.id === projectId);
    if (item) {
      const action = item.personalStatement ? 'added to' : 'removed from';
      const message = `"${item.name}" ${action} Personal Statement draft`;
      setFeedbackMessage(message);
      setShowFeedback(true);
      
      // Auto-hide feedback after 3 seconds
      setTimeout(() => {
        setShowFeedback(false);
      }, 3000);
    }
  };

  const handleAddEngagement = (projectId, engagementText, type) => {
    if (!engagementText.trim() || !type || !projectId) return;
    
    const newEngagementObj = {
      id: Date.now(),
      content: engagementText,
      type: type, // 'conclusions', 'arguments', 'methodology'
      dateAdded: new Date().toISOString(),
      personalStatement: false,
      evidenceStrength: 7, // Default strength, can be enhanced later
      subjectArea: '', // To be filled by Study Buddy integration
      universityRelevance: 7 // Default relevance
    };
    
    // Find which project to update
    const projectInHighLevel = highLevelProjects.find(p => p.id === projectId);
    const projectInMediumLevel = mediumLevelActivities.find(p => p.id === projectId);
    const projectInLowLevel = lowLevelActivities?.activities?.find(p => p.id === projectId);
    
    // Update the appropriate project with the new engagement
    if (onProfileUpdate) {
      let updatedProfile = { ...profile };
      
      if (projectInHighLevel) {
        // Update high-level project
        const updatedHighLevel = highLevelProjects.map(project => {
          if (project.id === projectId) {
            const engagements = project.engagements || [];
            return { ...project, engagements: [...engagements, newEngagementObj] };
          }
          return project;
        });
        
        updatedProfile = {
          ...profile,
          supercurricular: {
            ...profile?.supercurricular,
            highLevel: updatedHighLevel
          }
        };
      } else if (projectInMediumLevel) {
        // Update medium-level activity
        const updatedMediumLevel = mediumLevelActivities.map(activity => {
          if (activity.id === projectId) {
            const engagements = activity.engagements || [];
            return { ...activity, engagements: [...engagements, newEngagementObj] };
          }
          return activity;
        });
        
        updatedProfile = {
          ...profile,
          supercurricular: {
            ...profile?.supercurricular,
            mediumLevel: updatedMediumLevel
          }
        };
      } else if (projectInLowLevel) {
        // Update low-level activity
        const updatedLowLevel = lowLevelActivities.activities.map(activity => {
          if (activity.id === projectId) {
            const engagements = activity.engagements || [];
            return { ...activity, engagements: [...engagements, newEngagementObj] };
          }
          return activity;
        });
        
        updatedProfile = {
          ...profile,
          supercurricular: {
            ...profile?.supercurricular,
            lowLevel: {
              ...lowLevelActivities,
              activities: updatedLowLevel
            }
          }
        };
      }
      
      onProfileUpdate(updatedProfile);
    }
    
    setNewEngagement('');
    setShowAddEngagementModal(false);
    setEngagementProjectId(null);
    setEngagementType('conclusions');
  };

  // Book handlers
  const handleAddBook = (bookData) => {
    const newBookWithId = {
      ...bookData,
      id: Date.now(),
      dateAdded: new Date().toISOString(),
      insights: []
    };
    
    const updatedBooks = [...books, newBookWithId];
    
    // Update profile via parent component
    if (onProfileUpdate) {
      const updatedProfile = {
        ...profile,
        supercurricular: {
          ...profile?.supercurricular,
          lowLevel: {
            ...profile?.supercurricular?.lowLevel,
            books: updatedBooks
          }
        }
      };
      onProfileUpdate(updatedProfile);
    }
    
    setShowAddBookModal(false);
    setNewBook({
      title: '',
      author: '',
      status: 'planned',
      genre: '',
      pages: '',
      startDate: '',
      endDate: '',
      rating: 0,
      notes: '',
      personalStatement: false
    });
  };

  const handleUpdateBookStatus = (bookId, newStatus) => {
    const updatedBooks = books.map(book => 
      book.id === bookId ? { ...book, status: newStatus } : book
    );
    
    // Update profile via parent component
    if (onProfileUpdate) {
      const updatedProfile = {
        ...profile,
        supercurricular: {
          ...profile?.supercurricular,
          lowLevel: {
            ...profile?.supercurricular?.lowLevel,
            books: updatedBooks
          }
        }
      };
      onProfileUpdate(updatedProfile);
    }
  };

  const handleDeleteBook = (bookId) => {
    const updatedBooks = books.filter(book => book.id !== bookId);
    
    // Update profile via parent component  
    if (onProfileUpdate) {
      const updatedProfile = {
        ...profile,
        supercurricular: {
          ...profile?.supercurricular,
          lowLevel: {
            ...profile?.supercurricular?.lowLevel,
            books: updatedBooks
          }
        }
      };
      onProfileUpdate(updatedProfile);
    }
  };

  const handleToggleBookPS = (bookId) => {
    console.log('DEBUG: handleToggleBookPS called with bookId:', bookId);
    console.log('DEBUG: Current books:', books.map(b => ({ id: b.id, title: b.title, personalStatement: b.personalStatement })));
    
    const updatedBooks = books.map(book => {
      if (book.id === bookId) {
        console.log('DEBUG: Updating book:', book.title, 'from', book.personalStatement, 'to', !book.personalStatement);
        return { ...book, personalStatement: !book.personalStatement };
      }
      return book;
    });
    
    console.log('DEBUG: Updated books:', updatedBooks.map(b => ({ id: b.id, title: b.title, personalStatement: b.personalStatement })));
    
    // Update profile via parent component
    if (onProfileUpdate) {
      const updatedProfile = {
        ...profile,
        supercurricular: {
          ...profile?.supercurricular,
          lowLevel: {
            ...profile?.supercurricular?.lowLevel,
            books: updatedBooks
          }
        }
      };
      onProfileUpdate(updatedProfile);
    }
  };

  const handleAddBookInsight = (bookId, insightText) => {
    if (!insightText.trim() || !bookId) return;
    
    const newInsight = {
      id: Date.now(),
      bookId: bookId,
      content: insightText,
      type: 'book-insight',
      dateAdded: new Date().toISOString(),
      personalStatement: false
    };
    
    const updatedBooks = books.map(book => {
      if (book.id === bookId) {
        return {
          ...book,
          insights: [...(book.insights || []), newInsight]
        };
      }
      return book;
    });
    
    // Update profile via parent component
    if (onProfileUpdate) {
      const updatedProfile = {
        ...profile,
        supercurricular: {
          ...profile?.supercurricular,
          lowLevel: {
            ...profile?.supercurricular?.lowLevel,
            books: updatedBooks
          }
        }
      };
      onProfileUpdate(updatedProfile);
    }
    
    setNewBookInsight('');
    setShowAddBookInsightModal(false);
    setSelectedBookForInsight(null);
  };

  // Edit functionality handlers
  const handleEditItem = (item, type) => {
    setEditingItem({ ...item });
    setEditingType(type);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editingType) return;

    const updatedProfile = { ...profile };

    switch (editingType) {
      case 'high-level':
        const highLevelIndex = updatedProfile.supercurricular.highLevel.findIndex(p => p.id === editingItem.id);
        if (highLevelIndex !== -1) {
          updatedProfile.supercurricular.highLevel[highLevelIndex] = editingItem;
        }
        break;
      case 'medium-level':
        const mediumLevelIndex = updatedProfile.supercurricular.mediumLevel.findIndex(p => p.id === editingItem.id);
        if (mediumLevelIndex !== -1) {
          updatedProfile.supercurricular.mediumLevel[mediumLevelIndex] = editingItem;
        }
        break;
      case 'low-level':
        const lowLevelIndex = updatedProfile.supercurricular.lowLevel.findIndex(p => p.id === editingItem.id);
        if (lowLevelIndex !== -1) {
          updatedProfile.supercurricular.lowLevel[lowLevelIndex] = editingItem;
        }
        break;
      case 'book':
        const bookIndex = updatedProfile.supercurricular.books.findIndex(b => b.id === editingItem.id);
        if (bookIndex !== -1) {
          updatedProfile.supercurricular.books[bookIndex] = editingItem;
        }
        break;
      default:
        break;
    }

    onProfileUpdate(updatedProfile);
    setShowEditModal(false);
    setEditingItem(null);
    setEditingType(null);
  };

  // Delete functionality handlers
  const handleDeleteItem = (itemId, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'book' ? 'book' : 'activity'}?`)) {
      return;
    }

    const updatedProfile = { ...profile };

    switch (type) {
      case 'high-level':
        updatedProfile.supercurricular.highLevel = updatedProfile.supercurricular.highLevel.filter(p => p.id !== itemId);
        break;
      case 'medium-level':
        updatedProfile.supercurricular.mediumLevel = updatedProfile.supercurricular.mediumLevel.filter(p => p.id !== itemId);
        break;
      case 'low-level':
        updatedProfile.supercurricular.lowLevel = updatedProfile.supercurricular.lowLevel.filter(p => p.id !== itemId);
        break;
      case 'book':
        updatedProfile.supercurricular.books = updatedProfile.supercurricular.books.filter(b => b.id !== itemId);
        break;
      default:
        break;
    }

    onProfileUpdate(updatedProfile);
  };

  const generateBookRecommendations = () => {
    setGeneratingRecommendations(true);
    
    // Simulate API delay for realistic UX
    setTimeout(() => {
      const newRecommendations = [
        {
          title: 'Sapiens: A Brief History of Humankind',
          author: 'Yuval Noah Harari',
          reason: 'Broad intellectual perspective on human development',
          genre: 'History/Philosophy'
        },
        {
          title: 'The Art of War',
          author: 'Sun Tzu',
          reason: 'Strategic thinking and methodology',
          genre: 'Philosophy/Strategy'
        },
        {
          title: 'Thinking, Fast and Slow',
          author: 'Daniel Kahneman',
          reason: 'Decision-making and analytical frameworks',
          genre: 'Psychology/Science'
        },
        {
          title: 'The Structure of Scientific Revolutions',
          author: 'Thomas S. Kuhn',
          reason: 'Understanding paradigm shifts in knowledge',
          genre: 'Philosophy of Science'
        }
      ];

      // Add recommendations to the reading list
      const existingTitles = books.map(b => b.title.toLowerCase());
      const uniqueRecs = newRecommendations.filter(rec => 
        !existingTitles.includes(rec.title.toLowerCase())
      );

      if (uniqueRecs.length > 0) {
        const updatedBooks = [...books, ...uniqueRecs.map(rec => ({
          id: Date.now() + Math.random(),
          title: rec.title,
          author: rec.author,
          genre: rec.genre,
          notes: rec.reason,
          status: 'planned',
          dateAdded: new Date().toISOString(),
          personalStatement: false,
          insights: []
        }))];

        // Update profile via parent component
        if (onProfileUpdate) {
          const updatedProfile = {
            ...profile,
            supercurricular: {
              ...profile?.supercurricular,
              lowLevel: {
                ...profile?.supercurricular?.lowLevel,
                books: updatedBooks
              }
            }
          };
          onProfileUpdate(updatedProfile);
        }
      }

      setGeneratingRecommendations(false);
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'in-progress': return COLORS.warning;
      case 'planned': return COLORS.gray;
      default: return COLORS.gray;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'planned': return 'Planned';
      default: return status;
    }
  };

  // Modal Components (moved outside to prevent re-rendering issues)
  const renderAddProjectModal = () => {
    if (!showAddProjectModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
        padding: '20px',
        paddingTop: '10vh',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div style={{
          background: COLORS.glassBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: 'calc(80vh - 40px)',
          overflow: 'auto',
          boxShadow: COLORS.shadowLarge,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'scale(0.95)',
          animation: 'modalSlideIn 0.3s ease-out forwards'
        }}>
          <h3 style={{ 
            margin: '0 0 24px 0', 
            color: COLORS.dark,
            fontSize: '24px',
            fontWeight: '600'
          }}>
            Add {projectType === 'high-level' ? 'High-Level Project' : 'Activity/Competition'}
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              color: COLORS.dark,
              fontWeight: '500'
            }}>
              Name *
            </label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              placeholder="e.g., Research Project on Climate Change"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${COLORS.lightGray}`,
                borderRadius: '12px',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.primary}
              onBlur={(e) => e.target.style.borderColor = COLORS.lightGray}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              color: COLORS.dark,
              fontWeight: '500'
            }}>
              Description
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Describe what you did, skills developed, and impact made..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${COLORS.lightGray}`,
                borderRadius: '12px',
                fontSize: '15px',
                resize: 'vertical',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.primary}
              onBlur={(e) => e.target.style.borderColor = COLORS.lightGray}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                color: COLORS.dark,
                fontWeight: '500'
              }}>
                Status
              </label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${COLORS.lightGray}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: COLORS.white,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                color: COLORS.dark,
                fontWeight: '500'
              }}>
                Category
              </label>
              <input
                type="text"
                value={newProject.category}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                placeholder="e.g., Research, Competition"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${COLORS.lightGray}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = COLORS.lightGray}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowAddProjectModal(false);
                setNewProject({
                  name: '',
                  description: '',
                  status: 'planned',
                  category: '',
                  startDate: '',
                  endDate: '',
                  skills: [],
                  sources: [],
                  personalStatement: false
                });
              }}
              style={{
                padding: '12px 24px',
                border: `2px solid ${COLORS.lightGray}`,
                borderRadius: '12px',
                background: COLORS.white,
                color: COLORS.gray,
                fontSize: '15px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = COLORS.lightGray;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = COLORS.white;
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddProject}
              disabled={!newProject.name.trim()}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '12px',
                background: newProject.name.trim() 
                  ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
                  : COLORS.lightGray,
                color: newProject.name.trim() ? COLORS.white : COLORS.gray,
                fontSize: '15px',
                cursor: newProject.name.trim() ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                boxShadow: newProject.name.trim() ? '0 4px 14px 0 rgba(139, 92, 246, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (newProject.name.trim()) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px 0 rgba(139, 92, 246, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (newProject.name.trim()) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 14px 0 rgba(139, 92, 246, 0.25)';
                }
              }}
            >
              Add {projectType === 'high-level' ? 'Project' : 'Activity'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddSourceModal = () => {
    if (!showAddSourceModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
        padding: '20px',
        paddingTop: '10vh',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div style={{
          background: COLORS.glassBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: 'calc(80vh - 40px)',
          overflow: 'auto',
          boxShadow: COLORS.shadowLarge,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'scale(0.95)',
          animation: 'modalSlideIn 0.3s ease-out forwards'
        }}>
          <h3 style={{ 
            margin: '0 0 24px 0', 
            color: COLORS.dark,
            fontSize: '24px',
            fontWeight: '600'
          }}>
            📚 Add Source
          </h3>

          {/* Source Type Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
              Source Type
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['book', 'journal', 'documentary', 'podcast', 'lecture', 'interview', 'website', 'other'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSourceType(type)}
                  style={{
                    padding: '6px 12px',
                    border: `2px solid ${sourceType === type ? COLORS.primary : COLORS.lightGray}`,
                    borderRadius: '20px',
                    background: sourceType === type ? COLORS.primary : COLORS.white,
                    color: sourceType === type ? COLORS.white : COLORS.gray,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Project Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
              Related Project/Activity
            </label>
            <select
              value={sourceProjectId || ''}
              onChange={(e) => setSourceProjectId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">Select a project or activity...</option>
              {[...highLevelProjects, ...mediumLevelActivities].map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Author(s) */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
                Author(s) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={sourceData.authors || ''}
                onChange={(e) => setSourceData(prev => ({ ...prev, authors: e.target.value }))}
                placeholder="e.g., Smith, J. & Johnson, M."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Year */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
                Year <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                value={sourceData.year || ''}
                onChange={(e) => setSourceData(prev => ({ ...prev, year: e.target.value }))}
                placeholder="2024"
                min="1800"
                max="2030"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
              Full Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={sourceData.title || ''}
              onChange={(e) => setSourceData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Complete title of the work"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Publication Venue & Pages */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
                Publication Venue
              </label>
              <input
                type="text"
                value={sourceData.venue || ''}
                onChange={(e) => setSourceData(prev => ({ ...prev, venue: e.target.value }))}
                placeholder="Journal, Publisher, Platform, etc."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
                Pages/Duration
              </label>
              <input
                type="text"
                value={sourceData.pages || ''}
                onChange={(e) => setSourceData(prev => ({ ...prev, pages: e.target.value }))}
                placeholder="pp. 45-67"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* DOI/URL & Citations */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
                DOI or URL
              </label>
              <input
                type="text"
                value={sourceData.doi || ''}
                onChange={(e) => setSourceData(prev => ({ ...prev, doi: e.target.value }))}
                placeholder="https://doi.org/10.1000/xyz or URL"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
                Citations
              </label>
              <input
                type="number"
                value={sourceData.citations || ''}
                onChange={(e) => setSourceData(prev => ({ ...prev, citations: e.target.value }))}
                placeholder="0"
                min="0"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Key Insights/Relevance */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
              Key Insights & Relevance
            </label>
            <textarea
              value={sourceData.insights || ''}
              onChange={(e) => setSourceData(prev => ({ ...prev, insights: e.target.value }))}
              placeholder="What key insights did you gain? How does this source relate to your project/interests?"
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${COLORS.lightGray}`,
                borderRadius: '12px',
                fontSize: '15px',
                resize: 'vertical',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.primary}
              onBlur={(e) => e.target.style.borderColor = COLORS.lightGray}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowAddSourceModal(false);
                setSourceData({});
                setSourceType('book');
                setSourceProjectId(null);
              }}
              style={{
                padding: '12px 24px',
                border: `2px solid ${COLORS.lightGray}`,
                borderRadius: '12px',
                background: COLORS.white,
                color: COLORS.gray,
                fontSize: '15px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = COLORS.lightGray;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = COLORS.white;
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddSource(sourceProjectId, { ...sourceData, type: sourceType })}
              disabled={!sourceData.authors?.trim() || !sourceData.title?.trim() || !sourceData.year || !sourceProjectId}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '12px',
                background: (sourceData.authors?.trim() && sourceData.title?.trim() && sourceData.year && sourceProjectId)
                  ? `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successLight} 100%)`
                  : COLORS.lightGray,
                color: (sourceData.authors?.trim() && sourceData.title?.trim() && sourceData.year && sourceProjectId) ? COLORS.white : COLORS.gray,
                fontSize: '15px',
                cursor: (sourceData.authors?.trim() && sourceData.title?.trim() && sourceData.year && sourceProjectId) ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                boxShadow: (sourceData.authors?.trim() && sourceData.title?.trim() && sourceData.year && sourceProjectId) ? '0 4px 14px 0 rgba(16, 185, 129, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (sourceData.authors?.trim() && sourceData.title?.trim() && sourceData.year && sourceProjectId) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px 0 rgba(16, 185, 129, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (sourceData.authors?.trim() && sourceData.title?.trim() && sourceData.year && sourceProjectId) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.25)';
                }
              }}
            >
              📚 Add Source
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Engagement Modal for Conclusions, Arguments, Methodology
  const renderAddEngagementModal = () => {
    if (!showAddEngagementModal) return null;
    
    const engagementConfig = {
      conclusions: {
        title: 'Add Conclusion',
        icon: '💡',
        color: COLORS.darkGreen,
        placeholder: 'What did you discover or learn? Describe key findings, realizations, or new understanding...',
        description: 'Document what you learned, discovered, or realized through this intellectual activity.',
        examples: [
          'Key findings from reading academic papers',
          'Realizations from attending lectures',
          'New understanding from research projects',
          'Connections between theories'
        ]
      },
      arguments: {
        title: 'Add Argument',
        icon: '🎯',
        color: COLORS.purpleDark,
        placeholder: 'What position or thesis did you develop? Describe your argument, critical analysis, or intellectual stance...',
        description: 'Document intellectual positions, thesis statements, or critical analyses you\'ve developed.',
        examples: [
          'Thesis statements from essays',
          'Positions on controversial topics',
          'Critical analysis of theories',
          'Debate positions argued'
        ]
      },
      methodology: {
        title: 'Add Methodology',
        icon: '🔬',
        color: COLORS.navyBlue,
        placeholder: 'What systematic approach did you use? Describe your methods, procedures, or analytical framework...',
        description: 'Document systematic approaches, research methods, or analytical frameworks you employed.',
        examples: [
          'Experimental procedures designed',
          'Research methods employed',
          'Analytical techniques used',
          'Problem-solving frameworks'
        ]
      }
    };
    
    const config = engagementConfig[engagementType] || engagementConfig.conclusions;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
        padding: '20px',
        paddingTop: '10vh',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div style={{
          background: COLORS.glassBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: 'calc(80vh - 40px)',
          overflow: 'auto',
          boxShadow: COLORS.shadowLarge,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'scale(0.95)',
          animation: 'modalSlideIn 0.3s ease-out forwards'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px', marginRight: '16px' }}>{config.icon}</span>
            <div>
              <h3 style={{ margin: '0', color: config.color, fontSize: '24px', fontWeight: '600' }}>
                {config.title}
              </h3>
              <p style={{ margin: '4px 0 0 0', color: COLORS.gray, fontSize: '14px' }}>
                {config.description}
              </p>
            </div>
          </div>

          {/* Engagement Type Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
              Engagement Type
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Object.entries(engagementConfig).map(([type, typeConfig]) => (
                <button
                  key={type}
                  onClick={() => setEngagementType(type)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: engagementType === type ? `2px solid ${typeConfig.color}` : '1px solid #d1d5db',
                    background: engagementType === type ? `${typeConfig.color}20` : 'white',
                    color: engagementType === type ? typeConfig.color : COLORS.gray,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {typeConfig.icon} {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Project Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
              Related Project/Activity
            </label>
            <select
              value={engagementProjectId || ''}
              onChange={(e) => setEngagementProjectId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">Select a project or activity...</option>
              {[...highLevelProjects, ...mediumLevelActivities].map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '600' }}>
              {config.title} Content
            </label>
            <textarea
              value={newEngagement}
              onChange={(e) => setNewEngagement(e.target.value)}
              placeholder={config.placeholder}
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${config.color}40`,
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '120px'
              }}
            />
          </div>

          {/* Examples */}
          <div style={{ marginBottom: '24px', padding: '16px', background: `${config.color}10`, borderRadius: '8px', border: `1px solid ${config.color}30` }}>
            <h6 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: config.color }}>
              Examples of {engagementType}:
            </h6>
            <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '12px', color: COLORS.gray }}>
              {config.examples.map((example, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{example}</li>
              ))}
            </ul>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowAddEngagementModal(false);
                setNewEngagement('');
                setEngagementProjectId(null);
                setEngagementType('conclusions');
              }}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                background: 'white',
                color: COLORS.gray,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddEngagement(engagementProjectId, newEngagement, engagementType)}
              disabled={!newEngagement.trim() || !engagementProjectId}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '12px',
                background: (newEngagement.trim() && engagementProjectId) 
                  ? `linear-gradient(135deg, ${config.color} 0%, ${config.color}90 100%)`
                  : COLORS.lightGray,
                color: (newEngagement.trim() && engagementProjectId) ? 'white' : COLORS.gray,
                fontSize: '14px',
                cursor: (newEngagement.trim() && engagementProjectId) ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                boxShadow: (newEngagement.trim() && engagementProjectId) ? COLORS.shadowMedium : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {config.icon} Add {engagementType.charAt(0).toUpperCase() + engagementType.slice(1)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddBookModal = () => {
    if (!showAddBookModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
        padding: '20px',
        paddingTop: '10vh',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div style={{
          background: COLORS.glassBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: 'calc(80vh - 40px)',
          overflow: 'auto',
          boxShadow: COLORS.shadowLarge,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'scale(0.95)',
          animation: 'modalSlideIn 0.3s ease-out forwards'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{
              margin: '0',
              color: COLORS.dark,
              fontSize: '24px',
              fontWeight: '600'
            }}>
              📚 Add Book to Reading List
            </h3>
            <button
              onClick={() => setShowAddBookModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: COLORS.gray,
                padding: '8px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '500' }}>
                Book Title *
              </label>
              <input
                type="text"
                value={newBook.title}
                onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter the book title..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${COLORS.lightGray}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = COLORS.lightGray}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '500' }}>
                Author *
              </label>
              <input
                type="text"
                value={newBook.author}
                onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Enter the author's name..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${COLORS.lightGray}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = COLORS.lightGray}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '500' }}>
                Reading Status
              </label>
              <select
                value={newBook.status}
                onChange={(e) => setNewBook(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${COLORS.lightGray}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                <option value="planned">Planned to Read</option>
                <option value="reading">Currently Reading</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '500' }}>
                Genre
              </label>
              <input
                type="text"
                value={newBook.genre}
                onChange={(e) => setNewBook(prev => ({ ...prev, genre: e.target.value }))}
                placeholder="e.g. Biography, Science Fiction, Philosophy..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${COLORS.lightGray}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = COLORS.lightGray}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: COLORS.dark, fontWeight: '500' }}>
                Notes (Optional)
              </label>
              <textarea
                value={newBook.notes}
                onChange={(e) => setNewBook(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes, thoughts, or reasons for adding this book..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${COLORS.lightGray}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  resize: 'vertical',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = COLORS.lightGray}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button
              onClick={() => setShowAddBookModal(false)}
              style={{
                flex: 1,
                padding: '14px 24px',
                border: `2px solid ${COLORS.lightGray}`,
                borderRadius: '16px',
                background: COLORS.white,
                color: COLORS.gray,
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddBook(newBook)}
              disabled={!newBook.title.trim() || !newBook.author.trim()}
              style={{
                flex: 1,
                padding: '14px 24px',
                border: 'none',
                borderRadius: '16px',
                background: (newBook.title.trim() && newBook.author.trim()) 
                  ? `linear-gradient(135deg, ${COLORS.purpleDark} 0%, ${COLORS.lavender} 100%)`
                  : COLORS.lightGray,
                color: COLORS.white,
                fontSize: '16px',
                fontWeight: '600',
                cursor: (newBook.title.trim() && newBook.author.trim()) ? 'pointer' : 'not-allowed',
                boxShadow: (newBook.title.trim() && newBook.author.trim()) ? COLORS.shadowMedium : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              📚 Add Book
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddBookInsightModal = () => {
    if (!showAddBookInsightModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
        padding: '20px',
        paddingTop: '10vh',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div style={{
          background: COLORS.glassBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: 'calc(80vh - 40px)',
          overflow: 'auto',
          boxShadow: COLORS.shadowLarge,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'scale(0.95)',
          animation: 'modalSlideIn 0.3s ease-out forwards'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{
              margin: '0',
              color: COLORS.dark,
              fontSize: '24px',
              fontWeight: '600'
            }}>
              💡 Add Book Insight
            </h3>
            <button
              onClick={() => setShowAddBookInsightModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: COLORS.gray,
                padding: '8px'
              }}
            >
              ×
            </button>
          </div>
          
          {selectedBookForInsight && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: COLORS.dark,
                marginBottom: '4px'
              }}>
                {selectedBookForInsight.title}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: COLORS.gray,
                fontWeight: '500'
              }}>
                by {selectedBookForInsight.author}
              </div>
            </div>
          )}
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              color: COLORS.dark,
              fontWeight: '500'
            }}>
              What insights did you gain from this book? *
            </label>
            <textarea
              value={newBookInsight}
              onChange={(e) => setNewBookInsight(e.target.value)}
              placeholder="Describe key learnings, realizations, or insights you gained from reading this book. How did it change your perspective or understanding?"
              rows={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${COLORS.lightGray}`,
                borderRadius: '12px',
                fontSize: '15px',
                resize: 'vertical',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.primary}
              onBlur={(e) => e.target.style.borderColor = COLORS.lightGray}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={() => {
                setShowAddBookInsightModal(false);
                setNewBookInsight('');
                setSelectedBookForInsight(null);
              }}
              style={{
                padding: '12px 24px',
                border: `2px solid ${COLORS.lightGray}`,
                borderRadius: '12px',
                background: COLORS.white,
                color: COLORS.gray,
                fontSize: '15px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddBookInsight(selectedBookForInsight?.id, newBookInsight)}
              disabled={!newBookInsight.trim() || !selectedBookForInsight}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '12px',
                background: (newBookInsight.trim() && selectedBookForInsight) 
                  ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`
                  : COLORS.lightGray,
                color: (newBookInsight.trim() && selectedBookForInsight) ? COLORS.white : COLORS.gray,
                fontSize: '15px',
                cursor: (newBookInsight.trim() && selectedBookForInsight) ? 'pointer' : 'not-allowed',
                fontWeight: '600',
                boxShadow: (newBookInsight.trim() && selectedBookForInsight) ? '0 4px 14px 0 rgba(139, 92, 246, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              💡 Add Insight
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit Modal Component
  const renderEditModal = () => {
    if (!showEditModal || !editingItem) return null;
    
    const isBook = editingType === 'book';
    const isProject = ['high-level', 'medium-level', 'low-level'].includes(editingType);
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out',
        padding: '20px',
        paddingTop: '10vh',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div style={{
          background: COLORS.glassBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: 'calc(80vh - 40px)',
          overflow: 'auto',
          boxShadow: COLORS.shadowLarge,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'scale(0.95)',
          animation: 'modalSlideIn 0.3s ease-out forwards'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{
              margin: '0',
              color: COLORS.dark,
              fontSize: '24px',
              fontWeight: '600'
            }}>
              ✏️ Edit {isBook ? 'Book' : 'Activity'}
            </h3>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingItem(null);
                setEditingType(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: COLORS.gray,
                padding: '4px',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.1)';
                e.target.style.color = COLORS.dark;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = COLORS.gray;
              }}
            >
              ×
            </button>
          </div>

          {/* Book Edit Form */}
          {isBook && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.dark }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={editingItem.title || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.dark }}>
                  Author *
                </label>
                <input
                  type="text"
                  value={editingItem.author || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.dark }}>
                  Genre
                </label>
                <input
                  type="text"
                  value={editingItem.genre || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, genre: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.dark }}>
                  Status
                </label>
                <select
                  value={editingItem.status || 'planned'}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="planned">Planned</option>
                  <option value="reading">Reading</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.dark }}>
                  Notes
                </label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    resize: 'vertical',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </>
          )}

          {/* Project Edit Form */}
          {isProject && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.dark }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.dark }}>
                  Description
                </label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    resize: 'vertical',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: COLORS.dark }}>
                  Status
                </label>
                <select
                  value={editingItem.status || 'planned'}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="planned">Planned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingItem(null);
                setEditingType(null);
              }}
              style={{
                padding: '12px 24px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                background: 'white',
                color: COLORS.gray,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={
                isBook ? (!editingItem.title || !editingItem.author) : !editingItem.name
              }
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '10px',
                background: (isBook ? (!editingItem.title || !editingItem.author) : !editingItem.name) 
                  ? '#d1d5db' 
                  : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (isBook ? (!editingItem.title || !editingItem.author) : !editingItem.name) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: (isBook ? (!editingItem.title || !editingItem.author) : !editingItem.name) 
                  ? 'none' 
                  : '0 4px 16px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!((isBook ? (!editingItem.title || !editingItem.author) : !editingItem.name))) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!((isBook ? (!editingItem.title || !editingItem.author) : !editingItem.name))) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
                }
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PortfolioSection = () => (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Add Project Buttons - Apple-inspired 3-Tier System */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        marginBottom: '40px' 
      }}>
        <button
          onClick={() => {
            setProjectType('high-level');
            setShowAddProjectModal(true);
          }}
          style={{
            padding: '20px 28px',
            borderRadius: '20px',
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.purpleDark} 100%)`,
            color: 'white',
            ...TYPOGRAPHY.bodySmall,
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 12px 32px rgba(0, 206, 209, 0.4)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 16px 48px rgba(0, 206, 209, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 12px 32px rgba(0, 206, 209, 0.4)';
          }}
        >
          <span style={{ fontSize: '20px' }}>🚀</span>
          Add High-Level Project
        </button>
        <button
          onClick={() => {
            setProjectType('medium-level');
            setShowAddProjectModal(true);
          }}
          style={{
            padding: '20px 28px',
            borderRadius: '20px',
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.teal} 0%, ${COLORS.mediumGreen} 100%)`,
            color: 'white',
            ...TYPOGRAPHY.bodySmall,
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 12px 32px rgba(91, 143, 138, 0.4)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 16px 48px rgba(91, 143, 138, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 12px 32px rgba(91, 143, 138, 0.4)';
          }}
        >
          <span style={{ fontSize: '20px' }}>⚡</span>
          Add Medium Activity
        </button>
        <button
          onClick={() => {
            setProjectType('low-level');
            setShowAddProjectModal(true);
          }}
          style={{
            padding: '20px 28px',
            borderRadius: '20px',
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.darkGreen} 0%, ${COLORS.mediumGreen} 100%)`,
            color: 'white',
            ...TYPOGRAPHY.bodySmall,
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 12px 32px rgba(42, 68, 66, 0.4)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 16px 48px rgba(42, 68, 66, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 12px 32px rgba(42, 68, 66, 0.4)';
          }}
        >
          <span style={{ fontSize: '20px' }}>📋</span>
          Add Low Activity
        </button>
        <button
          onClick={() => setShowAddBookModal(true)}
          style={{
            padding: '20px 28px',
            borderRadius: '20px',
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.purpleDark} 0%, ${COLORS.lavender} 100%)`,
            color: 'white',
            ...TYPOGRAPHY.bodySmall,
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 12px 32px rgba(139, 69, 19, 0.4)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 16px 48px rgba(139, 69, 19, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 12px 32px rgba(139, 69, 19, 0.4)';
          }}
        >
          <span style={{ fontSize: '20px' }}>📚</span>
          Add Reading List
        </button>
      </div>

      {/* High-Level Projects - Apple-inspired */}
      {highLevelProjects.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <h4 style={{ 
            ...TYPOGRAPHY.h4,
            margin: '0 0 28px 0', 
            color: COLORS.darkGreen,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🚀 High-Level Projects
            <span style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.purpleDark})`,
              color: 'white',
              padding: '6px 12px',
              borderRadius: '16px',
              ...TYPOGRAPHY.caption,
              fontWeight: '700'
            }}>
              {highLevelProjects.length}
            </span>
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
            gap: '24px' 
          }}>
            {highLevelProjects.map((project) => (
              <div key={project.id} style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '32px',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(0, 206, 209, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}>
                {/* Enhanced gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.purpleDark} 50%, ${COLORS.secondary} 100%)`,
                  borderRadius: '24px 24px 0 0'
                }} />
                
                {/* Subtle background pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '120px',
                  background: 'radial-gradient(ellipse at center, rgba(0, 206, 209, 0.1) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }}></div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '16px',
                  position: 'relative',
                  zIndex: 2 
                }}>
                  <h5 style={{ 
                    ...TYPOGRAPHY.h5,
                    margin: 0, 
                    color: COLORS.darkGreen,
                    flex: 1,
                    marginRight: '16px'
                  }}>
                    {project.name}
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{
                      background: project.status === 'completed' 
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : project.status === 'in-progress' 
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #9ca3af, #6b7280)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '16px',
                      ...TYPOGRAPHY.caption,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
                    }}>
                      {getStatusLabel(project.status)}
                    </span>
                    {project.personalStatement && (
                      <span style={{
                        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.purpleDark} 100%)`,
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '16px',
                        ...TYPOGRAPHY.caption,
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 16px rgba(0, 206, 209, 0.3)'
                      }}>
                        📝 Personal Statement
                      </span>
                    )}
                    
                    {/* Edit and Delete Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(project, 'high-level');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(project.id, 'high-level');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                {project.description && (
                  <p style={{ 
                    margin: '0 0 16px 0', 
                    color: COLORS.gray, 
                    fontSize: '14px', 
                    lineHeight: '1.6' 
                  }}>
                    {project.description}
                  </p>
                )}
                
                {project.category && (
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      background: COLORS.lightGray,
                      color: COLORS.dark,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      {project.category}
                    </span>
                  </div>
                )}
                
                {project.sources && project.sources.length > 0 && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '20px', 
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '2px solid rgba(99, 102, 241, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h6 style={{ 
                      margin: '0 0 16px 0', 
                      color: COLORS.dark, 
                      fontSize: '16px', 
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📚 Sources ({project.sources.length})
                    </h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {project.sources.map((source, idx) => (
                        <div key={source.id || idx} style={{
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(99, 102, 241, 0.1)',
                          transition: 'all 0.2s ease'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            <p style={{ 
                              margin: '0 0 4px 0', 
                              color: COLORS.dark, 
                              fontSize: '15px', 
                              lineHeight: '1.5',
                              fontWeight: '600'
                            }}>
                              {source.title}
                            </p>
                            <p style={{
                              margin: '0 0 4px 0',
                              color: '#6366f1',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>
                              {source.authors} • {source.year}
                            </p>
                            {source.venue && (
                              <p style={{
                                margin: '0',
                                color: COLORS.gray,
                                fontSize: '13px',
                                fontStyle: 'italic'
                              }}>
                                {source.venue}
                              </p>
                            )}
                            {source.insights && (
                              <p style={{
                                margin: '8px 0 0 0',
                                color: COLORS.dark,
                                fontSize: '14px',
                                lineHeight: '1.5',
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.5)',
                                borderRadius: '8px'
                              }}>
                                💭 {source.insights}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Engagements Section */}
                {project.engagements && project.engagements.length > 0 && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '20px', 
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '2px solid rgba(139, 92, 246, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h6 style={{ 
                      margin: '0 0 16px 0', 
                      color: COLORS.dark, 
                      fontSize: '16px', 
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      💭 Insights ({project.engagements.length})
                    </h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {project.engagements.map((engagement, idx) => (
                        <div key={engagement.id || idx} style={{
                          background: engagement.type === 'conclusions' 
                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(22, 163, 74, 0.05) 100%)'
                            : engagement.type === 'arguments'
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
                          padding: '16px',
                          borderRadius: '12px',
                          border: engagement.type === 'conclusions' 
                            ? '1px solid rgba(34, 197, 94, 0.1)'
                            : engagement.type === 'arguments'
                            ? '1px solid rgba(239, 68, 68, 0.1)'
                            : '1px solid rgba(59, 130, 246, 0.1)',
                          transition: 'all 0.2s ease'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{
                              background: engagement.type === 'conclusions' 
                                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                : engagement.type === 'arguments'
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'capitalize',
                              marginBottom: '8px',
                              display: 'inline-block'
                            }}>
                              {engagement.type}
                            </span>
                            <p style={{ 
                              margin: '8px 0 0 0', 
                              color: COLORS.dark, 
                              fontSize: '14px', 
                              lineHeight: '1.5'
                            }}>
                              {engagement.content}
                            </p>
                            {engagement.dateAdded && (
                              <p style={{
                                margin: '8px 0 0 0',
                                color: COLORS.gray,
                                fontSize: '12px'
                              }}>
                                Added: {new Date(engagement.dateAdded).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                      setSourceProjectId(project.id);
                      setShowAddSourceModal(true);
                    }}
                    title="Add sources to strengthen this activity for your application"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: `2px solid ${COLORS.primary}`,
                      background: COLORS.white,
                      color: COLORS.primary,
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
                    }}
                  >
                    + Add Source
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEngagementProjectId(project.id);
                      setEngagementType('conclusions');
                      setShowAddEngagementModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: COLORS.white,
                      color: '#8b5cf6',
                      border: '2px solid #8b5cf6',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#8b5cf6';
                      e.target.style.color = COLORS.white;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = COLORS.white;
                      e.target.style.color = '#8b5cf6';
                    }}
                  >
                    + Add Insight
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePSTag(project.id);
                    }}
                    title={project.personalStatement 
                      ? "Remove from Personal Statement - Click to exclude this item from your personal statement draft" 
                      : "Add to Personal Statement - Click to include this item in your personal statement draft"
                    }
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: project.personalStatement ? COLORS.darkGreen : COLORS.white,
                      color: project.personalStatement ? COLORS.white : COLORS.darkGreen,
                      border: `2px solid ${COLORS.darkGreen}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!project.personalStatement) {
                        e.target.style.background = COLORS.darkGreen + '20';
                        e.target.style.borderColor = COLORS.darkGreen;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!project.personalStatement) {
                        e.target.style.background = COLORS.white;
                        e.target.style.borderColor = COLORS.darkGreen;
                      }
                    }}
                  >
                    {project.personalStatement ? '✓ PS' : 'PS'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medium-Level Activities */}
      {mediumLevelActivities.length > 0 && (
        <div>
          <h4 style={{ 
            margin: '0 0 20px 0', 
            color: COLORS.dark, 
            fontSize: '20px', 
            fontWeight: '600' 
          }}>
            ⚡ Medium-Level Activities (Transferable Skills)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {mediumLevelActivities.map((activity) => (
              <div key={activity.id} style={{
                background: COLORS.glassBg,
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: `2px solid ${COLORS.lightGray}`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.borderColor = COLORS.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = COLORS.lightGray;
              }}>
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${COLORS.secondary} 0%, ${COLORS.success} 100%)`
                }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h5 style={{ 
                    margin: 0, 
                    color: COLORS.dark, 
                    fontSize: '18px', 
                    fontWeight: '600',
                    flex: 1,
                    marginRight: '16px'
                  }}>
                    {activity.name}
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{
                      background: getStatusColor(activity.status),
                      color: COLORS.white,
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {getStatusLabel(activity.status)}
                    </span>
                    
                    {/* Edit and Delete Buttons */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(activity, 'medium-level');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 3px 8px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(activity.id, 'medium-level');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 3px 8px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                {activity.description && (
                  <p style={{ 
                    margin: '0 0 16px 0', 
                    color: COLORS.gray, 
                    fontSize: '14px', 
                    lineHeight: '1.6' 
                  }}>
                    {activity.description}
                  </p>
                )}
                
                {activity.sources && activity.sources.length > 0 && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '20px', 
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '2px solid rgba(16, 185, 129, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h6 style={{ 
                      margin: '0 0 16px 0', 
                      color: COLORS.dark, 
                      fontSize: '16px', 
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📚 Sources ({activity.sources.length})
                    </h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activity.sources.map((source, idx) => (
                        <div key={source.id || idx} style={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(16, 185, 129, 0.1)',
                          transition: 'all 0.2s ease'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            <p style={{ 
                              margin: '0 0 4px 0', 
                              color: COLORS.dark, 
                              fontSize: '15px', 
                              lineHeight: '1.5',
                              fontWeight: '600'
                            }}>
                              {source.title}
                            </p>
                            <p style={{
                              margin: '0 0 4px 0',
                              color: '#10b981',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>
                              {source.authors} • {source.year}
                            </p>
                            {source.venue && (
                              <p style={{
                                margin: '0',
                                color: COLORS.gray,
                                fontSize: '13px',
                                fontStyle: 'italic'
                              }}>
                                {source.venue}
                              </p>
                            )}
                            {source.insights && (
                              <p style={{
                                margin: '8px 0 0 0',
                                color: COLORS.dark,
                                fontSize: '14px',
                                lineHeight: '1.5',
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.5)',
                                borderRadius: '8px'
                              }}>
                                💭 {source.insights}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Engagements Section */}
                {activity.engagements && activity.engagements.length > 0 && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '20px', 
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '2px solid rgba(16, 185, 129, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h6 style={{ 
                      margin: '0 0 16px 0', 
                      color: COLORS.dark, 
                      fontSize: '16px', 
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      💭 Insights ({activity.engagements.length})
                    </h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activity.engagements.map((engagement, idx) => (
                        <div key={engagement.id || idx} style={{
                          background: engagement.type === 'conclusions' 
                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(22, 163, 74, 0.05) 100%)'
                            : engagement.type === 'arguments'
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
                          padding: '16px',
                          borderRadius: '12px',
                          border: engagement.type === 'conclusions' 
                            ? '1px solid rgba(34, 197, 94, 0.1)'
                            : engagement.type === 'arguments'
                            ? '1px solid rgba(239, 68, 68, 0.1)'
                            : '1px solid rgba(59, 130, 246, 0.1)',
                          transition: 'all 0.2s ease'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{
                              background: engagement.type === 'conclusions' 
                                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                : engagement.type === 'arguments'
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              textTransform: 'capitalize',
                              marginBottom: '8px',
                              display: 'inline-block'
                            }}>
                              {engagement.type}
                            </span>
                            <p style={{ 
                              margin: '8px 0 0 0', 
                              color: COLORS.dark, 
                              fontSize: '14px', 
                              lineHeight: '1.5'
                            }}>
                              {engagement.content}
                            </p>
                            {engagement.dateAdded && (
                              <p style={{
                                margin: '8px 0 0 0',
                                color: COLORS.gray,
                                fontSize: '12px'
                              }}>
                                Added: {new Date(engagement.dateAdded).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(activity);
                      setSourceProjectId(activity.id);
                      setShowAddSourceModal(true);
                    }}
                    title="Add sources to strengthen this activity for your application"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: `2px solid ${COLORS.primary}`,
                      background: COLORS.white,
                      color: COLORS.primary,
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
                    }}
                  >
                    + Add Source
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEngagementProjectId(activity.id);
                      setEngagementType('conclusions');
                      setShowAddEngagementModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: COLORS.white,
                      color: '#8b5cf6',
                      border: '2px solid #8b5cf6',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#8b5cf6';
                      e.target.style.color = COLORS.white;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = COLORS.white;
                      e.target.style.color = '#8b5cf6';
                    }}
                  >
                    + Add Insight
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePSTag(activity.id);
                    }}
                    title={activity.personalStatement 
                      ? "Remove from Personal Statement - Click to exclude this item from your personal statement draft" 
                      : "Add to Personal Statement - Click to include this item in your personal statement draft"
                    }
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: activity.personalStatement ? COLORS.darkGreen : COLORS.white,
                      color: activity.personalStatement ? COLORS.white : COLORS.darkGreen,
                      border: `2px solid ${COLORS.darkGreen}`,
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!activity.personalStatement) {
                        e.target.style.background = COLORS.darkGreen + '20';
                        e.target.style.borderColor = COLORS.darkGreen;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!activity.personalStatement) {
                        e.target.style.background = COLORS.white;
                        e.target.style.borderColor = COLORS.darkGreen;
                      }
                    }}
                  >
                    {activity.personalStatement ? '✓ PS' : 'PS'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low-Level Activities */}
      {lowLevelActivities.activities && lowLevelActivities.activities.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ 
            margin: '0 0 20px 0', 
            color: COLORS.dark, 
            fontSize: '20px', 
            fontWeight: '600' 
          }}>
            📚 Low-Level Activities (Knowledge Building)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {lowLevelActivities.activities.map((activity) => (
              <div key={activity.id} style={{
                background: COLORS.glassBg,
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: COLORS.shadowMedium,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: COLORS.dark, 
                    fontSize: '16px', 
                    fontWeight: '600' 
                  }}>
                    {activity.name}
                  </h5>
                  {activity.category && (
                    <span style={{
                      background: COLORS.mint,
                      color: COLORS.darkGreen,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {activity.category}
                    </span>
                  )}
                </div>

                {activity.description && (
                  <p style={{ 
                    margin: '0 0 16px 0', 
                    color: COLORS.gray, 
                    fontSize: '14px', 
                    lineHeight: '1.5' 
                  }}>
                    {activity.description}
                  </p>
                )}

                {activity.sources && activity.sources.length > 0 && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1'
                  }}>
                    <h6 style={{ 
                      margin: '0 0 8px 0', 
                      color: COLORS.dark, 
                      fontSize: '13px', 
                      fontWeight: '600' 
                    }}>
                      📚 Sources ({activity.sources ? activity.sources.length : 0})
                    </h6>
                    {activity.sources ? activity.sources.slice(0, 2).map((source, idx) => (
                      <p key={idx} style={{ 
                        margin: '0 0 4px 0', 
                        color: COLORS.gray, 
                        fontSize: '12px', 
                        lineHeight: '1.4' 
                      }}>
                        • {source.authors} ({source.year}): {source.title}
                      </p>
                    )) : null}
                    {activity.sources && activity.sources.length > 2 && (
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        color: COLORS.primary, 
                        fontSize: '12px', 
                        fontWeight: '500' 
                      }}>
                        +{activity.sources.length - 2} more...
                      </p>
                    )}
                  </div>
                )}
                
                {/* Engagements Section */}
                {activity.engagements && activity.engagements.length > 0 && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1'
                  }}>
                    <h6 style={{ 
                      margin: '0 0 8px 0', 
                      color: COLORS.dark, 
                      fontSize: '13px', 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      💭 Insights ({activity.engagements.length})
                    </h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activity.engagements.slice(0, 2).map((engagement, idx) => (
                        <div key={engagement.id || idx} style={{
                          background: engagement.type === 'conclusions' 
                            ? 'rgba(34, 197, 94, 0.1)'
                            : engagement.type === 'arguments'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(59, 130, 246, 0.1)',
                          padding: '8px',
                          borderRadius: '6px',
                          border: engagement.type === 'conclusions' 
                            ? '1px solid rgba(34, 197, 94, 0.2)'
                            : engagement.type === 'arguments'
                            ? '1px solid rgba(239, 68, 68, 0.2)'
                            : '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                          <span style={{
                            background: engagement.type === 'conclusions' 
                              ? '#22c55e'
                              : engagement.type === 'arguments'
                              ? '#ef4444'
                              : '#3b82f6',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            marginBottom: '4px',
                            display: 'inline-block'
                          }}>
                            {engagement.type}
                          </span>
                          <p style={{ 
                            margin: '4px 0 0 0', 
                            color: COLORS.dark, 
                            fontSize: '12px', 
                            lineHeight: '1.4'
                          }}>
                            {engagement.content.length > 100 ? 
                              engagement.content.substring(0, 100) + '...' : 
                              engagement.content
                            }
                          </p>
                        </div>
                      ))}
                    </div>
                    {activity.engagements.length > 2 && (
                      <p style={{ 
                        margin: '8px 0 0 0', 
                        color: COLORS.primary, 
                        fontSize: '11px', 
                        fontWeight: '500' 
                      }}>
                        +{activity.engagements.length - 2} more insights...
                      </p>
                    )}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(activity);
                      setSourceProjectId(activity.id);
                      setShowAddSourceModal(true);
                    }}
                    title="Add sources to strengthen this activity for your application"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: `linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%)`,
                      color: COLORS.white,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>📚</span> Sources
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEngagementProjectId(activity.id);
                      setEngagementType('conclusions');
                      setShowAddEngagementModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: COLORS.white,
                      color: '#8b5cf6',
                      border: '2px solid #8b5cf6',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    + Add Insight
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {highLevelProjects.length === 0 && mediumLevelActivities.length === 0 && (!lowLevelActivities.activities || lowLevelActivities.activities.length === 0) && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: COLORS.lightGray,
          borderRadius: '16px',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            color: COLORS.dark, 
            fontSize: '20px', 
            fontWeight: '600' 
          }}>
            Start Building Your Portfolio
          </h4>
          <p style={{ 
            margin: '0 0 24px 0', 
            color: COLORS.gray, 
            fontSize: '15px' 
          }}>
            Add your projects and activities to showcase your achievements
          </p>
        </div>
      )}

      {/* Reading List Section */}
      {books.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <h4 style={{ 
            ...TYPOGRAPHY.h4,
            margin: '0 0 28px 0', 
            color: COLORS.darkGreen,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📚 Reading List
            <span style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.purpleDark})`,
              color: 'white',
              padding: '6px 12px',
              borderRadius: '16px',
              ...TYPOGRAPHY.caption,
              fontWeight: '700'
            }}>
              {books.length}
            </span>
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
            gap: '24px' 
          }}>
            {books.map((book, index) => {
              console.log('DEBUG: Rendering book:', { id: book.id, title: book.title, index: index });
              return (
              <div key={book.id || index} style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '32px',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}>
                {/* Enhanced gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: `linear-gradient(90deg, ${COLORS.purpleDark} 0%, #8b5cf6 50%, ${COLORS.secondary} 100%)`,
                  borderRadius: '24px 24px 0 0'
                }} />
                
                {/* Subtle background pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '120px',
                  background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }}></div>
                
                {book.personalStatement === true && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '16px',
                    ...TYPOGRAPHY.caption,
                    fontWeight: '700',
                    zIndex: 3
                  }}>
                    PS READY
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '16px',
                  position: 'relative',
                  zIndex: 2 
                }}>
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <h5 style={{ 
                      ...TYPOGRAPHY.h5,
                      margin: 0, 
                      color: COLORS.darkGreen,
                      marginBottom: '8px'
                    }}>
                      {book.title}
                    </h5>
                    <p style={{
                      margin: 0,
                      color: COLORS.gray,
                      ...TYPOGRAPHY.bodySmall,
                      fontWeight: '500'
                    }}>
                      by {book.author}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{
                      background: book.status === 'completed' 
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : book.status === 'reading' 
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #9ca3af, #6b7280)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '16px',
                      ...TYPOGRAPHY.caption,
                      fontWeight: '700',
                      textAlign: 'center'
                    }}>
                      {book.status === 'completed' ? 'Completed' :
                       book.status === 'reading' ? 'Reading' : 'Planned'}
                    </span>
                    {book.genre && (
                      <span style={{
                        background: 'rgba(107, 114, 128, 0.1)',
                        color: COLORS.gray,
                        padding: '6px 12px',
                        borderRadius: '12px',
                        ...TYPOGRAPHY.caption,
                        fontWeight: '500'
                      }}>
                        {book.genre}
                      </span>
                    )}
                    
                    {/* Edit and Delete Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(book, 'book');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(book.id, 'book');
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>

                {book.notes && (
                  <div style={{ 
                    marginBottom: '24px', 
                    padding: '20px', 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                    borderRadius: '16px',
                    border: '1px solid rgba(203, 213, 225, 0.5)',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <p style={{ 
                      margin: 0, 
                      color: COLORS.gray, 
                      ...TYPOGRAPHY.bodySmall,
                      lineHeight: '1.6',
                      fontStyle: 'italic'
                    }}>
                      {book.notes}
                    </p>
                  </div>
                )}

                {book.insights && book.insights.length > 0 && (
                  <div style={{ 
                    marginBottom: '24px', 
                    position: 'relative', 
                    zIndex: 2
                  }}>
                    <h6 style={{
                      ...TYPOGRAPHY.caption,
                      margin: '0 0 12px 0',
                      color: COLORS.primary,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      💡 Insights ({book.insights.length})
                    </h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {book.insights.map((insight, idx) => (
                        <div key={insight.id || idx} style={{
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
                          borderRadius: '12px',
                          border: '1px solid rgba(139, 92, 246, 0.1)',
                          color: COLORS.dark,
                          ...TYPOGRAPHY.bodySmall,
                          lineHeight: '1.5'
                        }}>
                          {insight.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 2 }}>
                  {book.status !== 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateBookStatus(book.id, 'completed');
                      }}
                      style={{
                        flex: 1,
                        padding: '12px 18px',
                        background: `linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%)`,
                        color: COLORS.white,
                        border: 'none',
                        borderRadius: '12px',
                        ...TYPOGRAPHY.caption,
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                      }}
                    >
                      <span>✓</span> Complete
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBookForInsight(book);
                      setShowAddBookInsightModal(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      background: COLORS.white,
                      color: '#8b5cf6',
                      border: '2px solid #8b5cf6',
                      borderRadius: '12px',
                      ...TYPOGRAPHY.caption,
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.color = '#8b5cf6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.color = '#8b5cf6';
                    }}
                  >
                    + Add Insight
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBookPS(book.id);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      background: book.personalStatement === true ? `linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%)` : COLORS.white,
                      color: book.personalStatement === true ? COLORS.white : COLORS.success,
                      border: `2px solid ${COLORS.success}`,
                      borderRadius: '12px',
                      ...TYPOGRAPHY.caption,
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: book.personalStatement === true ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      if (book.personalStatement === true) {
                        e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.35)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      if (book.personalStatement === true) {
                        e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                      }
                    }}
                    title={book.personalStatement === true ? 
                      "Remove from Personal Statement - Click to exclude this book from your personal statement draft" :
                      "Tag for Personal Statement - Click to include this book in your personal statement draft"}
                  >
                    {book.personalStatement === true ? (
                      <>
                        <span>✓</span> PS Tagged
                      </>
                    ) : (
                      <>
                        <span>👁️</span> PS Tag
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Create engagement sections - Conclusions, Arguments, Methodology (functionality preserved, UI hidden)
  const ConclusionsSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h4 style={{ margin: '0', color: COLORS.darkGreen, fontSize: '18px', fontWeight: '600' }}>
            💡 Conclusions & Discoveries
          </h4>
          <p style={{ margin: '4px 0 0 0', color: COLORS.gray, fontSize: '14px' }}>
            Key findings, realizations, and insights you've gained from your intellectual activities
          </p>
        </div>
        <button
          onClick={() => {
            const allProjects = [...highLevelProjects, ...mediumLevelActivities];
            if (allProjects.length === 0) {
              alert('Add some projects first to create conclusions!');
              setActiveSection('portfolio');
            } else {
              setEngagementProjectId(allProjects[0].id);
              setEngagementType('conclusions');
              setShowAddEngagementModal(true);
            }
          }}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.darkGreen} 0%, ${COLORS.mediumGreen} 100%)`,
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: COLORS.shadowMedium,
            transition: 'all 0.2s ease',
            display: 'none'
          }}
        >
          + Add Conclusion
        </button>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: COLORS.mint,
          padding: '20px',
          borderRadius: '16px',
          textAlign: 'center',
          border: `2px solid ${COLORS.darkGreen}`
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.darkGreen, marginBottom: '4px' }}>
            {conclusions.length}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.darkGreen, fontWeight: '600' }}>Total Conclusions</div>
        </div>
        <div style={{
          background: COLORS.lavenderLight,
          padding: '20px',
          borderRadius: '16px',
          textAlign: 'center',
          border: `2px solid ${COLORS.purpleDark}`
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.purpleDark, marginBottom: '4px' }}>
            {conclusions.filter(c => c.personalStatement === true).length}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.purpleDark, fontWeight: '600' }}>Statement-Ready</div>
        </div>
      </div>

      <div style={{
        background: COLORS.glassBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: COLORS.shadowMedium
      }}>
        {conclusions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {conclusions.map((conclusion, index) => {
              const project = [...highLevelProjects, ...mediumLevelActivities].find(p => p.id === conclusion.projectId);
              return (
                <div key={conclusion.id || index} style={{
                  background: 'linear-gradient(135deg, rgba(42, 68, 66, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: `2px solid rgba(42, 68, 66, 0.1)`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  borderLeft: `6px solid ${COLORS.darkGreen}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.darkGreen }}>
                      {project?.name || 'General Learning'}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.gray }}>
                      {new Date(conclusion.dateAdded).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: COLORS.dark, lineHeight: '1.5', marginBottom: '8px' }}>
                    {conclusion.content}
                  </div>
                  {conclusion.subjectArea && (
                    <div style={{ fontSize: '12px', color: COLORS.mediumGreen, fontWeight: '500' }}>
                      Subject: {conclusion.subjectArea}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: COLORS.gray }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No Conclusions Yet</h5>
            <p style={{ margin: '0', fontSize: '14px' }}>Start documenting what you've learned and discovered!</p>
          </div>
        )}
      </div>
    </div>
  );

  const ArgumentsSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h4 style={{ margin: '0', color: COLORS.purpleDark, fontSize: '18px', fontWeight: '600' }}>
            🎯 Arguments & Positions
          </h4>
          <p style={{ margin: '4px 0 0 0', color: COLORS.gray, fontSize: '14px' }}>
            Intellectual positions, thesis statements, and critical analyses you've developed
          </p>
        </div>
        <button
          onClick={() => {
            const allProjects = [...highLevelProjects, ...mediumLevelActivities];
            if (allProjects.length === 0) {
              alert('Add some projects first to create arguments!');
              setActiveSection('portfolio');
            } else {
              setEngagementProjectId(allProjects[0].id);
              setEngagementType('arguments');
              setShowAddEngagementModal(true);
            }
          }}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: 'none',
            background: `linear-gradient(135deg, ${COLORS.purpleDark} 0%, ${COLORS.mediumPurple} 100%)`,
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: COLORS.shadowMedium,
            transition: 'all 0.2s ease',
            display: 'none'
          }}
        >
          + Add Argument
        </button>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: COLORS.lavenderLight,
          padding: '20px',
          borderRadius: '16px',
          textAlign: 'center',
          border: `2px solid ${COLORS.purpleDark}`
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.purpleDark, marginBottom: '4px' }}>
            {argumentsList.length}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.purpleDark, fontWeight: '600' }}>Total Arguments</div>
        </div>
        <div style={{
          background: COLORS.mint,
          padding: '20px',
          borderRadius: '16px',
          textAlign: 'center',
          border: `2px solid ${COLORS.darkGreen}`
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.darkGreen, marginBottom: '4px' }}>
            {argumentsList.filter(a => a.personalStatement === true).length}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.darkGreen, fontWeight: '600' }}>Statement-Ready</div>
        </div>
      </div>

      <div style={{
        background: COLORS.glassBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: COLORS.shadowMedium
      }}>
        {argumentsList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {argumentsList.map((argument, index) => {
              const project = [...highLevelProjects, ...mediumLevelActivities].find(p => p.id === argument.projectId);
              return (
                <div key={argument.id || index} style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${COLORS.purpleDark}20`,
                  borderLeft: `6px solid ${COLORS.purpleDark}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.purpleDark }}>
                      {project?.name || 'General Position'}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.gray }}>
                      {new Date(argument.dateAdded).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: COLORS.dark, lineHeight: '1.5', marginBottom: '8px' }}>
                    {argument.content}
                  </div>
                  {argument.subjectArea && (
                    <div style={{ fontSize: '12px', color: COLORS.mediumPurple, fontWeight: '500' }}>
                      Subject: {argument.subjectArea}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: COLORS.gray }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No Arguments Yet</h5>
            <p style={{ margin: '0', fontSize: '14px' }}>Start developing your intellectual positions and critical analyses!</p>
          </div>
        )}
      </div>
    </div>
  );

  const MethodologySection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h4 style={{ margin: '0', color: COLORS.navyBlue, fontSize: '18px', fontWeight: '600' }}>
            🔬 Methodology & Approaches
          </h4>
          <p style={{ margin: '4px 0 0 0', color: COLORS.gray, fontSize: '14px' }}>
            Systematic approaches, research methods, and analytical frameworks you've used
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={generateBookRecommendations}
            disabled={generatingRecommendations}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: generatingRecommendations 
                ? COLORS.lightGray 
                : `linear-gradient(135deg, ${COLORS.purpleDark} 0%, ${COLORS.lavender} 100%)`,
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: generatingRecommendations ? 'not-allowed' : 'pointer',
              boxShadow: generatingRecommendations ? 'none' : COLORS.shadowMedium,
              transition: 'all 0.2s ease',
              opacity: generatingRecommendations ? 0.7 : 1,
              display: 'none'
            }}
          >
            {generatingRecommendations ? '🔄 Generating...' : '📚 Generate Book Recommendations'}
          </button>
          <button
            onClick={() => {
              const allProjects = [...highLevelProjects, ...mediumLevelActivities];
              if (allProjects.length === 0) {
                alert('Add some projects first to document methodology!');
                setActiveSection('portfolio');
              } else {
                setEngagementProjectId(allProjects[0].id);
                setEngagementType('methodology');
                setShowAddEngagementModal(true);
              }
            }}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(135deg, ${COLORS.navyBlue} 0%, ${COLORS.teal} 100%)`,
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: COLORS.shadowMedium,
              transition: 'all 0.2s ease',
              display: 'none'
            }}
          >
            + Add Methodology
          </button>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: '#e0f2fe',
          padding: '20px',
          borderRadius: '16px',
          textAlign: 'center',
          border: `2px solid ${COLORS.navyBlue}`
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.navyBlue, marginBottom: '4px' }}>
            {methodology.length}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.navyBlue, fontWeight: '600' }}>Total Methodologies</div>
        </div>
        <div style={{
          background: COLORS.mint,
          padding: '20px',
          borderRadius: '16px',
          textAlign: 'center',
          border: `2px solid ${COLORS.teal}`
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.teal, marginBottom: '4px' }}>
            {methodology.filter(m => m.personalStatement === true).length}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.teal, fontWeight: '600' }}>Statement-Ready</div>
        </div>
      </div>

      <div style={{
        background: COLORS.glassBg,
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: COLORS.shadowMedium
      }}>
        {methodology.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {methodology.map((method, index) => {
              const project = [...highLevelProjects, ...mediumLevelActivities].find(p => p.id === method.projectId);
              return (
                <div key={method.id || index} style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${COLORS.navyBlue}20`,
                  borderLeft: `6px solid ${COLORS.navyBlue}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.navyBlue }}>
                      {project?.name || 'General Approach'}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.gray }}>
                      {new Date(method.dateAdded).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: COLORS.dark, lineHeight: '1.5', marginBottom: '8px' }}>
                    {method.content}
                  </div>
                  {method.subjectArea && (
                    <div style={{ fontSize: '12px', color: COLORS.teal, fontWeight: '500' }}>
                      Subject: {method.subjectArea}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: COLORS.gray }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔬</div>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No Methodologies Yet</h5>
            <p style={{ margin: '0', fontSize: '14px' }}>Start documenting your systematic approaches and research methods!</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div style={{
        background: 'radial-gradient(ellipse at center, rgba(216, 240, 237, 0.3) 0%, transparent 70%)',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Subtle background overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, padding: '0 8px' }}>
        {/* Header - Apple-inspired */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          padding: '40px 48px',
          borderRadius: '32px',
          marginBottom: '32px',
          border: '1px solid rgba(91, 143, 138, 0.3)',
          boxShadow: '0 16px 48px rgba(91, 143, 138, 0.12)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundImage: `url(${ICONS.bagback})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              marginRight: '24px',
              transform: 'scale(1.1)'
            }}></div>
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                ...TYPOGRAPHY.h2,
                margin: '0 0 8px 0', 
                color: COLORS.darkGreen
              }}>
                Supercurricular Portfolio
              </h2>
              <p style={{ 
                ...TYPOGRAPHY.body,
                margin: '0', 
                color: COLORS.mediumGreen,
                fontWeight: '500'
              }}>
                Showcase your academic pursuits and intellectual engagement beyond the classroom
              </p>
            </div>
            {/* Portfolio Statistics Summary */}
            <div style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'center'
            }}>
              <div style={{
                padding: '12px 20px',
                background: `linear-gradient(135deg, ${COLORS.mint}, rgba(255, 255, 255, 0.9))`,
                borderRadius: '16px',
                border: `1px solid ${COLORS.mediumGreen}30`,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  ...TYPOGRAPHY.h4,
                  color: COLORS.darkGreen,
                  margin: '0 0 4px 0'
                }}>
                  {highLevelProjects.length + mediumLevelActivities.length + (lowLevelActivities.activities?.length || 0)}
                </div>
                <div style={{ 
                  ...TYPOGRAPHY.caption,
                  color: COLORS.mediumGreen,
                  fontWeight: '600'
                }}>
                  Total Projects
                </div>
              </div>
              <div style={{
                padding: '12px 20px',
                background: `linear-gradient(135deg, ${COLORS.lavenderLight}, rgba(255, 255, 255, 0.9))`,
                borderRadius: '16px',
                border: `1px solid ${COLORS.purpleDark}30`,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  ...TYPOGRAPHY.h4,
                  color: COLORS.purpleDark,
                  margin: '0 0 4px 0'
                }}>
                  {conclusions.length + argumentsList.length + methodology.length}
                </div>
                <div style={{ 
                  ...TYPOGRAPHY.caption,
                  color: COLORS.purpleDark,
                  fontWeight: '600'
                }}>
                  Engagements
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Navigation Tabs - Apple-inspired */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '32px',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}>
          {[
            { id: 'portfolio', label: 'Portfolio', count: highLevelProjects.length + mediumLevelActivities.length + (lowLevelActivities.activities?.length || 0) },
            { id: 'conclusions', label: 'Conclusions', count: conclusions.length },
            { id: 'arguments', label: 'Arguments', count: argumentsList.length },
            { id: 'methodology', label: 'Methodology', count: methodology.length }
          ].filter(tab => tab.id === 'portfolio').map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                background: activeSection === tab.id 
                  ? `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)` 
                  : 'transparent',
                border: 'none',
                padding: '16px 24px',
                borderRadius: '20px',
                cursor: 'pointer',
                ...TYPOGRAPHY.bodySmall,
                fontWeight: activeSection === tab.id ? '700' : '600',
                color: activeSection === tab.id ? 'white' : '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: activeSection === tab.id ? '0 8px 24px rgba(0, 206, 209, 0.3)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateY(0)',
                textShadow: activeSection === tab.id ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                minWidth: '120px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== tab.id) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== tab.id) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.background = 'transparent';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: activeSection === tab.id 
                    ? 'rgba(255,255,255,0.3)' 
                    : `linear-gradient(135deg, ${COLORS.mediumGreen}, ${COLORS.teal})`,
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  ...TYPOGRAPHY.caption,
                  fontWeight: '700',
                  minWidth: '20px',
                  textAlign: 'center',
                  border: activeSection === tab.id ? '1px solid rgba(255,255,255,0.4)' : 'none',
                  boxShadow: activeSection === tab.id ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      
      {/* Content Sections */}
      {activeSection === 'portfolio' && <PortfolioSection />}
      {activeSection === 'conclusions' && <ConclusionsSection />}
      {activeSection === 'arguments' && <ArgumentsSection />}
      {activeSection === 'methodology' && <MethodologySection />}
      
      {/* Modals */}
      {renderAddProjectModal()}
      {renderAddSourceModal()}
      {renderAddEngagementModal()}
      {renderAddBookModal()}
      {renderAddBookInsightModal()}
      {renderEditModal()}
      
      {/* Personal Statement Feedback Notification */}
      {showFeedback && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: `linear-gradient(135deg, ${COLORS.darkGreen} 0%, ${COLORS.mediumGreen} 100%)`,
          color: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(42, 68, 66, 0.3)',
          zIndex: 1000,
          animation: 'slideInFromRight 0.3s ease-out',
          maxWidth: '300px',
          fontSize: '14px',
          fontWeight: '500',
          border: `2px solid ${COLORS.teal}`,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>📝</span>
            <span>{feedbackMessage}</span>
          </div>
        </div>
      )}
      
      {/* Styles for animations */}
      <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
        </div>
      </div>
    </>
  );
};

export default EnhancedSupercurricularTab;