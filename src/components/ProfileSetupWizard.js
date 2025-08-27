import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

const ProfileSetupWizard = ({ onSetupComplete }) => {
  // Main state declarations
  const [currentStep, setCurrentStep] = useState('archetype');
  const [userArchetype, setUserArchetype] = useState('');
  const [setupData, setSetupData] = useState({
    currentSubjects: [],
    universityTargets: [],
    books: [],
    supercurricular: {
      highLevel: [],
      mediumLevel: [],
      lowLevel: {
        books: [],
        lectures: [],
        moocs: [],
        societies: [],
        blogs: [],
        documentaries: [],
        museums: [],
        newsletters: []
      }
    },
    weeklyGoals: [],
    academicGoals: [],
    insights: []
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const FUNCTIONS_BASE_URL = 'https://us-central1-plewcsat1.cloudfunctions.net';

  // Effects
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Utility functions
  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error('No authenticated user');
  };

  const saveProgressToDatabase = async (data) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${FUNCTIONS_BASE_URL}/updateStudyProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profileUpdates: data,
          source: 'setup_wizard'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving profile data:', error);
      throw error;
    }
  };

  const proceedToNextStep = async (stepData = {}) => {
    const updatedData = { ...setupData, ...stepData };
    setSetupData(updatedData);

    // Save progress after each step
    if (Object.keys(stepData).length > 0) {
      try {
        setLoading(true);
        await saveProgressToDatabase(stepData);
      } catch (error) {
        // Continue even if save fails - we'll retry at the end
        console.error('Failed to save step data:', error);
      } finally {
        setLoading(false);
      }
    }

    const steps = ['archetype', 'academic', 'universities', 'reading', 'activities', 'goals', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const completeSetup = async () => {
    try {
      setLoading(true);
      
      // Final save with complete profile
      await saveProgressToDatabase({
        ...setupData,
        setupCompleted: true,
        setupDate: new Date().toISOString(),
        userArchetype: userArchetype
      });

      onSetupComplete();
    } catch (error) {
      console.error('Error completing setup:', error);
      // Still proceed to complete - they can fix issues later
      onSetupComplete();
    } finally {
      setLoading(false);
    }
  };

  // Shared styles
  const backgroundStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #b8e6d3 0%, #a8dcc6 20%, #d4edda 40%, #f0c5a0 60%, #f5b885 80%, #fad0c4 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    padding: '20px',
    boxSizing: 'border-box'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '700px',
    width: '100%',
    border: '1px solid #a8dcc6',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  };

  // Component definitions
  const ArchetypeSelection = () => (
    <div style={{ ...cardStyle, maxWidth: '600px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '28px', 
          fontWeight: '600', 
          color: '#111827' 
        }}>
          Welcome to Your Study Journey! 🎓
        </h1>
        <p style={{ 
          margin: '0', 
          color: '#6b7280', 
          fontSize: '16px', 
          lineHeight: '1.6' 
        }}>
          Let's set up your comprehensive academic profile. First, which best describes where you are in your university application journey?
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          {
            id: 'ready-to-apply',
            title: '🚀 Ready to Apply',
            description: 'I\'ve done most of my activities and research - I need to organize everything for personal statements',
            subtitle: 'Year 13, Gap Year, or late Year 12'
          },
          {
            id: 'in-progress',
            title: '📈 In Progress', 
            description: 'I\'m partway through my journey with some activities and research done - I need strategic guidance',
            subtitle: 'Year 12 or motivated Year 11'
          },
          {
            id: 'starting-fresh',
            title: '🌱 Starting Fresh',
            description: 'I\'m just beginning and need help choosing subjects, universities, and building my profile',
            subtitle: 'Year 10, Year 11, or career change'
          }
        ].map((archetype) => (
          <button
            key={archetype.id}
            onClick={() => {
              setUserArchetype(archetype.id);
              proceedToNextStep({ userArchetype: archetype.id });
            }}
            style={{
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#00ced1';
              e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = 'rgba(255, 255, 255, 0.8)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827' 
            }}>
              {archetype.title}
            </h3>
            <p style={{ 
              margin: '0 0 8px 0', 
              color: '#374151', 
              fontSize: '14px', 
              lineHeight: '1.5' 
            }}>
              {archetype.description}
            </p>
            <p style={{ 
              margin: '0', 
              color: '#6b7280', 
              fontSize: '12px', 
              fontStyle: 'italic' 
            }}>
              {archetype.subtitle}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const AcademicProfile = () => {
    const [subjects, setSubjects] = useState([]);
    const [newSubject, setNewSubject] = useState({ name: '', level: 'A-Level', predictedGrade: '' });
    const [currentYear, setCurrentYear] = useState('');

    const addSubject = () => {
      if (newSubject.name.trim()) {
        setSubjects([...subjects, { ...newSubject, id: Date.now() }]);
        setNewSubject({ name: '', level: 'A-Level', predictedGrade: '' });
      }
    };

    const removeSubject = (id) => {
      setSubjects(subjects.filter(s => s.id !== id));
    };

    const handleContinue = () => {
      proceedToNextStep({ 
        currentSubjects: subjects,
        currentYear: currentYear
      });
    };

    return (
      <div style={cardStyle}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#111827' 
          }}>
            📚 Academic Profile
          </h2>
          <p style={{ 
            margin: '0', 
            color: '#6b7280', 
            fontSize: '14px' 
          }}>
            Let's capture your current academic situation
          </p>
        </div>

        {/* Current Year */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151' 
          }}>
            What year are you currently in?
          </label>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Select your current year</option>
            <option value="Year 10">Year 10</option>
            <option value="Year 11">Year 11</option>
            <option value="Year 12">Year 12 (Lower Sixth)</option>
            <option value="Year 13">Year 13 (Upper Sixth)</option>
            <option value="Gap Year">Gap Year</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Current Subjects */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '12px', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151' 
          }}>
            Current Subjects
          </label>

          {/* Add Subject Form */}
          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  placeholder="e.g., Mathematics"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Level
                </label>
                <select
                  value={newSubject.level}
                  onChange={(e) => setNewSubject({...newSubject, level: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="A-Level">A-Level</option>
                  <option value="AS-Level">AS-Level</option>
                  <option value="GCSE">GCSE</option>
                  <option value="IB">IB</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Predicted Grade
                </label>
                <input
                  type="text"
                  value={newSubject.predictedGrade}
                  onChange={(e) => setNewSubject({...newSubject, predictedGrade: e.target.value})}
                  placeholder="A*"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={addSubject}
                disabled={!newSubject.name.trim()}
                style={{
                  padding: '8px 16px',
                  background: newSubject.name.trim() ? '#00ced1' : '#e5e7eb',
                  color: newSubject.name.trim() ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: newSubject.name.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Subjects List */}
          {subjects.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {subjects.map((subject) => (
                <div key={subject.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <span style={{ fontWeight: '500', color: '#111827' }}>{subject.name}</span>
                    <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                      {subject.level} {subject.predictedGrade && `(Predicted: ${subject.predictedGrade})`}
                    </span>
                  </div>
                  <button
                    onClick={() => removeSubject(subject.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Step 1 of 5 • Academic Profile
          </span>
          <button
            onClick={handleContinue}
            disabled={subjects.length === 0 || !currentYear}
            style={{
              padding: '12px 24px',
              background: (subjects.length > 0 && currentYear) ? '#00ced1' : '#e5e7eb',
              color: (subjects.length > 0 && currentYear) ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: (subjects.length > 0 && currentYear) ? 'pointer' : 'not-allowed',
              fontWeight: '500'
            }}
          >
            Continue to Universities
          </button>
        </div>
      </div>
    );
  };

const UniversityTargets = () => {
  const [universities, setUniversities] = useState([]);
  const [newUni, setNewUni] = useState({ name: '', course: '', priority: 'target' });
  const [skipForNow, setSkipForNow] = useState(false);

  const addUniversity = () => {
    if (newUni.name.trim() && newUni.course.trim()) {
      setUniversities([...universities, { 
        ...newUni, 
        id: Date.now(),
        researchProgress: 0,
        addedDate: new Date().toISOString()
      }]);
      setNewUni({ name: '', course: '', priority: 'target' });
    }
  };

  const removeUniversity = (id) => {
    setUniversities(universities.filter(u => u.id !== id));
  };

  const handleContinue = () => {
    proceedToNextStep({ 
      universityTargets: universities
    });
  };

  const getArchetypeGuidance = () => {
    if (userArchetype === 'ready-to-apply') {
      return "List the universities you're planning to apply to this year.";
    } else if (userArchetype === 'in-progress') {
      return "Add your target universities - we'll help you research them in detail later.";
    } else {
      return "Not sure yet? That's fine! You can explore different options as we go.";
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#111827' 
        }}>
          🏛️ University Targets
        </h2>
        <p style={{ 
          margin: '0 0 8px 0', 
          color: '#6b7280', 
          fontSize: '14px' 
        }}>
          {getArchetypeGuidance()}
        </p>
        <p style={{ 
          margin: '0', 
          color: '#059669',
          fontSize: '12px',
          background: '#f0f9ff',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #0ea5e9'
        }}>
          💡 Don't worry about getting this perfect - we'll help you research requirements, modules, and tutors later!
        </p>
      </div>

      {/* Skip Option */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
          <input
            type="checkbox"
            checked={skipForNow}
            onChange={(e) => setSkipForNow(e.target.checked)}
          />
          I'm not sure about universities yet - I'll explore options later
        </label>
      </div>

      {!skipForNow && (
        <>
          {/* Add University Form */}
          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  University
                </label>
                <input
                  type="text"
                  value={newUni.name}
                  onChange={(e) => setNewUni({...newUni, name: e.target.value})}
                  placeholder="e.g., Cambridge"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Course
                </label>
                <input
                  type="text"
                  value={newUni.course}
                  onChange={(e) => setNewUni({...newUni, course: e.target.value})}
                  placeholder="e.g., Economics"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Priority
                </label>
                <select
                  value={newUni.priority}
                  onChange={(e) => setNewUni({...newUni, priority: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="target">Target</option>
                  <option value="reach">Reach</option>
                  <option value="backup">Backup</option>
                </select>
              </div>
              <button
                onClick={addUniversity}
                disabled={!newUni.name.trim() || !newUni.course.trim()}
                style={{
                  padding: '8px 16px',
                  background: (newUni.name.trim() && newUni.course.trim()) ? '#00ced1' : '#e5e7eb',
                  color: (newUni.name.trim() && newUni.course.trim()) ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: (newUni.name.trim() && newUni.course.trim()) ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Universities List */}
          {universities.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {universities.map((uni) => (
                <div key={uni.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <span style={{ fontWeight: '500', color: '#111827' }}>{uni.name}</span>
                    <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                      {uni.course}
                    </span>
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                      background: uni.priority === 'reach' ? '#fef3c7' : uni.priority === 'backup' ? '#f3f4f6' : '#e1dfff',
                      color: uni.priority === 'reach' ? '#92400e' : uni.priority === 'backup' ? '#6b7280' : '#221468'
                    }}>
                      {uni.priority}
                    </span>
                  </div>
                  <button
                    onClick={() => removeUniversity(uni.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Continue Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          Step 2 of 5 • University Targets
        </span>
        <button
          onClick={handleContinue}
          style={{
            padding: '12px 24px',
            background: '#00ced1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Continue to Reading
        </button>
      </div>
    </div>
  );
};

const Reading = () => {
  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({ 
    title: '', 
    author: '', 
    status: 'reading',
    subject: '',
    insights: []
  });
  const [currentInsight, setCurrentInsight] = useState('');
  const [skipForNow, setSkipForNow] = useState(false);

  const addBook = () => {
    if (newBook.title.trim()) {
      setBooks([...books, { 
        ...newBook, 
        id: Date.now(),
        addedDate: new Date().toISOString()
      }]);
      setNewBook({ title: '', author: '', status: 'reading', subject: '', insights: [] });
    }
  };

  const removeBook = (id) => {
    setBooks(books.filter(b => b.id !== id));
  };

  const addInsightToBook = (bookId) => {
    if (currentInsight.trim()) {
      setBooks(books.map(book => 
        book.id === bookId 
          ? { ...book, insights: [...book.insights, currentInsight.trim()] }
          : book
      ));
      setCurrentInsight('');
    }
  };

  const handleContinue = () => {
    proceedToNextStep({ 
      supercurricular: {
        ...setupData.supercurricular,
        lowLevel: {
          ...setupData.supercurricular.lowLevel,
          books: books
        }
      }
    });
  };

  const getArchetypeGuidance = () => {
    if (userArchetype === 'ready-to-apply') {
      return "Add the books you've read that could be mentioned in your personal statement.";
    } else if (userArchetype === 'in-progress') {
      return "Add books you're currently reading or have recently finished.";
    } else {
      return "Any books that sparked your interest in your subjects? We'll suggest more later!";
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#111827' 
        }}>
          📚 Academic Reading
        </h2>
        <p style={{ 
          margin: '0 0 8px 0', 
          color: '#6b7280', 
          fontSize: '14px' 
        }}>
          {getArchetypeGuidance()}
        </p>
        <p style={{ 
          margin: '0', 
          color: '#059669',
          fontSize: '12px',
          background: '#f0f9ff',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #0ea5e9'
        }}>
          💡 Add any insights you've gained - these are gold for personal statements!
        </p>
      </div>

      {/* Skip Option */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
          <input
            type="checkbox"
            checked={skipForNow}
            onChange={(e) => setSkipForNow(e.target.checked)}
          />
          I haven't done much academic reading yet - I'll add books later
        </label>
      </div>

      {!skipForNow && (
        <>
          {/* Add Book Form */}
          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Book Title
                </label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  placeholder="e.g., Freakonomics"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Author
                </label>
                <input
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  placeholder="e.g., Steven Levitt"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
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
                  <option value="reading">Reading</option>
                  <option value="completed">Completed</option>
                  <option value="planned">Planned</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={newBook.subject}
                  onChange={(e) => setNewBook({...newBook, subject: e.target.value})}
                  placeholder="Economics"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                onClick={addBook}
                disabled={!newBook.title.trim()}
                style={{
                  padding: '8px 16px',
                  background: newBook.title.trim() ? '#00ced1' : '#e5e7eb',
                  color: newBook.title.trim() ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: newBook.title.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Books List */}
          {books.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {books.map((book) => (
                <div key={book.id} style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontWeight: '500', color: '#111827' }}>{book.title}</span>
                      {book.author && (
                        <span style={{ color: '#6b7280', marginLeft: '8px' }}>by {book.author}</span>
                      )}
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: book.status === 'completed' ? '#dcfce7' : book.status === 'reading' ? '#fef3c7' : '#f3f4f6',
                          color: book.status === 'completed' ? '#166534' : book.status === 'reading' ? '#92400e' : '#6b7280'
                        }}>
                          {book.status}
                        </span>
                        {book.subject && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: '#e1dfff',
                            color: '#221468'
                          }}>
                            {book.subject}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeBook(book.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  {/* Insights for this book */}
                  {book.insights.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Insights:</div>
                      {book.insights.map((insight, idx) => (
                        <div key={idx} style={{
                          background: '#f8fafc',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#374151',
                          marginBottom: '4px',
                          border: '1px solid #e2e8f0'
                        }}>
                          {insight}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add insight to this book */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={currentInsight}
                      onChange={(e) => setCurrentInsight(e.target.value)}
                      placeholder="Add an insight from this book..."
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                    <button
                      onClick={() => addInsightToBook(book.id)}
                      disabled={!currentInsight.trim()}
                      style={{
                        padding: '6px 12px',
                        background: currentInsight.trim() ? '#8b5cf6' : '#e5e7eb',
                        color: currentInsight.trim() ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: currentInsight.trim() ? 'pointer' : 'not-allowed',
                        fontWeight: '500'
                      }}
                    >
                      Add Insight
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Continue Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          Step 3 of 5 • Academic Reading
        </span>
        <button
          onClick={handleContinue}
          style={{
            padding: '12px 24px',
            background: '#00ced1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Continue to Activities
        </button>
      </div>
    </div>
  );
};

  const Activities = () => {
    const [highLevel, setHighLevel] = useState([]);
    const [mediumLevel, setMediumLevel] = useState([]);
    const [lowLevel, setLowLevel] = useState({
      lectures: [],
      moocs: [],
      societies: [],
      blogs: [],
      documentaries: [],
      museums: [],
      newsletters: [],
      podcasts: []
    });
    const [activeCategory, setActiveCategory] = useState('high-level');
    const [newActivity, setNewActivity] = useState({ name: '', description: '', status: 'planned', category: 'lectures' });
    const [skipForNow, setSkipForNow] = useState(false);

    const addHighLevelProject = () => {
      if (newActivity.name.trim()) {
        setHighLevel([...highLevel, {
          ...newActivity,
          id: Date.now(),
          type: 'project',
          addedDate: new Date().toISOString()
        }]);
        setNewActivity({ name: '', description: '', status: 'planned' });
      }
    };

    const addMediumLevelActivity = () => {
      if (newActivity.name.trim()) {
        setMediumLevel([...mediumLevel, {
          ...newActivity,
          id: Date.now(),
          type: 'activity',
          addedDate: new Date().toISOString()
        }]);
        setNewActivity({ name: '', description: '', status: 'planned' });
      }
    };

    const addLowLevelActivity = (category) => {
      if (newActivity.name.trim()) {
        setLowLevel({
          ...lowLevel,
          [category]: [...lowLevel[category], {
            ...newActivity,
            id: Date.now(),
            addedDate: new Date().toISOString()
          }]
        });
        setNewActivity({ name: '', description: '', status: 'planned' });
      }
    };

    const removeHighLevel = (id) => {
      setHighLevel(highLevel.filter(item => item.id !== id));
    };

    const removeMediumLevel = (id) => {
      setMediumLevel(mediumLevel.filter(item => item.id !== id));
    };

    const removeLowLevel = (category, id) => {
      setLowLevel({
        ...lowLevel,
        [category]: lowLevel[category].filter(item => item.id !== id)
      });
    };

    const handleContinue = () => {
      proceedToNextStep({
        supercurricular: {
          highLevel: highLevel,
          mediumLevel: mediumLevel,
          lowLevel: {
            ...setupData.supercurricular.lowLevel,
            ...lowLevel
          }
        }
      });
    };

    const getArchetypeGuidance = () => {
      if (userArchetype === 'ready-to-apply') {
        return "Add the activities, projects, and experiences you want to highlight in your applications.";
      } else if (userArchetype === 'in-progress') {
        return "Add what you're currently doing and planning - we'll help you develop your portfolio further.";
      } else {
        return "Any activities or interests you're involved in? Don't worry if it's not much - we'll help you build!";
      }
    };

    return (
      <div style={{ ...cardStyle, maxWidth: '800px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#111827' 
          }}>
            🎯 Supercurricular Activities
          </h2>
          <p style={{ 
            margin: '0 0 8px 0', 
            color: '#6b7280', 
            fontSize: '14px' 
          }}>
            {getArchetypeGuidance()}
          </p>
          <p style={{ 
            margin: '0', 
            color: '#059669',
            fontSize: '12px',
            background: '#f0f9ff',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #0ea5e9'
          }}>
            💡 We organize activities by impact level: High (major projects), Medium (competitions/volunteering), Low (knowledge building)
          </p>
        </div>

        {/* Skip Option */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
            <input
              type="checkbox"
              checked={skipForNow}
              onChange={(e) => setSkipForNow(e.target.checked)}
            />
            I don't have many activities yet - I'll build my portfolio later
          </label>
        </div>

        {!skipForNow && (
          <>
            {/* Category Tabs */}
            <div style={{
              display: 'flex',
              marginBottom: '20px',
              background: '#f8fafc',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {[
                { id: 'high-level', label: '🚀 Major Projects', desc: 'Independent research, competitions' },
                { id: 'medium-level', label: '🎯 Activities', desc: 'Volunteering, societies, work experience' },
                { id: 'low-level', label: '📚 Knowledge Building', desc: 'Lectures, courses, documentaries' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: 'none',
                    background: activeCategory === tab.id ? '#00ced1' : 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontWeight: '500',
                    fontSize: '12px',
                    color: activeCategory === tab.id ? '#ffffff' : '#374151',
                    marginBottom: '2px'
                  }}>
                    {tab.label}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: activeCategory === tab.id ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'
                  }}>
                    {tab.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* High-Level Projects Section */}
            {activeCategory === 'high-level' && (
              <div>
                {/* Add Project Form */}
                <div style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={newActivity.name}
                      onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                      placeholder="e.g., Independent Research on Economic Impact of AI"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                      Description
                    </label>
                    <textarea
                      value={newActivity.description}
                      onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                      placeholder="Describe your project, its goals, and impact..."
                      rows={3}
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
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Status
                      </label>
                      <select
                        value={newActivity.status}
                        onChange={(e) => setNewActivity({...newActivity, status: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="planned">Planned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <button
                      onClick={addHighLevelProject}
                      disabled={!newActivity.name.trim()}
                      style={{
                        padding: '8px 16px',
                        background: newActivity.name.trim() ? '#00ced1' : '#e5e7eb',
                        color: newActivity.name.trim() ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: newActivity.name.trim() ? 'pointer' : 'not-allowed',
                        fontWeight: '500'
                      }}
                    >
                      Add Project
                    </button>
                  </div>
                </div>

                {/* Projects List */}
                {highLevel.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {highLevel.map((project) => (
                      <div key={project.id} style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: '4px' }}>
                              <span style={{ fontWeight: '500', color: '#111827' }}>{project.name}</span>
                              <span style={{
                                marginLeft: '8px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                                background: project.status === 'completed' ? '#dcfce7' : project.status === 'in-progress' ? '#fef3c7' : '#f3f4f6',
                                color: project.status === 'completed' ? '#166534' : project.status === 'in-progress' ? '#92400e' : '#6b7280'
                              }}>
                                {project.status.replace('-', ' ')}
                              </span>
                            </div>
                            {project.description && (
                              <p style={{ margin: '0', color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
                                {project.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeHighLevel(project.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '14px',
                              marginLeft: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Medium-Level Activities Section */}
            {activeCategory === 'medium-level' && (
              <div>
                {/* Add Activity Form */}
                <div style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                      Activity Name
                    </label>
                    <input
                      type="text"
                      value={newActivity.name}
                      onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                      placeholder="e.g., Economics Society President, Volunteering at Local Library"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                      Description
                    </label>
                    <textarea
                      value={newActivity.description}
                      onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                      placeholder="Describe your role, responsibilities, and achievements..."
                      rows={3}
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
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Status
                      </label>
                      <select
                        value={newActivity.status}
                        onChange={(e) => setNewActivity({...newActivity, status: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="planned">Planned</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <button
                      onClick={addMediumLevelActivity}
                      disabled={!newActivity.name.trim()}
                      style={{
                        padding: '8px 16px',
                        background: newActivity.name.trim() ? '#00ced1' : '#e5e7eb',
                        color: newActivity.name.trim() ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: newActivity.name.trim() ? 'pointer' : 'not-allowed',
                        fontWeight: '500'
                      }}
                    >
                      Add Activity
                    </button>
                  </div>
                </div>

                {/* Activities List */}
                {mediumLevel.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mediumLevel.map((activity) => (
                      <div key={activity.id} style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: '4px' }}>
                              <span style={{ fontWeight: '500', color: '#111827' }}>{activity.name}</span>
                              <span style={{
                                marginLeft: '8px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                                background: activity.status === 'completed' ? '#dcfce7' : activity.status === 'ongoing' ? '#fef3c7' : '#f3f4f6',
                                color: activity.status === 'completed' ? '#166534' : activity.status === 'ongoing' ? '#92400e' : '#6b7280'
                              }}>
                                {activity.status}
                              </span>
                            </div>
                            {activity.description && (
                              <p style={{ margin: '0', color: '#6b7280', fontSize: '13px', lineHeight: '1.5' }}>
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeMediumLevel(activity.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '14px',
                              marginLeft: '12px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Low-Level Knowledge Building Section */}
            {activeCategory === 'low-level' && (
              <div>
                {/* Category Selector */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                    Select Knowledge Building Category:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { key: 'lectures', label: '🎓 Lectures' },
                      { key: 'moocs', label: '💻 Online Courses' },
                      { key: 'societies', label: '👥 Societies' },
                      { key: 'blogs', label: '📝 Blogs' },
                      { key: 'documentaries', label: '🎬 Documentaries' },
                      { key: 'museums', label: '🏛️ Museums' },
                      { key: 'newsletters', label: '📧 Newsletters' },
                      { key: 'podcasts', label: '🎙️ Podcasts' }
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setNewActivity({...newActivity, category: cat.key})}
                        style={{
                          padding: '8px',
                          border: '1px solid',
                          borderColor: newActivity.category === cat.key ? '#00ced1' : '#e2e8f0',
                          background: newActivity.category === cat.key ? 'rgba(0, 206, 209, 0.1)' : 'white',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Knowledge Activity Form */}
                <div style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                      {newActivity.category ? `${newActivity.category.charAt(0).toUpperCase() + newActivity.category.slice(1)} Name` : 'Activity Name'}
                    </label>
                    <input
                      type="text"
                      value={newActivity.name}
                      onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
                      placeholder={newActivity.category === 'lectures' ? 'e.g., LSE Public Lecture on Behavioral Economics' : 
                                  newActivity.category === 'moocs' ? 'e.g., MIT OpenCourseWare - Microeconomics' :
                                  newActivity.category === 'documentaries' ? 'e.g., Inside Job (2010)' :
                                  'Enter name...'}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                        Notes/Insights (optional)
                      </label>
                      <input
                        type="text"
                        value={newActivity.description}
                        onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                        placeholder="Key takeaways or insights..."
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => addLowLevelActivity(newActivity.category || 'lectures')}
                      disabled={!newActivity.name.trim() || !newActivity.category}
                      style={{
                        padding: '8px 16px',
                        background: (newActivity.name.trim() && newActivity.category) ? '#00ced1' : '#e5e7eb',
                        color: (newActivity.name.trim() && newActivity.category) ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: (newActivity.name.trim() && newActivity.category) ? 'pointer' : 'not-allowed',
                        fontWeight: '500'
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Display all low-level activities by category */}
                {Object.entries(lowLevel).map(([category, items]) => (
                  items.length > 0 && (
                    <div key={category} style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#374151', 
                        marginBottom: '8px',
                        textTransform: 'capitalize'
                      }}>
                        {category}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {items.map((item) => (
                          <div key={item.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'white',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div>
                              <span style={{ fontSize: '13px', color: '#111827' }}>{item.name}</span>
                              {item.description && (
                                <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '8px' }}>
                                  - {item.description}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeLowLevel(category, item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </>
        )}

        {/* Continue Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Step 4 of 5 • Supercurricular Activities
          </span>
          <button
            onClick={handleContinue}
            style={{
              padding: '12px 24px',
              background: '#00ced1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Continue to Goals
          </button>
        </div>
      </div>
    );
  };

  const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState({ text: '', category: 'academic', deadline: '', priority: 'medium' });
    const [skipForNow, setSkipForNow] = useState(false);

    const addGoal = () => {
      if (newGoal.text.trim()) {
        setGoals([...goals, {
          ...newGoal,
          id: Date.now(),
          completed: false,
          addedDate: new Date().toISOString()
        }]);
        setNewGoal({ text: '', category: 'academic', deadline: '', priority: 'medium' });
      }
    };

    const removeGoal = (id) => {
      setGoals(goals.filter(g => g.id !== id));
    };

    const toggleGoal = (id) => {
      setGoals(goals.map(goal => 
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      ));
    };

    const handleContinue = () => {
      proceedToNextStep({ 
        weeklyGoals: goals,
        academicGoals: goals.filter(g => g.category === 'academic'),
        setupCompleted: true
      });
      setCurrentStep('complete');
    };

    return (
      <div style={cardStyle}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#111827' 
          }}>
            🎯 Goals & Milestones
          </h2>
          <p style={{ 
            margin: '0', 
            color: '#6b7280', 
            fontSize: '14px' 
          }}>
            Set your academic and application goals
          </p>
        </div>

        {/* Skip Option */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
            <input
              type="checkbox"
              checked={skipForNow}
              onChange={(e) => setSkipForNow(e.target.checked)}
            />
            I'll set my goals later - skip for now
          </label>
        </div>

        {!skipForNow && (
          <>
            {/* Add Goal Form */}
            <div style={{
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Goal Description
                </label>
                <input
                  type="text"
                  value={newGoal.text}
                  onChange={(e) => setNewGoal({...newGoal, text: e.target.value})}
                  placeholder="e.g., Complete personal statement draft by end of month"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                    Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="academic">Academic</option>
                    <option value="application">Application</option>
                    <option value="research">Research</option>
                    <option value="extracurricular">Extracurricular</option>
                    <option value="personal">Personal Development</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                    Priority
                  </label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                    Deadline (optional)
                  </label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <button
                  onClick={addGoal}
                  disabled={!newGoal.text.trim()}
                  style={{
                    padding: '8px 16px',
                    background: newGoal.text.trim() ? '#00ced1' : '#e5e7eb',
                    color: newGoal.text.trim() ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: newGoal.text.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  Add Goal
                </button>
              </div>
            </div>

            {/* Goals List */}
            {goals.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '12px' 
                }}>
                  Your Goals ({goals.filter(g => !g.completed).length} active, {goals.filter(g => g.completed).length} completed)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {goals.map((goal) => (
                    <div key={goal.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: goal.completed ? '#f9fafb' : 'white',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      opacity: goal.completed ? 0.7 : 1
                    }}>
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        onChange={() => toggleGoal(goal.id)}
                        style={{
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          textDecoration: goal.completed ? 'line-through' : 'none',
                          color: goal.completed ? '#9ca3af' : '#111827',
                          fontSize: '14px',
                          marginBottom: '4px'
                        }}>
                          {goal.text}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: goal.category === 'academic' ? '#e1dfff' : 
                                       goal.category === 'application' ? '#dcfce7' :
                                       goal.category === 'research' ? '#fef3c7' : '#f3f4f6',
                            color: goal.category === 'academic' ? '#221468' : 
                                   goal.category === 'application' ? '#166534' :
                                   goal.category === 'research' ? '#92400e' : '#6b7280'
                          }}>
                            {goal.category}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: goal.priority === 'high' ? '#fee2e2' : 
                                       goal.priority === 'medium' ? '#fef3c7' : '#f3f4f6',
                            color: goal.priority === 'high' ? '#991b1b' : 
                                   goal.priority === 'medium' ? '#92400e' : '#6b7280'
                          }}>
                            {goal.priority} priority
                          </span>
                          {goal.deadline && (
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                              📅 {new Date(goal.deadline).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '14px',
                          marginLeft: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Continue Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Step 5 of 5 • Goals & Milestones
          </span>
          <button
            onClick={handleContinue}
            style={{
              padding: '12px 24px',
              background: '#00ced1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Complete Setup
          </button>
        </div>
      </div>
    );
  };

  const SetupComplete = () => (
    <div style={{ ...cardStyle, maxWidth: '600px', textAlign: 'center' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
        <h1 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '28px', 
          fontWeight: '600', 
          color: '#111827' 
        }}>
          Setup Complete!
        </h1>
        <p style={{ 
          margin: '0 0 24px 0', 
          color: '#6b7280', 
          fontSize: '16px', 
          lineHeight: '1.6' 
        }}>
          Your comprehensive academic profile has been created. You can now access your personalized dashboard and start working with your study buddy.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={() => completeSetup()}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? '#e5e7eb' : '#00ced1',
            color: loading ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {loading && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #e2e8f0',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          {loading ? 'Saving...' : 'Go to Dashboard'}
        </button>
      </div>
    </div>
  );

  // Main Render
  return (
    <div style={backgroundStyle}>
      {/* Progress Indicator */}
      {currentStep !== 'complete' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '12px 24px',
          borderRadius: '24px',
          border: '1px solid #a8dcc6',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {['archetype', 'academic', 'universities', 'reading', 'activities', 'goals'].map((step, index) => (
              <div key={step} style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: ['archetype', 'academic', 'universities', 'reading', 'activities', 'goals'].indexOf(currentStep) >= index 
                  ? '#00ced1' : '#e5e7eb',
                transition: 'background 0.3s ease'
              }} />
            ))}
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '12px', 
              fontWeight: '500', 
              color: '#374151' 
            }}>
              Profile Setup
            </span>
          </div>
        </div>
      )}

      {/* Step Components */}
      {currentStep === 'archetype' && <ArchetypeSelection />}
      {currentStep === 'academic' && <AcademicProfile />}
      {currentStep === 'universities' && <UniversityTargets />}
      {currentStep === 'reading' && <Reading />}
      {currentStep === 'activities' && <Activities />}
      {currentStep === 'goals' && <Goals />}
      {currentStep === 'complete' && <SetupComplete />}

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfileSetupWizard;

