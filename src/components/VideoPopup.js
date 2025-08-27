import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './VideoPopup.css';

// This is a completely different approach using React Portals
// It renders the popup outside of your main React tree, which can fix event bubbling issues

const VideoPopup = ({ videoUrl, onClose }) => {
  // Extract YouTube video ID from the URL
  const getYoutubeId = (url) => {
    if (!url) return null;

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYoutubeId(videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;

  // Disable body scroll when the popup is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Create the popup UI
  const popup = (
    <div
      className="video-popup-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="video-popup-content">
        <button className="video-popup-close" onClick={onClose}>
          ×
        </button>

        {embedUrl ? (
          <div className="video-container">
            <iframe
              src={embedUrl}
              title="Video Solution"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="video-error">
            <p>Sorry, we couldn't load the video. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Use a portal to render the popup in a different DOM node
  // This helps prevent event bubbling issues that could cause flickering
  return ReactDOM.createPortal(popup, document.body);
};

export default VideoPopup;