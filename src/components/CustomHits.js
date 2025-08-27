// CustomHits.js
import React from 'react';
import { Hits } from 'react-instantsearch';
import HitWrapper from './HitWrapper';

const CustomHits = ({ user, currentIndex, authLoading }) => {
  if (authLoading) return <p>Loading authentication...</p>;

  if (currentIndex === 'tsa_questions' && !user) {
    return (
      <div className="unlock-message">
        <p>🔒 Please log in to view TSA questions.</p>
        <a href="/login" className="login-button">
          Log In
        </a>
      </div>
    );
  }

  return <Hits hitComponent={HitWrapper} />;
};

export default CustomHits;