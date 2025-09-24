import React, { useState, useRef, useEffect } from 'react';
import { useSearchBox } from 'react-instantsearch';
import { usePaywall } from '../hooks/usePaywall';
import './SleekSearchBox.css';

const SleekSearchBox = ({ 
  placeholder = "search 문제은행", 
  className = "",
  onFocus,
  onBlur,
  autoFocus = false,
  ...props 
}) => {
  const { checkUsage, isPaidUser, isGuest } = usePaywall();
  const { query, refine, clear, isSearchStalled } = useSearchBox(props);
  const [inputValue, setInputValue] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Sync input value with query
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Block search functionality for non-subscribers
    if (value.trim()) {
      const usageCheck = await checkUsage('search_functionality');
      if (!usageCheck.allowed) {
        // Show an alert and clear the input
        alert(usageCheck.reason === 'Sign up required' 
          ? 'Please sign up or log in to search questions' 
          : 'Subscription required to search questions');
        setInputValue('');
        return;
      }
    }
    
    refine(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = () => {
    setInputValue('');
    clear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleKeyDown = (e) => {
    // Handle escape key to blur input
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="sleek-searchbox-wrapper">
      <form 
        className={`sleek-searchbox-form ${className}`} 
        onSubmit={handleSubmit}
        role="search"
      >
        <div className={`sleek-searchbox-container ${isFocused ? 'focused' : ''} ${inputValue ? 'has-value' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            className={`sleek-searchbox-input ${!isPaidUser ? 'locked' : ''}`}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={!isPaidUser 
              ? (isGuest ? '🔒 Sign up to search questions...' : '🔒 Subscription required to search...') 
              : placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            maxLength={512}
            disabled={!isPaidUser}
          />

          {/* Clear button - only show when there's text */}
          {inputValue && (
            <button
              type="button"
              className="sleek-searchbox-clear"
              onClick={handleClear}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SleekSearchBox;