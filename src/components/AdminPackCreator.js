import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { liteClient as algoliasearch } from 'algoliasearch/lite';

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Subject configuration - Korean-English only
const SUBJECTS = {
  'korean-english': {
    index: 'csat_final',
    displayName: 'Korean-English',
    description: 'Korean-English Language Questions',
    filterCategories: {
      year: [
        { id: 'year-2024', label: '2024', value: 'year:2024' },
        { id: 'year-2023', label: '2023', value: 'year:2023' },
        { id: 'year-2022', label: '2022', value: 'year:2022' },
        { id: 'year-2021', label: '2021', value: 'year:2021' },
        { id: 'year-2020', label: '2020', value: 'year:2020' },
      ],
      subjectArea: [
        { id: 'grammar', label: 'Grammar', value: 'subject_area:"Grammar"' },
        { id: 'vocabulary', label: 'Vocabulary', value: 'subject_area:"Vocabulary"' },
        { id: 'reading', label: 'Reading Comprehension', value: 'subject_area:"Reading"' },
        { id: 'writing', label: 'Writing', value: 'subject_area:"Writing"' },
        { id: 'speaking', label: 'Speaking', value: 'subject_area:"Speaking"' },
        { id: 'listening', label: 'Listening', value: 'subject_area:"Listening"' },
        { id: 'translation', label: 'Translation', value: 'subject_area:"Translation"' },
      ],
      difficulty: [
        { id: 'beginner', label: 'Beginner', value: 'difficulty:"Beginner"' },
        { id: 'intermediate', label: 'Intermediate', value: 'difficulty:"Intermediate"' },
        { id: 'advanced', label: 'Advanced', value: 'difficulty:"Advanced"' },
      ],
      questionType: [
        { id: 'multiple-choice', label: 'Multiple Choice', value: 'question_type:"Multiple Choice"' },
        { id: 'fill-blank', label: 'Fill in the Blank', value: 'question_type:"Fill in the Blank"' },
        { id: 'translation', label: 'Translation', value: 'question_type:"Translation"' },
        { id: 'comprehension', label: 'Reading Comprehension', value: 'question_type:"Reading Comprehension"' },
      ],
    },
  },
};

