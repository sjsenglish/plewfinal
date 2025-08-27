import React, { useState } from 'react';
import { useInstantSearch, RefinementList } from 'react-instantsearch';
import './FilterCategories.css';

const FilterCategories = ({ filters, currentIndex }) => {
  const { indexUiState, setIndexUiState } = useInstantSearch();
  const [activeFilter, setActiveFilter] = useState(null);

  // Get possible filter values based on data
  const getFilterValues = (attribute) => {
    // This is a placeholder - Algolia fetches these values dynamically
    // You can add some common ones as buttons for quick filtering
    switch (attribute) {
      case 'question_type':
        return ['Critical Thinking', 'Problem Solving', 'Data Analysis'];
      case 'sub_types':
        return ['Main Conclusion', 'Assumption', 'Strengthen', 'Weaken', 'Evaluate'];
      case 'questionType':
        return ['Reading Comprehension', 'Mood/Tone Analysis', 'Grammar', 'Vocabulary'];
      case 'theoryArea':
        return ['Sentence Structure', 'Main Idea', 'Inference', 'Word Choice'];
      default:
        return [];
    }
  };

  // Handle filter button clicks
  const handleFilterClick = (attribute, value) => {
    // Toggle the filter on/off
    const currentRefinements = indexUiState.refinementList?.[attribute] || [];

    if (currentRefinements.includes(value)) {
      // Remove this value from refinements
      setIndexUiState({
        ...indexUiState,
        refinementList: {
          ...indexUiState.refinementList,
          [attribute]: currentRefinements.filter((v) => v !== value),
        },
      });
    } else {
      // Add this value to refinements
      setIndexUiState({
        ...indexUiState,
        refinementList: {
          ...indexUiState.refinementList,
          [attribute]: [...currentRefinements, value],
        },
      });
    }
  };

  // Check if a filter button is active
  const isFilterActive = (attribute, value) => {
    const currentRefinements = indexUiState.refinementList?.[attribute] || [];
    return currentRefinements.includes(value);
  };

  return (
    <div className="filter-categories">
      {filters.map((filter) => (
        <div key={filter.attribute} className="filter-category">
          <h3 className="filter-title">{filter.label}</h3>
          <div className="filter-buttons">
            {getFilterValues(filter.attribute).map((value) => (
              <button
                key={value}
                className={`filter-button ${isFilterActive(filter.attribute, value) ? 'active' : ''}`}
                onClick={() => handleFilterClick(filter.attribute, value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilterCategories;