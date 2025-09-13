import React, { useState } from 'react';
import './VocabularyFilters.css';

const VocabularyFilters = ({ onFiltersChange, onSortChange, currentFilters, sortBy = 'frequency' }) => {
  const [activeCategory, setActiveCategory] = useState('sort');
  const [selectedFilters, setSelectedFilters] = useState(currentFilters || {});
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSort, setCurrentSort] = useState(sortBy);

  // Filter definitions for vocabulary words
  const FILTER_CATEGORIES = {
    sort: {
      label: 'Sort By',
      options: [
        { id: 'frequency', label: 'Most Frequent', value: 'frequency' },
        { id: 'alphabetical', label: 'A-Z', value: 'alphabetical' },
        { id: 'difficulty', label: 'Difficulty', value: 'difficulty' },
        { id: 'length', label: 'Word Length', value: 'length' },
      ]
    },
    difficulty: {
      label: 'Difficulty',
      options: [
        { id: 'beginner', label: 'Beginner (1-2)', value: 'beginner' },
        { id: 'intermediate', label: 'Intermediate (3)', value: 'intermediate' },
        { id: 'advanced', label: 'Advanced (4-5)', value: 'advanced' },
      ]
    },
    partOfSpeech: {
      label: 'Part of Speech',
      options: [
        { id: 'noun', label: 'Noun', value: 'partOfSpeech:noun' },
        { id: 'verb', label: 'Verb', value: 'partOfSpeech:verb' },
        { id: 'adjective', label: 'Adjective', value: 'partOfSpeech:adjective' },
        { id: 'adverb', label: 'Adverb', value: 'partOfSpeech:adverb' },
        { id: 'preposition', label: 'Preposition', value: 'partOfSpeech:preposition' },
        { id: 'conjunction', label: 'Conjunction', value: 'partOfSpeech:conjunction' },
      ]
    },
    frequency: {
      label: 'Frequency',
      options: [
        { id: 'very-common', label: 'Very Common', value: 'frequency:very_common' },
        { id: 'common', label: 'Common', value: 'frequency:common' },
        { id: 'uncommon', label: 'Uncommon', value: 'frequency:uncommon' },
        { id: 'rare', label: 'Rare', value: 'frequency:rare' },
      ]
    },
    subjectArea: {
      label: 'Subject Area',
      options: [
        { id: 'academic', label: 'Academic', value: 'subjectArea:academic' },
        { id: 'business', label: 'Business', value: 'subjectArea:business' },
        { id: 'science', label: 'Science', value: 'subjectArea:science' },
        { id: 'literature', label: 'Literature', value: 'subjectArea:literature' },
        { id: 'everyday', label: 'Everyday', value: 'subjectArea:everyday' },
        { id: 'technology', label: 'Technology', value: 'subjectArea:technology' },
        { id: 'social', label: 'Social Sciences', value: 'subjectArea:social' },
        { id: 'arts', label: 'Arts', value: 'subjectArea:arts' },
      ]
    },
    sourceExams: {
      label: 'Source Exams',
      options: [
        { id: 'toefl', label: 'TOEFL', value: 'sourceExams:toefl' },
        { id: 'ielts', label: 'IELTS', value: 'sourceExams:ielts' },
        { id: 'sat', label: 'SAT', value: 'sourceExams:sat' },
        { id: 'gre', label: 'GRE', value: 'sourceExams:gre' },
        { id: 'korean_csat', label: 'Korean CSAT', value: 'sourceExams:korean_csat' },
        { id: 'high_school', label: 'High School Texts', value: 'sourceExams:high_school' },
      ]
    },
    savedStatus: {
      label: 'Saved Status',
      options: [
        { id: 'saved', label: 'Saved Words', value: 'saved:true' },
        { id: 'unsaved', label: 'Unsaved Words', value: 'saved:false' },
        { id: 'weak', label: 'Weak Areas', value: 'weak:true' },
      ]
    }
  };

  // Handle filter selection
  const handleFilterSelect = (category, filterId, filterValue) => {
    if (category === 'sort') {
      // Handle sorting separately
      setCurrentSort(filterId);
      onSortChange && onSortChange(filterId);
      return;
    }

    const newFilters = { ...selectedFilters };
    
    // For single-select categories, replace the value
    newFilters[category] = filterId;
    
    setSelectedFilters(newFilters);
    
    console.log('Filter selected:', { category, filterId, filterValue });
    console.log('New filters state:', newFilters);
    
    onFiltersChange && onFiltersChange(newFilters);
  };

  // Clear specific filter
  const clearFilter = (category) => {
    if (category === 'sort') {
      setCurrentSort('frequency');
      onSortChange && onSortChange('frequency');
      return;
    }

    const newFilters = { ...selectedFilters };
    delete newFilters[category];
    setSelectedFilters(newFilters);
    
    onFiltersChange && onFiltersChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({});
    setCurrentSort('frequency');
    onFiltersChange && onFiltersChange({});
    onSortChange && onSortChange('frequency');
  };

  // Count active filters
  const activeFilterCount = Object.keys(selectedFilters).length;

  return (
    <div className="vocabulary-filters">
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
          {Object.entries(FILTER_CATEGORIES).map(([categoryKey, category]) => (
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
          {FILTER_CATEGORIES[activeCategory]?.options.map((option) => {
            const isSelected = activeCategory === 'sort' 
              ? currentSort === option.id 
              : selectedFilters[activeCategory] === option.id;
            
            return (
              <button
                key={option.id}
                className={`filter-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleFilterSelect(activeCategory, option.id, option.value)}
              >
                {option.label}
                {isSelected && (
                  <span className="selected-checkmark">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VocabularyFilters;