import React, { useState, useEffect } from 'react';
import './KoreanEnglishFilters.css';

const KoreanEnglishFilters = ({ onFiltersChange, currentFilters }) => {
  const [activeCategory, setActiveCategory] = useState('source');
  const [selectedFilters, setSelectedFilters] = useState(currentFilters || {});
  // Start expanded on desktop (window width > 768px), collapsed on mobile
  const [isExpanded, setIsExpanded] = useState(typeof window !== 'undefined' && window.innerWidth > 768);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

  // Filter definitions organized by Core (always visible) and Advanced (collapsible)
  const CORE_FILTERS = {
    source: {
      label: '문제 유형',
      options: [
        { id: 'past-paper', label: '기출', value: 'source:past-paper' },
        { id: 'similar', label: '유사', value: 'source:similar' },
        { id: 'similar-advanced', label: 'Advanced', value: 'source:similar AND similarLevel:advanced' },
        { id: 'similar-baby', label: '베이비', value: 'source:similar AND similarLevel:baby' },
      ]
    },
    subjectArea: {
      label: 'Subject Area',
      options: [
        { id: 'natural-sciences', label: '자연 과학', value: 'primarySubjectArea:natural_sciences' },
        { id: 'social-sciences', label: '사회 과학', value: 'primarySubjectArea:social_sciences' },
        { id: 'literature-arts', label: '문학/예술', value: 'primarySubjectArea:literature_arts' },
        { id: 'humanities', label: '인문학', value: 'primarySubjectArea:humanities' },
      ]
    },
    questionSkill: {
      label: '문제 유형',
      options: [
        { id: 'main-idea', label: '주제', value: 'questionSkill:main_idea' },
        { id: 'vocabulary-context', label: '빈칸', value: 'questionSkill:vocabulary_context' },
        { id: 'paragraph-ordering', label: '순서', value: 'questionSkill:paragraph_ordering' },
        { id: 'logical-structure', label: '문장 삽입', value: 'questionSkill:logical_structure' },
        { id: 'inference', label: '추론', value: 'questionSkill:inference' },
        { id: 'title-selection', label: '제목', value: 'questionSkill:title_selection' },
        { id: 'tone-attitude', label: '어조', value: 'questionSkill:tone_attitude' },
        { id: 'factual-comprehension', label: '사실 확인', value: 'questionSkill:factual_comprehension' },
      ]
    }
  };

  const ADVANCED_FILTERS = {
    difficulty: {
      label: 'Difficulty', 
      options: [
        { id: 'low', label: 'Low', value: 'difficultyLevel:low' },
        { id: 'medium', label: 'Medium', value: 'difficultyLevel:medium' },
        { id: 'high', label: 'High', value: 'difficultyLevel:high' },
        { id: 'very-high', label: 'Very High', value: 'difficultyLevel:very_high' },
      ]
    },
    passageType: {
      label: 'Passage Type',
      options: [
        { id: 'argumentative', label: '논쟁', value: 'passageType:argumentative' },
        { id: 'discursive', label: '담화', value: 'passageType:discursive' },
        { id: 'analytical', label: '분석', value: 'passageType:analytical' },
        { id: 'comprehension', label: '문해', value: 'passageType:comprehension' },
      ]
    },
    vocabularyLevel: {
      label: 'Vocabulary Level',
      options: [
        { id: 'basic', label: '기초(5200개 이하)', value: 'vocabularyDemand:[* TO 5199]' },
        { id: 'intermediate', label: '중간(5200-5500 개)', value: 'vocabularyDemand:[5200 TO 5500]' },
        { id: 'advanced', label: '고급(5500개 이상)', value: 'vocabularyDemand:[5500 TO *]' },
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

  // Get available core categories
  const getAvailableCoreCategories = () => {
    return { ...CORE_FILTERS };
  };

  // Get all filter categories (core + advanced)
  const getAllFilterCategories = () => {
    return { ...getAvailableCoreCategories(), ...ADVANCED_FILTERS };
  };

  const availableCoreCategories = getAvailableCoreCategories();
  const availableCategories = getAllFilterCategories();

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
        {/* Core Filters - Always Visible */}
        <div className="filter-section core-filters">
          <h3 className="filter-section-title">Core Filters</h3>
          <div className="filter-categories">
            {Object.entries(availableCoreCategories).map(([categoryKey, category]) => (
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

        {/* Advanced Filters - Collapsible */}
        <div className="filter-section advanced-filters">
          <button 
            className="filter-section-toggle"
            onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
          >
            <h3 className="filter-section-title">Advanced Filters</h3>
            <span className={`toggle-icon ${isAdvancedExpanded ? 'expanded' : ''}`}>▼</span>
          </button>
          
          {isAdvancedExpanded && (
            <div className="filter-categories">
              {Object.entries(ADVANCED_FILTERS).map(([categoryKey, category]) => (
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
          )}
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