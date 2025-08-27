// src/components/ui/Loading.js
import React from 'react';
import './Loading.css';

const Loading = ({
  size = 'medium',
  theme = 'tsa',
  text = 'Loading...',
  fullScreen = false,
  overlay = false,
}) => {
  const sizeClass = `loading--${size}`;
  const themeClass = `loading--theme-${theme}`;
  const containerClass = fullScreen ? 'loading-container--fullscreen' : 'loading-container';
  const overlayClass = overlay ? 'loading-container--overlay' : '';

  const containerClasses = [containerClass, overlayClass].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className="loading-content">
        <div className={`loading-spinner ${sizeClass} ${themeClass}`}>
          <div className="loading-spinner__inner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        {text && <div className={`loading-text ${themeClass}`}>{text}</div>}
      </div>
    </div>
  );
};

// Skeleton loading component for content placeholders
export const Skeleton = ({
  width = '100%',
  height = '1rem',
  borderRadius = '0.25rem',
  className = '',
}) => {
  const style = {
    width,
    height,
    borderRadius,
  };

  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
};

// Loading overlay for forms and components
export const LoadingOverlay = ({ isLoading, children, text = 'Loading...', theme = 'tsa' }) => {
  return (
    <div className="loading-overlay-wrapper">
      {children}
      {isLoading && <Loading overlay={true} text={text} theme={theme} />}
    </div>
  );
};

export default Loading;