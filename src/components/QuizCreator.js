// src/components/QuizCreator.js
import React, { useState } from 'react';
import { createQuiz } from '../services/quizService';
import {
  validateQuizData,
  getNextFriday4PM,
  getQuizEndTime,
  generateQuizTitle,
} from '../utils/quizUtils';

const QuizCreator = () => {
  const [quizData, setQuizData] = useState({
    subject: 'tsa',
    title: '',
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
      },
    ],
    scheduledStart: '',
    scheduledEnd: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);

  // Initialize with next Friday's schedule
  React.useEffect(() => {
    const nextFriday = getNextFriday4PM();
    const endTime = getQuizEndTime(nextFriday);

    setQuizData((prev) => ({
      ...prev,
      scheduledStart: nextFriday.toISOString().slice(0, 16), // Format for datetime-local input
      scheduledEnd: endTime.toISOString().slice(0, 16),
      title: generateQuizTitle(prev.subject, nextFriday),
    }));
  }, []);

  // Update title when subject changes
  const handleSubjectChange = (subject) => {
    const nextFriday = new Date(quizData.scheduledStart);
    setQuizData((prev) => ({
      ...prev,
      subject,
      title: generateQuizTitle(subject, nextFriday),
    }));
  };

  // Add new question
  const addQuestion = () => {
    setQuizData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: '',
        },
      ],
    }));
  };

  // Remove question
  const removeQuestion = (index) => {
    if (quizData.questions.length > 1) {
      setQuizData((prev) => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      }));
    }
  };

  // Update question
  const updateQuestion = (questionIndex, field, value) => {
    setQuizData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === questionIndex ? { ...q, [field]: value } : q)),
    }));
  };

  // Update option
  const updateOption = (questionIndex, optionIndex, value) => {
    setQuizData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, j) => (j === optionIndex ? value : opt)),
            }
          : q
      ),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrors([]);

    // Validate quiz data
    const validation = validateQuizData({
      ...quizData,
      scheduledStart: new Date(quizData.scheduledStart),
      scheduledEnd: new Date(quizData.scheduledEnd),
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const result = await createQuiz({
        ...quizData,
        scheduledStart: new Date(quizData.scheduledStart),
        scheduledEnd: new Date(quizData.scheduledEnd),
      });

      if (result.success) {
        setMessage(`Quiz created successfully! Quiz ID: ${result.quizId}`);

        // Reset form for next quiz
        const nextFriday = getNextFriday4PM();
        const endTime = getQuizEndTime(nextFriday);

        setQuizData({
          subject: 'tsa',
          title: generateQuizTitle('tsa', nextFriday),
          questions: [
            {
              question: '',
              options: ['', '', '', ''],
              correctAnswer: '',
            },
          ],
          scheduledStart: nextFriday.toISOString().slice(0, 16),
          scheduledEnd: endTime.toISOString().slice(0, 16),
        });
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Create Weekly Quiz</h1>

      {message && (
        <div
          style={{
            padding: '1rem',
            margin: '1rem 0',
            borderRadius: '4px',
            backgroundColor: message.startsWith('Error') ? '#ffebee' : '#e8f5e9',
            color: message.startsWith('Error') ? '#d32f2f' : '#2e7d32',
            border: `1px solid ${message.startsWith('Error') ? '#ffcdd2' : '#c8e6c9'}`,
          }}
        >
          {message}
        </div>
      )}

      {errors.length > 0 && (
        <div
          style={{
            padding: '1rem',
            margin: '1rem 0',
            borderRadius: '4px',
            backgroundColor: '#ffebee',
            color: '#d32f2f',
            border: '1px solid #ffcdd2',
          }}
        >
          <h4>Please fix the following errors:</h4>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Quiz Info */}
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}
        >
          <h3>Quiz Details</h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Subject:
            </label>
            <select
              value={quizData.subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="tsa">TSA Critical Thinking</option>
              <option value="plew">수능영어</option>
              <option value="maths">Maths A Level</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Quiz Title:
            </label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => setQuizData((prev) => ({ ...prev, title: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              placeholder="Quiz title..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Start Time:
              </label>
              <input
                type="datetime-local"
                value={quizData.scheduledStart}
                onChange={(e) => {
                  const startTime = new Date(e.target.value);
                  const endTime = getQuizEndTime(startTime);
                  setQuizData((prev) => ({
                    ...prev,
                    scheduledStart: e.target.value,
                    scheduledEnd: endTime.toISOString().slice(0, 16),
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                End Time:
              </label>
              <input
                type="datetime-local"
                value={quizData.scheduledEnd}
                onChange={(e) => setQuizData((prev) => ({ ...prev, scheduledEnd: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3>Questions ({quizData.questions.length})</h3>
            <button
              type="button"
              onClick={addQuestion}
              style={{
                backgroundColor: '#6b5ca5',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Add Question
            </button>
          </div>

          {quizData.questions.map((question, questionIndex) => (
            <div
              key={questionIndex}
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h4>Question {questionIndex + 1}</h4>
                {quizData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Question:
                </label>
                <textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical',
                  }}
                  placeholder="Enter question text..."
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Options:
                </label>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} style={{ marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                      placeholder={`Option ${optionIndex + 1}...`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Correct Answer:
                </label>
                <select
                  value={question.correctAnswer}
                  onChange={(e) => updateQuestion(questionIndex, 'correctAnswer', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                >
                  <option value="">Select correct answer...</option>
                  {question.options.map((option, optionIndex) => (
                    <option key={optionIndex} value={option} disabled={!option.trim()}>
                      {option.trim()
                        ? `Option ${optionIndex + 1}: ${option}`
                        : `Option ${optionIndex + 1} (empty)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#ccc' : '#6b5ca5',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Creating Quiz...' : 'Create Quiz'}
          </button>
        </div>

        {/* Preview Section */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
          }}
        >
          <h3>Preview</h3>
          <p>
            <strong>Subject:</strong> {quizData.subject}
          </p>
          <p>
            <strong>Title:</strong> {quizData.title}
          </p>
          <p>
            <strong>Questions:</strong> {quizData.questions.length}
          </p>
          <p>
            <strong>Scheduled:</strong> {new Date(quizData.scheduledStart).toLocaleString()} -{' '}
            {new Date(quizData.scheduledEnd).toLocaleString()}
          </p>

          {quizData.questions.some(
            (q) => q.question.trim() && q.options.every((opt) => opt.trim()) && q.correctAnswer
          ) && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Sample Question:</h4>
              {quizData.questions
                .filter((q) => q.question.trim() && q.correctAnswer)
                .slice(0, 1)
                .map((q, i) => (
                  <div
                    key={i}
                    style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '4px' }}
                  >
                    <p>
                      <strong>Q:</strong> {q.question}
                    </p>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                      {q.options.map((opt, j) => (
                        <li
                          key={j}
                          style={{
                            padding: '0.25rem',
                            color: opt === q.correctAnswer ? '#28a745' : 'inherit',
                            fontWeight: opt === q.correctAnswer ? 'bold' : 'normal',
                          }}
                        >
                          {opt} {opt === q.correctAnswer && '✓'}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default QuizCreator;