const AdminPackCreator = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [existingPacks, setExistingPacks] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pack creation state
  const [packData, setPackData] = useState({
    packName: '',
    description: '',
    difficulty: 'beginner',
    subject: 'korean-english',
    tags: [],
    isActive: true
  });
  
  // Video creation state
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    difficulty: 'beginner',
    subject: 'korean-english',
    duration: '',
    tags: [],
    isActive: true
  });
  
  // Question selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filters, setFilters] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    loadExistingPacks();
    loadExistingVideos();
  }, []);

  const loadExistingPacks = async () => {
    try {
      const q = query(collection(db, 'adminQuestionPacks'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const packs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExistingPacks(packs);
    } catch (error) {
      console.error('Error loading existing packs:', error);
    }
  };

  const loadExistingVideos = async () => {
    try {
      const q = query(collection(db, 'adminVideos'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const videos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExistingVideos(videos);
    } catch (error) {
      console.error('Error loading existing videos:', error);
    }
  };

  const searchQuestions = async () => {
    if (!searchQuery.trim() && Object.keys(filters).length === 0) return;
    
    setIsSearching(true);
    try {
      const subjectConfig = SUBJECTS[packData.subject];
      
      // Build filter string
      const filterParts = Object.entries(filters)
        .filter(([_, values]) => values.length > 0)
        .map(([category, values]) => {
          return values.map(value => {
            const filterOption = subjectConfig.filterCategories[category]?.find(opt => opt.id === value);
            return filterOption ? filterOption.value : '';
          }).filter(Boolean).join(' OR ');
        })
        .filter(Boolean);

      const filterString = filterParts.length > 0 ? filterParts.map(part => `(${part})`).join(' AND ') : '';

      const response = await searchClient.search([
        {
          indexName: subjectConfig.index,
          params: {
            query: searchQuery,
            filters: filterString,
            hitsPerPage: 50,
          },
        },
      ]);

      setSearchResults(response.results[0].hits || []);
    } catch (error) {
      console.error('Error searching questions:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuestionSelect = (question) => {
    const isSelected = selectedQuestions.some(q => q.objectID === question.objectID);
    if (isSelected) {
      setSelectedQuestions(prev => prev.filter(q => q.objectID !== question.objectID));
    } else {
      setSelectedQuestions(prev => [...prev, question]);
    }
  };

  const handleFilterChange = (category, valueId) => {
    setFilters(prev => {
      const currentValues = prev[category] || [];
      const newValues = currentValues.includes(valueId)
        ? currentValues.filter(v => v !== valueId)
        : [...currentValues, valueId];
      
      return {
        ...prev,
        [category]: newValues
      };
    });
  };

  const handleCreatePack = async () => {
    if (!packData.packName.trim() || selectedQuestions.length === 0) {
      alert('Please provide a pack name and select at least one question.');
      return;
    }

    setLoading(true);
    try {
      const adminPack = {
        ...packData,
        selectedQuestionIds: selectedQuestions.map(q => q.objectID),
        totalQuestions: selectedQuestions.length,
        createdAt: new Date(),
        createdBy: 'admin',
        createdByUser: user?.uid || 'admin'
      };

      await addDoc(collection(db, 'adminQuestionPacks'), adminPack);
      
      alert('Admin pack created successfully!');
      
      // Reset form
      setPackData({
        packName: '',
        description: '',
        difficulty: 'beginner',
        subject: 'korean-english',
        tags: [],
        isActive: true
      });
      setSelectedQuestions([]);
      setSearchResults([]);
      setSearchQuery('');
      setFilters({});
      
      // Reload existing packs
      loadExistingPacks();
    } catch (error) {
      console.error('Error creating admin pack:', error);
      alert('Error creating pack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!videoData.title.trim() || !videoData.videoUrl.trim()) {
      alert('Please provide a video title and video URL.');
      return;
    }

    setLoading(true);
    try {
      const adminVideo = {
        ...videoData,
        createdAt: new Date(),
        createdBy: 'admin',
        createdByUser: user?.uid || 'admin'
      };

      await addDoc(collection(db, 'adminVideos'), adminVideo);
      
      alert('Admin video created successfully!');
      
      // Reset form
      setVideoData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        difficulty: 'beginner',
        subject: 'korean-english',
        duration: '',
        tags: [],
        isActive: true
      });
      
      // Reload existing videos
      loadExistingVideos();
    } catch (error) {
      console.error('Error creating admin video:', error);
      alert('Error creating video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (packId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'adminQuestionPacks', packId), {
        isActive: !currentStatus
      });
      loadExistingPacks();
    } catch (error) {
      console.error('Error updating pack status:', error);
    }
  };

  const handleToggleVideoActive = async (videoId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'adminVideos', videoId), {
        isActive: !currentStatus
      });
      loadExistingVideos();
    } catch (error) {
      console.error('Error updating video status:', error);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteDoc(doc(db, 'adminVideos', videoId));
        loadExistingVideos();
      } catch (error) {
        console.error('Error deleting video:', error);
        alert('Error deleting video. Please try again.');
      }
    }
  };

  const handleDeletePack = async (packId) => {
    if (!window.confirm('Are you sure you want to delete this pack?')) return;
    
    try {
      await deleteDoc(doc(db, 'adminQuestionPacks', packId));
      loadExistingPacks();
    } catch (error) {
      console.error('Error deleting pack:', error);
    }
  };

  // Get question preview for Korean-English - same as QuestionPackPage
  const getQuestionPreview = (question) => {
    let korean = question.questionText || question.korean || question.korean_text || '';
    let english = question.actualQuestion || question.english || question.english_text || '';
    const questionType = question.question_type || '';
    const subjectArea = question.subject_area || '';
    
    // Handle object values
    if (typeof korean === 'object' && korean !== null) {
      korean = korean.sentence || korean.text || korean.value || '';
    }
    if (typeof english === 'object' && english !== null) {
      english = english.sentence || english.text || english.value || '';
    }
    
    // Convert to strings
    korean = String(korean || '');
    english = String(english || '');
    const questionStr = String(question.question || '');
    
    // Create a meaningful preview
    if (korean && english) {
      return `${korean.substring(0, 30)}... → ${english.substring(0, 30)}...`;
    } else if (korean) {
      return `Korean: ${korean.substring(0, 40)}...`;
    } else if (english) {
      return `English: ${english.substring(0, 40)}...`;
    } else if (questionStr) {
      return questionStr.substring(0, 50) + (questionStr.length > 50 ? '...' : '');
    } else {
      return `${subjectArea || 'Korean-English'} ${questionType || 'Question'}`;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', color: '#1f2937' }}>
        Admin Pack Creator
      </h1>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('create')}
          style={{
            padding: '1rem 2rem',
            background: activeTab === 'create' ? '#4f46e5' : 'transparent',
            color: activeTab === 'create' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Create New Pack
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          style={{
            padding: '1rem 2rem',
            background: activeTab === 'manage' ? '#4f46e5' : 'transparent',
            color: activeTab === 'manage' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Manage Packs ({existingPacks.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          style={{
            padding: '1rem 2rem',
            background: activeTab === 'videos' ? '#4f46e5' : 'transparent',
            color: activeTab === 'videos' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Video Management ({existingVideos.length})
        </button>
      </div>

      {activeTab === 'create' ? (
        <div>
          {/* Pack Details Form */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Pack Details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Pack Name</label>
                <input
                  type="text"
                  value={packData.packName}
                  onChange={(e) => setPackData(prev => ({...prev, packName: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  placeholder="e.g., Basic Korean Greetings"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Difficulty</label>
                <select
                  value={packData.difficulty}
                  onChange={(e) => setPackData(prev => ({...prev, difficulty: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
              <textarea
                value={packData.description}
                onChange={(e) => setPackData(prev => ({...prev, description: e.target.value}))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Brief description of the pack content..."
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tags (comma separated)</label>
              <input
                type="text"
                value={packData.tags.join(', ')}
                onChange={(e) => setPackData(prev => ({
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                placeholder="greetings, basic, conversation"
              />
            </div>
          </div>

          {/* Question Selection */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              Select Questions ({selectedQuestions.length} selected)
            </h2>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                placeholder="Search questions..."
              />
              <button
                onClick={searchQuestions}
                disabled={isSearching}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '1.5rem' }}>
              {Object.entries(SUBJECTS[packData.subject].filterCategories).map(([category, options]) => (
                <div key={category} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'capitalize' }}>
                    {category}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {options.slice(0, 6).map((option) => (
                      <label key={option.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={filters[category]?.includes(option.id) || false}
                          onChange={() => handleFilterChange(category, option.id)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        <span style={{ fontSize: '0.875rem' }}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                {searchResults.map((question, index) => (
                  <div
                    key={question.objectID}
                    onClick={() => handleQuestionSelect(question)}
                    style={{
                      padding: '1rem',
                      borderBottom: index < searchResults.length - 1 ? '1px solid #e5e7eb' : 'none',
                      cursor: 'pointer',
                      background: selectedQuestions.some(q => q.objectID === question.objectID) ? '#f0f9ff' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedQuestions.some(q => q.objectID === question.objectID)}
                        readOnly
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          {getQuestionPreview(question)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {question.difficulty} | {question.subject_area} | {question.question_type}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Pack Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleCreatePack}
              disabled={loading || !packData.packName.trim() || selectedQuestions.length === 0}
              style={{
                padding: '1rem 2rem',
                background: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Creating Pack...' : `Create Pack (${selectedQuestions.length} questions)`}
            </button>
          </div>
        </div>
      ) : activeTab === 'manage' ? (
        /* Manage Packs Tab */
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Existing Admin Packs
          </h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {existingPacks.map((pack) => (
              <div
                key={pack.id}
                style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: `2px solid ${pack.isActive ? '#10b981' : '#ef4444'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                      {pack.packName}
                    </h3>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      background: pack.difficulty === 'beginner' ? '#dbeafe' : 
                                 pack.difficulty === 'intermediate' ? '#fef3c7' : '#fecaca',
                      color: pack.difficulty === 'beginner' ? '#1e40af' : 
                             pack.difficulty === 'intermediate' ? '#92400e' : '#dc2626'
                    }}>
                      {pack.difficulty}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: pack.isActive ? '#d1fae5' : '#fee2e2',
                      color: pack.isActive ? '#065f46' : '#dc2626'
                    }}>
                      {pack.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
                    {pack.description || 'No description provided'}
                  </p>
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                    {pack.totalQuestions} questions • Created {new Date(pack.createdAt.toDate()).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleToggleActive(pack.id, pack.isActive)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: pack.isActive ? '#ef4444' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {pack.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeletePack(pack.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {existingPacks.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                color: '#6b7280',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                No admin packs created yet. Create your first pack using the "Create New Pack" tab.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Video Management Tab */
        <div>
          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
            {/* Video Creation Form */}
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              height: 'fit-content'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Create New Video</h2>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Video Title *
                  </label>
                  <input
                    type="text"
                    value={videoData.title}
                    onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter video title..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Description
                  </label>
                  <textarea
                    value={videoData.description}
                    onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter video description..."
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Video URL *
                  </label>
                  <input
                    type="url"
                    value={videoData.videoUrl}
                    onChange={(e) => setVideoData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://example.com/video.mp4 or YouTube URL"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={videoData.thumbnailUrl}
                    onChange={(e) => setVideoData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                    placeholder="https://example.com/thumbnail.jpg"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Difficulty Level
                    </label>
                    <select
                      value={videoData.difficulty}
                      onChange={(e) => setVideoData(prev => ({ ...prev, difficulty: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                      Duration
                    </label>
                    <input
                      type="text"
                      value={videoData.duration}
                      onChange={(e) => setVideoData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 10:30"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateVideo}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: loading ? '#9ca3af' : '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '1rem'
                  }}
                >
                  {loading ? 'Creating Video...' : 'Create Video'}
                </button>
              </div>
            </div>

            {/* Existing Videos */}
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                Existing Videos ({existingVideos.length})
              </h2>
              
              <div style={{ display: 'grid', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                {existingVideos.map((video) => (
                  <div
                    key={video.id}
                    style={{
                      padding: '1rem',
                      border: `2px solid ${video.isActive ? '#10b981' : '#ef4444'}`,
                      borderRadius: '8px',
                      background: video.isActive ? '#f0fdf4' : '#fef2f2'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600', 
                        margin: '0',
                        flex: 1,
                        marginRight: '1rem'
                      }}>
                        {video.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleToggleVideoActive(video.id, video.isActive)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: video.isActive ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {video.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      <div><strong>Difficulty:</strong> {video.difficulty}</div>
                      {video.duration && <div><strong>Duration:</strong> {video.duration}</div>}
                      <div><strong>Created:</strong> {video.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</div>
                    </div>
                    
                    {video.description && (
                      <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0.5rem 0' }}>
                        {video.description}
                      </p>
                    )}
                    
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      <div><strong>URL:</strong> <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>
                        {video.videoUrl.length > 50 ? video.videoUrl.substring(0, 50) + '...' : video.videoUrl}
                      </a></div>
                    </div>
                  </div>
                ))}
                
                {existingVideos.length === 0 && (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    No admin videos created yet. Create your first video using the form on the left.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackCreator;