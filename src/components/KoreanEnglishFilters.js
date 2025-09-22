import React, { useState, useEffect } from 'react';
import './KoreanEnglishFilters.css';

const KoreanEnglishFilters = ({ onFiltersChange, currentFilters }) => {
  const [activeCategory, setActiveCategory] = useState('source');
  const [selectedFilters, setSelectedFilters] = useState(currentFilters || {});
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter definitions for Korean-English question pairs
  const FILTER_CATEGORIES = {
    source: {
      label: '문제 유형',
      options: [
        { id: 'past-paper', label: '기출 (Past Papers)', value: 'source:past-paper' },
        { id: 'similar', label: '유사 (Similar Questions)', value: 'source:similar' },
      ]
    },
    similarLevel: {
      label: '유사 문제 레벨',
      options: [
        { id: 'advanced', label: 'Advanced', value: 'similarLevel:advanced' },
        { id: 'baby', label: 'Baby', value: 'similarLevel:baby' },
      ]
    },
    level: {
      label: 'Level',
      options: [
        { id: 'beginner', label: 'Beginner', value: 'level:beginner' },
        { id: 'intermediate', label: 'Intermediate', value: 'level:intermediate' },
        { id: 'advanced', label: 'Advanced', value: 'level:advanced' },
        { id: 'native', label: 'Native', value: 'level:native' },
      ]
    },
    category: {
      label: 'Category',
      options: [
        { id: 'grammar', label: 'Grammar', value: 'category:grammar' },
        { id: 'vocabulary', label: 'Vocabulary', value: 'category:vocabulary' },
        { id: 'conversation', label: 'Conversation', value: 'category:conversation' },
        { id: 'reading', label: 'Reading', value: 'category:reading' },
        { id: 'listening', label: 'Listening', value: 'category:listening' },
        { id: 'writing', label: 'Writing', value: 'category:writing' },
        { id: 'culture', label: 'Culture', value: 'category:culture' },
      ]
    },
    topic: {
      label: 'Topic',
      options: [
        { id: 'daily-life', label: 'Daily Life', value: 'topic:"daily life"' },
        { id: 'business', label: 'Business', value: 'topic:business' },
        { id: 'travel', label: 'Travel', value: 'topic:travel' },
        { id: 'food', label: 'Food & Dining', value: 'topic:food' },
        { id: 'education', label: 'Education', value: 'topic:education' },
        { id: 'technology', label: 'Technology', value: 'topic:technology' },
        { id: 'entertainment', label: 'Entertainment', value: 'topic:entertainment' },
        { id: 'health', label: 'Health', value: 'topic:health' },
      ]
    },
    difficulty: {
      label: 'Difficulty',
      options: [
        { id: 'easy', label: 'Easy', value: 'difficulty:easy' },
        { id: 'medium', label: 'Medium', value: 'difficulty:medium' },
        { id: 'hard', label: 'Hard', value: 'difficulty:hard' },
        { id: 'very-hard', label: 'Very Hard', value: 'difficulty:"very hard"' },
      ]
    },
    type: {
      label: 'Question Type',
      options: [
        { id: 'translation', label: 'Translation', value: 'type:translation' },
        { id: 'fill-blank', label: 'Fill in the Blank', value: 'type:"fill in the blank"' },
        { id: 'multiple-choice', label: 'Multiple Choice', value: 'type:"multiple choice"' },
        { id: 'sentence-construction', label: 'Sentence Construction', value: 'type:"sentence construction"' },
        { id: 'comprehension', label: 'Comprehension', value: 'type:comprehension' },
      ]
    }
  };

  // Handle filter selection
  const handleFilterSelect = (category, filterId, filterValue) => {
    const newFilters = { ...selectedFilters };
    
    // For single-select categories, replace the value
    newFilters[category] = filterId;
    
    setSelectedFilters(newFilters);
    
    // Convert to format expected by App.js
    const algoliaFilters = {};
    Object.entries(newFilters).forEach(([cat, id]) => {
      if (id) {
        const option = FILTER_CATEGORIES[cat]?.options.find(opt => opt.id === id);
        if (option) {
          algoliaFilters[cat] = option.value;
        }
      }
    });
    
    console.log('Filter selected:', { category, filterId, filterValue });
    console.log('New filters state:', newFilters);
    console.log('Algolia filters to send:', algoliaFilters);
    
    onFiltersChange(algoliaFilters);
  };

  // Clear specific filter
  const clearFilter = (category) => {
    const newFilters = { ...selectedFilters };
    delete newFilters[category];
    setSelectedFilters(newFilters);
    
    // Convert to format expected by App.js
    const algoliaFilters = {};
    Object.entries(newFilters).forEach(([cat, id]) => {
      if (id) {
        const option = FILTER_CATEGORIES[cat]?.options.find(opt => opt.id === id);
        if (option) {
          algoliaFilters[cat] = option.value;
        }
      }
    });
    
    onFiltersChange(algoliaFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({});
    onFiltersChange({});
  };

  // Count active filters
  const activeFilterCount = Object.keys(selectedFilters).length;

  // Get available categories based on current selections
  const getAvailableCategories = () => {
    const categories = { ...FILTER_CATEGORIES };
    
    // Only show similarLevel if 'similar' is selected in source
    if (selectedFilters.source !== 'similar') {
      delete categories.similarLevel;
    }
    
    return categories;
  };

  const availableCategories = getAvailableCategories();

  // Effect to handle when activeCategory becomes unavailable
  useEffect(() => {
    if (!availableCategories[activeCategory]) {
      // If current active category is not available, switch to the first available one
      const firstAvailableCategory = Object.keys(availableCategories)[0];
      if (firstAvailableCategory) {
        setActiveCategory(firstAvailableCategory);
      }
    }
  }, [activeCategory, availableCategories]);

  // Also clear similarLevel filter when source changes away from 'similar'
  useEffect(() => {
    if (selectedFilters.source !== 'similar' && selectedFilters.similarLevel) {
      const newFilters = { ...selectedFilters };
      delete newFilters.similarLevel;
      setSelectedFilters(newFilters);
      
      // Convert to format expected by App.js
      const algoliaFilters = {};
      Object.entries(newFilters).forEach(([cat, id]) => {
        if (id) {
          const option = FILTER_CATEGORIES[cat]?.options.find(opt => opt.id === id);
          if (option) {
            algoliaFilters[cat] = option.value;
          }
        }
      });
      
      onFiltersChange(algoliaFilters);
    }
  }, [selectedFilters.source]);

  return (
    <div className="korean-english-filters">
      {/* Mobile toggle */}
      <div className="filters-mobile-toggle">
        <button 
          className="filters-toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-count-badge">{activeFilterCount}</span>
          )}
          <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
      </div>

      {/* Filter content */}
      <div className={`filters-content ${isExpanded ? 'expanded' : ''}`}>
        {/* Category tabs */}
        <div className="filter-categories">
          {Object.entries(availableCategories).map(([categoryKey, category]) => (
            <button
              key={categoryKey}
              className={`category-tab ${activeCategory === categoryKey ? 'active' : ''}`}
              onClick={() => setActiveCategory(categoryKey)}
            >
              {category.label}
              {selectedFilters[categoryKey] && <span className="active-indicator">•</span>}
            </button>
          ))}
        </div>

        {/* Active filters summary */}
        {activeFilterCount > 0 && (
          <div className="active-filters-summary">
            <div className="active-filters-list">
              {Object.entries(selectedFilters).map(([category, filterId]) => {
                const categoryData = FILTER_CATEGORIES[category];
                const option = categoryData?.options.find(opt => opt.id === filterId);
                
                return option ? (
                  <span key={`${category}-${filterId}`} className="active-filter-tag">
                    {categoryData.label}: {option.label}
                    <button 
                      className="remove-filter"
                      onClick={() => clearFilter(category)}
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>
            <button className="clear-all-btn" onClick={clearAllFilters}>
              Clear All
            </button>
          </div>
        )}

        {/* Filter options */}
        <div className="filter-options">
          {availableCategories[activeCategory]?.options.map((option) => (
            <button
              key={option.id}
              className={`filter-option ${selectedFilters[activeCategory] === option.id ? 'selected' : ''}`}
              onClick={() => handleFilterSelect(activeCategory, option.id, option.value)}
            >
              {option.label}
              {selectedFilters[activeCategory] === option.id && (
                <span className="selected-checkmark">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KoreanEnglishFilters;