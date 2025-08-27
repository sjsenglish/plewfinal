import React, { useState } from 'react';

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

const EnhancedUniversityTab = ({ profile, currentSubjects, onProfileUpdate }) => {
  const universityTargets = profile.universityTargets || profile.universities || [];
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [manualEntryData, setManualEntryData] = useState({
    type: '',
    data: {}
  });

  // Helper function to generate course URL
  const generateCourseUrl = (university, course) => {
    if (!university || !course) return null;
    
    const universitySlug = university.toLowerCase()
      .replace(/university of /g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    const courseSlug = course.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Common URL patterns for UK universities
    const urlPatterns = {
      'cambridge': `https://www.undergraduate.study.cam.ac.uk/courses/${courseSlug}`,
      'oxford': `https://www.ox.ac.uk/admissions/undergraduate/courses-listing/${courseSlug}`,
      'imperial': `https://www.imperial.ac.uk/study/ug/courses/${courseSlug}`,
      'ucl': `https://www.ucl.ac.uk/prospective-students/undergraduate/degrees/${courseSlug}`,
      'lse': `https://www.lse.ac.uk/study-at-lse/undergraduate/degree-programmes-2025/${courseSlug}`,
      'edinburgh': `https://www.ed.ac.uk/studying/undergraduate/degrees/index.php?action=view&code=${courseSlug.toUpperCase()}`,
      'warwick': `https://warwick.ac.uk/study/undergraduate/courses/${courseSlug}`,
      'bristol': `https://www.bristol.ac.uk/study/undergraduate/search/${courseSlug}`,
      'manchester': `https://www.manchester.ac.uk/study/undergraduate/courses/${courseSlug}`,
      'nottingham': `https://www.nottingham.ac.uk/ugstudy/courses/${courseSlug}`,
      'birmingham': `https://www.birmingham.ac.uk/undergraduate/courses/${courseSlug}`,
      'leeds': `https://courses.leeds.ac.uk/i/${courseSlug}`,
      'sheffield': `https://www.sheffield.ac.uk/undergraduate/courses/${courseSlug}`,
      'southampton': `https://www.southampton.ac.uk/courses/undergraduate/${courseSlug}`,
      'york': `https://www.york.ac.uk/study/undergraduate/courses/${courseSlug}/`,
      'bath': `https://www.bath.ac.uk/courses/${courseSlug}/`,
      'durham': `https://www.durham.ac.uk/study/courses/${courseSlug}/`,
      'exeter': `https://www.exeter.ac.uk/undergraduate/courses/${courseSlug}/`,
      'lancaster': `https://www.lancaster.ac.uk/study/undergraduate/courses/${courseSlug}/`,
      'stAndrews': `https://www.st-andrews.ac.uk/subjects/${courseSlug}/`,
      'surrey': `https://www.surrey.ac.uk/undergraduate/${courseSlug}`,
      'sussex': `https://www.sussex.ac.uk/study/undergraduate/courses/${courseSlug}`,
      'cardiff': `https://www.cardiff.ac.uk/study/undergraduate/courses/${courseSlug}`,
      'glasgow': `https://www.gla.ac.uk/undergraduate/degrees/${courseSlug}/`,
      'newcastle': `https://www.ncl.ac.uk/undergraduate/degrees/${courseSlug}/`
    };

    return urlPatterns[universitySlug] || `https://www.google.com/search?q=${university}+${course}+undergraduate+course`;
  };

  // Calculate completion percentage for research status
  const calculateCompletionStatus = (uni) => {
    let completed = 0;
    let total = 7; // Total aspects to track

    if (uni.courseUrl || generateCourseUrl(uni.name, uni.course)) completed++;
    if (uni.requirements?.grades) completed++;
    if (uni.requirements?.admissionTest !== undefined) completed++; // Can be null for "none"
    if (uni.modules?.year1Core?.length > 0) completed++;
    if (uni.modules?.year2Options?.length > 0) completed++;
    if (uni.department?.specializations?.length > 0) completed++;
    if (uni.tutors?.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  // Get status color based on completion
  const getStatusColor = (percentage) => {
    if (percentage >= 80) return { bg: COLORS.mint, text: COLORS.darkGreen, label: 'Complete' };
    if (percentage >= 60) return { bg: COLORS.lavender, text: COLORS.purpleDark, label: 'Good Progress' };
    if (percentage >= 40) return { bg: COLORS.lightPurple, text: COLORS.navyBlue, label: 'In Progress' };
    return { bg: '#ffeaa7', text: '#e17055', label: 'Needs Research' };
  };

  // Research prompts for missing information
  const getResearchPrompts = (uni) => {
    const prompts = [];
    
    if (!uni.requirements?.grades) {
      prompts.push(`Research ${uni.name} ${uni.course} grade requirements`);
    }
    if (!uni.modules?.year1Core?.length) {
      prompts.push(`Find first-year core modules for ${uni.course} at ${uni.name}`);
    }
    if (!uni.modules?.year2Options?.length) {
      prompts.push(`Explore optional modules for years 2-3`);
    }
    if (!uni.department?.specializations?.length) {
      prompts.push(`Research department specializations and research areas`);
    }
    if (!uni.tutors?.length) {
      prompts.push(`Find 2-3 tutors whose research interests align with yours`);
    }

    return prompts;
  };

  // Manual entry functions
  const openManualEntry = (university, entryType) => {
    setSelectedUniversity(university);
    setManualEntryData({
      type: entryType,
      data: {}
    });
    setShowManualEntry(true);
  };

  const handleManualEntrySubmit = () => {
    if (!selectedUniversity || !onProfileUpdate) return;

    const updatedProfile = { ...profile };
    const universityIndex = updatedProfile.universityTargets?.findIndex(
      uni => uni.name === selectedUniversity.name
    ) ?? -1;

    if (universityIndex >= 0) {
      const updatedUniversity = { ...updatedProfile.universityTargets[universityIndex] };

      switch (manualEntryData.type) {
        case 'requirements':
          updatedUniversity.requirements = {
            ...updatedUniversity.requirements,
            ...manualEntryData.data
          };
          break;
        case 'modules':
          updatedUniversity.modules = {
            ...updatedUniversity.modules,
            ...manualEntryData.data
          };
          break;
        case 'department':
          updatedUniversity.department = {
            ...updatedUniversity.department,
            ...manualEntryData.data
          };
          break;
        case 'tutors':
          updatedUniversity.tutors = manualEntryData.data.tutors || [];
          break;
      }

      updatedProfile.universityTargets[universityIndex] = updatedUniversity;
      onProfileUpdate(updatedProfile);
    }

    setShowManualEntry(false);
    setSelectedUniversity(null);
    setManualEntryData({ type: '', data: {} });
  };

  const renderManualEntryModal = () => {
    if (!showManualEntry || !selectedUniversity) return null;

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
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              margin: 0,
              color: COLORS.darkGreen,
              fontSize: '20px',
              fontWeight: '700'
            }}>
              Add Research Info: {selectedUniversity.name}
            </h3>
            <button
              onClick={() => setShowManualEntry(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              ×
            </button>
          </div>

          {manualEntryData.type === 'requirements' && (
            <div>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>Entry Requirements</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Grade Requirements
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., A*AA"
                    value={manualEntryData.data.grades || ''}
                    onChange={(e) => setManualEntryData(prev => ({
                      ...prev,
                      data: { ...prev.data, grades: e.target.value }
                    }))}
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
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Required Subjects (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mathematics, Further Mathematics"
                    value={manualEntryData.data.subjects?.join(', ') || ''}
                    onChange={(e) => setManualEntryData(prev => ({
                      ...prev,
                      data: { ...prev.data, subjects: e.target.value.split(',').map(s => s.trim()) }
                    }))}
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
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Admission Test
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., MAT, STEP, or 'None'"
                    value={manualEntryData.data.admissionTest || ''}
                    onChange={(e) => setManualEntryData(prev => ({
                      ...prev,
                      data: { ...prev.data, admissionTest: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {manualEntryData.type === 'modules' && (
            <div>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>Course Modules</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Year 1 Core Modules (one per line)
                  </label>
                  <textarea
                    placeholder="Linear Algebra&#10;Calculus&#10;Discrete Mathematics"
                    value={manualEntryData.data.year1Core?.join('\n') || ''}
                    onChange={(e) => setManualEntryData(prev => ({
                      ...prev,
                      data: { ...prev.data, year1Core: e.target.value.split('\n').filter(m => m.trim()) }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Year 2 Optional Modules (one per line)
                  </label>
                  <textarea
                    placeholder="Advanced Analysis&#10;Group Theory&#10;Probability Theory"
                    value={manualEntryData.data.year2Options?.join('\n') || ''}
                    onChange={(e) => setManualEntryData(prev => ({
                      ...prev,
                      data: { ...prev.data, year2Options: e.target.value.split('\n').filter(m => m.trim()) }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {manualEntryData.type === 'department' && (
            <div>
              <h4 style={{ margin: '0 0 16px 0', color: '#374151' }}>Department Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Department Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Department of Mathematics"
                    value={manualEntryData.data.name || ''}
                    onChange={(e) => setManualEntryData(prev => ({
                      ...prev,
                      data: { ...prev.data, name: e.target.value }
                    }))}
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
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Specializations (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Pure Mathematics, Applied Mathematics, Statistics"
                    value={manualEntryData.data.specializations?.join(', ') || ''}
                    onChange={(e) => setManualEntryData(prev => ({
                      ...prev,
                      data: { ...prev.data, specializations: e.target.value.split(',').map(s => s.trim()) }
                    }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setShowManualEntry(false)}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              Cancel
            </button>
            <button
              onClick={handleManualEntrySubmit}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: COLORS.teal,
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.background = '#00b4b7'}
              onMouseLeave={(e) => e.target.style.background = COLORS.teal}
            >
              Save Information
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 8px' }}>
      {/* Header Section - Apple-inspired */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '32px',
        padding: '24px 32px',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(168, 220, 198, 0.3)',
        boxShadow: '0 8px 32px rgba(42, 68, 66, 0.08)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundImage: `url(${ICONS.trophy})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          marginRight: '24px',
          transform: 'scale(1.1)'
        }}></div>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            ...TYPOGRAPHY.h2,
            margin: '0 0 8px 0', 
            color: COLORS.darkGreen
          }}>
            University & Course Research
          </h3>
          {universityTargets.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                ...TYPOGRAPHY.body,
                color: COLORS.mediumGreen,
                fontWeight: '600'
              }}>
                {universityTargets.length} target{universityTargets.length !== 1 ? 's' : ''} tracked
              </span>
              <div style={{
                padding: '6px 12px',
                background: `linear-gradient(135deg, ${COLORS.mint}, rgba(255, 255, 255, 0.9))`,
                borderRadius: '12px',
                border: `1px solid ${COLORS.mediumGreen}30`,
                ...TYPOGRAPHY.caption,
                color: COLORS.darkGreen,
                fontWeight: '600'
              }}>
                {Math.round(universityTargets.reduce((acc, uni) => acc + calculateCompletionStatus(uni), 0) / universityTargets.length)}% avg completion
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Research Instructions Banner - Apple-inspired */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.teal}12 0%, ${COLORS.mint}90 50%, rgba(255, 255, 255, 0.95) 100%)`,
        border: `1px solid ${COLORS.teal}40`,
        borderRadius: '24px',
        padding: '32px 40px',
        marginBottom: '40px',
        boxShadow: '0 12px 40px rgba(0, 206, 209, 0.12)',
        backdropFilter: 'blur(20px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '20px'
        }}>
          <div style={{
            fontSize: '36px',
            lineHeight: '1',
            padding: '8px'
          }}>
            📚
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{
              ...TYPOGRAPHY.h4,
              margin: '0 0 16px 0',
              color: COLORS.darkGreen
            }}>
              How to Add University Research Information
            </h4>
            <p style={{
              ...TYPOGRAPHY.body,
              margin: '0 0 20px 0',
              color: '#4b5563'
            }}>
              Build a comprehensive research profile for each university to strengthen your applications. Here's how to add information:
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(0, 206, 209, 0.25)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>💬</span>
                  <strong style={{ 
                    ...TYPOGRAPHY.h6,
                    color: COLORS.darkGreen
                  }}>Chat with Bo</strong>
                </div>
                <p style={{
                  ...TYPOGRAPHY.bodySmall,
                  margin: '0',
                  color: '#6b7280'
                }}>
                  Tell Bo about your research: "I found that Cambridge Economics requires A*AA with Maths..."
                </p>
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(0, 206, 209, 0.25)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>📝</span>
                  <strong style={{ 
                    ...TYPOGRAPHY.h6,
                    color: COLORS.darkGreen
                  }}>Manual Entry</strong>
                </div>
                <p style={{
                  ...TYPOGRAPHY.bodySmall,
                  margin: '0',
                  color: '#6b7280'
                }}>
                  Use the "Add Research Info" buttons below to manually enter specific details
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(0, 206, 209, 0.4)',
              boxShadow: '0 6px 24px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <strong style={{ 
                  ...TYPOGRAPHY.h6,
                  color: COLORS.darkGreen
                }}>Research Categories to Track:</strong>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px'
              }}>
                {[
                  'Entry requirements & grades',
                  'Admission tests & deadlines',
                  'Course modules & structure',
                  'Department specializations',
                  'Faculty research interests',
                  'Campus facilities & location'
                ].map((category, idx) => (
                  <div key={idx} style={{
                    padding: '10px 16px',
                    background: `linear-gradient(135deg, ${COLORS.teal}15, rgba(255, 255, 255, 0.9))`,
                    color: COLORS.darkGreen,
                    borderRadius: '12px',
                    ...TYPOGRAPHY.caption,
                    fontWeight: '600',
                    textAlign: 'center',
                    border: `1px solid ${COLORS.teal}30`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default'
                  }}>
                    {category}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Subjects Overview - Apple-inspired */}
      {currentSubjects.length > 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.mint}70 0%, rgba(255, 255, 255, 0.98) 100%)`,
          padding: '32px',
          borderRadius: '24px',
          marginBottom: '32px',
          border: `1px solid ${COLORS.mediumGreen}40`,
          boxShadow: '0 12px 40px rgba(91, 143, 138, 0.12)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundImage: `url(${ICONS.toaster})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              marginRight: '16px',
              transform: 'scale(1.1)'
            }}></div>
            <h4 style={{ 
              ...TYPOGRAPHY.h5,
              margin: '0', 
              color: COLORS.darkGreen
            }}>
              Current Academic Profile
            </h4>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {currentSubjects.map((subject, index) => (
              <span key={index} style={{
                background: `linear-gradient(135deg, ${COLORS.darkGreen} 0%, ${COLORS.mediumGreen} 100%)`,
                color: 'white',
                padding: '12px 20px',
                borderRadius: '16px',
                ...TYPOGRAPHY.bodySmall,
                fontWeight: '600',
                boxShadow: '0 6px 20px rgba(42, 68, 66, 0.25)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateY(0)',
                cursor: 'default'
              }}>
                {subject.name || subject}
                {subject.grade && <span style={{ opacity: 0.85, marginLeft: '6px' }}>({subject.grade})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* University Targets - Apple-inspired */}
      {universityTargets.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {universityTargets.map((uni, index) => {
            const completion = calculateCompletionStatus(uni);
            const status = getStatusColor(completion);
            const researchPrompts = getResearchPrompts(uni);
            const courseUrl = uni.courseUrl || generateCourseUrl(uni.name || uni.university, uni.course || uni.degree);

            return (
              <div key={index} style={{
                background: `linear-gradient(135deg, ${COLORS.lavenderLight}80 0%, rgba(255, 255, 255, 0.98) 100%)`,
                borderRadius: '24px',
                padding: '36px 40px',
                border: `1px solid ${COLORS.purpleDark}30`,
                boxShadow: '0 16px 48px rgba(34, 20, 104, 0.12)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Header - Apple-inspired */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '28px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                      <h4 style={{ 
                        ...TYPOGRAPHY.h4,
                        margin: '0', 
                        color: '#111827'
                      }}>
                        {uni.name || uni.university}
                      </h4>
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: '12px',
                        ...TYPOGRAPHY.caption,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: uni.priority === 'target' 
                          ? 'linear-gradient(135deg, #dbeafe, #f0f9ff)' 
                          : 'linear-gradient(135deg, #f3e8ff, #faf5ff)',
                        color: uni.priority === 'target' ? '#1e40af' : '#7c3aed',
                        border: `1px solid ${uni.priority === 'target' ? '#3b82f6' : '#a855f7'}30`
                      }}>
                        {uni.priority || uni.type || 'Target'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      <h5 style={{ 
                        ...TYPOGRAPHY.h6,
                        margin: '0', 
                        color: '#6b7280'
                      }}>
                        {uni.course || uni.degree}
                      </h5>
                      {courseUrl && (
                        <a 
                          href={courseUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: '#0ea5e9',
                            textDecoration: 'none',
                            ...TYPOGRAPHY.caption,
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                            border: '1px solid #0ea5e940',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.15)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, #f0f9ff, #e0f2fe)';
                            e.target.style.color = '#0ea5e9';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.15)';
                          }}
                        >
                          🔗 Course Page
                        </a>
                      )}
                    </div>

                    {/* Research Progress - Apple-inspired */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{
                        flex: 1,
                        height: '12px',
                        background: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${completion}%`,
                          background: `linear-gradient(90deg, ${status.bg}, ${status.text})`,
                          borderRadius: '8px',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }} />
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          ...TYPOGRAPHY.caption,
                          fontWeight: '700',
                          background: `linear-gradient(135deg, ${status.bg}, rgba(255, 255, 255, 0.9))`,
                          color: status.text,
                          border: `1px solid ${status.text}20`,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          {completion}% Complete
                        </span>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          ...TYPOGRAPHY.caption,
                          fontWeight: '600',
                          background: 'rgba(75, 85, 99, 0.1)',
                          color: '#374151'
                        }}>
                          {status.label}
                        </div>
                      </div>
                    </div>
                    
                    {/* Manual Entry Buttons - Apple-inspired */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginTop: '20px'
                    }}>
                      <button
                        onClick={() => openManualEntry(uni, 'requirements')}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '12px',
                          border: `1px solid ${COLORS.teal}40`,
                          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(0, 206, 209, 0.05))`,
                          color: COLORS.teal,
                          ...TYPOGRAPHY.caption,
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 8px rgba(0, 206, 209, 0.15)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = `linear-gradient(135deg, ${COLORS.teal}, #00b4b7)`;
                          e.target.style.color = 'white';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 16px rgba(0, 206, 209, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = `linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(0, 206, 209, 0.05))`;
                          e.target.style.color = COLORS.teal;
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(0, 206, 209, 0.15)';
                        }}
                      >
                        📊 Add Requirements
                      </button>
                      <button
                        onClick={() => openManualEntry(uni, 'modules')}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '12px',
                          border: `1px solid ${COLORS.teal}40`,
                          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(0, 206, 209, 0.05))`,
                          color: COLORS.teal,
                          ...TYPOGRAPHY.caption,
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 8px rgba(0, 206, 209, 0.15)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = `linear-gradient(135deg, ${COLORS.teal}, #00b4b7)`;
                          e.target.style.color = 'white';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 16px rgba(0, 206, 209, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = `linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(0, 206, 209, 0.05))`;
                          e.target.style.color = COLORS.teal;
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(0, 206, 209, 0.15)';
                        }}
                      >
                        📚 Add Modules
                      </button>
                      <button
                        onClick={() => openManualEntry(uni, 'department')}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '12px',
                          border: `1px solid ${COLORS.teal}40`,
                          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(0, 206, 209, 0.05))`,
                          color: COLORS.teal,
                          ...TYPOGRAPHY.caption,
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 8px rgba(0, 206, 209, 0.15)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = `linear-gradient(135deg, ${COLORS.teal}, #00b4b7)`;
                          e.target.style.color = 'white';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 16px rgba(0, 206, 209, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = `linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(0, 206, 209, 0.05))`;
                          e.target.style.color = COLORS.teal;
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(0, 206, 209, 0.15)';
                        }}
                      >
                        🏛️ Add Department Info
                      </button>
                    </div>
                  </div>
                </div>

                {/* Requirements Section - Apple-inspired */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px',
                  marginBottom: '28px'
                }}>
                  <div style={{
                    background: 'rgba(248, 250, 252, 0.9)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <h5 style={{ 
                      ...TYPOGRAPHY.h6,
                      margin: '0 0 16px 0', 
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📊 Entry Requirements
                    </h5>
                    {uni.requirements?.grades ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{
                          padding: '12px 16px',
                          background: 'rgba(34, 197, 94, 0.1)',
                          borderRadius: '12px',
                          border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}>
                          <strong style={{ 
                            ...TYPOGRAPHY.bodySmall,
                            color: '#065f46',
                            fontWeight: '600'
                          }}>Grades:</strong>
                          <span style={{ 
                            ...TYPOGRAPHY.bodySmall,
                            color: '#111827',
                            marginLeft: '8px',
                            fontWeight: '600'
                          }}>{uni.requirements.grades}</span>
                        </div>
                        {uni.requirements.subjects && (
                          <div style={{
                            padding: '12px 16px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          }}>
                            <strong style={{ 
                              ...TYPOGRAPHY.bodySmall,
                              color: '#1e40af',
                              fontWeight: '600'
                            }}>Required Subjects:</strong>
                            <div style={{
                              ...TYPOGRAPHY.caption,
                              color: '#374151',
                              marginTop: '4px'
                            }}>{uni.requirements.subjects.join(', ')}</div>
                          </div>
                        )}
                        {uni.requirements.admissionTest && (
                          <div style={{
                            padding: '12px 16px',
                            background: 'rgba(168, 85, 247, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(168, 85, 247, 0.2)'
                          }}>
                            <strong style={{ 
                              ...TYPOGRAPHY.bodySmall,
                              color: '#7c3aed',
                              fontWeight: '600'
                            }}>Admission Test:</strong>
                            <span style={{ 
                              ...TYPOGRAPHY.bodySmall,
                              color: '#111827',
                              marginLeft: '8px'
                            }}>{uni.requirements.admissionTest}</span>
                          </div>
                        )}
                        {uni.requirements.admissionTest === null && (
                          <div style={{ 
                            ...TYPOGRAPHY.caption,
                            color: '#6b7280',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            padding: '8px'
                          }}>
                            No admission test required
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ 
                        ...TYPOGRAPHY.bodySmall,
                        margin: '0', 
                        color: '#9ca3af', 
                        fontStyle: 'italic',
                        textAlign: 'center',
                        padding: '16px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '8px'
                      }}>
                        Research grade requirements and admission tests
                      </p>
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(248, 250, 252, 0.9)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <h5 style={{ 
                      ...TYPOGRAPHY.h6,
                      margin: '0 0 16px 0', 
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🏛️ Department Info
                    </h5>
                    {uni.department?.name ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                          padding: '16px',
                          background: 'rgba(79, 70, 229, 0.1)',
                          borderRadius: '12px',
                          border: '1px solid rgba(79, 70, 229, 0.2)'
                        }}>
                          <strong style={{ 
                            ...TYPOGRAPHY.body,
                            color: '#4338ca',
                            fontWeight: '600'
                          }}>{uni.department.name}</strong>
                        </div>
                        {uni.department.specializations?.length > 0 && (
                          <div>
                            <strong style={{ 
                              ...TYPOGRAPHY.bodySmall,
                              color: '#111827',
                              fontWeight: '600',
                              marginBottom: '8px',
                              display: 'block'
                            }}>Specializations:</strong>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              {uni.department.specializations.map((spec, idx) => (
                                <span key={idx} style={{
                                  background: 'linear-gradient(135deg, #e1dfff, #f3f0ff)',
                                  color: '#221468',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  ...TYPOGRAPHY.caption,
                                  fontWeight: '600',
                                  border: '1px solid rgba(34, 20, 104, 0.2)'
                                }}>
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {uni.department.researchAreas?.length > 0 && (
                          <div>
                            <strong style={{ 
                              ...TYPOGRAPHY.bodySmall,
                              color: '#111827',
                              fontWeight: '600'
                            }}>Research Areas:</strong>
                            <div style={{ 
                              ...TYPOGRAPHY.caption,
                              color: '#6b7280',
                              marginTop: '4px',
                              lineHeight: '1.6'
                            }}>
                              {uni.department.researchAreas.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ 
                        ...TYPOGRAPHY.bodySmall,
                        margin: '0', 
                        color: '#9ca3af', 
                        fontStyle: 'italic',
                        textAlign: 'center',
                        padding: '16px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '8px'
                      }}>
                        Research department structure and specializations
                      </p>
                    )}
                  </div>
                </div>

                {/* Course Structure - Apple-inspired */}
                <div style={{
                  background: 'rgba(248, 250, 252, 0.9)',
                  padding: '28px',
                  borderRadius: '20px',
                  marginBottom: '24px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
                  backdropFilter: 'blur(15px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <h5 style={{ 
                    ...TYPOGRAPHY.h6,
                    margin: '0 0 20px 0', 
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    📚 Course Structure
                  </h5>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px'
                  }}>
                    <div>
                      <h6 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '13px', fontWeight: '600' }}>
                        Year 1 - Core Modules
                      </h6>
                      {uni.modules?.year1Core?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {uni.modules.year1Core.map((module, idx) => (
                            <span key={idx} style={{
                              background: '#dcfce7',
                              color: '#166534',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              {module}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: '0', color: '#9ca3af', fontSize: '11px', fontStyle: 'italic' }}>
                          Find first-year modules
                        </p>
                      )}
                    </div>

                    <div>
                      <h6 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '13px', fontWeight: '600' }}>
                        Year 2 - Options
                      </h6>
                      {uni.modules?.year2Options?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {uni.modules.year2Options.slice(0, 3).map((module, idx) => (
                            <span key={idx} style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              {module}
                            </span>
                          ))}
                          {uni.modules.year2Options.length > 3 && (
                            <span style={{
                              color: '#6b7280',
                              fontSize: '10px',
                              fontStyle: 'italic'
                            }}>
                              +{uni.modules.year2Options.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p style={{ margin: '0', color: '#9ca3af', fontSize: '11px', fontStyle: 'italic' }}>
                          Research optional modules
                        </p>
                      )}
                    </div>

                    <div>
                      <h6 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '13px', fontWeight: '600' }}>
                        Year 3 - Specialization
                      </h6>
                      {uni.modules?.year3Options?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {uni.modules.year3Options.slice(0, 3).map((module, idx) => (
                            <span key={idx} style={{
                              background: '#f3e8ff',
                              color: '#7c3aed',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              {module}
                            </span>
                          ))}
                          {uni.modules.year3Options.length > 3 && (
                            <span style={{
                              color: '#6b7280',
                              fontSize: '10px',
                              fontStyle: 'italic'
                            }}>
                              +{uni.modules.year3Options.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p style={{ margin: '0', color: '#9ca3af', fontSize: '11px', fontStyle: 'italic' }}>
                          Explore final year options
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tutors Section */}
                {uni.tutors?.length > 0 && (
                  <div style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h5 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px', fontWeight: '600' }}>
                      👨‍🏫 Research-Aligned Tutors
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {uni.tutors.map((tutor, idx) => (
                        <div key={idx} style={{
                          background: 'white',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ color: '#111827', fontSize: '13px' }}>{tutor.name}</strong>
                              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>
                                <strong>Research:</strong> {tutor.interests}
                              </div>
                              {tutor.why && (
                                <div style={{ color: '#059669', fontSize: '11px', marginTop: '4px', fontStyle: 'italic' }}>
                                  "{tutor.why}"
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research To-Do List */}
                {researchPrompts.length > 0 && (
                  <div style={{
                    background: '#fef3c7',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #f59e0b'
                  }}>
                    <h5 style={{ 
                      margin: '0 0 12px 0', 
                      color: '#92400e', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🔍 Research Needed
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {researchPrompts.map((prompt, idx) => (
                        <div key={idx} style={{
                          color: '#92400e',
                          fontSize: '12px',
                          padding: '6px 0',
                          borderBottom: idx < researchPrompts.length - 1 ? '1px solid #fbbf24' : 'none'
                        }}>
                          {prompt}
                        </div>
                      ))}
                    </div>
                    <div style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#92400e',
                      fontStyle: 'italic'
                    }}>
                      💡 <strong>Tip:</strong> Tell your study buddy what you discover - I'll automatically organize and store this information for your applications!
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.5)',
          padding: '48px 32px',
          borderRadius: '16px',
          border: '1px solid #a8dcc6',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            color: '#111827', 
            fontSize: '18px', 
            fontWeight: '600' 
          }}>
            No University Targets Set
          </h4>
          <p style={{ 
            margin: '0 0 20px 0', 
            color: '#6b7280', 
            fontSize: '15px', 
            lineHeight: '1.5',
            maxWidth: '400px',
            margin: '0 auto 20px auto'
          }}>
            Start by telling your study buddy about universities you're interested in. I'll help you research course requirements, modules, and find tutors whose research aligns with your interests.
          </p>
          <div style={{
            background: '#f0f9ff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #0ea5e9',
            fontSize: '14px',
            color: '#0c4a6e',
            fontWeight: '500'
          }}>
            💬 Try saying: "I'm interested in Economics at Cambridge and LSE"
          </div>
        </div>
      )}
      
      {/* Manual Entry Modal */}
      {renderManualEntryModal()}
    </div>
  );
};

export default EnhancedUniversityTab;