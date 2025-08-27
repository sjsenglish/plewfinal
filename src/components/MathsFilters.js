import React, { useState } from 'react';
import './MathsFilters.css'; // We'll create this CSS file

const MathsFilters = ({ onFiltersChange, currentFilters }) => {
  const [activeCategory, setActiveCategory] = useState('year');
  const [selectedFilters, setSelectedFilters] = useState(currentFilters || {});
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter definitions based on your index structure
  const FILTER_CATEGORIES = {
    year: {
      label: 'Year',
      options: [
        { id: '2024', label: '2024', value: 'paper_info.year:2024' },
        { id: '2023', label: '2023', value: 'paper_info.year:2023' },
        { id: '2022', label: '2022', value: 'paper_info.year:2022' },
        { id: '2021', label: '2021', value: 'paper_info.year:2021' },
        { id: '2020', label: '2020', value: 'paper_info.year:2020' },
        { id: '2019', label: '2019', value: 'paper_info.year:2019' },
        { id: '2018', label: '2018', value: 'paper_info.year:2018' },
        { id: '2017', label: '2017', value: 'paper_info.year:2017' },
      ]
    },
    paperTitle: {
      label: 'Paper Title',
      options: [
        { id: 'pure-1', label: 'Pure Mathematics 1', value: 'paper_info.paper_title:"Pure Mathematics 1"' },
        { id: 'pure-2', label: 'Pure Mathematics 2', value: 'paper_info.paper_title:"Pure Mathematics 2"' },
        { id: 'statistics-1', label: 'Statistics 1', value: 'paper_info.paper_title:"Statistics 1"' },
        { id: 'mechanics-1', label: 'Mechanics 1', value: 'paper_info.paper_title:"Mechanics 1"' },
      ]
    },
    specTopic: {
      label: 'Spec Topic',
      options: [
        { id: 'proof', label: 'Proof', value: 'spec_topic:"Proof"' },
        { id: 'algebra-function', label: 'Algebra and function', value: 'spec_topic:"Algebra and function"' },
        { id: 'coordinate-geometry', label: 'Coordinate geometry in the (x,y) plane', value: 'spec_topic:"Coordinate geometry in the (x,y) plane"' },
        { id: 'sequences-series', label: 'Sequences and series', value: 'spec_topic:"Sequences and series"' },
        { id: 'trigonometry', label: 'Trigonometry', value: 'spec_topic:"Trigonometry"' },
        { id: 'exponentials-logarithms', label: 'Exponentials and logarithms', value: 'spec_topic:"Exponentials and logarithms"' },
        { id: 'differentiation', label: 'Differentiation', value: 'spec_topic:"Differentiation"' },
        { id: 'integration', label: 'Integration', value: 'spec_topic:"Integration"' },
        { id: 'numerical-methods', label: 'Numerical methods', value: 'spec_topic:"Numerical methods"' },
        { id: 'vectors', label: 'Vectors', value: 'spec_topic:"Vectors"' },
        { id: 'statistical-sampling', label: 'Statistical Sampling', value: 'spec_topic:"Statistical Sampling"' },
        { id: 'data-presentation', label: 'Data presentation and interpretation', value: 'spec_topic:"Data presentation and interpretation"' },
        { id: 'probability', label: 'Probability', value: 'spec_topic:"Probability"' },
        { id: 'statistical-distributions', label: 'Statistical distributions', value: 'spec_topic:"Statistical distributions"' },
        { id: 'hypothesis-testing', label: 'Statistical hypothesis testing', value: 'spec_topic:"Statistical hypothesis testing"' },
        { id: 'quantities-units', label: 'Quantities and units in mechanics', value: 'spec_topic:"Quantities and units in mechanics"' },
        { id: 'kinematics', label: 'Kinematics', value: 'spec_topic:"Kinematics"' },
        { id: 'forces-newtons', label: 'Forces and Newton\'s laws', value: 'spec_topic:"Forces and Newton\'s laws"' },
        { id: 'moments', label: 'Moments', value: 'spec_topic:"Moments"' },
      ]
    },
    questionTopic: {
      label: 'Question Topic',
      options: [
        { id: 'manipulate-polynomials', label: 'Manipulate polynomials', value: 'question_topic:"Manipulate polynomials"' },
        { id: 'factorising-quadratics', label: 'Factorising quadratics', value: 'question_topic:"Factorising quadratics"' },
        { id: 'quadratic-formula', label: 'Quadratic formula', value: 'question_topic:"Quadratic formula"' },
        { id: 'completing-square', label: 'Completing the square', value: 'question_topic:"Completing the square"' },
        { id: 'binomial-expansion', label: 'Binomial expansion', value: 'question_topic:"Binomial expansion"' },
        { id: 'differentiation', label: 'Differentiation', value: 'question_topic:"Differentiation"' },
        { id: 'integration', label: 'Integration', value: 'question_topic:"Integration"' },
        { id: 'trigonometry', label: 'Trigonometry', value: 'question_topic:"Trigonometry"' },
        { id: 'vectors', label: 'Vectors', value: 'question_topic:"Vectors"' },
        { id: 'coordinate-geometry', label: 'Coordinate geometry', value: 'question_topic:"Coordinate geometry"' },
        { id: 'sequences-series', label: 'Sequences and series', value: 'question_topic:"Sequences and series"' },
        { id: 'exponentials-logs', label: 'Exponentials and logarithms', value: 'question_topic:"Exponentials and logarithms"' },
        { id: 'probability', label: 'Probability', value: 'question_topic:"Probability"' },
        { id: 'statistics', label: 'Statistics', value: 'question_topic:"Statistics"' },
        { id: 'mechanics', label: 'Mechanics', value: 'question_topic:"Mechanics"' },
      ]
    },
    month: {
      label: 'Month',
      options: [
        { id: 'june', label: 'June', value: 'paper_info.month:"June 2024" OR paper_info.month:"June 2023" OR paper_info.month:"June 2022" OR paper_info.month:"June 2021" OR paper_info.month:"June 2020" OR paper_info.month:"June 2019" OR paper_info.month:"June 2018" OR paper_info.month:"June 2017"' },
        { id: 'october', label: 'October', value: 'paper_info.month:"October 2024" OR paper_info.month:"October 2023" OR paper_info.month:"October 2022" OR paper_info.month:"October 2021" OR paper_info.month:"October 2020" OR paper_info.month:"October 2019" OR paper_info.month:"October 2018" OR paper_info.month:"October 2017"' },
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

  return (
    <div className="maths-filters">
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
          {FILTER_CATEGORIES[activeCategory]?.options.map((option) => (
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

export default MathsFilters;