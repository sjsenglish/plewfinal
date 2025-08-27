import React, { useState, useEffect } from 'react';
import { createQuestionPack } from '../services/questionPackService';
import { generateQuestionPackPDF, downloadPDF } from '../services/pdfGenerator';
import { getAuth } from 'firebase/auth';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { usePaywall } from '../hooks/usePaywall';
import { incrementUsage } from '../services/subscriptionService';
import SubscriptionPlans from './SubscriptionPlans';

const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_KEY
);

// Color palette from your specification
const COLORS = {
  lightPurple: '#ccccff',
  teal: '#00ced1', 
  lightTeal: '#d8f0ed',
  white: '#ffffff',
  gray: '#6b7280',
  darkGray: '#374151'
};

// Your Firebase Storage icons
const ICONS = {
  tsa: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftsa%20icon.svg?alt=media&token=ef892a4f-ae47-4295-a252-b3f11dbeb376',
  maths: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Falevel%20maths%20icon.svg?alt=media&token=df078332-ccae-4013-b34e-fd1c5f4c5383',
  ghost: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fpurple%20ghost.svg?alt=media&token=8f68c264-89dd-4563-8858-07b8f9fd87e0',
  note: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ffile%20icon.svg?alt=media&token=19369fc7-4d0c-499a-ad43-d47372a13b09'
};

// Helper function to convert Firebase Storage URLs to direct URLs
const getImageUrl = (url) => {
  if (!url) return '';
  
  // If it's a Firebase Storage gs:// URL, convert it
  if (url.startsWith('gs://')) {
    // Extract bucket and path from gs://bucket/path format
    const gsMatch = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (gsMatch) {
      const bucket = gsMatch[1];
      const path = gsMatch[2];
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    }
  }
  
  return url;
};

// Subject configurations - TSA and Maths
const SUBJECTS = {
  tsa: {
    index: 'copy_tsa_questions',
    displayName: 'TSA',
    description: 'Thinking Skills Assessment',
    filterCategories: {
      type: [
        { id: 'critical-thinking', label: 'Critical Thinking', value: 'question_type:"Critical Thinking"' },
        { id: 'problem-solving', label: 'Problem Solving', value: 'question_type:"Problem Solving"' },
      ],
      subType: [
        { id: 'main-conclusion', label: 'Main Conclusion', value: 'sub_types:"Main Conclusion"' },
        { id: 'drawing-conclusions', label: 'Drawing Conclusions', value: 'sub_types:"Drawing Conclusions"' },
        { id: 'assumption', label: 'Assumption', value: 'sub_types:"Assumption"' },
        { id: 'strengthen', label: 'Strengthen', value: 'sub_types:"Strengthen"' },
        { id: 'parallel-reasoning', label: 'Parallel Reasoning', value: 'sub_types:"Parallel Reasoning"' },
        { id: 'weakening-arguments', label: 'Weakening Arguments', value: 'sub_types:"Weakening Arguments"' },
        { id: 'principle', label: 'Principle', value: 'sub_types:"Principle"' },
        { id: 'flaws', label: 'Flaws', value: 'sub_types:"Flaws"' },
        { id: 'Rates', label: 'Rates', value: 'sub_types:"Rates"' },
        { id: 'Ratio/Proportion/Percentage', label: 'Ratio/Proportion/Percentage', value: 'sub_types:"Ratio/Proportion/Percentage"' },
        { id: 'Spatial', label: 'Spatial', value: 'sub_types:"Spatial"' },
        { id: 'Optimisation', label: 'Optimisation', value: 'sub_types:"Optimisation"' },
        { id: 'Best Fit', label: 'Best Fit', value: 'sub_types:"Best Fit"' },
        { id: 'Probability', label: 'Probability', value: 'sub_types:"Probability"' },
        { id: 'Logic', label: 'Logic', value: 'sub_types:"Logic"' },
      ],
      year: [
        { id: 'year-2008', label: '2008', value: 'year:2008' },
        { id: 'year-2009', label: '2009', value: 'year:2009' },
        { id: 'year-2010', label: '2010', value: 'year:2010' },
        { id: 'year-2011', label: '2011', value: 'year:2011' },
        { id: 'year-2012', label: '2012', value: 'year:2012' },
        { id: 'year-2013', label: '2013', value: 'year:2013' },
        { id: 'year-2014', label: '2014', value: 'year:2014' },
        { id: 'year-2015', label: '2015', value: 'year:2015' },
        { id: 'year-2016', label: '2016', value: 'year:2016' },
        { id: 'year-2017', label: '2017', value: 'year:2017' },
        { id: 'year-2018', label: '2018', value: 'year:2018' },
        { id: 'year-2019', label: '2019', value: 'year:2019' },
        { id: 'year-2020', label: '2020', value: 'year:2020' },
        { id: 'year-2021', label: '2021', value: 'year:2021' },
        { id: 'year-2022', label: '2022', value: 'year:2022' },
      ],
    },
    categoryLabels: { type: 'Question Type', subType: 'Sub Type', year: 'Year' },
  },
  
maths: {
  index: 'edexel_mathematics_updated',
  displayName: 'A Level Maths',
  description: 'Edexcel A Level Mathematics',
  filterCategories: {
    year: [
      { id: 'year-2024', label: '2024', value: 'paper_info.year:2024' },
      { id: 'year-2023', label: '2023', value: 'paper_info.year:2023' },
      { id: 'year-2022', label: '2022', value: 'paper_info.year:2022' },
      { id: 'year-2021', label: '2021', value: 'paper_info.year:2021' },
      { id: 'year-2020', label: '2020', value: 'paper_info.year:2020' },
      { id: 'year-2019', label: '2019', value: 'paper_info.year:2019' },
      { id: 'year-2018', label: '2018', value: 'paper_info.year:2018' },
      { id: 'year-2017', label: '2017', value: 'paper_info.year:2017' },
    ],
    paperTitle: [
      { id: 'pure-1', label: 'Pure Mathematics 1', value: 'paper_info.paper_title:"Pure Mathematics 1"' },
      { id: 'pure-2', label: 'Pure Mathematics 2', value: 'paper_info.paper_title:"Pure Mathematics 2"' },
      { id: 'statistics-1', label: 'Statistics 1', value: 'paper_info.paper_title:"Statistics 1"' },
      { id: 'mechanics-1', label: 'Mechanics 1', value: 'paper_info.paper_title:"Mechanics 1"' },
    ],
    specTopic: [
      { id: 'proof', label: '1. Proof', value: 'spec_topic:"Proof"' },
      { id: 'algebra-function', label: '2. Algebra and function', value: 'spec_topic:"Algebra and function"' },
      { id: 'coordinate-geometry', label: '3. Coordinate geometry', value: 'spec_topic:"Coordinate geometry in the (x,y) plane"' },
      { id: 'sequences-series', label: '4. Sequences and series', value: 'spec_topic:"Sequences and series"' },
      { id: 'trigonometry', label: '5. Trigonometry', value: 'spec_topic:"Trigonometry"' },
      { id: 'exponentials-logarithms', label: '6. Exponentials and logarithms', value: 'spec_topic:"Exponentials and logarithms"' },
      { id: 'differentiation', label: '7. Differentiation', value: 'spec_topic:"Differentiation"' },
      { id: 'integration', label: '8. Integration', value: 'spec_topic:"Integration"' },
      { id: 'numerical-methods', label: '9. Numerical methods', value: 'spec_topic:"Numerical methods"' },
      { id: 'vectors', label: '10. Vectors', value: 'spec_topic:"Vectors"' },
      { id: 'statistical-sampling', label: 'Statistical Sampling', value: 'spec_topic:"Statistical Sampling"' },
      { id: 'data-presentation', label: 'Data presentation and interpretation', value: 'spec_topic:"Data presentation and interpretation"' },
      { id: 'probability', label: 'Probability', value: 'spec_topic:"Probability"' },
      { id: 'statistical-distributions', label: 'Statistical distributions', value: 'spec_topic:"Statistical distributions"' },
      { id: 'hypothesis-testing', label: 'Statistical hypothesis testing', value: 'spec_topic:"Statistical hypothesis testing"' },
      { id: 'quantities-units', label: 'Quantities and units in mechanics', value: 'spec_topic:"Quantities and units in mechanics"' },
      { id: 'kinematics', label: 'Kinematics', value: 'spec_topic:"Kinematics"' },
      { id: 'forces-newtons', label: 'Forces and Newton\'s laws', value: 'spec_topic:"Forces and Newton\'s laws"' },
      { id: 'moments', label: 'Moments', value: 'spec_topic:"Moments"' },
    ],
    questionTopic: [
      { id: 'factorising-quadratics', label: 'Factorising quadratics', value: 'question_topic:"Factorising quadratics"' },
      { id: 'quadratic-formula', label: 'Quadratic formula', value: 'question_topic:"Quadratic formula"' },
      { id: 'completing-square', label: 'Completing the square', value: 'question_topic:"Completing the square"' },
      { id: 'manipulate-polynomials', label: 'Manipulate polynomials', value: 'question_topic:"Manipulate polynomials"' },
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
    ],
    month: [
      { id: 'june', label: 'June', value: 'paper_info.month:"June 2024" OR paper_info.month:"June 2023" OR paper_info.month:"June 2022" OR paper_info.month:"June 2021" OR paper_info.month:"June 2020" OR paper_info.month:"June 2019" OR paper_info.month:"June 2018" OR paper_info.month:"June 2017"' },
      { id: 'october', label: 'October', value: 'paper_info.month:"October 2024" OR paper_info.month:"October 2023" OR paper_info.month:"October 2022" OR paper_info.month:"October 2021" OR paper_info.month:"October 2020" OR paper_info.month:"October 2019" OR paper_info.month:"October 2018" OR paper_info.month:"October 2017"' },
    ],
  },
  categoryLabels: { 
    year: 'Year',
    paperTitle: 'Paper Title',
    specTopic: 'Spec Topic', 
    questionTopic: 'Question Topic',
    month: 'Month'
  },
},
};

