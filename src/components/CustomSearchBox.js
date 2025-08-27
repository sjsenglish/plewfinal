import React, { useState, useRef, useEffect } from 'react';
import { useSearchBox } from 'react-instantsearch';

const CustomSearchBox = ({ 
  placeholder = "Search questions...", 
  className = "",
  onFocus,
  onBlur,
  autoFocus = false,
  showSearchIcon = true,
  showClearButton = true,
  ...props 
}) => {
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
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
    <form 
      className={`custom-searchbox-form ${className}`} 
      onSubmit={handleSubmit}
      role="search"
    >
      <div className={`custom-searchbox-container ${isFocused ? 'focused' : ''} ${inputValue ? 'has-value' : ''}`}>
        {showSearchIcon && (
          <div className="custom-searchbox-icon search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          className="custom-searchbox-input"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          maxLength={512}
        />

        {/* Loading indicator */}
        {isSearchStalled && (
          <div className="custom-searchbox-loading">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* Clear button */}
        {showClearButton && inputValue && (
          <button
            type="button"
            className="custom-searchbox-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </form>
  );
};

export default CustomSearchBox;