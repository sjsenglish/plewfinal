// src/components/CommunityHitWrapper.js
import React, { useState } from 'react';

const CommunityHitWrapper = ({ hit }) => {
  const [showWrittenSolution, setShowWrittenSolution] = useState(false);
  const [showVideoSolution, setShowVideoSolution] = useState(false);

  const toggleWrittenSolution = () => {
    setShowWrittenSolution(!showWrittenSolution);
    if (showVideoSolution) setShowVideoSolution(false);
  };

  const toggleVideoSolution = () => {
    setShowVideoSolution(!showVideoSolution);
    if (showWrittenSolution) setShowWrittenSolution(false);
  };

  const formatWrittenSolution = (text) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h4 key={index} className="solution-heading">{line.slice(2, -2)}</h4>;
      }
      if (line.startsWith('•')) {
        return <li key={index} className="solution-bullet">{line.slice(1).trim()}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="solution-paragraph">{line}</p>;
    });
  };

  return (
    <div className="community-hit-wrapper">
      <div className="hit-header">
        <div className="hit-meta">
          <span className="hit-subject">{hit.subject}</span>
          <span className="hit-difficulty">{hit.difficulty}</span>
          {hit.tags && hit.tags.map(tag => (
            <span key={tag} className="hit-tag">#{tag}</span>
          ))}
        </div>
<div className="hit-stats">
  <span className="hit-author">by {hit.author}</span>
</div>
      </div>

      <div className="hit-content">
        <h3 className="hit-question">{hit.question}</h3>
        <p className="hit-explanation">{hit.explanation}</p>

        <div className="solution-buttons">
          {hit.hasWrittenSolution && (
            <button 
              onClick={toggleWrittenSolution}
              className={`solution-btn written-btn ${showWrittenSolution ? 'active' : ''}`}
            >
              <i className="fas fa-file-text"></i>
              {showWrittenSolution ? 'Hide Written Solution' : 'Show Written Solution'}
            </button>
          )}
          
          {hit.hasVideo && (
            <button 
              onClick={toggleVideoSolution}
              className={`solution-btn video-btn ${showVideoSolution ? 'active' : ''}`}
            >
              <i className="fas fa-play"></i>
              {showVideoSolution ? 'Hide Video Solution' : 'Watch Video Solution'}
            </button>
          )}
        </div>

        {/* Written Solution */}
        {showWrittenSolution && hit.writtenSolution && (
          <div className="written-solution">
            <div className="solution-header">
              <h4><i className="fas fa-file-text"></i> Written Solution</h4>
            </div>
            <div className="solution-content">
              {formatWrittenSolution(hit.writtenSolution)}
            </div>
          </div>
        )}

        {/* Video Solution */}
        {showVideoSolution && hit.videoUrl && (
          <div className="video-solution">
            <div className="solution-header">
              <h4><i className="fas fa-play"></i> {hit.videoTitle || 'Video Solution'}</h4>
            </div>
            <div className="video-container">
              <iframe
                src={hit.videoUrl}
                title={hit.videoTitle || 'Video Solution'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="solution-video"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHitWrapper;