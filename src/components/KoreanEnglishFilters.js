import React, { useState, useEffect } from 'react';
import './KoreanEnglishFilters.css';

const KoreanEnglishFilters = ({ onFiltersChange, currentFilters }) => {
  const [activeCategory, setActiveCategory] = useState('source');
  const [selectedFilters, setSelectedFilters] = useState(currentFilters || {});
  // Start expanded on desktop (window width > 768px), collapsed on mobile
  const [isExpanded, setIsExpanded] = useState(typeof window !== 'undefined' && window.innerWidth > 768);

  // All filters in one unified set
  const ALL_FILTERS = {
    source: {
      label: '문제 타입',
      options: [
        { id: 'past-paper', label: '기출', value: 'source:past-paper' },
        { id: 'original', label: '유사', value: 'source:original' },
        { id: 'baby', label: '베이비', value: 'source:baby' },
      ]
    },
    subjectArea: {
      label: '주제 영역',
      options: [
        { id: 'natural science', label: '자연 과학', value: 'primarySubjectArea:natural science' },
        { id: 'social science', label: '사회 과학', value: 'primarySubjectArea:social science' },
        { id: 'literature and arts', label: '문학/예술', value: 'primarySubjectArea:literature and arts' },
        { id: 'humanities', label: '인문학', value: 'primarySubjectArea:humanities' },
      ]
    },
    questionSkill: {
      label: '문제 유형',
      options: [
        { id: '대의 파악', label: '대의 파악', value: 'questionSkill:대의 파악' },
        { id: '도표', label: '도표', value: 'questionSkill:도표' },
        { id: '내용 일치', label: '내용 일치', value: 'questionSkill:내용 일치' },
        { id: '안내문', label: '안내문', value: 'questionSkill:안내문' },
        { id: '어법', label: '어법', value: 'questionSkill:어법' },
        { id: '어휘', label: '어휘', value: 'questionSkill:어휘' },
        { id: '빈칸 추론', label: '빈칸 추론', value: 'questionSkill:빈칸 추론' },
        { id: '간접 쓰기', label: '간접 쓰기', value: 'questionSkill:간접 쓰기' },
        { id: '장문 독해', label: '장문 독해', value: 'questionSkill:장문 독해' },
      ]
    },
    passageType: {
      label: '지문 종류',
      options: [
        { id: 'argumentative', label: '논쟁', value: 'passageType:argumentative' },
        { id: 'discursive', label: '담화', value: 'passageType:discursive' },
        { id: 'analytical', label: '분석', value: 'passageType:analytical' },
        { id: 'comprehension', label: '문해', value: 'passageType:comprehension' },
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
        const option = availableCategories[cat]?.options.find(opt => opt.id === id);
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
        const option = availableCategories[cat]?.options.find(opt => opt.id === id);
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

  // Get all filter categories
  const availableCategories = ALL_FILTERS;

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

  // No default filters applied - let Algolia handle question ordering

  // No longer need to handle similarLevel separately since it's integrated into source options

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
        {/* All Filters */}
        <div className="filter-section">
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
        </div>

        {/* Active filters summary */}
        {activeFilterCount > 0 && (
          <div className="active-filters-summary">
            <div className="active-filters-list">
              {Object.entries(selectedFilters).map(([category, filterId]) => {
                const categoryData = availableCategories[category];
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