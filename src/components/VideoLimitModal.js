// components/VideoLimitModal.js
import React, { useState, useEffect } from 'react';
import { getTimeUntilReset } from '../services/videoUsageService';

const VideoLimitModal = ({ isOpen, onClose, usageInfo }) => {
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Update countdown every minute
    const updateCountdown = () => {
      setTimeUntilReset(getTimeUntilReset());
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="video-limit-modal-overlay" onClick={onClose}>
      <div className="video-limit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Daily Video Limit Reached</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="limit-icon">🎬</div>
          <p className="limit-message">
            You've watched your daily video solution! 
          </p>
          <p className="limit-submessage">
            Come back tomorrow for another free video, or upgrade for unlimited access.
          </p>
          
          <div className="usage-stats">
            <div className="usage-item">
              <span className="usage-label">Today's Usage:</span>
              <span className="usage-value">{usageInfo?.count || 0}/{usageInfo?.limit || 1}</span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Resets in:</span>
              <span className="usage-value">{timeUntilReset}</span>
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Got it
          </button>
          <a href="/subscription-plans" className="btn-primary">
            Upgrade for Unlimited
          </a>
        </div>
      </div>
      
      <style jsx>{`
        .video-limit-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .video-limit-modal {
          background: white;
          border-radius: 16px;
          max-width: 480px;
          width: 90%;
          margin: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem 1rem 2rem;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .modal-close:hover {
          color: #6b7280;
          background-color: #f3f4f6;
        }
        
        .modal-content {
          padding: 2rem;
          text-align: center;
        }
        
        .limit-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .limit-message {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        
        .limit-submessage {
          color: #6b7280;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        
        .usage-stats {
          background-color: #f9fafb;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .usage-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .usage-item:last-child {
          margin-bottom: 0;
        }
        
        .usage-label {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .usage-value {
          font-weight: 600;
          color: #1f2937;
        }
        
        .modal-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem 2rem 2rem 2rem;
        }
        
        .btn-secondary {
          flex: 1;
          padding: 0.75rem 1rem;
          background-color: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-secondary:hover {
          background-color: #e5e7eb;
        }
        
        .btn-primary {
          flex: 2;
          padding: 0.75rem 1rem;
          background-color: #6366f1;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          text-align: center;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-primary:hover {
          background-color: #5856eb;
        }
      `}</style>
    </div>
  );
};

export default VideoLimitModal;