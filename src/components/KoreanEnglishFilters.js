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
      ]
    },
    similarLevel: {
      label: '유사 문제 레벨',
      options: [
        { id: 'advanced', label: 'Advanced', value: 'similarLevel:advanced' },
        { id: 'baby', label: 'Baby', value: 'similarLevel:baby' },
      ]
    },
    subjectArea: {
      label: 'Subject Area',
      options: [
        { id: 'natural-sciences', label: 'Natural Sciences', value: 'primarySubjectArea:natural_sciences' },
        { id: 'social-sciences', label: 'Social Sciences', value: 'primarySubjectArea:social_sciences' },
        { id: 'literature-arts', label: 'Literature & Arts', value: 'primarySubjectArea:literature_arts' },
        { id: 'humanities', label: 'Humanities', value: 'primarySubjectArea:humanities' },
      ]
    },
    questionSkill: {
      label: 'Question Skill',
      options: [
        { id: 'title-selection', label: 'Title Selection', value: 'questionSkill:title_selection' },
        { id: 'main-idea', label: 'Main Idea', value: 'questionSkill:main_idea' },
        { id: 'factual-comprehension', label: 'Factual Comprehension', value: 'questionSkill:factual_comprehension' },
        { id: 'reference-understanding', label: 'Reference Understanding', value: 'questionSkill:reference_understanding' },
        { id: 'vocabulary-context', label: 'Vocabulary in Context', value: 'questionSkill:vocabulary_context' },
        { id: 'inference', label: 'Inference', value: 'questionSkill:inference' },
        { id: 'paragraph-ordering', label: 'Paragraph Ordering', value: 'questionSkill:paragraph_ordering' },
        { id: 'tone-attitude', label: 'Tone & Attitude', value: 'questionSkill:tone_attitude' },
        { id: 'logical-structure', label: 'Logical Structure', value: 'questionSkill:logical_structure' },
      ]
    },
    difficulty: {
      label: 'Difficulty',
      options: [
        { id: 'low', label: 'Low', value: 'difficultyLevel:low' },
        { id: 'medium', label: 'Medium', value: 'difficultyLevel:medium' },
        { id: 'high', label: 'High', value: 'difficultyLevel:high' },
        { id: 'very-high', label: 'Very High', value: 'difficultyLevel:very_high' },
      ]
    }
  };

  const ADVANCED_FILTERS = {
    specificTopic: {
      label: 'Specific Topic',
      options: [
        { id: 'biology', label: 'Biology', value: 'secondarySubjectArea:biology' },
        { id: 'chemistry', label: 'Chemistry', value: 'secondarySubjectArea:chemistry' },
        { id: 'physics', label: 'Physics', value: 'secondarySubjectArea:physics' },
        { id: 'psychology', label: 'Psychology', value: 'secondarySubjectArea:psychology' },
        { id: 'economics', label: 'Economics', value: 'secondarySubjectArea:economics' },
        { id: 'politics', label: 'Politics', value: 'secondarySubjectArea:politics' },
        { id: 'history', label: 'History', value: 'secondarySubjectArea:history' },
        { id: 'philosophy', label: 'Philosophy', value: 'secondarySubjectArea:philosophy' },
        { id: 'geography', label: 'Geography', value: 'secondarySubjectArea:geography' },
        { id: 'literature', label: 'Literature', value: 'secondarySubjectArea:literature' },
        { id: 'art', label: 'Art', value: 'secondarySubjectArea:art' },
        { id: 'music', label: 'Music', value: 'secondarySubjectArea:music' },
        { id: 'technology', label: 'Technology', value: 'secondarySubjectArea:technology' },
      ]
    },
    passageType: {
      label: 'Passage Type',
      options: [
        { id: 'argumentative', label: 'Argumentative', value: 'passageType:argumentative' },
        { id: 'discursive', label: 'Discursive', value: 'passageType:discursive' },
        { id: 'analytical', label: 'Analytical', value: 'passageType:analytical' },
        { id: 'comprehension', label: 'Comprehension', value: 'passageType:comprehension' },
      ]
    },
    vocabularyLevel: {
      label: 'Vocabulary Level',
      options: [
        { id: 'basic', label: 'Basic (5000-6000)', value: 'vocabularyDemand:[5000 TO 6000]' },
        { id: 'intermediate', label: 'Intermediate (6000-7000)', value: 'vocabularyDemand:[6000 TO 7000]' },
        { id: 'advanced', label: 'Advanced (7000-8000)', value: 'vocabularyDemand:[7000 TO 8000]' },
        { id: 'expert', label: 'Expert (8000+)', value: 'vocabularyDemand:[8000 TO 10000]' },
      ]
    },
    textSource: {
      label: 'Text Source',
      options: [
        { id: 'academic-journal', label: 'Academic Journal', value: 'textSource:academic_journal' },
        { id: 'university-textbook', label: 'University Textbook', value: 'textSource:university_textbook' },
        { id: 'popular-media', label: 'Popular Media', value: 'textSource:popular_media' },
        { id: 'news-article', label: 'News Article', value: 'textSource:news_article' },
        { id: 'scientific-publication', label: 'Scientific Publication', value: 'textSource:scientific_publication' },
        { id: 'literary-work', label: 'Literary Work', value: 'textSource:literary_work' },
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

  // Get available core categories based on current selections
  const getAvailableCoreCategories = () => {
    const categories = { ...CORE_FILTERS };
    
    // Only show similarLevel if 'similar' is selected in source
    if (selectedFilters.source !== 'similar') {
      delete categories.similarLevel;
    }
    
    return categories;
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
          const option = availableCategories[cat]?.options.find(opt => opt.id === id);
          if (option) {
            algoliaFilters[cat] = option.value;
          }
        }
      });
      
      onFiltersChange(algoliaFilters);
    }
  }, [selectedFilters.source, availableCategories, onFiltersChange]);

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