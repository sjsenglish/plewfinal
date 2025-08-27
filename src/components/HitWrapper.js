// HitWrapper.js - Enhanced with better detection logic for your data structures
import React from 'react';
import TSAHit from './TSAHit';
import PlewHit from './PlewHit';
import MathsHit from './MathsHit';
import KoreanEnglishHit from './KoreanEnglishHit';

const HitWrapper = ({ hit, ...props }) => {
  // Debug: Log the hit to see what we're working with (remove in production)
  console.log('HitWrapper received hit:', hit);

  // Function to determine if the hit is a PLEW question
  const isPlewQuestion = (hit) => {
    return (
      hit.questionText !== undefined &&
      hit.actualQuestion !== undefined &&
      hit.theoryArea !== undefined
    );
  };

  // Function to determine if the hit is a Maths question (updated for your structure)
  const isMathsQuestion = (hit) => {
    return (
      hit.spec_topic !== undefined ||
      hit.spec_point !== undefined ||
      hit.question_topic !== undefined ||
      (hit.marks !== undefined && hit.question_text !== undefined) ||
      (hit.filters !== undefined && Array.isArray(hit.filters)) ||
      // FIXED: Check if hit.id exists, is a string, and includes 'MA0'
      (hit.id && typeof hit.id === 'string' && hit.id.includes('MA0'))
    );
  };

  // Function to determine if the hit is a Korean-English question
  const isKoreanEnglishQuestion = (hit) => {
    return (
      hit.korean_text !== undefined ||
      hit.korean !== undefined ||
      hit.english_text !== undefined ||
      hit.english !== undefined ||
      hit.romanization !== undefined ||
      hit.pronunciation !== undefined ||
      hit.korean_audio_url !== undefined ||
      hit.english_audio_url !== undefined ||
      (hit.level !== undefined && (hit.category !== undefined || hit.topic !== undefined)) ||
      // Check if index contains korean-english
      (hit._index && typeof hit._index === 'string' && hit._index.includes('korean-english'))
    );
  };

  // Function to determine if the hit is a TSA question
  const isTsaQuestion = (hit) => {
    return (
      hit.question_content !== undefined ||
      hit.question !== undefined ||
      hit.question_type !== undefined ||
      (hit.options !== undefined && Array.isArray(hit.options)) ||
      hit.correct_answer !== undefined ||
      hit.solution_video !== undefined ||
      hit.videoSolutionLink !== undefined ||
      hit.year !== undefined ||
      hit.sub_types !== undefined
    );
  };

  // Enhanced detection with fallback logic
  const detectHitType = () => {
    if (isKoreanEnglishQuestion(hit)) {
      return 'koreanEnglish';
    } else if (isPlewQuestion(hit)) {
      return 'plew';
    } else if (isMathsQuestion(hit)) {
      return 'maths';
    } else if (isTsaQuestion(hit)) {
      return 'tsa';
    } else {
      // Additional fallback logic based on index or other hints
      // FIXED: Added safety checks for _index as well
      if (hit._index && typeof hit._index === 'string' && hit._index.includes('korean-english')) {
        return 'koreanEnglish';
      } else if (hit._index && typeof hit._index === 'string' && hit._index.includes('maths')) {
        return 'maths';
      } else if (hit._index && typeof hit._index === 'string' && hit._index.includes('plew')) {
        return 'plew';
      } else {
        return 'tsa'; // Default fallback
      }
    }
  };

  const hitType = detectHitType();

  // Debug: Show which type is detected
  console.log('Detection results:', {
    hitType,
    isPlewQuestion: isPlewQuestion(hit),
    isTsaQuestion: isTsaQuestion(hit),
    isMathsQuestion: isMathsQuestion(hit),
    isKoreanEnglishQuestion: isKoreanEnglishQuestion(hit)
  });

  // Render the appropriate hit component
  switch (hitType) {
    case 'plew':
      return <PlewHit hit={hit} {...props} />;
    case 'maths':
      return <MathsHit hit={hit} {...props} />;
    case 'koreanEnglish':
      return <KoreanEnglishHit hit={hit} {...props} />;
    case 'tsa':
      return <TSAHit hit={hit} {...props} />;
    default:
      // Fallback for any unrecognized type
      console.warn('Unknown hit type detected, using debug fallback. Hit:', hit);
      return <DebugHit hit={hit} />;
  }
};

// Debug component for development
const DebugHit = ({ hit }) => (
  <div className="generic-hit" style={{ 
    background: '#f8f9fa', 
    border: '2px dashed #dee2e6', 
    borderRadius: '8px',
    padding: '1rem',
    margin: '1rem 0'
  }}>
    <h3 style={{ color: '#6c757d' }}>Debug: Question #{hit.objectID || 'Unknown'}</h3>
    <div style={{ 
      background: '#e9ecef', 
      padding: '10px', 
      margin: '10px 0',
      borderRadius: '4px',
      fontSize: '0.85rem'
    }}>
      <strong>Available fields:</strong>
      <pre style={{ margin: '0.5rem 0', fontSize: '0.75rem' }}>
        {JSON.stringify(Object.keys(hit).filter(key => !key.startsWith('_')), null, 2)}
      </pre>
    </div>
    <div style={{ maxHeight: '300px', overflow: 'auto' }}>
      {Object.entries(hit)
        .filter(([key]) => !['objectID', '_highlightResult', '_snippetResult'].includes(key))
        .slice(0, 10)
        .map(([key, value]) => (
          <div key={key} style={{ 
            margin: '0.5rem 0', 
            padding: '0.25rem',
            background: 'white',
            borderRadius: '4px',
            fontSize: '0.85rem'
          }}>
            <strong style={{ color: '#495057' }}>{key}:</strong>{' '}
            <span style={{ color: '#6c757d' }}>
              {typeof value === 'string'
                ? value.length > 100 ? value.substring(0, 100) + '...' : value
                : Array.isArray(value)
                  ? `[Array with ${value.length} items]`
                  : typeof value === 'object' && value !== null
                    ? '[Object]'
                    : String(value)}
            </span>
          </div>
        ))}
    </div>
  </div>
);

export default HitWrapper;