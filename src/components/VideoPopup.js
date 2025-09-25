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

  // Check if URL is a direct video file (like .mp4, .webm, etc.)
  const isDirectVideoUrl = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i.test(url);
  };

  // Check if URL is YouTube
  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
  };

  const videoId = isYouTubeUrl(videoUrl) ? getYoutubeId(videoUrl) : null;
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
  const isDirect = isDirectVideoUrl(videoUrl);

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
        ) : isDirect ? (
          <div className="video-container">
            <video
              src={videoUrl}
              title="Video Solution"
              controls
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px'
              }}
              onError={(e) => {
                console.error('Video loading error:', e);
                e.target.style.display = 'none';
                const errorDiv = e.target.parentNode.querySelector('.video-error') || document.createElement('div');
                errorDiv.className = 'video-error';
                errorDiv.innerHTML = '<p>Sorry, we couldn\'t load the video. Please try again later.</p>';
                if (!e.target.parentNode.querySelector('.video-error')) {
                  e.target.parentNode.appendChild(errorDiv);
                }
              }}
            >
              Your browser does not support the video tag.
            </video>
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