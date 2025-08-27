// MathsHit.js - Updated with per-part video solutions
import React, { useState } from 'react';
import './Hit.css'; // Your existing CSS
import VideoPopup from './VideoPopup';
import { createPortal } from 'react-dom';

// PDF Popup Component with matching design
const PDFPopup = ({ isOpen, pdfUrl, questionNumber, onClose }) => {
  // Mobile detection for responsive behavior
  const isMobile = window.innerWidth <= 768;
  
  // Convert Firebase Storage URLs if needed
  const getProcessedPdfUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('gs://')) {
      const gsMatch = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
      if (gsMatch) {
        const bucket = gsMatch[1];
        const path = gsMatch[2];
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
      }
    }
    return url;
  };

  const processedPdfUrl = getProcessedPdfUrl(pdfUrl);

  // Handle mobile behavior with useEffect at the top level - ALWAYS call hooks first
  React.useEffect(() => {
    // On mobile, open PDF in new tab instead of iframe
    if (isOpen && isMobile && processedPdfUrl) {
      window.open(processedPdfUrl, '_blank');
      onClose();
    }
  }, [isOpen, isMobile, processedPdfUrl, onClose]);

  // Early returns AFTER all hooks are called
  if (!isOpen) return null;
  
  // Don't render iframe on mobile since we open in new tab
  if (isMobile) {
    return null;
  }

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
    padding: '20px'
  };

  const containerStyle = {
    position: 'relative',
    width: '95vw',
    height: '95vh',
    maxWidth: '1200px',
    maxHeight: '900px',
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #3f72af, #2d4059)',
    color: 'white',
    padding: '20px 25px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '600',
    fontSize: '1.1rem',
    boxShadow: '0 2px 10px rgba(107, 92, 165, 0.3)'
  };

  const closeButtonStyle = {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  };

  const contentStyle = {
    height: 'calc(100% - 80px)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  const iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#f8f9fa'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}></span>
            <span>Question {questionNumber} - Mark Scheme</span>
          </div>
          <button 
            style={closeButtonStyle} 
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={contentStyle}>
          {processedPdfUrl ? (
            <iframe
              src={processedPdfUrl}
              title={`Mark Scheme for Question ${questionNumber}`}
              style={iframeStyle}
              loading="lazy"
              onError={(e) => {
                console.error('PDF loading error');
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              flexDirection: 'column',
              color: '#6c757d',
              background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: '0.6' }}>⚠️</div>
              <div style={{ fontSize: '1.5rem', marginBottom: '10px', fontWeight: '600', color: '#495057' }}>
                PDF Answer Unavailable
              </div>
              <div style={{ fontSize: '1rem', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5' }}>
                The answer PDF could not be loaded. Please try again later or contact support if the problem persists.
              </div>
              <button
                onClick={() => window.open(processedPdfUrl, '_blank')}
                style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3f72af, #2d4059)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(107, 92, 165, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Open in New Tab
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Coming Soon Message Component
const ComingSoonMessage = () => (
  <div className="coming-soon-container">
    <div className="coming-soon-icon">🚧</div>
    <div className="coming-soon-text">Solutions Coming Soon</div>
    <div className="coming-soon-subtext">
      Video solutions and answer PDFs will be available shortly
    </div>
    <style jsx>{`
      .coming-soon-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: linear-gradient(135deg, #fff3cd, #ffeaa7);
        border: 2px solid #ffc107;
        border-radius: 12px;
        margin: 1.5rem 0;
        text-align: center;
      }
      
      .coming-soon-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        animation: pulse 2s infinite;
      }
      
      .coming-soon-text {
        font-size: 1.2rem;
        font-weight: 600;
        color: #856404;
        margin-bottom: 0.5rem;
      }
      
      .coming-soon-subtext {
        font-size: 0.9rem;
        color: #6c757d;
        max-width: 300px;
        line-height: 1.4;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    `}</style>
  </div>
);

const MathsHit = ({ hit }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoPart, setCurrentVideoPart] = useState('');
  const [showPDFAnswer, setShowPDFAnswer] = useState(false);

  // Early return if hit is undefined or null
  if (!hit) {
    return null;
  }

  console.log('Full hit object:', hit);

  // Extract data from your actual maths hit structure
  const questionNumber = hit.question_number || '';
  const questionText = hit.question_text || '';
  const marks = hit.marks || 0;
  const specTopic = hit.spec_topic || '';
  const specPoint = hit.spec_point || '';
  const questionTopic = hit.question_topic || '';
  const filters = Array.isArray(hit.filters) ? hit.filters : [];
  const questionParts = Array.isArray(hit.question_parts) ? hit.question_parts : [];
  
  // Paper info
  const paperInfo = hit.paper_info || {};
  const paperTitle = paperInfo.paper_title || '';
  const paperReference = paperInfo.paper_reference || '';
  const year = paperInfo.year || '';
  const subject = paperInfo.subject || '';
  
  // Handle image and PDF
  const imageUrl = hit.imageUrl || '';
  const pdfAnswerUrl = hit.markscheme_url || ''; // PDF URL stored in markscheme_url field

  // Get video URLs for each part - more robust detection
  const getVideoUrlsForParts = () => {
    const videoUrls = {};
    
    // Debug log to see what we're working with
    console.log('Hit object keys:', Object.keys(hit));
    
    // Look for video_solution_url_X pattern in the hit object
    Object.keys(hit).forEach(key => {
      if (key.startsWith('video_solution_url_')) {
        const match = key.match(/^video_solution_url_(\d+)$/);
        if (match) {
          const partNumber = match[1];
          const videoUrl = hit[key];
          if (videoUrl && videoUrl.trim() !== '' && videoUrl !== 'undefined') {
            videoUrls[partNumber] = videoUrl;
            console.log(`Found video for part ${partNumber}:`, videoUrl);
          }
        }
      }
    });
    
    // Also check for legacy video_solution_url (without part number)
    if (hit.video_solution_url && hit.video_solution_url.trim() !== '' && hit.video_solution_url !== 'undefined' && Object.keys(videoUrls).length === 0) {
      videoUrls['1'] = hit.video_solution_url;
      console.log('Found legacy video URL:', hit.video_solution_url);
    }
    
    console.log('Final videoUrls object:', videoUrls);
    return videoUrls;
  };

  const videoUrls = getVideoUrlsForParts();

  // Get display year
  const getDisplayYear = () => {
    if (year && year !== 'Specimen') return year;
    if (year === 'Specimen') return 'Specimen';
    return '';
  };

  const displayYear = getDisplayYear();

  // Toggle functions
  const openVideo = (videoUrl, partNumber) => {
    console.log('Opening video:', videoUrl, 'for part:', partNumber);
    setCurrentVideoUrl(videoUrl);
    setCurrentVideoPart(partNumber);
    setShowVideo(true);
  };
  
  const closeVideo = () => {
    setShowVideo(false);
    setCurrentVideoUrl('');
    setCurrentVideoPart('');
  };
  
  const openPDFAnswer = () => setShowPDFAnswer(true);
  const closePDFAnswer = () => setShowPDFAnswer(false);

  // Convert Firebase Storage URLs
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('gs://')) {
      const gsMatch = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
      if (gsMatch) {
        const bucket = gsMatch[1];
        const path = gsMatch[2];
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
      }
    }
    return url;
  };

  const processedImageUrl = getImageUrl(imageUrl);

  // Check if we have any solutions available
  const hasVideoSolutions = Object.keys(videoUrls).length > 0;
  const hasPDFAnswer = pdfAnswerUrl && pdfAnswerUrl !== '';
  const hasSolutions = hasVideoSolutions || hasPDFAnswer;

  console.log('Solutions check:', { hasVideoSolutions, hasPDFAnswer, hasSolutions, videoUrls });

  return (
    <div className="maths-hit-container">
      {/* Enhanced Header */}
      <div className="maths-hit-header">
        <div className="question-header-left">
          <h2 className="question-title">Question {questionNumber}</h2>
          {displayYear && <span className="question-year-badge">{displayYear}</span>}
          {paperReference && <span className="paper-ref-badge">{paperReference}</span>}
        </div>
        
        <div className="question-metadata">
          {subject && (
            <span className="subject-badge">
              {subject}
            </span>
          )}
          {specTopic && (
            <span className="spec-topic-badge">
              {specTopic}
            </span>
          )}
          {specPoint && (
            <span className="spec-point-badge">
              Point {specPoint}
            </span>
          )}
          {marks > 0 && (
            <span className="marks-badge">
              {marks} mark{marks !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Question Parts */}
      {questionParts.length > 0 && (
        <div className="question-parts">
          <div className="parts-label">Parts:</div>
          <div className="parts-list">
            {questionParts.map((part, index) => (
              <span key={index} className="part-badge">
                {part}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Topic Context */}
      {questionTopic && (
        <div className="topic-context">
          <div className="topic-label">Topic:</div>
          <div className="topic-content">{questionTopic}</div>
        </div>
      )}

      {/* Main Content Area - Image as Primary Question Display */}
      <div className="question-content-area">
        
        {/* Question Image - Primary question display */}
        {processedImageUrl ? (
          <div className="question-image-container primary-question">
            <img
              src={processedImageUrl}
              alt={`Question ${questionNumber} - Mathematical notation`}
              className="question-image-primary"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const errorMsg = document.createElement('div');
                errorMsg.className = 'image-error-message';
                errorMsg.innerHTML = `
                  <div class="error-icon">⚠️</div>
                  <div class="error-text">Question image temporarily unavailable</div>
                  <div class="error-subtext">Please try refreshing the page</div>
                `;
                e.target.parentNode.appendChild(errorMsg);
              }}
            />
          </div>
        ) : (
          <div className="no-image-placeholder">
            <div className="placeholder-icon">📋</div>
            <div className="placeholder-text">Question {questionNumber}</div>
            <div className="placeholder-subtext">Image not available</div>
            {questionText && (
              <div className="fallback-question-text">
                {questionText.length > 200 ? questionText.substring(0, 200) + '...' : questionText}
              </div>
            )}
          </div>
        )}

        {/* Related Topics */}
        {filters.length > 0 && (
          <div className="related-topics-section">
            <h4 className="related-topics-title">Related Topics:</h4>
            <div className="topic-tags">
              {filters.map((filter, index) => (
                <span key={index} className="topic-tag">
                  {filter}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons or Coming Soon */}
      {hasSolutions ? (
        <div className="question-actions">
          {/* Video Solution Buttons - One for each part that has a video */}
          {hasVideoSolutions && (
            <div className="video-solutions-section">
              {Object.keys(videoUrls).length > 1 && (
                <div className="video-solutions-label">Video Solutions:</div>
              )}
              <div className="video-solutions-buttons">
                {Object.entries(videoUrls)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by part number
                  .map(([partNumber, videoUrl]) => (
                    <button 
                      key={partNumber}
                      className="action-button video-solution-btn part-video-btn" 
                      onClick={() => openVideo(videoUrl, partNumber)}
                    >
                      <span className="button-icon">▶</span>
                      <span className="button-text">
                        {Object.keys(videoUrls).length === 1 ? 'Video Solution' : `Part ${partNumber} Solution`}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* PDF Answer Button */}
          {hasPDFAnswer && (
            <button className="action-button answer-toggle-btn" onClick={openPDFAnswer}>
              <span className="button-icon">📄</span>
              <span className="button-text">View Mark Scheme</span>
            </button>
          )}
        </div>
      ) : (
        <ComingSoonMessage />
      )}

      {/* Video Popup */}
      {showVideo && (
        <VideoPopup 
          videoUrl={currentVideoUrl} 
          onClose={closeVideo}
          questionPart={currentVideoPart}
        />
      )}

{/* PDF Answer Popup - Render outside container using Portal */}
{showPDFAnswer && createPortal(
  <PDFPopup 
    isOpen={showPDFAnswer}
    pdfUrl={pdfAnswerUrl}
    questionNumber={questionNumber}
    onClose={closePDFAnswer}
  />,
  document.body
)}

      {/* Additional CSS for new badges and video solutions layout */}
      <style jsx>{`
        .paper-ref-badge {
          background: linear-gradient(135deg, #495057, #6c757d);
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(73, 80, 87, 0.3);
        }
        
        .subject-badge {
          background: linear-gradient(135deg, #e83e8c, #fd7e14);
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(232, 62, 140, 0.3);
        }
        
        .question-parts {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          padding: 0.8rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #3f72af;
          gap: 0.8rem;
        }
        
        .parts-label {
          font-weight: 600;
          color: #3f72af;
          font-size: 0.9rem;
          white-space: nowrap;
        }
        
        .parts-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        
        .part-badge {
          background: linear-gradient(135deg, #3f72af, #2d4059);
          color: white;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(107, 92, 165, 0.2);
        }
        
        .video-solutions-section {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin-bottom: 1rem;
        }
        
        .video-solutions-label {
          font-weight: 600;
          color: #3f72af;
          font-size: 0.9rem;
        }
        
        .video-solutions-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
        }
        
        .part-video-btn {
          min-width: auto;
          flex: 0 0 auto;
        }
        
        .part-video-btn .button-text {
          white-space: nowrap;
        }
        
        @media (max-width: 768px) {
          .question-parts {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .parts-list {
            align-self: stretch;
          }
          
          .video-solutions-buttons {
            flex-direction: column;
          }
          
          .part-video-btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default MathsHit;