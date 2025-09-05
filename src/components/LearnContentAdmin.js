// components/LearnContentAdmin.js
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { setWeeklyContent, getCurrentWeek } from '../services/learnService';

const LearnContentAdmin = () => {
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [content, setContent] = useState({
    questionPacks: [],
    videos: [],
    vocabulary: []
  });
  const [message, setMessage] = useState('');
  
  const auth = getAuth();
  const user = auth.currentUser;

  // Check if user is admin
  useEffect(() => {
    // You should implement proper admin checking here
    // For now, check if email is yours
    if (!user || user.email !== 'admin@example.com') {
      setMessage('Unauthorized: Admin access only');
    }
  }, [user]);

  // Add question pack
  const addQuestionPack = () => {
    setContent(prev => ({
      ...prev,
      questionPacks: [...prev.questionPacks, {
        id: `pack-${Date.now()}`,
        title: '',
        questionCount: 0,
        difficulty: 'Easy'
      }]
    }));
  };

  // Update question pack
  const updateQuestionPack = (index, field, value) => {
    setContent(prev => ({
      ...prev,
      questionPacks: prev.questionPacks.map((pack, i) => 
        i === index ? { ...pack, [field]: value } : pack
      )
    }));
  };

  // Remove question pack
  const removeQuestionPack = (index) => {
    setContent(prev => ({
      ...prev,
      questionPacks: prev.questionPacks.filter((_, i) => i !== index)
    }));
  };

  // Add video
  const addVideo = () => {
    setContent(prev => ({
      ...prev,
      videos: [...prev.videos, {
        id: `vid-${Date.now()}`,
        title: '',
        duration: '',
        thumbnail: '',
        videoUrl: ''
      }]
    }));
  };

  // Update video
  const updateVideo = (index, field, value) => {
    setContent(prev => ({
      ...prev,
      videos: prev.videos.map((video, i) => 
        i === index ? { ...video, [field]: value } : video
      )
    }));
  };

  // Remove video
  const removeVideo = (index) => {
    setContent(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  // Add vocabulary word
  const addVocabulary = () => {
    setContent(prev => ({
      ...prev,
      vocabulary: [...prev.vocabulary, {
        word: '',
        definition: '',
        synonym: ''
      }]
    }));
  };

  // Update vocabulary
  const updateVocabulary = (index, field, value) => {
    setContent(prev => ({
      ...prev,
      vocabulary: prev.vocabulary.map((vocab, i) => 
        i === index ? { ...vocab, [field]: value } : vocab
      )
    }));
  };

  // Remove vocabulary
  const removeVocabulary = (index) => {
    setContent(prev => ({
      ...prev,
      vocabulary: prev.vocabulary.filter((_, i) => i !== index)
    }));
  };

  // Save content to Firebase
  const saveContent = async () => {
    try {
      const result = await setWeeklyContent(selectedLevel, selectedWeek, content);
      if (result.success) {
        setMessage('Content saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Learn Content Admin</h1>
      
      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          background: message.includes('Error') ? '#fee' : '#efe',
          border: `1px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`,
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {/* Level and Week Selection */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Level:</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{ padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Week:</label>
          <input
            type="number"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
            min="1"
            max="52"
            style={{ padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd', width: '100px' }}
          />
        </div>
      </div>

      {/* Question Packs Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Question Packs</h2>
        {content.questionPacks.map((pack, index) => (
          <div key={index} style={{ 
            padding: '15px', 
            marginBottom: '10px', 
            background: '#f9f9f9', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Pack Title"
                value={pack.title}
                onChange={(e) => updateQuestionPack(index, 'title', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <input
                type="number"
                placeholder="Questions"
                value={pack.questionCount}
                onChange={(e) => updateQuestionPack(index, 'questionCount', parseInt(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <select
                value={pack.difficulty}
                onChange={(e) => updateQuestionPack(index, 'difficulty', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <button
                onClick={() => removeQuestionPack(index)}
                style={{
                  padding: '8px 12px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addQuestionPack}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Add Question Pack
        </button>
      </div>

      {/* Videos Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Videos</h2>
        {content.videos.map((video, index) => (
          <div key={index} style={{ 
            padding: '15px', 
            marginBottom: '10px', 
            background: '#f9f9f9', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 2fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Video Title"
                value={video.title}
                onChange={(e) => updateVideo(index, 'title', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="Duration"
                value={video.duration}
                onChange={(e) => updateVideo(index, 'duration', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="Thumbnail URL"
                value={video.thumbnail}
                onChange={(e) => updateVideo(index, 'thumbnail', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="Video URL"
                value={video.videoUrl}
                onChange={(e) => updateVideo(index, 'videoUrl', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <button
                onClick={() => removeVideo(index)}
                style={{
                  padding: '8px 12px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addVideo}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Add Video
        </button>
      </div>

      {/* Vocabulary Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Vocabulary</h2>
        {content.vocabulary.map((vocab, index) => (
          <div key={index} style={{ 
            padding: '15px', 
            marginBottom: '10px', 
            background: '#f9f9f9', 
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Word"
                value={vocab.word}
                onChange={(e) => updateVocabulary(index, 'word', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="Definition"
                value={vocab.definition}
                onChange={(e) => updateVocabulary(index, 'definition', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="Synonym"
                value={vocab.synonym}
                onChange={(e) => updateVocabulary(index, 'synonym', e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <button
                onClick={() => removeVocabulary(index)}
                style={{
                  padding: '8px 12px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addVocabulary}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Add Vocabulary Word
        </button>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button
          onClick={saveContent}
          style={{
            padding: '15px 40px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          Save Weekly Content
        </button>
      </div>
    </div>
  );
};

export default LearnContentAdmin;