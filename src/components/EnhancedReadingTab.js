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
  primary: '#00ced1',        // Added missing primary color - teal
  secondary: '#5b8f8a',      // Added missing secondary color - medium green
  glassBg: 'rgba(255, 255, 255, 0.95)',
  shadowLight: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowMedium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  shadowLarge: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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

const EnhancedReadingTab = ({ profile, currentSubjects, universityTargets, onProfileUpdate }) => {
  const [activeSection, setActiveSection] = useState('reading-list');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // Modal states for forms
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showAddInsightModal, setShowAddInsightModal] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState(false);
  
  // Form states
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    subject: '',
    status: 'planned',
    personalStatement: false,
    universityRelevant: false
  });
  
  const [newInsight, setNewInsight] = useState('');
  const [insightBookId, setInsightBookId] = useState(null);
  const [additionalRecommendations, setAdditionalRecommendations] = useState([]);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  
  // Use profile data directly - no localStorage
  const books = profile?.supercurricular?.lowLevel?.books || [];
  const insights = profile?.knowledgeInsights || profile?.insights || [];

  const completedBooks = books.filter(book => book.status === 'completed' || book.completed === true);
  const currentlyReading = books.filter(book => book.status === 'reading');
  const plannedBooks = books.filter(book => book.status === 'planned' || (!book.status && !book.completed));

  // Handler functions
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
      subject: '',
      status: 'planned',
      personalStatement: false,
      universityRelevant: false
    });
  };

  const handleAddInsight = (bookId, insightText) => {
    if (!insightText.trim()) return;
    
    const newInsightObj = {
      id: Date.now(),
      bookId: bookId,
      insight: insightText,
      dateAdded: new Date().toISOString(),
      personalStatement: false
    };
    
    // Update books with new insight
    const updatedBooks = books.map(book => {
      if (book.id === bookId) {
        return {
          ...book,
          insights: [...(book.insights || []), insightText]
        };
      }
      return book;
    });
    
    // Update insights list
    const updatedInsights = [...insights, newInsightObj];
    
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
        },
        knowledgeInsights: updatedInsights
      };
      onProfileUpdate(updatedProfile);
    }
    
    setNewInsight('');
    setShowAddInsightModal(false);
  };

  const handleTogglePSTag = (bookId) => {
    const updatedBooks = books.map(book => {
      if (book.id === bookId) {
        return {
          ...book,
          personalStatement: !book.personalStatement
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
  };

  const handleAddRecommendedBook = (bookInfo) => {
    const newBookData = {
      title: bookInfo.title,
      author: bookInfo.author,
      subject: bookInfo.subject || '',
      status: 'planned',
      personalStatement: false,
      universityRelevant: true,
      recommendationReason: bookInfo.reason
    };
    
    handleAddBook(newBookData);
  };

  const handleUpdateBookStatus = (bookId, newStatus) => {
    const updatedBooks = books.map(book => {
      if (book.id === bookId) {
        return {
          ...book,
          status: newStatus
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
  };

  // Generate university-specific reading recommendations
  const getUniversityRecommendations = () => {
    const recommendations = [];
    
    // Debug: Check what we're receiving
    console.log('University targets in reading tab:', universityTargets);
    
    // Check both possible data structures
    const targets = universityTargets || profile?.universityTargets || profile?.universities || [];
    
    targets?.forEach(uni => {
      const course = uni.course || uni.degree || '';
      const university = uni.name || uni.university || '';
      
      // Economics recommendations
      if (course.toLowerCase().includes('economics') || course.toLowerCase().includes('ppe')) {
        recommendations.push({
          university,
          course,
          books: [
            { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', reason: 'Essential behavioral economics for Cambridge/LSE', priority: 'high', subject: 'Economics' },
            { title: 'The Undercover Economist', author: 'Tim Harford', reason: 'Popular economics writing style', priority: 'medium', subject: 'Economics' },
            { title: 'Capital in the Twenty-First Century', author: 'Thomas Piketty', reason: 'Modern economic theory', priority: 'high', subject: 'Economics' }
          ]
        });
      }
      
      // Medicine recommendations
      if (course.toLowerCase().includes('medicine') || course.toLowerCase().includes('medical')) {
        recommendations.push({
          university,
          course,
          books: [
            { title: 'Being Mortal', author: 'Atul Gawande', reason: 'Medical ethics and patient care', priority: 'high', subject: 'Medicine' },
            { title: 'The Emperor of All Maladies', author: 'Siddhartha Mukherjee', reason: 'Medical research and history', priority: 'high', subject: 'Medicine' },
            { title: 'Bad Science', author: 'Ben Goldacre', reason: 'Critical thinking in medicine', priority: 'medium', subject: 'Medicine' }
          ]
        });
      }
      
      // Engineering/Science recommendations  
      if (course.toLowerCase().includes('engineering') || course.toLowerCase().includes('computer science')) {
        recommendations.push({
          university,
          course,
          books: [
            { title: 'The Design of Everyday Things', author: 'Don Norman', reason: 'Design thinking and problem solving', priority: 'high', subject: 'Engineering' },
            { title: 'The Innovators', author: 'Walter Isaacson', reason: 'Technology history and innovation', priority: 'medium', subject: 'Technology' }
          ]
        });
      }
    });
    
    return recommendations;
  };

  // Enhanced recommendation system with additional intelligent suggestions
  const generateAdditionalRecommendations = () => {
    setGeneratingRecommendations(true);
    
    // Simulate API delay for realistic UX
    setTimeout(() => {
      const newRecommendations = [];
      const existingBooks = books.map(b => b.title.toLowerCase());
      
      // Subject-based recommendations from current subjects
      currentSubjects?.forEach(subject => {
        const subjectName = subject.name || subject;
        const subjectLower = subjectName.toLowerCase();
        
        if (subjectLower.includes('mathematics') || subjectLower.includes('maths')) {
          newRecommendations.push({
            university: 'Subject-Based',
            course: subjectName,
            books: [
              { title: 'The Man Who Loved Only Numbers', author: 'Paul Hoffman', reason: 'Mathematical biography and history', priority: 'medium', subject: 'Mathematics' },
              { title: 'A Mathematician\'s Apology', author: 'G.H. Hardy', reason: 'Philosophy of pure mathematics', priority: 'high', subject: 'Mathematics' },
              { title: 'Gödel, Escher, Bach', author: 'Douglas Hofstadter', reason: 'Mathematics, art, and consciousness', priority: 'high', subject: 'Mathematics' }
            ].filter(book => !existingBooks.includes(book.title.toLowerCase()))
          });
        }
        
        if (subjectLower.includes('physics')) {
          newRecommendations.push({
            university: 'Subject-Based',
            course: subjectName,
            books: [
              { title: 'Six Easy Pieces', author: 'Richard Feynman', reason: 'Accessible physics from a master', priority: 'high', subject: 'Physics' },
              { title: 'The Elegant Universe', author: 'Brian Greene', reason: 'String theory and modern physics', priority: 'medium', subject: 'Physics' },
              { title: 'Cosmos', author: 'Carl Sagan', reason: 'Astronomy and cosmology', priority: 'medium', subject: 'Physics' }
            ].filter(book => !existingBooks.includes(book.title.toLowerCase()))
          });
        }
        
        if (subjectLower.includes('english') || subjectLower.includes('literature')) {
          newRecommendations.push({
            university: 'Subject-Based',
            course: subjectName,
            books: [
              { title: 'How to Read Literature Like a Professor', author: 'Thomas C. Foster', reason: 'Literary analysis techniques', priority: 'high', subject: 'English Literature' },
              { title: 'The Western Canon', author: 'Harold Bloom', reason: 'Critical literary theory', priority: 'medium', subject: 'English Literature' },
              { title: 'On Writing', author: 'Stephen King', reason: 'Craft of writing and storytelling', priority: 'medium', subject: 'English Literature' }
            ].filter(book => !existingBooks.includes(book.title.toLowerCase()))
          });
        }
        
        if (subjectLower.includes('history')) {
          newRecommendations.push({
            university: 'Subject-Based',
            course: subjectName,
            books: [
              { title: 'Sapiens', author: 'Yuval Noah Harari', reason: 'Human history and civilization', priority: 'high', subject: 'History' },
              { title: 'The Guns of August', author: 'Barbara Tuchman', reason: 'Historical narrative technique', priority: 'medium', subject: 'History' },
              { title: 'A People\'s History of the World', author: 'Chris Harman', reason: 'Alternative historical perspectives', priority: 'medium', subject: 'History' }
            ].filter(book => !existingBooks.includes(book.title.toLowerCase()))
          });
        }
        
        if (subjectLower.includes('psychology')) {
          newRecommendations.push({
            university: 'Subject-Based',
            course: subjectName,
            books: [
              { title: 'Influence: The Psychology of Persuasion', author: 'Robert Cialdini', reason: 'Social psychology principles', priority: 'high', subject: 'Psychology' },
              { title: 'The Social Animal', author: 'David Brooks', reason: 'Psychology in everyday life', priority: 'medium', subject: 'Psychology' },
              { title: 'Predictably Irrational', author: 'Dan Ariely', reason: 'Behavioral economics and psychology', priority: 'medium', subject: 'Psychology' }
            ].filter(book => !existingBooks.includes(book.title.toLowerCase()))
          });
        }
      });
      
      // University-specific advanced recommendations
      universityTargets?.forEach(uni => {
        const university = uni.name || uni.university || '';
        const course = uni.course || uni.degree || '';
        
        if (university.toLowerCase().includes('oxford') || university.toLowerCase().includes('cambridge')) {
          newRecommendations.push({
            university: `${university} (Advanced)`,
            course,
            books: [
              { title: 'The Idea of a University', author: 'John Henry Newman', reason: 'Philosophy of higher education - Oxbridge tradition', priority: 'high', subject: 'Education Philosophy' },
              { title: 'Brideshead Revisited', author: 'Evelyn Waugh', reason: 'Oxford university culture and tradition', priority: 'medium', subject: 'Literature' },
              { title: 'The Once and Future Liberal', author: 'Mark Lilla', reason: 'Political philosophy and civic engagement', priority: 'medium', subject: 'Political Philosophy' }
            ].filter(book => !existingBooks.includes(book.title.toLowerCase()))
          });
        }
        
        if (university.toLowerCase().includes('lse') || university.toLowerCase().includes('london school')) {
          newRecommendations.push({
            university: `${university} (Advanced)`,
            course,
            books: [
              { title: 'The Road to Serfdom', author: 'Friedrich Hayek', reason: 'Classic LSE economic philosophy', priority: 'high', subject: 'Economics' },
              { title: 'The Open Society and Its Enemies', author: 'Karl Popper', reason: 'Political philosophy - LSE tradition', priority: 'high', subject: 'Political Philosophy' },
              { title: 'Why Nations Fail', author: 'Daron Acemoglu', reason: 'Modern institutional economics', priority: 'medium', subject: 'Economics' }
            ].filter(book => !existingBooks.includes(book.title.toLowerCase()))
          });
        }
      });
      
      // Interest-based recommendations from existing reading patterns
      const completedSubjects = new Set();
      books.forEach(book => {
        if (book.subject) completedSubjects.add(book.subject);
      });
      
      if (completedSubjects.has('Economics') && !existingBooks.includes('freakonomics')) {
        newRecommendations.push({
          university: 'Based on Your Reading',
          course: 'Economics Extension',
          books: [
            { title: 'Freakonomics', author: 'Steven Levitt', reason: 'You\'ve shown interest in economics', priority: 'medium', subject: 'Economics' },
            { title: 'The Economics of Inequality', author: 'Thomas Piketty', reason: 'Builds on your economics foundation', priority: 'medium', subject: 'Economics' }
          ]
        });
      }
      
      // Filter out empty recommendation groups
      const validRecommendations = newRecommendations.filter(rec => rec.books && rec.books.length > 0);
      
      setAdditionalRecommendations(validRecommendations);
      setGeneratingRecommendations(false);
    }, 1500); // 1.5 second delay for realistic UX
  };

  // Get insights tagged for personal statement
  const getPersonalStatementInsights = () => {
    return insights.filter(insight => {
      const content = (insight.learning || insight.description || insight.insight || '').toLowerCase();
      // Tag insights that show intellectual curiosity, problem-solving, or subject passion
      return content.includes('made me think') || 
             content.includes('connection') || 
             content.includes('application') || 
             content.includes('fascinated') ||
             content.includes('question') ||
             insight.personalStatement === true;
    });
  };

  const universityRecs = getUniversityRecommendations();
  const psInsights = getPersonalStatementInsights();

  // Add Book Modal Component - Regular function to access current state
  // Render function for Add Book Modal to prevent re-creation on each render
  const renderAddBookModal = () => {
    if (!showAddBookModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-out'
      }}>
        <div style={{
          background: COLORS.glassBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: COLORS.shadowLarge,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transform: 'scale(0.95)',
          animation: 'modalSlideIn 0.3s ease-out forwards'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>Add New Book</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
              Title *
            </label>
            <input
              type="text"
              value={newBook.title}
              onChange={(e) => setNewBook({...newBook, title: e.target.value})}
              placeholder="Enter book title"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
              Author
            </label>
            <input
              type="text"
              value={newBook.author}
              onChange={(e) => setNewBook({...newBook, author: e.target.value})}
              placeholder="Enter author name"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
              Subject
            </label>
            <input
              type="text"
              value={newBook.subject}
              onChange={(e) => setNewBook({...newBook, subject: e.target.value})}
              placeholder="e.g., Economics, Medicine, etc."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
              Status
            </label>
            <select
              value={newBook.status}
              onChange={(e) => setNewBook({...newBook, status: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="planned">Planned</option>
              <option value="reading">Currently Reading</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
              <input
                type="checkbox"
                checked={newBook.personalStatement}
                onChange={(e) => setNewBook({...newBook, personalStatement: e.target.checked})}
              />
              Tag for Personal Statement
            </label>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151' }}>
              <input
                type="checkbox"
                checked={newBook.universityRelevant}
                onChange={(e) => setNewBook({...newBook, universityRelevant: e.target.checked})}
              />
              University Relevant
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowAddBookModal(false);
                setNewBook({
                  title: '',
                  author: '',
                  subject: '',
                  status: 'planned',
                  personalStatement: false,
                  universityRelevant: false
                });
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
              onClick={() => handleAddBook(newBook)}
              disabled={!newBook.title.trim()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: newBook.title.trim() ? '#00ced1' : '#e5e7eb',
                color: newBook.title.trim() ? 'white' : '#9ca3af',
                fontSize: '14px',
                cursor: newBook.title.trim() ? 'pointer' : 'not-allowed',
                fontWeight: '500'
              }}
            >
              Add Book
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render function for Add Insight Modal to prevent re-creation on each render
  const renderAddInsightModal = () => {
    if (!showAddInsightModal) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
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
          <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>Add Reading Insight</h3>
          
          {/* Book Selector - only show if no specific book selected */}
          {!insightBookId && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
                Which book is this insight from?
              </label>
              <select
                value={insightBookId || ''}
                onChange={(e) => setInsightBookId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Select a book...</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} {book.author ? `by ${book.author}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show selected book if one is pre-selected */}
          {insightBookId && (
            <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Adding insight for:</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                {books.find(b => b.id === insightBookId)?.title || 'Selected Book'}
                {books.find(b => b.id === insightBookId)?.author && (
                  <span style={{ color: '#6b7280' }}> by {books.find(b => b.id === insightBookId)?.author}</span>
                )}
              </div>
            </div>
          )}
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#374151' }}>
              Your Insight
            </label>
            <textarea
              value={newInsight}
              onChange={(e) => setNewInsight(e.target.value)}
              placeholder="What did you learn? What connections did you make? How does this relate to your subject?"
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowAddInsightModal(false);
                setNewInsight('');
                setInsightBookId(null);
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
              onClick={() => handleAddInsight(insightBookId, newInsight)}
              disabled={!newInsight.trim() || !insightBookId}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: (newInsight.trim() && insightBookId) ? '#8b5cf6' : '#e5e7eb',
                color: (newInsight.trim() && insightBookId) ? 'white' : '#9ca3af',
                fontSize: '14px',
                cursor: (newInsight.trim() && insightBookId) ? 'pointer' : 'not-allowed',
                fontWeight: '500'
              }}
            >
              Add Insight
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ReadingListSection = () => (
    <div>
      {/* Add Book Button - Apple-inspired */}
      <div style={{ marginBottom: '28px' }}>
        <button
          onClick={() => setShowAddBookModal(true)}
          style={{
            background: `linear-gradient(135deg, ${COLORS.teal} 0%, #00b4b7 100%)`,
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '16px',
            ...TYPOGRAPHY.bodySmall,
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 206, 209, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 32px rgba(0, 206, 209, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 24px rgba(0, 206, 209, 0.3)';
          }}
        >
          + Add New Book
        </button>
      </div>

      {/* Reading Progress Overview - Apple-inspired */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.mint} 0%, rgba(255, 255, 255, 0.95) 100%)`,
          color: COLORS.darkGreen,
          padding: '24px',
          borderRadius: '20px',
          textAlign: 'center',
          border: `1px solid ${COLORS.mediumGreen}30`,
          boxShadow: '0 8px 32px rgba(42, 68, 66, 0.12)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ 
            ...TYPOGRAPHY.h3,
            margin: '0 0 8px 0'
          }}>{completedBooks.length}</div>
          <div style={{ 
            ...TYPOGRAPHY.caption,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>Completed</div>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.pastelAmber} 0%, rgba(255, 255, 255, 0.95) 100%)`,
          color: '#92400e',
          padding: '24px',
          borderRadius: '20px',
          textAlign: 'center',
          border: '1px solid rgba(146, 64, 14, 0.2)',
          boxShadow: '0 8px 32px rgba(146, 64, 14, 0.12)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ 
            ...TYPOGRAPHY.h3,
            margin: '0 0 8px 0'
          }}>{currentlyReading.length}</div>
          <div style={{ 
            ...TYPOGRAPHY.caption,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>Currently Reading</div>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.lavenderLight} 0%, rgba(255, 255, 255, 0.95) 100%)`,
          color: COLORS.purpleDark,
          padding: '24px',
          borderRadius: '20px',
          textAlign: 'center',
          border: `1px solid ${COLORS.purpleDark}30`,
          boxShadow: '0 8px 32px rgba(34, 20, 104, 0.12)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ 
            ...TYPOGRAPHY.h3,
            margin: '0 0 8px 0'
          }}>{plannedBooks.length}</div>
          <div style={{ 
            ...TYPOGRAPHY.caption,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>Planned</div>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.lightPurple} 0%, rgba(255, 255, 255, 0.95) 100%)`,
          color: COLORS.purpleDark,
          padding: '24px',
          borderRadius: '20px',
          textAlign: 'center',
          border: `1px solid ${COLORS.purpleDark}30`,
          boxShadow: '0 8px 32px rgba(34, 20, 104, 0.12)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ 
            ...TYPOGRAPHY.h3,
            margin: '0 0 8px 0'
          }}>{psInsights.length}</div>
          <div style={{ 
            ...TYPOGRAPHY.caption,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>PS Insights</div>
        </div>
      </div>

      {/* Currently Reading - Apple-inspired */}
      {currentlyReading.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, rgba(255, 255, 255, 0.95) 100%)',
          padding: '32px',
          borderRadius: '24px',
          marginBottom: '32px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          boxShadow: '0 12px 40px rgba(245, 158, 11, 0.15)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h4 style={{ 
            ...TYPOGRAPHY.h5,
            margin: '0 0 20px 0', 
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📖 Currently Reading
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentlyReading.map((book, index) => (
              <div key={book.id || index} style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '24px',
                borderRadius: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ 
                    ...TYPOGRAPHY.h6,
                    margin: '0 0 6px 0', 
                    color: '#111827'
                  }}>
                    {book.title}
                  </h5>
                  {book.author && (
                    <p style={{ 
                      ...TYPOGRAPHY.bodySmall,
                      margin: '0 0 12px 0', 
                      color: '#6b7280'
                    }}>
                      by {book.author}
                    </p>
                  )}
                  {book.progress && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        background: 'rgba(229, 231, 235, 0.8)',
                        height: '8px',
                        width: '120px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div style={{
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                          height: '100%',
                          width: `${book.progress || 0}%`,
                          borderRadius: '6px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ 
                        ...TYPOGRAPHY.caption,
                        color: '#6b7280',
                        fontWeight: '600'
                      }}>{book.progress || 0}%</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleUpdateBookStatus(book.id, 'completed')}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      ...TYPOGRAPHY.caption,
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={() => setSelectedBook(book)}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      ...TYPOGRAPHY.caption,
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Books List - Apple-inspired */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        padding: '32px',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at top, rgba(91, 143, 138, 0.05) 0%, transparent 60%)',
          pointerEvents: 'none'
        }}></div>
        
        <div style={{ 
          marginBottom: '28px',
          position: 'relative',
          zIndex: 1
        }}>
          <h4 style={{ 
            ...TYPOGRAPHY.h4,
            margin: '0', 
            color: COLORS.darkGreen,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📚 All Books 
            <span style={{
              background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.mediumGreen})`,
              color: 'white',
              padding: '6px 12px',
              borderRadius: '16px',
              ...TYPOGRAPHY.caption,
              fontWeight: '700'
            }}>
              {books.length}
            </span>
          </h4>
        </div>
        
        {books.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gap: '16px',
            position: 'relative',
            zIndex: 1
          }}>
            {books.map((book, index) => (
              <div key={book.id || index} style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                backdropFilter: 'blur(15px)',
                padding: '24px',
                borderRadius: '20px',
                border: `2px solid ${
                  book.status === 'completed' || book.completed ? 'rgba(34, 197, 94, 0.4)' : 
                  book.status === 'reading' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(156, 163, 175, 0.3)'
                }`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.borderColor = book.status === 'completed' || book.completed ? 'rgba(34, 197, 94, 0.6)' : 
                                                   book.status === 'reading' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(156, 163, 175, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = book.status === 'completed' || book.completed ? 'rgba(34, 197, 94, 0.4)' : 
                                                   book.status === 'reading' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(156, 163, 175, 0.3)';
              }}
              >
                {/* Status indicator */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: book.status === 'completed' || book.completed ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 
                             book.status === 'reading' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 
                             'linear-gradient(135deg, #9ca3af, #6b7280)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}></div>

                <div style={{ flex: 1, marginRight: '20px' }}>
                  <h5 style={{ 
                    ...TYPOGRAPHY.h6,
                    margin: '0 0 8px 0', 
                    color: COLORS.darkGreen
                  }}>
                    {book.title}
                  </h5>
                  {book.author && (
                    <p style={{ 
                      ...TYPOGRAPHY.bodySmall,
                      margin: '0 0 16px 0', 
                      color: COLORS.mediumGreen,
                      fontWeight: '500'
                    }}>
                      by {book.author}
                    </p>
                  )}
                  
                  {/* Book tags - Apple-inspired */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {book.subject && (
                      <span style={{
                        background: `linear-gradient(135deg, ${COLORS.lavenderLight}, rgba(225, 223, 255, 0.8))`,
                        color: COLORS.purpleDark,
                        padding: '6px 12px',
                        borderRadius: '16px',
                        ...TYPOGRAPHY.caption,
                        fontWeight: '600',
                        border: `1px solid ${COLORS.purpleDark}30`,
                        backdropFilter: 'blur(10px)'
                      }}>
                        {book.subject}
                      </span>
                    )}
                    {book.universityRelevant && (
                      <span style={{
                        background: 'linear-gradient(135deg, #dcfce7, rgba(220, 252, 231, 0.8))',
                        color: '#166534',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        ...TYPOGRAPHY.caption,
                        fontWeight: '600',
                        border: '1px solid rgba(22, 101, 52, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}>
                        🎯 University Relevant
                      </span>
                    )}
                    {book.personalStatement && (
                      <span style={{
                        background: `linear-gradient(135deg, ${COLORS.pastelAmber}, rgba(254, 243, 199, 0.8))`,
                        color: '#92400e',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        ...TYPOGRAPHY.caption,
                        fontWeight: '600',
                        border: '1px solid rgba(146, 64, 14, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}>
                        📝 PS Evidence
                      </span>
                    )}
                  </div>

                  {book.weeklyInsights && book.weeklyInsights.length > 0 && (
                    <div style={{ 
                      ...TYPOGRAPHY.caption,
                      margin: '0', 
                      color: COLORS.mediumPurple, 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                      💡 {book.weeklyInsights.length} insight{book.weeklyInsights.length !== 1 ? 's' : ''} recorded
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '16px',
                    ...TYPOGRAPHY.caption,
                    fontWeight: '700',
                    background: (book.status === 'completed' || book.completed) ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 
                               book.status === 'reading' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 
                               'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                    color: (book.status === 'completed' || book.completed) ? '#166534' : 
                           book.status === 'reading' ? '#92400e' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: (book.status === 'completed' || book.completed) ? '1px solid rgba(22, 101, 52, 0.3)' : 
                            book.status === 'reading' ? '1px solid rgba(146, 64, 14, 0.3)' : 
                            '1px solid rgba(107, 114, 128, 0.3)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                  }}>
                    {book.status || (book.completed ? 'completed' : 'planned')}
                  </span>
                  
                  <button
                    onClick={() => setSelectedBook(book)}
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.mediumGreen} 0%, ${COLORS.teal} 100%)`,
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '14px',
                      ...TYPOGRAPHY.caption,
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(91, 143, 138, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 28px rgba(91, 143, 138, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 6px 20px rgba(91, 143, 138, 0.3)';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBook(book);
                    }}
                  >
                    View Details
                  </button>
                  
                  {book.dateAdded && (
                    <span style={{ 
                      ...TYPOGRAPHY.caption,
                      color: '#9ca3af', 
                      fontWeight: '500'
                    }}>
                      Added {new Date(book.dateAdded).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 250, 252, 0.4) 100%)',
            borderRadius: '20px',
            border: '2px dashed rgba(156, 163, 175, 0.3)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundImage: `url(${ICONS.bookYellow})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              margin: '0 auto 24px auto',
              opacity: 0.7,
              filter: 'grayscale(20%)'
            }}></div>
            <p style={{ 
              ...TYPOGRAPHY.body,
              color: COLORS.mediumGreen,
              fontWeight: '500',
              margin: '0 0 8px 0'
            }}>
              No books added yet
            </p>
            <p style={{ 
              ...TYPOGRAPHY.bodySmall,
              color: '#9ca3af',
              margin: '0',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              Click "Add New Book" to start building your reading portfolio and track your academic journey!
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const RecommendationsSection = () => (
    <div>
      <h4 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
        📚 University-Targeted Reading Recommendations
      </h4>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
          Found {universityRecs.reduce((acc, rec) => acc + rec.books.length, 0) + additionalRecommendations.reduce((acc, rec) => acc + rec.books.length, 0)} recommendations
          {additionalRecommendations.length > 0 && (
            <span style={{ color: '#10b981', fontSize: '14px', marginLeft: '8px' }}>
              (+{additionalRecommendations.reduce((acc, rec) => acc + rec.books.length, 0)} personalized)
            </span>
          )}
        </h4>
        <button
          onClick={generateAdditionalRecommendations}
          disabled={generatingRecommendations}
          style={{
            background: generatingRecommendations ? '#6b7280' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: generatingRecommendations ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            boxShadow: generatingRecommendations ? 'none' : '0 4px 14px 0 rgba(139, 92, 246, 0.3)',
            transition: 'all 0.2s ease-in-out',
            opacity: generatingRecommendations ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px 0 rgba(139, 92, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 14px 0 rgba(139, 92, 246, 0.3)';
          }}
        >
          {generatingRecommendations ? '🔄 Generating...' : '✨ Generate More Recommendations'}
        </button>
      </div>
      
      {(universityRecs.length > 0 || additionalRecommendations.length > 0) ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {universityRecs.map((rec, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #a8dcc6'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h5 style={{ margin: '0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                  {rec.university} - {rec.course}
                </h5>
                <span style={{
                  background: '#8b5cf6',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  TARGETED
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rec.books.map((book, bookIndex) => {
                  const alreadyHave = books.some(existing => 
                    existing.title.toLowerCase().includes(book.title.toLowerCase()) ||
                    book.title.toLowerCase().includes(existing.title.toLowerCase())
                  );
                  
                  return (
                    <div key={bookIndex} style={{
                      background: alreadyHave ? '#dcfce7' : '#f8fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      border: `1px solid ${alreadyHave ? '#10b981' : '#e5e7eb'}`,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h6 style={{ 
                            margin: '0 0 4px 0', 
                            color: '#111827', 
                            fontSize: '14px', 
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {book.title}
                            {alreadyHave && <span style={{ color: '#10b981', fontSize: '12px' }}>✓ Added</span>}
                          </h6>
                          <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px' }}>
                            by {book.author}
                          </p>
                          <p style={{ margin: '0', color: '#374151', fontSize: '13px', lineHeight: '1.4' }}>
                            <strong>Why:</strong> {book.reason}
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{
                            background: book.priority === 'high' ? '#ef4444' : '#f59e0b',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '500',
                            textTransform: 'uppercase'
                          }}>
                            {book.priority} Priority
                          </span>
                          
                          {!alreadyHave && (
                            <button
                              onClick={() => handleAddRecommendedBook(book)}
                              style={{
                                background: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                marginTop: '4px'
                              }}
                            >
                              Add to List
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Additional Generated Recommendations */}
          {additionalRecommendations.map((rec, index) => (
            <div key={`additional-${index}`} style={{
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #10b981'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h5 style={{ margin: '0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                  {rec.university} - {rec.course}
                </h5>
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  PERSONALIZED
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rec.books.map((book, bookIndex) => {
                  const alreadyHave = books.some(existing => 
                    existing.title.toLowerCase().includes(book.title.toLowerCase()) ||
                    book.title.toLowerCase().includes(existing.title.toLowerCase())
                  );
                  
                  return (
                    <div key={bookIndex} style={{
                      background: alreadyHave ? '#dcfce7' : '#f8fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      border: `1px solid ${alreadyHave ? '#10b981' : '#e5e7eb'}`,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h6 style={{ 
                            margin: '0 0 4px 0', 
                            color: '#111827', 
                            fontSize: '14px', 
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {book.title}
                            {alreadyHave && <span style={{ color: '#10b981', fontSize: '12px' }}>✓ Added</span>}
                          </h6>
                          <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '13px' }}>
                            by {book.author}
                          </p>
                          <p style={{ margin: '0', color: '#374151', fontSize: '13px', lineHeight: '1.4' }}>
                            <strong>Why:</strong> {book.reason}
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{
                            background: book.priority === 'high' ? '#ef4444' : '#f59e0b',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '500',
                            textTransform: 'uppercase'
                          }}>
                            {book.priority} Priority
                          </span>
                          
                          {!alreadyHave && (
                            <button
                              onClick={() => handleAddRecommendedBook(book)}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                marginTop: '4px'
                              }}
                            >
                              Add to List
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          padding: '40px 20px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p>Add university targets to get personalized reading recommendations!</p>
          <p style={{ fontSize: '12px', marginTop: '10px', opacity: 0.7 }}>
            Or click "Generate More Recommendations" above to get AI-powered suggestions.
          </p>
        </div>
      )}
    </div>
  );

  const ReadingInsightsSection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: '0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
          💡 Reading Insights
        </h4>
        <button
          onClick={() => {
            if (books.length === 0) {
              alert('Add some books first to create insights!');
              setActiveSection('reading-list');
            } else {
              // Don't pre-select a book - let user choose in modal
              setInsightBookId(null);
              setShowAddInsightModal(true);
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px 0 rgba(139, 92, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 14px 0 rgba(139, 92, 246, 0.3)';
          }}
        >
          + Add New Insight
        </button>
      </div>
      
      {/* Insights Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: COLORS.lavenderLight,
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: `2px solid ${COLORS.purpleDark}`
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.purpleDark, marginBottom: '4px' }}>
            {insights.length}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.purpleDark, fontWeight: '600' }}>Total Insights</div>
        </div>
        <div style={{
          background: COLORS.mint,
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: `2px solid ${COLORS.darkGreen}`
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.darkGreen, marginBottom: '4px' }}>
            {psInsights.length}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.darkGreen, fontWeight: '600' }}>Statement-Ready</div>
        </div>
        <div style={{
          background: COLORS.lavender,
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center',
          border: `2px solid ${COLORS.mediumPurple}`
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.mediumPurple, marginBottom: '4px' }}>
            {books.filter(b => b.personalStatement).length}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.mediumPurple, fontWeight: '600' }}>Tagged Books</div>
        </div>
      </div>

      {/* All Reading Insights */}
      <div style={{
        background: COLORS.glassBg,
        backdropFilter: 'blur(20px)',
        padding: '24px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: COLORS.shadowMedium,
        marginBottom: '20px'
      }}>
        <h5 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
          📖 All Reading Insights
        </h5>
        
        {insights.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {insights.map((insight, index) => (
              <div key={insight.id || index} style={{
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease-in-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' }}>
                      {insight.learning || insight.description || insight.insight}
                    </p>
                    {(insight.bookId || insight.relatedBook) && (
                      <div style={{ margin: '0 0 4px 0', padding: '6px 10px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                        <p style={{ margin: '0', color: '#1e40af', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px' }}>📖</span>
                          {insight.bookId 
                            ? `From: ${books.find(b => b.id === insight.bookId)?.title || 'Unknown Book'}`
                            : `Related to: ${insight.relatedBook?.title || 'Unknown Book'}`
                          }
                          {insight.relatedBook?.author && (
                            <span style={{ color: '#6b7280', fontWeight: 'normal' }}>
                              by {insight.relatedBook.author}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {insight.dateAdded && (
                      <p style={{ margin: '0', color: '#9ca3af', fontSize: '11px' }}>
                        Added {new Date(insight.dateAdded).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '16px' }}>
                    {(insight.learning || insight.description || insight.insight || '').toLowerCase().includes('made me think') || 
                     (insight.learning || insight.description || insight.insight || '').toLowerCase().includes('connection') ||
                     (insight.learning || insight.description || insight.insight || '').toLowerCase().includes('fascinated') ||
                     insight.personalStatement === true ? (
                      <span style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        ✨ STATEMENT-READY
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundImage: `url(${ICONS.bulb})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              margin: '0 auto 16px',
              opacity: 0.7
            }}></div>
            <p style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>No reading insights yet</p>
            <p style={{ margin: '0', fontSize: '14px' }}>Start adding insights as you read your books to track your learning journey!</p>
          </div>
        )}
      </div>

      {/* Books Tagged for Statement */}
      <div style={{
        background: COLORS.glassBg,
        backdropFilter: 'blur(20px)',
        padding: '24px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: COLORS.shadowMedium
      }}>
        <h5 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
          📚 Books Tagged for Personal Statement
        </h5>
        
        {books.filter(b => b.personalStatement).length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {books.filter(b => b.personalStatement).map((book, index) => (
              <div key={book.id || index} style={{
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #f59e0b'
              }}>
                <h6 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '14px', fontWeight: '600' }}>
                  {book.title}
                </h6>
                {book.author && (
                  <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '12px' }}>
                    by {book.author}
                  </p>
                )}
                {book.insights && book.insights.length > 0 && (
                  <p style={{ margin: '0 0 8px 0', color: '#8b5cf6', fontSize: '12px', fontWeight: '500' }}>
                    💡 {book.insights.length} insight{book.insights.length !== 1 ? 's' : ''}
                  </p>
                )}
                <button
                  onClick={() => handleTogglePSTag(book.id)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Remove PS Tag
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280'
          }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
              No books tagged for personal statement yet. Tag relevant books from your reading list!
            </p>
            <button
              onClick={() => setActiveSection('reading-list')}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Go to Reading List
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Book Detail Modal
  const BookModal = () => {
    if (!selectedBook) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }} onClick={() => setSelectedBook(null)}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#111827' }}>{selectedBook.title}</h3>
              {selectedBook.author && (
                <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>by {selectedBook.author}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedBook(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#6b7280',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* Book Details */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                background: (selectedBook.status === 'completed' || selectedBook.completed) ? '#dcfce7' : 
                           selectedBook.status === 'reading' ? '#fef3c7' : '#f3f4f6',
                color: (selectedBook.status === 'completed' || selectedBook.completed) ? '#166534' : 
                       selectedBook.status === 'reading' ? '#92400e' : '#6b7280'
              }}>
                {selectedBook.status || (selectedBook.completed ? 'completed' : 'planned')}
              </span>
              {selectedBook.subject && (
                <span style={{
                  background: '#e1dfff',
                  color: '#221468',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {selectedBook.subject}
                </span>
              )}
              {selectedBook.personalStatement && (
                <span style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  📝 PS Evidence
                </span>
              )}
            </div>
          </div>

          {/* Insights Section */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
              💡 Insights ({selectedBook.weeklyInsights?.length || 0})
            </h4>
            {selectedBook.weeklyInsights && selectedBook.weeklyInsights.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {selectedBook.weeklyInsights.map((insight, index) => (
                  <div key={index} style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ margin: '0', color: '#374151', fontSize: '14px' }}>{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>No insights recorded yet.</p>
            )}
            <button
              onClick={() => {
                setInsightBookId(selectedBook.id);
                setShowAddInsightModal(true);
              }}
              style={{
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Add Insight
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleTogglePSTag(selectedBook.id)}
              style={{
                background: selectedBook.personalStatement ? '#ef4444' : '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {selectedBook.personalStatement ? 'Remove PS Tag' : 'Tag for PS'}
            </button>
            
            {selectedBook.status !== 'completed' && (
              <button
                onClick={() => {
                  handleUpdateBookStatus(selectedBook.id, 'completed');
                  setSelectedBook(null);
                }}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Mark as Completed
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { transform: scale(0.9) translateY(-20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .reading-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reading-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mediumGreen} 50%, ${COLORS.teal} 100%)`,
        minHeight: '100vh',
        padding: '20px',
        position: 'relative'
      }}>
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
              backgroundImage: `url(${ICONS.bookYellow})`,
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
                Academic Reading Portfolio
              </h2>
              <p style={{ 
                ...TYPOGRAPHY.body,
                margin: '0', 
                color: COLORS.mediumGreen,
                fontWeight: '500'
              }}>
                Track your reading journey and collect insights for your personal statement
              </p>
            </div>
            {/* Reading Statistics Summary */}
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
                  {books.length}
                </div>
                <div style={{ 
                  ...TYPOGRAPHY.caption,
                  color: COLORS.mediumGreen,
                  fontWeight: '600'
                }}>
                  Total Books
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
                  {insights.length}
                </div>
                <div style={{ 
                  ...TYPOGRAPHY.caption,
                  color: COLORS.purpleDark,
                  fontWeight: '600'
                }}>
                  Insights
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
            { id: 'reading-list', label: 'Reading List', count: books.length },
            { id: 'recommendations', label: 'Recommendations', count: universityRecs.reduce((acc, rec) => acc + rec.books.length, 0) },
            { id: 'insights', label: 'Reading Insights', count: insights.length }
          ].map((tab) => (
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
                minWidth: '140px',
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
        {activeSection === 'reading-list' && <ReadingListSection />}
        {activeSection === 'recommendations' && <RecommendationsSection />}
        {activeSection === 'insights' && <ReadingInsightsSection />}
        
        {/* Book Detail Modal */}
        {selectedBook && <BookModal />}
        
        {/* Add Book Modal */}
        {renderAddBookModal()}
        
        {/* Add Insight Modal */}
        {renderAddInsightModal()}
        </div>
      </div>
    </>
  );
};

export default EnhancedReadingTab;