// PDF Preview Component
const PDFPreview = ({ packData, selectedQuestions }) => {
  const previewStyles = {
    questionSpacing: '20px',
    optionSpacing: '6px',
    fontSize: packData.styling?.fontSize || 12,
    questionNumberSize: (packData.styling?.fontSize || 12) + 2,
    metaFontSize: (packData.styling?.fontSize || 12) - 2,
    padding: '20px 25px',
    answerBoxPadding: '8px 10px'
  };

  const formatQuestionForPreview = (question, index) => {
    const questionNum = index + 1;
    const imageUrl = question?.imageUrl || question?.image_url || question?.imageFile || question?.image_file;
    
    return (
      <div 
        key={question.objectID || index} 
        style={{ 
          marginBottom: previewStyles.questionSpacing,
          padding: '16px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: 'white'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: packData.styling?.color || COLORS.teal,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            flexShrink: 0
          }}>
            {questionNum}
          </div>

          <div style={{ flex: 1 }}>
            {packData.subject === 'tsa' && (
              <>
                {question.question_content && (
                  <div style={{ 
                    fontSize: `${previewStyles.fontSize}px`,
                    marginBottom: '8px',
                    color: '#374151'
                  }}>
                    {question.question_content}
                  </div>
                )}

                {imageUrl && (
                  <div style={{ 
                    margin: '12px 0',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px',
                    backgroundColor: '#f8fafc'
                  }}>
                    <img
                      src={getImageUrl(imageUrl)}
                      alt={`Question ${questionNum} diagram`}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        height: 'auto',
                        borderRadius: '4px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errorMsg = document.createElement('div');
                        errorMsg.textContent = '[Image will be included in PDF]';
                        errorMsg.style.color = '#64748b';
                        errorMsg.style.fontStyle = 'italic';
                        errorMsg.style.padding = '20px';
                        e.target.parentNode.appendChild(errorMsg);
                      }}
                    />
                  </div>
                )}
                
                {question.question && (
                  <div style={{ 
                    fontSize: `${previewStyles.fontSize + 1}px`,
                    fontWeight: '500',
                    color: '#111827'
                  }}>
                    {question.question}
                  </div>
                )}

                {question.options && question.options.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        <span style={{
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: `${previewStyles.fontSize - 1}px`,
                          fontWeight: '500',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {option.id || String.fromCharCode(65 + optIndex)}
                        </span>
                        <span style={{ 
                          fontSize: `${previewStyles.fontSize}px`,
                          color: '#374151'
                        }}>
                          {option.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {packData.styling?.includeAnswers && !packData.styling?.separateAnswerSheet && question.correct_answer && (
                  <div style={{ 
                    padding: previewStyles.answerBoxPadding,
                    fontSize: `${previewStyles.fontSize - 1}px`,
                    marginTop: '12px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    color: '#16a34a'
                  }}>
                    <strong>Answer: {question.correct_answer}</strong>
                    {question.options && (() => {
                      const correctOption = question.options.find(opt => opt.id === question.correct_answer);
                      return correctOption?.text ? ` - ${correctOption.text.substring(0, 50)}${correctOption.text.length > 50 ? '...' : ''}` : '';
                    })()}
                  </div>
                )}
              </>
            )}
{packData.subject === 'maths' && (
  <>
    <div style={{ marginBottom: '12px' }}>
      {question.paper_info && (
        <div style={{ 
          fontSize: `${previewStyles.fontSize - 1}px`,
          color: '#6b7280',
          marginBottom: '4px'
        }}>
          <strong>Year:</strong> {question.paper_info.year} • <strong>Paper:</strong> {question.paper_info.paper_title}
        </div>
      )}
      {question.spec_topic && (
        <div style={{ 
          fontSize: `${previewStyles.fontSize - 1}px`,
          color: '#6b7280',
          marginBottom: '4px'
        }}>
          <strong>Spec Topic:</strong> {question.spec_topic}
        </div>
      )}
      {question.question_topic && (
        <div style={{ 
          fontSize: `${previewStyles.fontSize - 1}px`,
          color: '#6b7280',
          marginBottom: '4px'
        }}>
          <strong>Question Topic:</strong> {question.question_topic}
        </div>
      )}
      {question.marks && (
        <div style={{ 
          fontSize: `${previewStyles.fontSize - 1}px`,
          color: '#6b7280'
        }}>
          <strong>Marks:</strong> {question.marks}
        </div>
      )}
    </div>


                {imageUrl && (
                  <div style={{ 
                    margin: '12px 0',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px',
                    backgroundColor: '#f8fafc'
                  }}>
                    <img
                      src={getImageUrl(imageUrl)}
                      alt={`Question ${questionNum} diagram`}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        height: 'auto',
                        borderRadius: '4px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errorMsg = document.createElement('div');
                        errorMsg.textContent = '[Image will be included in PDF]';
                        errorMsg.style.color = '#64748b';
                        errorMsg.style.fontStyle = 'italic';
                        errorMsg.style.padding = '20px';
                        e.target.parentNode.appendChild(errorMsg);
                      }}
                    />
                  </div>
                )}

                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  minHeight: '60px',
                  fontSize: `${previewStyles.fontSize - 1}px`,
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  Answer space for working and solution
                </div>

                {packData.styling?.includeAnswers && !packData.styling?.separateAnswerSheet && question.correct_answer && (
                  <div style={{ 
                    padding: previewStyles.answerBoxPadding,
                    fontSize: `${previewStyles.fontSize - 1}px`,
                    marginTop: '12px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    color: '#16a34a'
                  }}>
                    <strong>Answer:</strong> {question.correct_answer}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '20px',
      minHeight: '500px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {selectedQuestions.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '320px',
          textAlign: 'center'
        }}>
          <img 
            src={ICONS.note} 
            alt="File Icon"
            style={{
              width: '80px',
              height: '80px',
              marginBottom: '16px'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.style.cssText = 'width: 80px; height: 80px; background-color: #e0e7ff; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px;';
              fallback.textContent = '📄';
              e.target.parentNode.insertBefore(fallback, e.target);
            }}
          />
          <h3 style={{ 
            color: COLORS.gray, 
            margin: '0 0 8px 0',
            fontWeight: '500'
          }}>
            Your chosen questions will appear here exactly...
          </h3>
          <p style={{ 
            color: '#9ca3af', 
            margin: '0',
            fontSize: '14px'
          }}>
            by examrizzsearch.com
          </p>
        </div>
      ) : (
        <div>
          <div style={{
            borderBottom: `2px solid ${COLORS.teal}`,
            paddingBottom: '16px',
            marginBottom: '24px'
          }}>
            <h1 style={{
              color: COLORS.teal,
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>
              {packData.packName || 'Your Question Pack'}
            </h1>
            <div style={{
              fontSize: '14px',
              color: COLORS.gray
            }}>
              {SUBJECTS[packData.subject]?.displayName || packData.subject.toUpperCase()} • {selectedQuestions.length} Questions
              {packData.styling?.showDate && ` • ${new Date().toLocaleDateString()}`}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginTop: '8px'
            }}>
              by examrizzsearch.com
            </div>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {selectedQuestions.map((question, index) => 
              formatQuestionForPreview(question, index)
            )}
          </div>

          {packData.styling?.includeAnswers && packData.styling?.separateAnswerSheet && selectedQuestions.length > 0 && (
            <div style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '2px solid #e5e7eb'
            }}>
              <h2 style={{ 
                color: packData.styling?.color || COLORS.teal,
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                Answer Sheet
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '8px'
              }}>
                {selectedQuestions.map((question, index) => (
                  <div key={index} style={{
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}>
                    {index + 1}. {question.correct_answer || 'See marking scheme'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const QuestionPackPage = () => {
  // Paywall hooks
  const {
    subscription,
    usage,
    loading: paywallLoading,
    checkFeatureAccess,
    checkUsage,
    getPlanInfo,
    isLoggedIn,
    isPaidUser,
  } = usePaywall();

  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [packData, setPackData] = useState({
    packName: '',
    subject: 'tsa',
    selectedQuestionIds: [],
    totalQuestions: 50,
    styling: { 
      color: COLORS.teal,
      fontSize: 12,
      includeAnswers: true,
      separateAnswerSheet: false,
      showDate: true
    },
  });

  // Filter and question states
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeCategory, setActiveCategory] = useState('type');
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [fetchedQuestions, setFetchedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdPackId, setCreatedPackId] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Auth and config
  const auth = getAuth();
  const user = auth.currentUser;
  const subjectConfig = SUBJECTS[packData.subject];
  const canCreateQuestionPacks = checkFeatureAccess('create_question_packs');
  const planInfo = getPlanInfo();

// Color options - updated with your custom palette
const colorOptions = [
  { id: 'light-purple', color: '#ccccff', name: 'Light Purple' },
  { id: 'dark-purple', color: '#221468', name: 'Dark Purple' },
  { id: 'teal', color: '#00ced1', name: 'Teal' },
  { id: 'light-teal', color: '#d8f0ed', name: 'Light Teal' },
  { id: 'lavender', color: '#e1dfff', name: 'Lavender' },
];

  // Build filter string for Algolia
  const buildFilterString = () => {
    if (!subjectConfig) return '';
    const currentFilters = Object.values(subjectConfig.filterCategories).flat();
    const filterGroups = {};

    activeFilters.forEach((id) => {
      const filter = currentFilters.find((f) => f.id === id);
      if (!filter) return;

      const attributeName = filter.value.split(':')[0];
      if (!filterGroups[attributeName]) {
        filterGroups[attributeName] = [];
      }
      filterGroups[attributeName].push(filter.value);
    });

    return Object.entries(filterGroups)
      .map(([_, values]) => {
        if (values.length === 1) return values[0];
        return `(${values.join(' OR ')})`;
      })
      .join(' AND ');
  };

  // Handle filter clicks
  const handleFilterClick = (filter) => {
    if (activeFilters.includes(filter.id)) {
      setActiveFilters(activeFilters.filter((id) => id !== filter.id));
    } else {
      setActiveFilters([...activeFilters, filter.id]);
    }
  };

// Get question preview
const getQuestionPreview = (question) => {
  if (packData.subject === 'tsa') {
    const hasImage = question?.image_url || question?.imageFile || question?.image_file;
    const preview = question.question_content || question.question || 'TSA Question';
    return hasImage ? `📷 ${preview}` : preview;
  } else if (packData.subject === 'maths') {
    const hasImage = question?.imageUrl || question?.image_url || question?.imageFile || question?.image_file;
    const year = question.paper_info?.year || 'Unknown Year';
    const paperTitle = question.paper_info?.paper_title || 'Unknown Paper';
    const questionNumber = question.question_number || 'Q?';
    const questionTopic = question.question_topic || question.spec_topic || 'Unknown Topic';
    const preview = `${year} ${paperTitle} Q${questionNumber} - ${questionTopic}`;
    return hasImage ? `📷 ${preview}` : preview;
  }
  return 'Question';
};

  // Toggle question selection
  const toggleQuestionSelection = (question) => {
    const isSelected = selectedQuestions.some((q) => q.objectID === question.objectID);

    if (isSelected) {
      setSelectedQuestions((prev) => prev.filter((q) => q.objectID !== question.objectID));
    } else {
      if (selectedQuestions.length < packData.totalQuestions) {
        setSelectedQuestions((prev) => [...prev, question]);
      } else {
        alert(`You can only select ${packData.totalQuestions} questions for this pack.`);
      }
    }
  };

  // Fetch questions for step 2 with enhanced error handling
  const fetchQuestionsForSelection = async () => {
    if (!subjectConfig) {
      console.error('No subject configuration found');
      alert('Please select a subject first');
      return;
    }

    setLoadingQuestions(true);
    setFetchedQuestions([]); // Clear previous questions
    
    try {
      const filterString = buildFilterString();
      
      console.log('Fetching questions with:', {
        index: subjectConfig.index,
        filters: filterString,
        requestedCount: packData.totalQuestions
      });
      
      const response = await searchClient.search([
        {
          indexName: subjectConfig.index,
          params: {
            query: '',
            filters: filterString || '',
            hitsPerPage: Math.min(packData.totalQuestions * 3, 100),
          },
        },
      ]);

      const questions = response.results[0]?.hits || [];
      
      if (questions.length === 0) {
        console.warn('No questions found with current filters');
        alert('No questions found with the selected filters. Try adjusting your criteria.');
        setFetchedQuestions([]);
        setSelectedQuestions([]);
        return;
      }
      
      console.log(`Fetched ${questions.length} questions successfully`);
      setFetchedQuestions(questions);

      // Auto-select questions up to the requested amount
      const autoSelected = questions.slice(0, packData.totalQuestions);
      setSelectedQuestions(autoSelected);
      
      if (autoSelected.length < packData.totalQuestions) {
        console.warn(`Only ${autoSelected.length} questions available, requested ${packData.totalQuestions}`);
        alert(`Only ${autoSelected.length} questions found. You may want to adjust your filters to find more questions.`);
      }
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        index: subjectConfig?.index
      });
      
      // Provide user-friendly error message
      let errorMessage = 'Failed to load questions. ';
      
      if (error.message?.includes('Network')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message?.includes('index')) {
        errorMessage += 'The question database is unavailable. Please try again later.';
      } else if (error.message?.includes('algolia')) {
        errorMessage += 'Search service is temporarily unavailable. Please try again in a moment.';
      } else {
        errorMessage += 'Please try again or contact support if the problem persists.';
      }
      
      alert(errorMessage);
      setFetchedQuestions([]);
      setSelectedQuestions([]);
      
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Handle pack creation
  const handleCreatePack = async () => {
    if (!user) {
      alert('Please log in to create a question pack');
      return;
    }

    if (!canCreateQuestionPacks) {
      const usageCheck = await checkUsage('create_question_pack');
      if (!usageCheck.allowed) {
        window.location.href = '/subscription-plans';
        return;
      }
    }

    setLoading(true);
    
    try {
      const result = await createQuestionPack(user.uid, {
        ...packData,
        selectedQuestions: selectedQuestions,
      });

      if (result.success) {
        setCreatedPackId(result.packId);
        
        if (!canCreateQuestionPacks) {
          await incrementUsage(user.uid, 'create_question_pack');
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating pack:', error);
      alert('Failed to create pack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF download with enhanced error handling
  const handleDownloadPDF = async () => {
    // Validation checks
    if (!selectedQuestions || selectedQuestions.length === 0) {
      console.error('PDF Generation Error: No questions selected');
      alert('Please select questions before generating a PDF');
      return;
    }

    // Log debug information
    console.log('Starting PDF generation with:', {
      questionCount: selectedQuestions.length,
      subject: packData.subject,
      packName: packData.packName,
      includeAnswers: packData.styling?.includeAnswers,
      fontSize: packData.styling?.fontSize
    });

    setGeneratingPDF(true);

    try {
      // Validate questions have required data
      const invalidQuestions = selectedQuestions.filter((q, index) => {
        if (!q) {
          console.warn(`Question at index ${index} is null/undefined`);
          return true;
        }
        // Check for required fields based on subject
        if (packData.subject === 'tsa') {
          if (!q.question && !q.question_content) {
            console.warn(`TSA question ${q.objectID || index} missing question content`);
            return true;
          }
        } else if (packData.subject === 'maths') {
          if (!q.paper_info && !q.spec_topic && !q.question_topic) {
            console.warn(`Maths question ${q.objectID || index} missing metadata`);
            return true;
          }
        }
        return false;
      });

      if (invalidQuestions.length > 0) {
        console.error(`Found ${invalidQuestions.length} invalid questions`);
        const proceed = window.confirm(
          `Warning: ${invalidQuestions.length} question(s) may have missing data. ` +
          `The PDF may not display these questions correctly. Continue anyway?`
        );
        if (!proceed) {
          setGeneratingPDF(false);
          return;
        }
      }

      // Process images if they exist
      const questionsWithProcessedImages = await Promise.all(
        selectedQuestions.map(async (question) => {
          const processedQuestion = { ...question };
          
          // Handle various image URL formats
          const imageUrl = question.image_url || question.imageUrl || question.image_file || question.imageFile;
          if (imageUrl) {
            try {
              // Ensure HTTPS for image URLs
              processedQuestion.processedImageUrl = imageUrl.replace('http:', 'https:');
              console.log(`Processing image for question ${question.objectID}: ${processedQuestion.processedImageUrl}`);
            } catch (imgError) {
              console.warn(`Failed to process image for question ${question.objectID}:`, imgError);
              // Continue without image rather than failing entirely
              processedQuestion.processedImageUrl = null;
            }
          }
          
          return processedQuestion;
        })
      );

      // Prepare PDF data
      const packDataForPDF = {
        ...packData,
        selectedQuestions: questionsWithProcessedImages,
        packId: createdPackId || 'preview',
        generatedAt: new Date().toISOString()
      };

      // PDF options with defaults
      const pdfOptions = {
        includeAnswers: packData.styling?.includeAnswers !== false,
        separateAnswerSheet: packData.styling?.separateAnswerSheet || false,
        fontSize: packData.styling?.fontSize || 11,
        margin: 20,
        includeImages: true,
        debug: true // Enable debug mode for better error tracking
      };

      console.log('Generating PDF with options:', pdfOptions);

      // Generate PDF
      const pdfResult = await generateQuestionPackPDF(
        packDataForPDF,
        questionsWithProcessedImages,
        pdfOptions
      );

      if (!pdfResult || !pdfResult.success) {
        throw new Error(pdfResult?.error || 'PDF generation failed');
      }

      // Create filename
      const sanitizedName = (packData.packName || 'question_pack')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${sanitizedName}_${dateStr}.pdf`;

      console.log('PDF generated successfully, downloading as:', filename);

      // Download PDF
      downloadPDF(pdfResult.pdf, filename);

      // Success notification
      console.log('PDF downloaded successfully');

    } catch (error) {
      console.error('PDF Generation Error:', error);
      console.error('Error stack:', error.stack);

      // Provide detailed error message
      let errorMessage = 'Failed to generate PDF. ';

      if (error.message) {
        if (error.message.includes('image')) {
          errorMessage += 'There was a problem loading question images. ';
        } else if (error.message.includes('memory')) {
          errorMessage += 'The PDF is too large. Try selecting fewer questions. ';
        } else if (error.message.includes('font')) {
          errorMessage += 'There was a problem with text rendering. ';
        } else {
          errorMessage += `Error: ${error.message}. `;
        }
      }

      errorMessage += 'Please try again or contact support if the problem persists.';

      alert(errorMessage);

      // Log additional debug info
      console.log('Failed PDF generation attempt with data:', {
        questionsCount: selectedQuestions?.length,
        packData: packData,
        error: error.toString()
      });

    } finally {
      setGeneratingPDF(false);
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep === 1) {
      fetchQuestionsForSelection();
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Update available questions when filters change
  useEffect(() => {
    if (!subjectConfig) return;

    const filterString = buildFilterString();
    searchClient
      .search([
        {
          indexName: subjectConfig.index,
          params: {
            query: '',
            filters: filterString,
            hitsPerPage: 0,
          },
        },
      ])
      .then((results) => {
        const newAvailableQuestions = results.results[0].nbHits;
        setAvailableQuestions(newAvailableQuestions);
        
        if (packData.totalQuestions > newAvailableQuestions && newAvailableQuestions > 0) {
          setPackData(prev => ({ 
            ...prev, 
            totalQuestions: Math.min(prev.totalQuestions, newAvailableQuestions)
          }));
        } else if (newAvailableQuestions === 0) {
          setPackData(prev => ({ 
            ...prev, 
            totalQuestions: 0 
          }));
        }
      })
      .catch((error) => {
        console.error('Error counting questions:', error);
        setAvailableQuestions(0);
        setPackData(prev => ({ 
          ...prev, 
          totalQuestions: 0 
        }));
      });
  }, [activeFilters, packData.subject]);

  // Reset filters when changing subjects
  useEffect(() => {
    setActiveFilters([]);
    setActiveCategory(packData.subject === 'tsa' ? 'type' : 'year');
  }, [packData.subject]);

  if (paywallLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${COLORS.teal}`,
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#374151', fontWeight: '500' }}>Checking subscription status...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.lightTeal} 0%, ${COLORS.lightPurple} 100%)`,
      padding: '0'
    }}>
      {/* Subscription Plans Modal */}
      {showSubscriptionPlans && (
        <SubscriptionPlans onClose={() => setShowSubscriptionPlans(false)} />
      )}

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 24px 40px 24px'
      }}>
        {/* Step Indicator - standalone */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              Create Question Pack
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '14px',
              color: COLORS.gray
            }}>
              <span>Plan: <strong style={{ color: '#111827' }}>{planInfo?.name || 'Monthly Plan'}</strong></span>
              {!isPaidUser && usage && (
                <span>Usage: {usage.questionPacksCreated || 0}/1 used</span>
              )}
            </div>
          </div>
          
          {/* Step Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: currentStep >= step ? COLORS.teal : 'rgba(255, 255, 255, 0.7)',
                  color: currentStep >= step ? 'white' : COLORS.gray,
                  border: currentStep >= step ? 'none' : '2px solid rgba(255, 255, 255, 0.5)'
                }}>
                  {currentStep > step ? '✓' : step}
                </div>
                {step < 3 && (
                  <div style={{
                    width: '20px',
                    height: '2px',
                    backgroundColor: currentStep > step ? COLORS.teal : 'rgba(255, 255, 255, 0.5)'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Split Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          alignItems: 'start'
        }}>
          
          {/* Left Panel - Form */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '28px'
          }}>
            
            {/* Step 1: Pack Setup */}
            {currentStep === 1 && (
              <>
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 8px 0'
                  }}>
                    Pack Setup
                  </h2>
                  <span style={{
                    color: '#0369a1',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Step 1 of 3
                  </span>
                </div>

                {/* Pack Name */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: COLORS.darkGray,
                    marginBottom: '8px'
                  }}>
                    Pack Name
                  </label>
                  <input
                    type="text"
                    value={packData.packName}
                    onChange={(e) => setPackData(prev => ({ ...prev, packName: e.target.value }))}
                    placeholder="Enter pack name..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: COLORS.white,
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                </div>

                {/* Subject Selection */}
                <div style={{ marginBottom: '32px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: COLORS.darkGray,
                    marginBottom: '12px'
                  }}>
                    Subject
                  </label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
{Object.entries(SUBJECTS).map(([key, config]) => (
  <button
    key={key}
    onClick={() => {
      if (key === 'maths') {
        return; // Disable click for maths
      }
      setPackData(prev => ({ 
        ...prev, 
        subject: key
      }));
    }}
    disabled={key === 'maths'}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      border: packData.subject === key ? `2px solid ${COLORS.teal}` : '1px solid #e5e7eb',
      borderRadius: '12px',
      backgroundColor: key === 'maths' ? '#f9fafb' : COLORS.white,
      textAlign: 'left',
      cursor: key === 'maths' ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      opacity: key === 'maths' ? 0.5 : 1
    }}
  >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img 
                            src={key === 'tsa' ? ICONS.tsa : ICONS.maths}
                            alt={config.displayName}
                            style={{ width: '32px', height: '32px' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.style.cssText = 'width: 32px; height: 32px; background-color: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;';
                              fallback.textContent = key === 'tsa' ? '🧠' : '📊';
                              e.target.parentNode.appendChild(fallback);
                            }}
                          />
                        </div>
                        
                        <div style={{ flex: 1 }}>
  <div style={{
    fontSize: '16px',
    fontWeight: '600',
    color: key === 'maths' ? '#9ca3af' : '#111827',
    marginBottom: '2px'
  }}>
    {config.displayName}
    {key === 'maths' && (
      <span style={{
        fontSize: '12px',
        fontWeight: '400',
        color: '#9ca3af',
        marginLeft: '8px'
      }}>
        (temporarily unavailable)
      </span>
    )}
  </div>
  <div style={{
    fontSize: '14px',
    color: key === 'maths' ? '#9ca3af' : COLORS.gray
  }}>
    {config.description}
  </div>
</div>
                        
                        {packData.subject === key && (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: COLORS.teal,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Filters */}
                {subjectConfig && (
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: COLORS.darkGray,
                      marginBottom: '12px'
                    }}>
                      Question Filters
                    </label>

                    {/* Filter Category Tabs */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '16px',
                      overflowX: 'auto',
                      paddingBottom: '4px'
                    }}>
                      {Object.keys(subjectConfig.filterCategories).map((category) => (
                        <button
                          key={category}
                          onClick={() => setActiveCategory(category)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: activeCategory === category ? COLORS.teal : 'rgba(255, 255, 255, 0.7)',
                            color: activeCategory === category ? 'white' : COLORS.gray,
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          {subjectConfig.categoryLabels[category] || category}
                        </button>
                      ))}
                    </div>

                    {/* Filter Buttons */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      {subjectConfig.filterCategories[activeCategory]?.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => handleFilterClick(filter)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            border: activeFilters.includes(filter.id) ? `2px solid ${COLORS.teal}` : '2px solid #d1d5db',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: activeFilters.includes(filter.id) ? 'rgba(0, 206, 209, 0.1)' : 'transparent',
                            color: activeFilters.includes(filter.id) ? COLORS.teal : COLORS.gray
                          }}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    <div style={{
                      fontSize: '13px',
                      color: COLORS.gray,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{subjectConfig.filterCategories[activeCategory]?.length || 0} filters available</span>
                      {activeFilters.length > 0 && (
                        <button
                          onClick={() => setActiveFilters([])}
                          style={{
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Clear all ({activeFilters.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Number of Questions */}
                <div style={{ marginBottom: '32px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: COLORS.darkGray,
                    marginBottom: '12px'
                  }}>
                    Number of Questions
                  </label>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '12px', color: COLORS.gray }}>1</span>
                    <input
                      type="range"
                      min="1"
                      max={Math.min(availableQuestions, 100)}
                      value={Math.min(packData.totalQuestions, availableQuestions)}
                      onChange={(e) => setPackData(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) }))}
                      disabled={availableQuestions === 0}
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '3px',
                        outline: 'none',
                        background: `linear-gradient(to right, ${COLORS.teal} 0%, ${COLORS.teal} ${(Math.min(packData.totalQuestions, availableQuestions) / Math.min(availableQuestions, 100)) * 100}%, #e5e7eb ${(Math.min(packData.totalQuestions, availableQuestions) / Math.min(availableQuestions, 100)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <span style={{ fontSize: '12px', color: COLORS.gray }}>{Math.min(availableQuestions, 100)}</span>
                    <div style={{
                      backgroundColor: COLORS.teal,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      minWidth: '32px',
                      textAlign: 'center'
                    }}>
                      {packData.totalQuestions}
                    </div>
                  </div>
                  
                  <p style={{
                    fontSize: '13px',
                    color: COLORS.gray,
                    margin: '0'
                  }}>
                    {availableQuestions > 0 
                      ? `${availableQuestions} ${subjectConfig?.displayName} available with current filters`
                      : `No ${subjectConfig?.displayName} match current filters`
                    }
                  </p>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!packData.packName || packData.totalQuestions < 1 || availableQuestions === 0}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    backgroundColor: COLORS.teal,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: packData.packName && packData.totalQuestions >= 1 && availableQuestions > 0 ? 'pointer' : 'not-allowed',
                    opacity: packData.packName && packData.totalQuestions >= 1 && availableQuestions > 0 ? 1 : 0.6,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Next: Select Questions →
                </button>
              </>
            )}

            {/* Step 2: Question Selection */}
            {currentStep === 2 && (
              <>
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 8px 0'
                  }}>
                    Select Questions
                  </h2>
                  <span style={{
                    color: '#0369a1',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Step 2 of 3
                  </span>
                </div>

                <p style={{
                  fontSize: '14px',
                  color: COLORS.gray,
                  marginBottom: '24px'
                }}>
                  Choose {packData.totalQuestions} questions from the filtered results. 
                  Currently selected: <strong>{selectedQuestions.length}/{packData.totalQuestions}</strong>
                </p>

                {loadingQuestions ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid #e5e7eb',
                      borderTop: `3px solid ${COLORS.teal}`,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '16px'
                    }} />
                    <p style={{ color: COLORS.gray, fontSize: '14px' }}>Loading questions...</p>
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    marginBottom: '24px',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none' /* IE and Edge */
                  }}>
                    {/* Hide scrollbar for webkit browsers */}
                    <style jsx>{`
                      div::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    {fetchedQuestions.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '48px',
                        color: COLORS.gray
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
                        <p>No questions found with current filters.</p>
                      </div>
                    ) : (
                      fetchedQuestions.map((question, index) => {
                        const isSelected = selectedQuestions.some(q => q.objectID === question.objectID);
                        
                        return (
                          <div
                            key={question.objectID}
                            onClick={() => toggleQuestionSelection(question)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              padding: '12px',
                              border: isSelected ? `2px solid ${COLORS.teal}` : '1px solid #e5e7eb',
                              borderRadius: '8px',
                              backgroundColor: isSelected ? '#f0f9ff' : COLORS.white,
                              cursor: 'pointer',
                              marginBottom: '8px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{
                              width: '20px',
                              height: '20px',
                              border: '2px solid #d1d5db',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isSelected ? COLORS.teal : COLORS.white,
                              borderColor: isSelected ? COLORS.teal : '#d1d5db',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: '600',
                              flexShrink: 0
                            }}>
                              {isSelected && '✓'}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                marginBottom: '4px'
                              }}>
                                Question {index + 1} • {question.objectID}
                              </div>

                              <div style={{
                                fontSize: '14px',
                                color: '#374151',
                                marginBottom: '8px',
                                lineHeight: '1.4'
                              }}>
                                {getQuestionPreview(question)}
                              </div>

                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px'
                              }}>
                                {packData.subject === 'tsa' && question.question_type && (
                                  <span style={{
                                    backgroundColor: '#ddd6fe',
                                    color: '#7c3aed',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}>
                                    {question.question_type}
                                  </span>
                                )}
                                {packData.subject === 'maths' && question.spec_topic && (
                                  <span style={{
                                    backgroundColor: '#ddd6fe',
                                    color: '#7c3aed',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}>
                                    {question.spec_topic}
                                  </span>
                                )}
                                {question.marks && (
                                  <span style={{
                                    backgroundColor: '#fef3c7',
                                    color: '#d97706',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}>
                                    {question.marks} marks
                                  </span>
                                )}
                                {(question.year || (question.id && packData.subject === 'maths')) && (
                                  <span style={{
                                    backgroundColor: '#dcfce7',
                                    color: '#16a34a',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}>
                                    {question.id && packData.subject === 'maths' ? question.id.split('_')[0] : question.year}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>
                  <button 
                    onClick={prevStep}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      color: COLORS.gray,
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      setPackData(prev => ({
                        ...prev,
                        selectedQuestionIds: selectedQuestions.map(q => q.objectID),
                      }));
                      nextStep();
                    }}
                    disabled={selectedQuestions.length !== packData.totalQuestions}
                    style={{
                      flex: 2,
                      padding: '12px 24px',
                      backgroundColor: COLORS.teal,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: selectedQuestions.length === packData.totalQuestions ? 'pointer' : 'not-allowed',
                      opacity: selectedQuestions.length === packData.totalQuestions ? 1 : 0.6
                    }}
                  >
                    Next: Customize Design → ({selectedQuestions.length}/{packData.totalQuestions})
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Design Customization */}
            {currentStep === 3 && (
              <>
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 8px 0'
                  }}>
                    Design
                  </h2>
                  <span style={{
                    color: '#0369a1',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Step 3 of 3
                  </span>
                </div>

                {/* Color Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: COLORS.darkGray,
                    marginBottom: '12px'
                  }}>
                    Pack Color
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px'
                  }}>
                    {colorOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setPackData(prev => ({ 
                          ...prev, 
                          styling: { ...prev.styling, color: option.color } 
                        }))}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          border: packData.styling.color === option.color ? '3px solid #374151' : '2px solid #e5e7eb',
                          backgroundColor: option.color,
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}
                        title={option.name}
                      >
                        {packData.styling.color === option.color && (
                          <div style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600'
                          }}>
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: COLORS.darkGray,
                    marginBottom: '12px'
                  }}>
                    Font Size: {packData.styling.fontSize}pt
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <span style={{ fontSize: '12px', color: COLORS.gray }}>Small</span>
                    <input
                      type="range"
                      min="10"
                      max="16"
                      value={packData.styling.fontSize}
                      onChange={(e) => setPackData(prev => ({
                        ...prev,
                        styling: { ...prev.styling, fontSize: parseInt(e.target.value) }
                      }))}
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '3px',
                        outline: 'none',
                        background: `linear-gradient(to right, ${COLORS.teal} 0%, ${COLORS.teal} ${((packData.styling.fontSize - 10) / 6) * 100}%, #e5e7eb ${((packData.styling.fontSize - 10) / 6) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <span style={{ fontSize: '12px', color: COLORS.gray }}>Large</span>
                  </div>
                </div>

                {/* Additional Options */}
                <div style={{ marginBottom: '32px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: COLORS.darkGray,
                    marginBottom: '12px'
                  }}>
                    Additional Options
                  </label>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={packData.styling.includeAnswers}
                        onChange={(e) => setPackData(prev => ({
                          ...prev,
                          styling: { ...prev.styling, includeAnswers: e.target.checked }
                        }))}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: COLORS.teal
                        }}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        Include answer key
                      </span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: packData.styling.includeAnswers ? 'pointer' : 'not-allowed',
                      opacity: packData.styling.includeAnswers ? 1 : 0.5
                    }}>
                      <input
                        type="checkbox"
                        checked={packData.styling.separateAnswerSheet}
                        disabled={!packData.styling.includeAnswers}
                        onChange={(e) => setPackData(prev => ({
                          ...prev,
                          styling: { ...prev.styling, separateAnswerSheet: e.target.checked }
                        }))}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: COLORS.teal
                        }}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        Separate answer sheet
                      </span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={packData.styling.showDate}
                        onChange={(e) => setPackData(prev => ({
                          ...prev,
                          styling: { ...prev.styling, showDate: e.target.checked }
                        }))}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: COLORS.teal
                        }}
                      />
                      <span style={{
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        Show current date
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <button 
                    onClick={prevStep}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      color: COLORS.gray,
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>

                  <button
                    onClick={handleDownloadPDF}
                    disabled={generatingPDF || selectedQuestions.length === 0}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: !generatingPDF && selectedQuestions.length > 0 ? 'pointer' : 'not-allowed',
                      opacity: !generatingPDF && selectedQuestions.length > 0 ? 1 : 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {generatingPDF ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        PDF...
                      </>
                    ) : (
                      <>📄 Download PDF</>
                    )}
                  </button>
                  
                  <button
                    onClick={handleCreatePack}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: !loading ? 'pointer' : 'not-allowed',
                      opacity: !loading ? 1 : 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Creating...
                      </>
                    ) : (
                      <>✓ Create Pack</>
                    )}
                  </button>
                </div>

                {/* Success Message */}
                {createdPackId && (
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <p style={{
                      color: '#16a34a',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      fontSize: '14px'
                    }}>
                      🎉 Pack created successfully!
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: '#16a34a',
                      margin: '0 0 16px 0'
                    }}>
                      Pack ID: {createdPackId}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <a 
                        href={`/pack/${createdPackId}`}
                        style={{
                          backgroundColor: '#16a34a',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        📖 View Pack
                      </a>
                      <button
                        onClick={handleDownloadPDF}
                        disabled={generatingPDF}
                        style={{
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          border: 'none',
                          cursor: !generatingPDF ? 'pointer' : 'not-allowed',
                          fontWeight: '500'
                        }}
                      >
                        {generatingPDF ? 'Generating...' : '📄 Download PDF'}
                      </button>
                      <a 
                        href="/profile"
                        style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        📊 My Packs
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '28px',
            position: 'relative'
          }}>
            {/* Ghost icon in top-right corner */}
            <img 
              src={ICONS.ghost} 
              alt="Ghost"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '80px',
                height: '80px'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 8px 0'
              }}>
                Your Question Packs
              </h3>
              <div style={{
                fontSize: '13px',
                color: COLORS.gray
              }}>
                TSA Question - 0 Questions - 03/08/2025
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                by examrizzsearch.com
              </div>
            </div>

            <PDFPreview 
              packData={packData} 
              selectedQuestions={selectedQuestions} 
            />
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${COLORS.teal};
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${COLORS.teal};
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default QuestionPackPage;