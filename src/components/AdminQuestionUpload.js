// src/components/AdminQuestionUpload.js
import React, { useState } from 'react';
import { addCommunityQuestion } from '../utils/pineconeClient';

const AdminQuestionUpload = () => {
  const [formData, setFormData] = useState({
    question: '',
    explanation: '',
    writtenSolution: '',
    videoUrl: '',
    videoTitle: '',
    tags: '',
    difficulty: 'Medium',
    author: 'ExamRizz Team'
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Starting question upload...');
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Process tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      const questionData = {
        question: formData.question,
        explanation: formData.explanation,
        writtenSolution: formData.writtenSolution,
        videoUrl: formData.videoUrl || null,
        videoTitle: formData.videoTitle || null,
        tags: tagsArray,
        difficulty: formData.difficulty,
        author: formData.author,
        hasVideo: !!formData.videoUrl,
        hasWrittenSolution: !!formData.writtenSolution,
        subject: 'Community'
      };

      const questionId = await addCommunityQuestion(questionData);
      setSuccess(`Question added successfully! ID: ${questionId}`);
      
      // Reset form
      setFormData({
        question: '',
        explanation: '',
        writtenSolution: '',
        videoUrl: '',
        videoTitle: '',
        tags: '',
        difficulty: 'Medium',
        author: 'ExamRizz Team'
      });

    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-upload-container">
      <h2>Add Community Question</h2>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-group">
          <label>Question *</label>
          <textarea
            name="question"
            value={formData.question}
            onChange={handleInputChange}
            required
            rows="3"
            placeholder="What supercurriculars are worth doing for Oxford applications?"
          />
        </div>

        <div className="form-group">
          <label>Brief Explanation *</label>
          <textarea
            name="explanation"
            value={formData.explanation}
            onChange={handleInputChange}
            required
            rows="2"
            placeholder="Focus on quality over quantity. Choose activities that demonstrate genuine interest..."
          />
        </div>

        <div className="form-group">
          <label>Written Solution</label>
          <textarea
            name="writtenSolution"
            value={formData.writtenSolution}
            onChange={handleInputChange}
            rows="8"
            placeholder="Detailed written solution with formatting..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Video URL</label>
            <input
              type="url"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleInputChange}
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>

          <div className="form-group">
            <label>Video Title</label>
            <input
              type="text"
              name="videoTitle"
              value={formData.videoTitle}
              onChange={handleInputChange}
              placeholder="Oxford Applications: Choosing the Right Supercurriculars"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="oxford, applications, extracurriculars"
            />
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Author</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            placeholder="ExamRizz Team"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !formData.question || !formData.explanation}
          className="submit-button"
        >
          {loading ? 'Adding Question...' : 'Add Question'}
        </button>
      </form>
    </div>
  );
};

export default AdminQuestionUpload;