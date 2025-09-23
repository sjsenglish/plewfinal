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

// Color palette - Updated to purple theme
const COLORS = {
  lightPurple: '#d4d0ff',
  teal: '#221468', 
  lightTeal: '#e1dfff',
  white: '#ffffff',
  gray: '#9691c4',
  darkGray: '#221468'
};

// Firebase Storage icons
const ICONS = {
  ghost: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fpurple%20ghost.svg?alt=media&token=8f68c264-89dd-4563-8858-07b8f9fd87e0',
  note: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ffile%20icon.svg?alt=media&token=19369fc7-4d0c-499a-ad43-d47372a13b09',
  tsa: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fdino-with-books.svg?alt=media&token=2c2149db-8726-447c-b966-2d010e4b22b0',
  maths: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fdino-with-books.svg?alt=media&token=2c2149db-8726-447c-b966-2d010e4b22b0'
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

// Subject configuration - Korean-English only
const SUBJECTS = {
  'korean-english': {
    index: 'korean-english-question-pairs',
    displayName: '수능영어 문재들',
    description: '다양한 내게 맞는 문제들을 찾아 리딩 레벨을 올려 가 보세요.',
    filterCategories: {
      source: [
        { id: 'past-paper', label: '기출', value: 'source:past-paper' },
        { id: 'similar', label: '유사', value: 'source:similar' },
        { id: 'similar-advanced', label: 'Advanced', value: 'source:similar AND similarLevel:advanced' },
        { id: 'similar-baby', label: '베이비', value: 'source:similar AND similarLevel:baby' },
      ],
      subjectArea: [
        { id: 'natural-sciences', label: '자연 과학', value: 'primarySubjectArea:natural_sciences' },
        { id: 'social-sciences', label: '사회 과학', value: 'primarySubjectArea:social_sciences' },
        { id: 'literature-arts', label: '문학/예술', value: 'primarySubjectArea:literature_arts' },
        { id: 'humanities', label: '인문학', value: 'primarySubjectArea:humanities' },
      ],
      questionSkill: [
        { id: 'main-idea', label: '주제', value: 'questionSkill:main_idea' },
        { id: 'vocabulary-context', label: '빈칸', value: 'questionSkill:vocabulary_context' },
        { id: 'paragraph-ordering', label: '순서', value: 'questionSkill:paragraph_ordering' },
        { id: 'logical-structure', label: '문장 삽입', value: 'questionSkill:logical_structure' },
        { id: 'inference', label: '추론', value: 'questionSkill:inference' },
        { id: 'title-selection', label: '제목', value: 'questionSkill:title_selection' },
        { id: 'tone-attitude', label: '어조', value: 'questionSkill:tone_attitude' },
        { id: 'factual-comprehension', label: '사실 확인', value: 'questionSkill:factual_comprehension' },
      ],
      difficulty: [
        { id: 'low', label: '쉬움', value: 'difficultyLevel:low' },
        { id: 'medium', label: '보통', value: 'difficultyLevel:medium' },
        { id: 'high', label: '어려움', value: 'difficultyLevel:high' },
      ],
      passageType: [
        { id: 'argumentative', label: '논쟁', value: 'passageType:argumentative' },
        { id: 'discursive', label: '담화', value: 'passageType:discursive' },
        { id: 'analytical', label: '분석', value: 'passageType:analytical' },
        { id: 'comprehension', label: '문해', value: 'passageType:comprehension' },
      ],
      vocabularyLevel: [
        { id: 'basic', label: '기초(5200개 이하)', value: 'vocabularyDemand:[* TO 5199]' },
        { id: 'intermediate', label: '중간(5200-5500 개)', value: 'vocabularyDemand:[5200 TO 5500]' },
        { id: 'advanced', label: '고급(5500개 이상)', value: 'vocabularyDemand:[5500 TO *]' },
      ],
    },
    categoryLabels: { 
      year: 'Year',
      subjectArea: 'Subject Area',
      difficulty: 'Difficulty', 
      questionType: 'Question Type',
      level: 'Level'
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
            {/* Korean-English question display */}
            <div style={{ marginBottom: '12px' }}>
              {question.year && (
                <div style={{ 
                  fontSize: `${previewStyles.fontSize - 1}px`,
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  <strong>Year:</strong> {question.year}
                </div>
              )}
              {question.subject_area && (
                <div style={{ 
                  fontSize: `${previewStyles.fontSize - 1}px`,
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  <strong>Subject Area:</strong> {question.subject_area}
                </div>
              )}
              {question.difficulty && (
                <div style={{ 
                  fontSize: `${previewStyles.fontSize - 1}px`,
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  <strong>Difficulty:</strong> {question.difficulty}
                </div>
              )}
              {question.question_type && (
                <div style={{ 
                  fontSize: `${previewStyles.fontSize - 1}px`,
                  color: '#6b7280'
                }}>
                  <strong>Question Type:</strong> {question.question_type}
                </div>
              )}
            </div>

            {/* Korean text */}
            {(question.questionText || question.korean) && (
              <div style={{ 
                fontSize: `${previewStyles.fontSize}px`,
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
                fontFamily: 'Malgun Gothic, Noto Sans KR, serif'
              }}>
                <strong>Korean:</strong> {String(question.questionText || question.korean || '')}
              </div>
            )}

            {/* English text */}
            {(question.actualQuestion || question.english) && (
              <div style={{ 
                fontSize: `${previewStyles.fontSize + 1}px`,
                fontWeight: '500',
                color: '#111827',
                marginBottom: '8px'
              }}>
                <strong>English:</strong> {String(question.actualQuestion || question.english || '')}
              </div>
            )}

            {/* Question text */}
            {question.question && (
              <div style={{ 
                fontSize: `${previewStyles.fontSize + 1}px`,
                fontWeight: '500',
                color: '#111827',
                marginBottom: '12px'
              }}>
                {question.question}
              </div>
            )}

            {/* Options for multiple choice */}
            {(question.answerOptions || question.options) && (question.answerOptions || question.options).length > 0 && (
              <div style={{ marginTop: '12px' }}>
                {(question.answerOptions || question.options).map((option, optIndex) => (
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

            {/* Answer space for fill-in-the-blank or essay questions */}
            {(question.question_type === 'Fill in the Blank' || question.question_type === 'Essay' || question.question_type === 'Translation') && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '20px',
                backgroundColor: '#fafafa',
                minHeight: '60px',
                fontSize: `${previewStyles.fontSize - 1}px`,
                color: '#6b7280',
                fontStyle: 'italic',
                marginTop: '12px'
              }}>
                Answer space
              </div>
            )}

            {/* Answer section */}
            {packData.styling?.includeAnswers && !packData.styling?.separateAnswerSheet && question.answer && (
              <div style={{ 
                padding: previewStyles.answerBoxPadding,
                fontSize: `${previewStyles.fontSize - 1}px`,
                marginTop: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                color: '#16a34a'
              }}>
                <strong>Answer:</strong> {question.answer}
              </div>
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
    subject: 'korean-english',
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
  const [activeCategory, setActiveCategory] = useState('year');
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
  { id: 'teal', color: '#221468', name: 'Purple' },
  { id: 'light-teal', color: '#e1dfff', name: 'Light Purple' },
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

// Get question preview for Korean-English
const getQuestionPreview = (question) => {
  let korean = question.questionText || question.korean || question.korean_text || '';
  let english = question.actualQuestion || question.english || question.english_text || '';
  const questionType = question.question_type || '';
  const subjectArea = question.subject_area || '';
  
  // Handle object values
  if (typeof korean === 'object' && korean !== null) {
    korean = korean.sentence || korean.text || korean.value || '';
  }
  if (typeof english === 'object' && english !== null) {
    english = english.sentence || english.text || english.value || '';
  }
  
  // Convert to strings
  korean = String(korean || '');
  english = String(english || '');
  const questionStr = String(question.question || '');
  
  // Create a meaningful preview
  if (korean && english) {
    return `${korean.substring(0, 30)}... → ${english.substring(0, 30)}...`;
  } else if (korean) {
    return `Korean: ${korean.substring(0, 40)}...`;
  } else if (english) {
    return `English: ${english.substring(0, 40)}...`;
  } else if (questionStr) {
    return questionStr.substring(0, 50) + (questionStr.length > 50 ? '...' : '');
  } else {
    return `${subjectArea || 'Korean-English'} ${questionType || 'Question'}`;
  }
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
      // Validate Korean-English questions have required data
      const invalidQuestions = selectedQuestions.filter((q, index) => {
        if (!q) {
          console.warn(`Question at index ${index} is null/undefined`);
          return true;
        }
        // Check for Korean-English required fields
        if (!q.questionText && !q.korean && !q.actualQuestion && !q.english && !q.question) {
          console.warn(`Korean-English question ${q.objectID || index} missing content`);
          return true;
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
    setActiveCategory('year'); // Default to year for Korean-English
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
        padding: '24px 24px 120px 24px'
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
              내 문제지 제작
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
                    문제지 만들기
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
                    팩 이름
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
                    주제
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
                            src={key === 'korean-english' ? ICONS.tsa : key === 'tsa' ? ICONS.tsa : ICONS.maths}
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
                      질문 필터
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
                    질문 수
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

                <div style={{ marginBottom: '60px' }}>
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
                    다음: 질문 선택 →
                  </button>
                </div>
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
                    질문 선택
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
                                {question.question_type && (
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
                                {question.subject_area && (
                                  <span style={{
                                    backgroundColor: '#e0f2fe',
                                    color: '#0891b2',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}>
                                    {question.subject_area}
                                  </span>
                                )}
                                {question.difficulty && (
                                  <span style={{
                                    backgroundColor: '#fef3c7',
                                    color: '#d97706',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}>
                                    {question.difficulty}
                                  </span>
                                )}
                                {question.level && (
                                  <span style={{
                                    backgroundColor: '#fce7f3',
                                    color: '#be185d',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}>
                                    {question.level}
                                  </span>
                                )}
                                {question.year && (
                                  <span style={{
                                    backgroundColor: '#dcfce7',
                                    color: '#16a34a',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}>
                                    {question.year}
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
                  gap: '12px',
                  marginBottom: '60px'
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
                    다음: 맞춤형 디자인 → ({selectedQuestions.length}/{packData.totalQuestions})
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
                    디자인 하기 
                  </h2>
                  <span style={{
                    color: '#0369a1',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    3단계 중 세번째
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
                    문제지 색상
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
                    글씨 크기: {packData.styling.fontSize}pt
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
                    추가 옵션
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
                        정답지 포함
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
                        별도 답지
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
                        날짜 표시
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '60px'
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
                    ← 돌아 가기
                  </button>

                  {/* Hide PDF button for Korean-English questions */}
                  {packData.subject !== 'korean-english' && (
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
                  )}
                  
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
                      <>✓ 문제지 생성</>
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
                      🎉 문제지가 생성 되었습니다.
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
                        문제지 보기
                      </a>
                      {/* Hide PDF button for Korean-English questions */}
                      {packData.subject !== 'korean-english' && (
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
                      )}
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
                        내 문제지 팩
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
                내 문제지
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
                by plew.co.kr
              </div>
            </div>

            {/* Hide PDF preview for Korean-English questions */}
            {packData.subject !== 'korean-english' && (
              <PDFPreview 
                packData={packData} 
                selectedQuestions={selectedQuestions} 
              />
            )}
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