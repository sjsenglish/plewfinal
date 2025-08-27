import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { userStorage } from '../utils/userStorage';
import { 
  checkGradingEligibility, 
  saveGradedStatement, 
  getActiveStatement,
  getUserStatements 
} from '../services/personalStatementService';
import { generatePersonalStatement } from '../services/openaiService';

// Custom Color Palette
const COLORS = {
  mint: '#d8f0ed',
  darkGreen: '#2a4442',
  lavenderLight: '#e1dfff',
  purpleDark: '#221468',
  lavender: '#d4d0ff',
  teal: '#00ced1',
  mediumGreen: '#5b8f8a',
  mediumPurple: '#9691c4',
  navyBlue: '#1e3a8a',
  lightPurple: '#ccccff',
  pastelAmber: '#fef3c7',
  primary: '#00ced1',
  secondary: '#5b8f8a',
  glassBg: 'rgba(255, 255, 255, 0.95)',
  shadowLight: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowMedium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  shadowLarge: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

// Apple-inspired Typography System
const TYPOGRAPHY = {
  h1: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1.25',
    letterSpacing: '-0.025em'
  },
  h2: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '1.3',
    letterSpacing: '-0.02em'
  },
  h3: {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.35',
    letterSpacing: '-0.01em'
  },
  h4: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '1.4',
    letterSpacing: '-0.005em'
  },
  h5: {
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '1.45'
  },
  h6: {
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.5'
  },
  body: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.55',
    letterSpacing: '0.01em'
  },
  bodySmall: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.6',
    letterSpacing: '0.01em'
  },
  caption: {
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '1.5',
    letterSpacing: '0.02em'
  }
};

const ANIMATIONS = {
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  hover: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  fadeIn: 'opacity 0.5s ease-in-out'
};

// Custom Icons
const ICONS = {
  trophy: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftrophy.svg?alt=media&token=ac0b5d6a-9b79-4cb4-afd2-0fa07f70d443',
  toaster: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Ftoaster.svg?alt=media&token=744ba4bf-336d-4dd2-b2dc-25bd4df85af6',
  ghost: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20white.svg?alt=media&token=599d4414-99cf-4084-858b-5b3512557023',
  bulb: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbulb.svg?alt=media&token=1f21ae0e-764d-4b03-ba1d-f1423329c325',
  bookYellow: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook_yellow.svg?alt=media&token=d951aa02-015d-45eb-9782-9ed989aa549c',
  bookPink: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbook_pink.svg?alt=media&token=eca318d2-2785-4ffe-b806-e15381734a28',
  bagback: 'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fbagback.svg?alt=media&token=65739e08-36db-4810-951c-91641f5d0084'
};

/**
 * Enhanced Personal Statement Builder with intelligent evidence scoring
 * and university-specific statement generation
 */
const EnhancedPersonalStatementBuilder = ({ profile, currentSubjects, universityTargets }) => {
  const [activeSection, setActiveSection] = useState('evidence-picker');
  const [selectedEvidence, setSelectedEvidence] = useState({
    books: [],
    insights: [],
    projects: [],
    activities: [],
    lectures: [],
    moocs: []
  });
  const [generatedStatement, setGeneratedStatement] = useState('');
  const [statementVersion, setStatementVersion] = useState('universal');
  const [wordCount, setWordCount] = useState(0);
  const [scoringAnalysis, setScoringAnalysis] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetUniversity, setTargetUniversity] = useState(null);
  // Personal statement grading feature
  const [userStatement, setUserStatement] = useState('');
  const [userStatementAnalysis, setUserStatementAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showGradingSection, setShowGradingSection] = useState(false);
  

  // Extract all available evidence with enhanced structure
  const supercurricular = profile?.supercurricular || {};
  const highLevelProjects = (supercurricular.highLevel || []).filter(project => project.personalStatement === true);
  const mediumLevelActivities = (supercurricular.mediumLevel || []).filter(activity => activity.personalStatement === true);
  const lowLevelActivities = supercurricular.lowLevel || {};
  const books = (lowLevelActivities.books || []).filter(book => book.personalStatement === true);
  
  // Extract individual engagements from projects as evidence items
  const extractProjectEngagements = (projects, projectLevel) => {
    const engagements = [];
    projects.forEach(project => {
      if (project.engagements && project.engagements.length > 0) {
        project.engagements.forEach(engagement => {
          engagements.push({
            ...engagement,
            // Add project context
            projectName: project.name || project.title,
            projectLevel: projectLevel,
            projectId: project.id,
            // Set proper fields for evidence display
            title: `${engagement.type.charAt(0).toUpperCase() + engagement.type.slice(1)}: ${project.name || project.title}`,
            name: `${engagement.type.charAt(0).toUpperCase() + engagement.type.slice(1)}: ${project.name || project.title}`,
            description: engagement.content,
            content: engagement.content,
            evidence: engagement.content,
            type: 'project-engagement',
            category: engagement.type, // conclusions, arguments, methodology
            evidenceStrength: engagement.evidenceStrength || 7,
            personalStatement: true, // These are already from PS-tagged projects
            // Include parent project properties for statement generation
            researchBased: project.researchBased,
            independent: project.independent || true, // Assume project engagements are independent work
            significant: project.significant || (projectLevel === 'high-level'),
            status: project.status,
            sources: project.sources,
            // For backward compatibility with statement generation
            learningObjectives: project.learningObjectives,
            outcomes: project.outcomes
          });
        });
      }
    });
    return engagements;
  };
  
  // Extract engagements from all project levels
  const highLevelEngagements = extractProjectEngagements(highLevelProjects, 'high-level');
  const mediumLevelEngagements = extractProjectEngagements(mediumLevelActivities, 'medium-level'); 
  const lowLevelEngagements = extractProjectEngagements(
    (lowLevelActivities.activities || []).filter(activity => activity.personalStatement === true), 
    'low-level'
  );
  
  // Combine all project engagements
  const projectEngagements = [...highLevelEngagements, ...mediumLevelEngagements, ...lowLevelEngagements];
  const lectures = lowLevelActivities.lectures || [];
  const moocs = lowLevelActivities.moocs || [];
  // Collect insights from both reading and supercurricular sources (user-specific)
  const readingInsights = userStorage.getItem('userInsights', []);
  const supercurricularInsights = userStorage.getItem('supercurricularInsights', []);
  // Only use insights that have been tagged as evidence
  const profileInsights = (profile?.knowledgeInsights || profile?.insights || [])
    .filter(insight => insight.taggedAsEvidence === true);
  
  // Normalize insight data to handle different formats
  const normalizeInsights = (insights) => {
    return insights.map(insight => {
      // If insight has the new format (from Reading tab)
      if (insight.insight && insight.bookId) {
        const book = books.find(b => b.id === insight.bookId);
        return {
          ...insight,
          concept: insight.concept || (book ? null : 'Book Insight'), // Don't set concept if we have book info
          learning: insight.learning || insight.insight,
          description: insight.description || insight.insight,
          type: insight.type || 'reflective',
          evidenceStrength: insight.evidenceStrength || 6,
          academicLevel: insight.academicLevel || 5
        };
      }
      // If insight has the old format (from other sources)
      return insight;
    });
  };
  
  const insights = normalizeInsights([...readingInsights, ...supercurricularInsights, ...profileInsights]);

  // Initialize with first university target
  useEffect(() => {
    if (universityTargets?.length > 0 && !targetUniversity) {
      setTargetUniversity(universityTargets[0]);
    }
  }, [universityTargets, targetUniversity]);

  // Calculate character count (UCAS limit is 4,000 characters)
  useEffect(() => {
    setWordCount(generatedStatement.length);
  }, [generatedStatement]);


  /**
   * Advanced Evidence Scoring System
   */
  const scoreEvidence = (evidence, type) => {
    let score = 0;
    let breakdown = {
      academicDepth: 0,
      universityRelevance: 0,
      personalEngagement: 0,
      uniqueness: 0,
      evidenceQuality: 0
    };

    // Academic Depth (0-4 points)
    breakdown.academicDepth = assessAcademicDepth(evidence, type);
    score += breakdown.academicDepth;

    // University Relevance (0-3 points)
    breakdown.universityRelevance = assessUniversityRelevance(evidence, type);
    score += breakdown.universityRelevance;

    // Personal Engagement (0-2 points)
    breakdown.personalEngagement = assessPersonalEngagement(evidence, type);
    score += breakdown.personalEngagement;

    // Uniqueness/Distinctiveness (0-1 point)
    breakdown.uniqueness = assessUniqueness(evidence, type);
    score += breakdown.uniqueness;

    // Evidence Quality (0-2 points)
    breakdown.evidenceQuality = assessEvidenceQuality(evidence, type);
    score += breakdown.evidenceQuality;

    // Bonus adjustments for specific combinations
    score += assessBonusFactors(evidence, type, breakdown);

    return {
      score: Math.min(Math.round(score * 10) / 10, 10),
      breakdown,
      recommendation: getScoreRecommendation(score),
      improvementSuggestions: getImprovementSuggestions(evidence, type, breakdown)
    };
  };

  const assessAcademicDepth = (evidence, type) => {
    let depth = 0; // Start from 0 - must earn every point

    switch (type) {
      case 'book':
        // Much harsher book scoring - university level is baseline expectation
        if (evidence.universityLevel || evidence.academic) depth += 1; // Reduced from 2
        if (evidence.beyondCurriculum && evidence.technicalDepth) depth += 1; // Must have both, reduced from 1.5
        if (evidence.complexConcepts && evidence.criticalAnalysis) depth += 0.8; // Requires demonstrated analysis
        if (evidence.authorCredentials === 'academic' && evidence.publishedBy === 'university_press') depth += 0.5; // Must have both
        if (evidence.originalResearch || evidence.seminalWork) depth += 0.7; // Exceptional books only
        
        // Enhanced scoring for books with insights - shows deeper engagement
        if (evidence.insights && evidence.insights.length > 0) {
          depth += 0.5; // Base bonus for having insights
          if (evidence.insights.length >= 2) depth += 0.3; // Multiple insights show sustained engagement
          
          // Quality bonus for substantial insights (check content length as proxy for depth)
          const substantialInsights = evidence.insights.filter(insight => 
            insight.content && insight.content.length > 200
          );
          if (substantialInsights.length > 0) depth += 0.4; // Bonus for detailed reflection
        }
        break;

      case 'insight':
        // Much stricter insight scoring
        if (evidence.type === 'conceptual' && evidence.academicLevel > 8) depth += 1.2; // Raised threshold from 7 to 8
        if (evidence.type === 'connection' && evidence.synthesisLevel > 7) depth += 1; // Raised threshold and reduced score
        if (evidence.type === 'application' && evidence.innovationPotential > 7) depth += 0.8; // Raised threshold and reduced
        if (evidence.intellectualDepth > 8 && evidence.originalThinking) depth += 0.8; // Must demonstrate originality
        if (evidence.evidenceStrength > 8) depth += 0.4; // Raised threshold, reduced score
        if (evidence.interdisciplinary && evidence.synthesisQuality > 7) depth += 0.8; // Bonus for genuine interdisciplinary work
        
        // Study Buddy insights - reward thoughtful AI-assisted learning
        if (evidence.type === 'full_response') {
          // Base academic depth for engaging with AI tutor on academic concepts
          depth += 0.6;
          
          // Bonus for substantial content (proxy for depth of discussion)
          const contentLength = (evidence.evidence || evidence.content || evidence.description || '').length;
          if (contentLength > 300) depth += 0.4; // Substantial discussion
          if (contentLength > 500) depth += 0.3; // Very detailed exploration
          
          // Academic keywords suggest deeper intellectual engagement
          const academicKeywords = ['theory', 'concept', 'principle', 'framework', 'analysis', 'hypothesis', 'methodology', 'critique'];
          const content = (evidence.evidence || evidence.content || evidence.description || '').toLowerCase();
          const academicMatches = academicKeywords.filter(keyword => content.includes(keyword)).length;
          if (academicMatches >= 2) depth += 0.4;
          if (academicMatches >= 4) depth += 0.3;
          
          // Original thoughtful question shows intellectual curiosity
          if (evidence.originalThought && evidence.originalThought.length > 30) {
            depth += 0.3;
          }
        }
        break;

      case 'project':
        // Stricter project scoring - independent research is baseline
        if (evidence.researchBased && evidence.independent && evidence.significantScope) depth += 1.5; // Must have all three
        if (evidence.methodologyRigorous && evidence.validatedApproach) depth += 1; // Must demonstrate rigor
        if (evidence.resultsSignificant && evidence.measurableImpact) depth += 1; // Must show real impact
        if (evidence.peerReviewed || evidence.published || evidence.presentedAtConference) depth += 0.8;
        if (evidence.originalContribution) depth += 0.7; // Exceptional projects only
        break;

      case 'activity':
        // Much stricter activity scoring
        if (evidence.leadershipRole && evidence.demonstratedImpact) depth += 1; // Must show real impact, not just title
        if (evidence.impactMeasurable && evidence.sustainableChange) depth += 0.8; // Must demonstrate lasting change
        if (evidence.skillsDeveloped?.length > 4 && evidence.skillsApplied) depth += 0.6; // Must apply skills, not just develop
        if (evidence.recognition && evidence.competitiveSelection) depth += 0.6; // Must be genuinely competitive
        if (evidence.nationalLevel || evidence.internationalLevel) depth += 0.5; // Exceptional scope only
        break;
    }

    return Math.min(depth, 4);
  };

  const assessUniversityRelevance = (evidence, type) => {
    let relevance = 0; // Start from 0 - must demonstrate clear relevance

    if (!targetUniversity) return 0.5; // Reduced default relevance

    const course = targetUniversity.course?.toLowerCase() || '';
    const university = targetUniversity.name?.toLowerCase() || '';

    // Course-specific relevance - much stricter
    if (evidence.subjectArea?.toLowerCase().includes(course) &&
        evidence.courseConnection && evidence.relevantTo?.includes(course)) {
      relevance += 1.5; // Reduced from 2, must show explicit connection
    } else if (evidence.subjectArea?.toLowerCase().includes(course)) {
      relevance += 0.8; // Partial relevance only
    }

    // University-specific preferences - stricter requirements
    if (isOxbridge(university)) {
      // Oxbridge demands exceptional intellectual depth
      if (evidence.independentThinking && evidence.originalIdeas && evidence.intellectualRigor) relevance += 0.8;
      if (evidence.academicReading && evidence.beyondSyllabus && evidence.criticalEngagement) relevance += 0.4;
      if (evidence.tutorialSystemRelevance || evidence.dialecticalThinking) relevance += 0.3;
    } else if (isRussellGroup(university)) {
      // Russell Group requires demonstrated research aptitude
      if (evidence.researchSkills && evidence.analyticalThinking && evidence.empiricalEvidence) relevance += 0.6;
      if (evidence.practicalApplication && evidence.realWorldImpact) relevance += 0.4;
    } else {
      // Other universities - moderate standards
      if (evidence.practicalSkills || evidence.appliedKnowledge) relevance += 0.3;
    }

    // Course-specific bonuses - reduced
    relevance += getCourseSpecificRelevance(evidence, course) * 0.6; // Reduced impact

    return Math.min(relevance, 3);
  };

  const assessPersonalEngagement = (evidence, type) => {
    let engagement = 0; // Must demonstrate genuine personal investment

    // Look for authentic personal passion indicators - stricter requirements
    if (evidence.personalPassion && evidence.sustainedCommitment && evidence.personalSacrifice) engagement += 0.8; // Must show all three
    if (evidence.emotionalConnection && evidence.articulatedImpact) engagement += 0.4; // Must articulate the connection
    if (evidence.personalGrowth && evidence.transformativeExperience && evidence.behaviorChange) engagement += 0.6; // Must show actual change
    if (evidence.continuedPursuit && evidence.deepDive && evidence.progressiveComplexity) engagement += 0.4; // Must show progression

    // Type-specific engagement - much stricter
    if (type === 'insight') {
      if (evidence.type === 'reflective' && evidence.personalGrowth > 7 && evidence.selfAwareness > 7) engagement += 0.4;
      if (evidence.personalEngagement > 8 && evidence.emotionalIntelligence > 7) engagement += 0.4;
    }
    
    // Book-specific engagement - insights demonstrate genuine intellectual engagement
    if (type === 'book') {
      if (evidence.insights && evidence.insights.length > 0) {
        engagement += 0.3; // Base engagement for having insights
        
        // Higher engagement for multiple insights showing sustained thought
        if (evidence.insights.length >= 2) engagement += 0.2;
        
        // Quality engagement bonus - substantial insights show deep thinking
        const deepInsights = evidence.insights.filter(insight => 
          insight.content && insight.content.length > 150
        );
        if (deepInsights.length > 0) engagement += 0.3;
        
        // Personal reflection keywords suggest authentic engagement
        const personalKeywords = ['realize', 'understand', 'perspective', 'changed', 'thought', 'reflection'];
        const hasPersonalReflection = evidence.insights.some(insight =>
          personalKeywords.some(keyword => insight.content?.toLowerCase().includes(keyword))
        );
        if (hasPersonalReflection) engagement += 0.2;
      }
    }

    // Study Buddy insights - reward proactive learning through AI interaction
    if (evidence.type === 'full_response') {
      // Base engagement for proactive learning with AI tutor
      engagement += 0.4;
      
      // Bonus for asking thoughtful original questions
      if (evidence.originalThought && evidence.originalThought.length > 50) {
        engagement += 0.3;
      }
      
      // Personal curiosity keywords suggest genuine intellectual interest
      const curiosityKeywords = ['understand', 'explore', 'learn', 'discover', 'insight', 'realize', 'question'];
      const originalText = (evidence.originalThought || '').toLowerCase();
      const curiosityMatches = curiosityKeywords.filter(keyword => originalText.includes(keyword)).length;
      if (curiosityMatches >= 2) engagement += 0.2;
      
      // Detailed follow-up questions show sustained engagement
      const contentText = evidence.evidence || evidence.content || evidence.description || '';
      if (contentText && contentText.includes('explore') && contentText.includes('example')) {
        engagement += 0.3;
      }
    }

    // Penalty for generic or superficial engagement
    if (evidence.genericPassion || evidence.superficialConnection) engagement -= 0.3;

    return Math.max(0, Math.min(engagement, 2));
  };

  const assessUniqueness = (evidence, type) => {
    let uniqueness = 0;

    // Check against common activities/books/insights
    if (isUncommonEvidence(evidence, type)) uniqueness += 0.5;
    if (evidence.originalPerspective || evidence.uniqueApproach) uniqueness += 0.5;

    return Math.min(uniqueness, 1);
  };

  const assessEvidenceQuality = (evidence, type) => {
    let quality = 0; // Must provide substantial evidence

    // Specificity and detail - much stricter requirements
    if (evidence.specificExamples && evidence.concreteDetails && evidence.contextualizedExamples) quality += 0.8; // Must have all three
    if (evidence.measurableOutcomes && evidence.quantifiableResults && evidence.statisticalSignificance) quality += 0.6; // Must show significance
    if (evidence.verifiable && evidence.documented && evidence.thirdPartyValidation) quality += 0.4; // Must have external validation
    if (evidence.primarySources || evidence.originalData) quality += 0.3; // Bonus for primary evidence
    if (evidence.professionalStandard || evidence.academicRigor) quality += 0.3; // Must meet professional standards

    // Penalty for weak evidence
    if (evidence.anecdotalOnly || evidence.unsubstantiated || evidence.vague) quality -= 0.4;

    return Math.max(0, Math.min(quality, 2));
  };

  const assessBonusFactors = (evidence, type, breakdown) => {
    let bonus = 0;

    // Exceptional combinations - much stricter thresholds
    if (breakdown.academicDepth > 3.5 && breakdown.universityRelevance > 2.5 && evidence.exceptionalQuality) bonus += 0.3; // Reduced bonus
    if (breakdown.personalEngagement > 1.8 && breakdown.evidenceQuality > 1.8 && evidence.authenticPassion) bonus += 0.2; // Much higher thresholds

    // Interdisciplinary connections - must be genuine and sophisticated
    if (evidence.interdisciplinary && evidence.crossCurricular && evidence.synthesisQuality > 7) bonus += 0.2; // Reduced bonus
    if (evidence.innovativeApproach && evidence.originalPerspective) bonus += 0.2;
    if (evidence.internationalPerspective || evidence.culturalSynthesis) bonus += 0.1;

    // Penalty for common/expected combinations
    if (evidence.predictableCombination || evidence.standardApproach) bonus -= 0.2;

    return bonus;
  };

  const getCourseSpecificRelevance = (evidence, course) => {
    const courseRelevanceMap = {
      'economics': {
        keywords: ['market', 'policy', 'data analysis', 'economic theory', 'behavioral'],
        bonus: 0.5
      },
      'medicine': {
        keywords: ['research', 'care', 'ethics', 'scientific method', 'patient'],
        bonus: 0.5
      },
      'engineering': {
        keywords: ['problem solving', 'design', 'technical', 'innovation', 'systems'],
        bonus: 0.5
      },
      'computer science': {
        keywords: ['programming', 'algorithm', 'computational', 'software', 'data'],
        bonus: 0.5
      }
    };

    for (const [courseKey, config] of Object.entries(courseRelevanceMap)) {
      if (course.includes(courseKey)) {
        const evidenceText = `${evidence.description || ''} ${evidence.learning || ''} ${evidence.reflection || ''}`.toLowerCase();
        if (config.keywords.some(keyword => evidenceText.includes(keyword))) {
          return config.bonus;
        }
      }
    }

    return 0;
  };

  const isOxbridge = (university) => {
    return university.includes('oxford') || university.includes('cambridge');
  };

  const isRussellGroup = (university) => {
    const russellGroup = [
      'imperial', 'ucl', 'lse', 'edinburgh', 'manchester', 'warwick',
      'bristol', 'nottingham', 'birmingham', 'leeds', 'sheffield'
    ];
    return russellGroup.some(uni => university.includes(uni));
  };

  const isUncommonEvidence = (evidence, type) => {
    // Define common evidence to penalize
    const commonEvidence = {
      books: ['thinking fast and slow', 'freakonomics', 'brief history of time'],
      activities: ['duke of edinburgh', 'young enterprise', 'charity walk'],
      projects: ['extended project qualification']
    };

    if (type === 'book' && commonEvidence.books.some(common => 
      evidence.title?.toLowerCase().includes(common))) {
      return false;
    }

    return true;
  };

  const getScoreRecommendation = (score) => {
    if (score >= 8.5) return 'Exceptional - Rare quality evidence';
    if (score >= 7.5) return 'Strong - Competitive standard';
    if (score >= 6.5) return 'Good - Above average but common';
    if (score >= 5.5) return 'Adequate - Meets minimum requirements';
    if (score >= 4.5) return 'Weak - Below university expectations';
    if (score >= 3.5) return 'Poor - Significant improvement needed';
    return 'Inadequate - Avoid in personal statement';
  };

  const getImprovementSuggestions = (evidence, type, breakdown) => {
    const suggestions = [];

    if (breakdown.academicDepth < 2) {
      suggestions.push('Add more technical detail or academic context');
    }
    if (breakdown.universityRelevance < 2) {
      suggestions.push('Emphasize connection to your target course');
    }
    if (breakdown.personalEngagement < 1) {
      suggestions.push('Include personal reflection on impact/learning');
    }
    if (breakdown.evidenceQuality < 1) {
      suggestions.push('Provide specific examples and measurable outcomes');
    }

    return suggestions;
  };

  /**
   * University-Specific Statement Generation
   */
  const handleGenerateStatement = async () => {
    setIsGenerating(true);

    try {
      const selectedBooks = books.filter(book => selectedEvidence.books.includes(book.title || book.id));
      const selectedInsights = insights.filter((insight, idx) => 
        selectedEvidence.insights.includes(idx) || 
        selectedEvidence.insights.includes(insight.id)
      );
      const selectedProjects = projectEngagements.filter(engagement => 
        selectedEvidence.projects.includes(engagement.name || engagement.id)
      );

      // Prepare refined insights for backend API
      const refinedInsights = [];
      
      // Add book insights
      selectedBooks.forEach(book => {
        if (book.insights && book.insights.length > 0) {
          book.insights.forEach(insight => {
            refinedInsights.push({
              concept: book.title,
              originalThought: `Basic understanding of ${book.title}`,
              refinedVersion: insight,
              type: 'book',
              source: book.title
            });
          });
        }
      });

      // Add knowledge insights
      selectedInsights.forEach(insight => {
        refinedInsights.push({
          concept: insight.concept || insight.title || 'Academic Insight',
          originalThought: insight.learning || insight.content || 'Initial understanding',
          refinedVersion: insight.evidence || insight.description || insight.content,
          type: insight.type || 'insight',
          source: insight.source || 'Study'
        });
      });

      // Add project engagements
      selectedProjects.forEach(project => {
        refinedInsights.push({
          concept: project.title || project.name,
          originalThought: `Basic engagement with ${project.title || project.name}`,
          refinedVersion: project.evidence || project.content || project.description,
          type: 'project',
          source: project.projectLevel || 'Project'
        });
      });

      if (refinedInsights.length === 0) {
        alert('Please select at least one piece of evidence to generate your personal statement');
        setIsGenerating(false);
        return;
      }

      // Generate statement using backend API
      const result = await generatePersonalStatement(refinedInsights);
      
      if (result.success) {
        setGeneratedStatement(result.statement);
        
        // Enhanced scoring analysis using the same data
        const scoring = analyzeStatementAdvanced(result.statement, selectedBooks, selectedInsights, selectedProjects);
        setScoringAnalysis(scoring);
      } else {
        console.error('Failed to generate statement:', result.error);
        alert(`Failed to generate statement: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating personal statement:', error);
      alert(`Error generating statement: ${error.message}`);
    }

    setIsGenerating(false);
  };

  // Function to analyze user-provided personal statement
  const analyzeUserStatement = () => {
    if (!userStatement.trim()) return;
    
    setIsAnalyzing(true);
    
    // Get selected evidence for analysis (same logic as in generatePersonalStatement)
    const selectedBooks = books.filter(book => selectedEvidence.books.includes(book.title || book.id));
    const selectedInsights = insights.filter((insight, idx) => 
      selectedEvidence.insights.includes(idx) || 
      selectedEvidence.insights.includes(insight.id)
    );
    const selectedProjects = projectEngagements.filter(engagement => 
      selectedEvidence.projects.includes(engagement.name || engagement.id)
    );
    
    // Use the existing advanced analysis function
    const analysis = analyzeStatementAdvanced(userStatement, selectedBooks, selectedInsights, selectedProjects);
    setUserStatementAnalysis(analysis);
    
    setIsAnalyzing(false);
  };

  const generateUniversitySpecificStatement = (books, insights, projects, university) => {
    if (!university) return generateGenericStatement(books, insights, projects);

    const course = university.course?.toLowerCase() || 'this field';
    const uniName = university.name || 'university';
    const isOxbridgeTarget = isOxbridge(uniName.toLowerCase());

    // Get course-specific generation strategy
    const strategy = getCourseStrategy(course);
    
    let statement = '';

    // Opening - course-specific hook
    statement += generateCourseSpecificOpening(course, books, insights, strategy);
    statement += '\n\n';

    // Academic development paragraph
    statement += generateAcademicDevelopmentParagraph(books, insights, course, strategy, isOxbridgeTarget);
    statement += '\n\n';

    // Practical engagement paragraph
    statement += generatePracticalEngagementParagraph(projects, course, strategy);
    statement += '\n\n';

    // University-specific conclusion
    statement += generateUniversitySpecificConclusion(university, course, strategy, isOxbridgeTarget);

    return statement;
  };

  const getCourseStrategy = (course) => {
    const strategies = {
      economics: {
        pattern: 'conceptual_trigger', // Abstract concept → Real-world → Academic → Mathematical
        openingType: 'abstract_discovery',
        progression: ['trigger_concept', 'real_world_connection', 'academic_exploration', 'mathematical_depth', 'policy_implications'],
        intellectualMarkers: ['theoretical frameworks', 'empirical evidence', 'mathematical optimization', 'policy debates'],
        avoidPhrases: ['passion for', 'always interested', 'fascinated by', 'love of']
      },
      medicine: {
        pattern: 'experiential_shock', // Experience → Scientific wonder → Deep-dive → Research
        openingType: 'experiential_moment',
        progression: ['human_concern', 'scientific_investigation', 'research_methodology', 'clinical_application', 'ethical_considerations'],
        intellectualMarkers: ['cellular mechanisms', 'pathophysiology', 'evidence-based practice', 'clinical reasoning'],
        avoidPhrases: ['helping people', 'making a difference', 'caring nature', 'always wanted']
      },
      engineering: {
        pattern: 'fictional_inspiration', // Fiction → Technical analysis → Design philosophy → Application
        openingType: 'imaginative_spark',
        progression: ['fictional_inspiration', 'technical_analysis', 'design_philosophy', 'hands_on_application', 'innovation_potential'],
        intellectualMarkers: ['design constraints', 'optimization theory', 'systems thinking', 'iterative design'],
        avoidPhrases: ['problem solver', 'love building', 'creative person', 'enjoy challenges']
      },
      biochemistry: {
        pattern: 'experiential_shock',
        openingType: 'scientific_wonder',
        progression: ['experiential_trigger', 'cellular_wonder', 'academic_deepdive', 'research_methodology', 'therapeutic_applications'],
        intellectualMarkers: ['molecular mechanisms', 'metabolic pathways', 'protein folding', 'enzymatic kinetics'],
        avoidPhrases: ['fascination with life', 'wonder of biology', 'complexity of life', 'always curious']
      },
      physics: {
        pattern: 'conceptual_trigger',
        openingType: 'conceptual_revelation',
        progression: ['conceptual_trigger', 'mathematical_beauty', 'experimental_validation', 'theoretical_depth', 'frontier_questions'],
        intellectualMarkers: ['quantum mechanics', 'relativity', 'field theory', 'mathematical formalism'],
        avoidPhrases: ['love of math', 'understanding universe', 'always questioned', 'natural curiosity']
      },
      'computer science': {
        pattern: 'technical_discovery',
        openingType: 'algorithmic_insight',
        progression: ['algorithmic_discovery', 'computational_thinking', 'system_architecture', 'implementation_challenges', 'innovation_potential'],
        intellectualMarkers: ['complexity theory', 'data structures', 'algorithmic efficiency', 'distributed systems'],
        avoidPhrases: ['love coding', 'tech enthusiast', 'problem solver', 'digital native']
      }
    };

    for (const [courseKey, strategy] of Object.entries(strategies)) {
      if (course.includes(courseKey)) {
        return strategy;
      }
    }

    // Default strategy
    return {
      openingFocus: 'intellectual curiosity and academic passion',
      academicEmphasis: 'theoretical understanding and critical thinking',
      practicalFocus: 'practical application and skill development',
      conclusionTheme: 'contributing to knowledge and understanding in the field'
    };
  };

  const generateCourseSpecificOpening = (course, books, insights, strategy) => {
    // NO generic fallbacks - generate specific content based on subject pattern
    
    if (strategy.pattern === 'conceptual_trigger') {
      return generateConceptualTriggerOpening(course, books, insights);
    } else if (strategy.pattern === 'experiential_shock') {
      return generateExperientialShockOpening(course, books, insights);
    } else if (strategy.pattern === 'fictional_inspiration') {
      return generateFictionalInspirationOpening(course, books, insights);
    } else if (strategy.pattern === 'technical_discovery') {
      return generateTechnicalDiscoveryOpening(course, books, insights);
    }
    
    // If no pattern matches, use most sophisticated evidence available
    return generateEvidenceBasedOpening(course, books, insights);
  };

  const generateConceptualTriggerOpening = (course, books, insights) => {
    // Economics/Physics style: Abstract concept that sparked genuine curiosity
    const conceptualInsight = insights.find(i => 
      i.type === 'conceptual' && i.concept && 
      (i.learning?.includes('discovered') || i.learning?.includes('realized') || i.learning?.includes('understood'))
    );
    
    if (conceptualInsight) {
      const trigger = conceptualInsight.learning || `The concept of ${conceptualInsight.concept}`;
      const connection = conceptualInsight.connection || conceptualInsight.application;
      
      if (course.includes('economics')) {
        return `I was first introduced to ${conceptualInsight.concept || 'hyperinflation'} whilst ${connection || 'studying historical monetary crises'}. ${trigger} immediately intrigued me, particularly its implications for ${conceptualInsight.application || 'modern monetary policy and quantitative easing debates'}.`;
      } else if (course.includes('physics')) {
        return `${trigger} fundamentally altered my understanding of ${connection || 'physical reality'}. The mathematical elegance of ${conceptualInsight.concept || 'the principle'} revealed how ${conceptualInsight.significance || 'abstract mathematics can describe concrete phenomena with extraordinary precision'}.`;
      }
    }
    
    // Fallback to book-based conceptual opening
    const conceptualBook = books.find(b => b.insights?.some(i => i.includes('concept') || i.includes('theory')));
    if (conceptualBook) {
      return `Reading '${conceptualBook.title}' introduced me to ${conceptualBook.insights[0] || 'fundamental theoretical frameworks'}. This conceptual foundation prompted deeper investigation into ${course}'s theoretical underpinnings.`;
    }
    
    return null;
  };

  const generateExperientialShockOpening = (course, books, insights) => {
    // Medicine/Biochemistry style: Personal experience revealing scientific wonder
    const experientialInsight = insights.find(i => 
      i.type === 'reflective' && 
      (i.learning?.includes('witnessed') || i.learning?.includes('experienced') || i.learning?.includes('observed'))
    );
    
    if (experientialInsight) {
      const experience = experientialInsight.learning;
      const impact = experientialInsight.impact || experientialInsight.personalGrowth;
      
      if (course.includes('medicine')) {
        return `${experience}. This experience drove me to understand the underlying pathophysiology, particularly ${experientialInsight.specificFocus || 'the cellular mechanisms involved'}. What struck me most was ${experientialInsight.significance || 'the intricate relationship between molecular processes and clinical manifestations'}.`;
      } else if (course.includes('biochem')) {
        return `${experience} revealed the extraordinary complexity of ${experientialInsight.concept || 'cellular processes'}. This prompted intensive study of ${experientialInsight.specificFocus || 'the biochemical pathways'} underlying what I had observed, transforming abstract molecular biology into tangible understanding.`;
      }
    }
    
    return null;
  };

  const generateFictionalInspirationOpening = (course, books, insights) => {
    // Engineering style: Fiction/imagination revealing technical interest
    const fictionBook = books.find(b => 
      b.genre === 'fiction' || b.title?.toLowerCase().includes('martian') || 
      b.insights?.some(i => i.includes('technical') || i.includes('engineering'))
    );
    
    if (fictionBook) {
      const technicalAspect = fictionBook.insights?.find(i => i.includes('technical')) || 'the technical problem-solving';
      return `Reading '${fictionBook.title}' is where my interest in ${course} began to grow. ${technicalAspect} demonstrated how ${course.includes('engineering') ? 'creative engineering solutions emerge from systematic analysis of constraints' : 'technical innovation requires both theoretical knowledge and practical ingenuity'}.`;
    }
    
    const applicationInsight = insights.find(i => i.type === 'application' && i.practicalImplementation);
    if (applicationInsight) {
      return `${applicationInsight.learning || 'Discovering how theoretical principles translate into practical solutions'} revealed the creative problem-solving at the heart of ${course}. This realization prompted systematic exploration of ${applicationInsight.application || 'design methodologies and implementation strategies'}.`;
    }
    
    return null;
  };

  const generateTechnicalDiscoveryOpening = (course, books, insights) => {
    // Computer Science style: Technical discovery leading to deeper exploration
    const technicalInsight = insights.find(i => 
      i.type === 'application' && i.technicalDepth && 
      (i.learning?.includes('discovered') || i.learning?.includes('implemented') || i.learning?.includes('developed'))
    );
    
    if (technicalInsight) {
      return `${technicalInsight.learning}. The elegance of ${technicalInsight.concept || 'the algorithmic solution'} demonstrated how ${course} combines mathematical rigor with creative problem-solving. This discovery prompted exploration of ${technicalInsight.application || 'more complex computational challenges'}.`;
    }
    
    return null;
  };

  const generateEvidenceBasedOpening = (course, books, insights) => {
    // Last resort: Use best available evidence with sophisticated framing
    const bestInsight = insights.sort((a, b) => 
      (b.evidenceStrength || 0) + (b.academicLevel || 0) - (a.evidenceStrength || 0) - (a.academicLevel || 0)
    )[0];
    
    if (bestInsight && bestInsight.learning) {
      return `${bestInsight.learning}. This ${bestInsight.type || 'insight'} revealed ${bestInsight.significance || `fundamental principles underlying ${course}`}, prompting systematic investigation of ${bestInsight.application || 'related theoretical frameworks'}.`;
    }
    
    return null;
  };

  const generateAcademicDevelopmentParagraph = (books, insights, course, strategy, isOxbridge) => {
    // Build intellectual chain following subject-specific progression
    return generateIntellectualChain(books, insights, course, strategy);
  };

  const generateIntellectualChain = (books, insights, course, strategy) => {
    const progression = strategy.progression || [];
    let narrative = '';
    
    // Map evidence to progression stages
    const stageEvidence = mapEvidenceToStages(books, insights, progression);
    
    // Generate flowing narrative through stages
    progression.forEach((stage, index) => {
      const evidence = stageEvidence[stage];
      if (evidence && evidence.length > 0) {
        if (index === 0) {
          // First stage continues from opening
          narrative += generateStageContent(stage, evidence[0], course, true);
        } else {
          // Subsequent stages with transitions
          narrative += generateStageTransition(stage, evidence[0], progression[index-1], course);
        }
        narrative += ' ';
      }
    });
    
    return narrative || generateEvidenceChain(books, insights, course);
  };

  const mapEvidenceToStages = (books, insights, progression) => {
    const stageEvidence = {};
    
    progression.forEach(stage => {
      stageEvidence[stage] = [];
      
      // Map books to stages
      books.forEach(book => {
        if (matchesStage(book, stage)) {
          stageEvidence[stage].push({ type: 'book', data: book });
        }
      });
      
      // Map insights to stages
      insights.forEach(insight => {
        if (matchesInsightToStage(insight, stage)) {
          stageEvidence[stage].push({ type: 'insight', data: insight });
        }
      });
    });
    
    return stageEvidence;
  };

  const matchesStage = (book, stage) => {
    const stageKeywords = {
      'trigger_concept': ['theory', 'concept', 'principle', 'framework'],
      'real_world_connection': ['application', 'case study', 'empirical', 'data'],
      'academic_exploration': ['research', 'academic', 'scholarly', 'university'],
      'mathematical_depth': ['mathematical', 'quantitative', 'statistical', 'model'],
      'policy_implications': ['policy', 'regulation', 'governance', 'implementation'],
      'human_concern': ['patient', 'clinical', 'human', 'care'],
      'scientific_investigation': ['research', 'mechanism', 'molecular', 'cellular'],
      'technical_analysis': ['technical', 'engineering', 'design', 'system'],
      'design_philosophy': ['philosophy', 'approach', 'methodology', 'principles'],
      'hands_on_application': ['practical', 'built', 'implemented', 'created']
    };
    
    const keywords = stageKeywords[stage] || [];
    const bookText = `${book.title} ${book.description || ''} ${book.insights?.join(' ') || ''}`.toLowerCase();
    
    return keywords.some(keyword => bookText.includes(keyword));
  };

  const matchesInsightToStage = (insight, stage) => {
    const stageTypes = {
      'trigger_concept': ['conceptual'],
      'real_world_connection': ['connection', 'application'],
      'academic_exploration': ['conceptual', 'connection'],
      'mathematical_depth': ['application'],
      'scientific_investigation': ['conceptual', 'connection'],
      'technical_analysis': ['application'],
      'design_philosophy': ['reflective'],
      'hands_on_application': ['application']
    };
    
    const types = stageTypes[stage] || [];
    return types.includes(insight.type);
  };

  const generateStageContent = (stage, evidence, course, isFirst) => {
    if (evidence.type === 'book') {
      return generateBookStageContent(stage, evidence.data, course, isFirst);
    } else if (evidence.type === 'insight') {
      return generateInsightStageContent(stage, evidence.data, course, isFirst);
    }
    return '';
  };

  const generateBookStageContent = (stage, book, course, isFirst) => {
    const stageFraming = {
      'real_world_connection': `'${book.title}' examined`,
      'academic_exploration': `To deepen my understanding, I turned to '${book.title}', which`,
      'mathematical_depth': `'${book.title}' provided the mathematical framework, demonstrating`,
      'technical_analysis': `'${book.title}' revealed`,
      'design_philosophy': `This led me to '${book.title}', where`
    };
    
    const framing = stageFraming[stage] || `'${book.title}'`;
    const insight = book.insights?.[0] || `provided crucial understanding of ${stage.replace(/_/g, ' ')}`;
    
    return `${framing} ${insight}.`;
  };

  const generateInsightStageContent = (stage, insight, course, isFirst) => {
    if (insight.learning) {
      return `${isFirst ? 'This led me to discover that' : ''} ${insight.learning}.`;
    }
    return '';
  };

  const generateStageTransition = (currentStage, evidence, previousStage, course) => {
    const transitions = {
      'real_world_connection': 'This theoretical understanding prompted examination of',
      'academic_exploration': 'Seeking deeper comprehension, I explored',
      'mathematical_depth': 'The mathematical foundations revealed through',
      'technical_analysis': 'This sparked investigation into',
      'design_philosophy': 'These technical insights led to exploring',
      'hands_on_application': 'To test these principles practically, I',
      'scientific_investigation': 'This experience drove systematic investigation of',
      'research_methodology': 'Building on this foundation, I examined'
    };
    
    const transition = transitions[currentStage] || 'This led to';
    return `${transition} ${generateStageContent(currentStage, evidence, course, false)}`;
  };

  const generateEvidenceChain = (books, insights, course) => {
    // Fallback: Create intellectual progression from best available evidence
    let chain = '';
    
    const bestBook = books.find(b => b.universityLevel || b.academic) || books[0];
    const bestInsight = insights.find(i => i.evidenceStrength >= 7) || insights[0];
    
    if (bestBook) {
      chain += `Reading '${bestBook.title}' ${bestBook.insights?.[0] || 'provided foundational understanding'}. `;
    }
    
    if (bestInsight && bestInsight.learning) {
      chain += `This led to the realization that ${bestInsight.learning}. `;
    }
    
    const connectionInsight = insights.find(i => i.type === 'connection');
    if (connectionInsight) {
      chain += `${connectionInsight.connection || 'These connections'} demonstrated the interconnected nature of ${course}.`;
    }
    
    return chain;
  };

  const generatePracticalEngagementParagraph = (projects, course, strategy) => {
    // Demonstrate skills through subject-appropriate examples, not generic claims
    return demonstrateSkillsThroughProjects(projects, course, strategy);
  };

  const demonstrateSkillsThroughProjects = (projects, course, strategy) => {
    if (projects.length === 0) {
      return generateSkillDemonstrationWithoutProjects(course, strategy);
    }

    const bestProject = projects.find(p => 
      p.evidence?.length > 0 && (p.researchBased || p.independent || p.significant)
    ) || projects[0];
    
    // Generate subject-specific skill demonstration
    if (course.includes('economics')) {
      return demonstrateEconomicsSkills(bestProject);
    } else if (course.includes('engineering')) {
      return demonstrateEngineeringSkills(bestProject);
    } else if (course.includes('medicine') || course.includes('biochem')) {
      return demonstrateBiomedicalSkills(bestProject);
    } else if (course.includes('computer')) {
      return demonstrateComputerScienceSkills(bestProject);
    } else if (course.includes('physics')) {
      return demonstratePhysicsSkills(bestProject);
    }
    
    return demonstrateGeneralAcademicSkills(bestProject, course);
  };

  const demonstrateEconomicsSkills = (project) => {
    // Show: Analytical thinking, Mathematical modeling, Policy analysis
    const description = project.description || 'analyzing economic trends';
    const methodology = project.methodology || 'econometric analysis';
    const finding = project.outcome || project.impact || 'revealing unexpected correlations';
    
    return `${project.name || 'My investigation into'} ${description} required ${methodology}. ` +
           `Through examining ${project.data || 'multiple datasets and theoretical models'}, I discovered that ` +
           `${finding}. This finding revealed how theoretical frameworks must be tested against empirical evidence, ` +
           `demonstrating the iterative relationship between economic theory and real-world data.`;
  };

  const demonstrateEngineeringSkills = (project) => {
    // Show: Problem-solving, Design thinking, Technical implementation
    const challenge = project.description || 'a complex design challenge';
    const approach = project.methodology || 'iterative prototyping and testing';
    const outcome = project.outcome || 'an innovative solution';
    
    return `${project.name || 'Developing'} ${challenge} challenged me to balance multiple design constraints. ` +
           `I approached this through ${approach}, which revealed that optimal solutions often require creative compromise ` +
           `between theoretical ideals and practical limitations. The ${outcome} demonstrated the iterative nature of ` +
           `engineering problem-solving, where each iteration refined both the solution and my understanding of the problem space.`;
  };

  const demonstrateBiomedicalSkills = (project) => {
    // Show: Scientific method, Research analysis, Critical evaluation
    const research = project.description || 'investigating biological mechanisms';
    const methodology = project.methodology || 'systematic literature review and analysis';
    const hypothesis = project.hypothesis || project.outcome || 'a novel mechanistic explanation';
    
    return `${project.name || 'My research into'} ${research} led me to investigate underlying molecular mechanisms. ` +
           `Through ${methodology}, I proposed that the observed phenomenon could be explained by ` +
           `${hypothesis}. This research highlighted the importance of interdisciplinary approaches in advancing ` +
           `our understanding of complex biological systems, particularly where traditional boundaries between ` +
           `biochemistry, physiology, and clinical medicine intersect.`;
  };

  const demonstrateComputerScienceSkills = (project) => {
    // Show: Algorithmic thinking, System design, Implementation challenges
    const problem = project.description || 'a computational challenge';
    const approach = project.methodology || 'algorithm design and optimization';
    const insight = project.outcome || 'improved efficiency';
    
    return `${project.name || 'Tackling'} ${problem} required developing novel algorithmic approaches. ` +
           `Through ${approach}, I achieved ${insight}, but more importantly, discovered how algorithmic elegance ` +
           `must be balanced against practical constraints like memory usage and runtime complexity. This experience ` +
           `reinforced that effective computer science requires not just theoretical understanding but also ` +
           `pragmatic engineering judgment.`;
  };

  const demonstratePhysicsSkills = (project) => {
    // Show: Mathematical modeling, Experimental design, Theoretical analysis
    const investigation = project.description || 'a physical phenomenon';
    const method = project.methodology || 'mathematical modeling and experimental validation';
    const result = project.outcome || 'theoretical predictions aligned with observations';
    
    return `${project.name || 'Investigating'} ${investigation} required rigorous application of ${method}. ` +
           `The process revealed how ${result}, demonstrating the profound connection between abstract mathematics ` +
           `and physical reality. This work particularly highlighted how seemingly disparate physical principles ` +
           `can be unified through mathematical formalism.`;
  };

  const demonstrateGeneralAcademicSkills = (project, course) => {
    // Generic fallback with subject-appropriate language
    return `${project.name || 'My independent project'} ${project.description || `in ${course}`} ` +
           `required ${project.methodology || 'systematic investigation and analysis'}. ` +
           `${project.outcome || 'The results'} demonstrated how academic study demands both ` +
           `theoretical sophistication and methodological rigor.`;
  };

  const generateSkillDemonstrationWithoutProjects = (course, strategy) => {
    // When no projects available, focus on intellectual development through reading/thinking
    const progression = strategy.progression || [];
    const intellectualSkill = strategy.intellectualMarkers?.[0] || 'advanced theoretical understanding';
    
    return `My systematic engagement with ${intellectualSkill} has developed through intensive reading and analysis. ` +
           `This intellectual work, while not yet manifested in formal projects, has built the conceptual foundation ` +
           `and analytical capabilities essential for university-level research in ${course}.`;
  };

  const generateUniversitySpecificConclusion = (university, course, strategy, isOxbridge) => {
    // NO university references - focus on future intellectual goals
    return generateForwardLookingConclusion(course, strategy);
  };

  const generateForwardLookingConclusion = (course, strategy) => {
    // End with future intellectual goals, not university-specific content
    const courseSpecificConclusions = {
      economics: generateEconomicsConclusion,
      medicine: generateMedicineConclusion,
      engineering: generateEngineeringConclusion,
      biochemistry: generateBiochemistryConclusion,
      physics: generatePhysicsConclusion,
      'computer science': generateComputerScienceConclusion
    };
    
    // Find matching conclusion generator
    for (const [key, generator] of Object.entries(courseSpecificConclusions)) {
      if (course.toLowerCase().includes(key)) {
        return generator(strategy);
      }
    }
    
    return generateGenericIntellectualConclusion(course, strategy);
  };

  const generateEconomicsConclusion = (strategy) => {
    return `My current research into behavioral economics and market inefficiencies has opened questions about ` +
           `the limitations of rational choice theory. I am particularly interested in exploring how computational methods ` +
           `could provide new insights into complex economic systems where traditional equilibrium models fail. ` +
           `The intersection of economic theory, empirical analysis, and policy implementation represents the frontier ` +
           `where I aim to contribute original research.`;
  };

  const generateMedicineConclusion = (strategy) => {
    return `My investigation into cellular mechanisms has highlighted the gap between molecular understanding ` +
           `and clinical application. I am particularly drawn to exploring how systems biology approaches could ` +
           `bridge this divide, potentially revealing therapeutic targets that single-pathway analyses miss. ` +
           `The challenge of translating basic science into patient benefit represents the area where I believe ` +
           `interdisciplinary thinking will yield the greatest advances.`;
  };

  const generateEngineeringConclusion = (strategy) => {
    return `My exploration of design methodologies has revealed how engineering excellence emerges from the tension ` +
           `between theoretical optimization and practical constraints. I am particularly interested in investigating ` +
           `how biomimetic approaches could inform sustainable engineering solutions. The challenge of developing ` +
           `technologies that are simultaneously efficient, sustainable, and scalable represents the problem space ` +
           `where I aim to make meaningful contributions.`;
  };

  const generateBiochemistryConclusion = (strategy) => {
    return `My study of protein folding and enzymatic mechanisms has raised fundamental questions about ` +
           `the emergence of biological complexity from chemical simplicity. I am particularly interested in exploring ` +
           `how computational modeling could predict emergent properties in biological systems. The intersection of ` +
           `structural biology, systems chemistry, and synthetic biology represents the frontier where I believe ` +
           `transformative discoveries await.`;
  };

  const generatePhysicsConclusion = (strategy) => {
    return `My engagement with quantum mechanics and relativity has highlighted the profound questions that remain ` +
           `at physics' foundations. I am particularly interested in exploring how information theory might provide ` +
           `new perspectives on fundamental physical laws. The challenge of reconciling quantum mechanics with gravity ` +
           `represents not just a technical problem but a conceptual revolution waiting to happen.`;
  };

  const generateComputerScienceConclusion = (strategy) => {
    return `My work with algorithm design has revealed how computational thinking transcends traditional disciplinary ` +
           `boundaries. I am particularly interested in exploring how quantum computing could fundamentally alter ` +
           `our approach to computational complexity. The challenge of developing algorithms that can reason about ` +
           `uncertainty and learn from limited data represents the frontier where theoretical computer science ` +
           `meets practical artificial intelligence.`;
  };

  const generateGenericIntellectualConclusion = (course, strategy) => {
    const progression = strategy.progression || [];
    const futureArea = progression[progression.length - 1] || 'advanced concepts';
    
    return `My exploration of ${course} has revealed fundamental questions about ${futureArea.replace(/_/g, ' ')}. ` +
           `I am particularly interested in investigating how interdisciplinary approaches could provide new insights ` +
           `into these challenges. The opportunity to contribute original research to ${course} represents not just ` +
           `an academic goal but an intellectual imperative.`;
  };

  const generateGenericStatement = (books, insights, projects) => {
    // Fallback for when no university target is specified
    return `My academic journey has been shaped by a combination of rigorous self-study, practical engagement, and intellectual curiosity. Through systematic exploration of university-level content and independent projects, I have developed the analytical skills and theoretical foundation necessary for advanced study. I am excited to contribute to academic discourse while continuing to develop my understanding of complex concepts and their real-world applications.`;
  };

  /**
   * Advanced Statement Analysis
   */
  const analyzeStatementAdvanced = (statement, books, insights, projects) => {
    const analysis = {
      overallScore: 0,
      criteriaScores: {},
      strengths: [],
      weaknesses: [],
      improvements: [],
      universityFit: 0
    };

    // Analyze against enhanced criteria using your framework weights
    analysis.criteriaScores = {
      academicCriteria: analyzeAcademicCriteria(statement),
      intellectualQualities: analyzeIntellectualQualities(statement),
      intellectualDevelopment: analyzeIntellectualDevelopment(statement),
      subjectEngagement: analyzeSubjectEngagement(statement),
      communicationStructure: analyzeCommunicationStructure(statement),
      personalDevelopment: analyzePersonalDevelopment(statement),
      factualAccuracy: analyzeFactualAccuracy(statement),
      universitySpecific: analyzeUniversitySpecificContent(statement, targetUniversity),
      fillerLanguagePenalty: analyzeFillerLanguage(statement)
    };

    // Calculate overall score with your updated framework weights including Intellectual Development
    const weights = {
      academicCriteria: 0.40,           // Academic Criteria (40%)
      intellectualQualities: 0.25,      // Intellectual Qualities (25%) 
      intellectualDevelopment: 0.15,    // Intellectual Development vs Listing (15%) - NEW CRITICAL CATEGORY
      subjectEngagement: 0.10,          // Subject Engagement Quality (10% - reduced from 15%)
      communicationStructure: 0.05,     // Communication & Structure (5% - reduced from 10%)
      personalDevelopment: 0.03,        // Personal Development (3% - reduced from 5%)
      factualAccuracy: 0.02,            // Factual Accuracy (2% - reduced from 5%)
      universitySpecific: 0.00          // No weight - supplementary only
    };

    // Calculate base score from weighted criteria (excluding filler penalty)
    analysis.overallScore = Object.entries(analysis.criteriaScores).reduce((total, [criterion, score]) => {
      if (criterion === 'fillerLanguagePenalty') return total; // Skip penalty in weighted calculation
      return total + (score * (weights[criterion] || 0));
    }, 0);

    // Apply filler language penalty directly to overall score
    const fillerPenalty = analysis.criteriaScores.fillerLanguagePenalty || 0;
    analysis.overallScore = Math.max(0.5, analysis.overallScore - fillerPenalty);

    // Generate strengths, weaknesses, and improvements
    analysis.strengths = generateStrengths(analysis.criteriaScores);
    analysis.weaknesses = generateWeaknesses(analysis.criteriaScores);
    analysis.improvements = generateImprovements(analysis.criteriaScores, statement);

    analysis.universityFit = calculateUniversityFit(statement, books, insights, projects, targetUniversity);

    return analysis;
  };

  const analyzeAcademicCriteria = (statement) => {
    let score = 0;

    // Knowledge Appropriateness (10% of total, scaled to 4 points here)
    const knowledgeScore = analyzeKnowledgeAppropriateness(statement);
    score += knowledgeScore * 0.4;

    // Academic Relevance & Sophistication (15% of total, scaled to 6 points here)
    const relevanceScore = analyzeAcademicRelevanceSophistication(statement);
    score += relevanceScore * 0.6;

    // Understanding Depth (10% of total, scaled to 4 points here)  
    const depthScore = analyzeUnderstandingDepth(statement);
    score += depthScore * 0.4;

    // Self-Assessment Accuracy (5% of total, scaled to 2 points here)
    const selfAssessScore = analyzeSelfAssessmentAccuracy(statement);
    score += selfAssessScore * 0.2;

    return Math.max(0, Math.min(score, 10));
  };

  const analyzeKnowledgeAppropriateness = (statement) => {
    let score = 2; // Base score
    
    // University-level concepts
    const universityTerms = [
      'matrix', 'matrices', 'eigenvalue', 'topology', 'quantum', 'thermodynamics', 
      'differential', 'integral', 'calculus', 'algorithm', 'complexity theory',
      'molecular', 'biochemistry', 'organic chemistry', 'inorganic', 'polymer',
      'mechanics', 'electromagnetism', 'relativity', 'particle physics',
      'non-commutativity', 'qubit', 'superposition', 'entanglement'
    ];
    
    const foundTerms = universityTerms.filter(term => 
      statement.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundTerms.length >= 3) score += 6;
    else if (foundTerms.length >= 2) score += 4;
    else if (foundTerms.length >= 1) score += 2;
    
    // Beyond curriculum evidence
    const beyondCurriculumIndicators = [
      'university course', 'lecture', 'research paper', 'academic journal',
      'graduate level', 'advanced', 'postgraduate', 'doctoral'
    ];
    
    if (beyondCurriculumIndicators.some(indicator => 
      statement.toLowerCase().includes(indicator.toLowerCase())
    )) {
      score += 2;
    }

    return Math.max(0, Math.min(score, 10));
  };

  const analyzeAcademicRelevanceSophistication = (statement) => {
    let score = 0;
    
    // Count multiple academic sources (7-8 points tier)
    const academicSources = [
      'research', 'study', 'paper', 'journal', 'academic', 'scholarly',
      'university', 'professor', 'lecture', 'course', 'edx', 'coursera',
      'mooc', 'textbook', 'dissertation', 'thesis'
    ];
    
    const sourceCount = academicSources.filter(source =>
      statement.toLowerCase().includes(source.toLowerCase())
    ).length;
    
    // Independent research indicators (7-8 points tier)
    const independentResearch = [
      'independent research', 'research project', 'investigated', 'examined',
      'assessed', 'analyzed', 'evaluated', 'my research', 'I researched',
      'I studied', 'explored independently'
    ];
    
    const researchCount = independentResearch.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    // Course engagement (7-8 points tier)
    const courseEngagement = [
      'course', 'lecture', 'seminar', 'workshop', 'edx course', 'coursera',
      'online course', 'mooc', 'attended', 'participated'
    ];
    
    const courseCount = courseEngagement.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    // Competitions and advanced activities
    const competitions = [
      'competition', 'olympiad', 'challenge', 'contest', 'award',
      'prize', 'medal', 'certificate', 'recognition'
    ];
    
    const competitionCount = competitions.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    // Scoring based on updated framework
    if (sourceCount >= 3 && researchCount >= 1 && courseCount >= 1) {
      score = 8; // Multiple academic sources + independent research + course engagement
    } else if ((sourceCount >= 2 && researchCount >= 1) || (sourceCount >= 3 && courseCount >= 1)) {
      score = 7; // Strong academic engagement
    } else if (sourceCount >= 2 || researchCount >= 1 || courseCount >= 1) {
      score = 6; // Some academic sources with good understanding
    } else if (sourceCount >= 1) {
      score = 4; // Limited academic engagement
    } else {
      score = 2; // Minimal engagement
    }
    
    // Bonus for competitions or advanced activities
    if (competitionCount >= 1) score += 1;
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeUnderstandingDepth = (statement) => {
    let score = 2;
    
    // Cross-topic connections
    const connectionWords = [
      'link', 'connection', 'relationship', 'bridge', 'intersection',
      'interdisciplinary', 'synthesis', 'integration', 'convergence'
    ];
    
    const connections = connectionWords.filter(word =>
      statement.toLowerCase().includes(word.toLowerCase())
    ).length;
    
    score += connections * 1.5;
    
    // Depth of explanation
    if (statement.match(/\b\w+\b/g)?.length > 500) score += 2; // Substantial content
    if (statement.includes('which') || statement.includes('that')) score += 1; // Complex sentences
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeSelfAssessmentAccuracy = (statement) => {
    let score = 5; // Neutral base
    
    // Realistic positioning as learner
    const learnerIndicators = [
      'learned', 'discovered', 'realized', 'understood', 'explored',
      'beginning to understand', 'started to appreciate', 'hope to learn'
    ];
    
    if (learnerIndicators.some(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    )) {
      score += 3;
    }
    
    // Penalty for overstatement
    const overstateIndicators = [
      'mastered', 'expert', 'revolutionary', 'groundbreaking', 'world-changing'
    ];
    
    if (overstateIndicators.some(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    )) {
      score -= 4;
    }
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeIntellectualQualities = (statement) => {
    let score = 0;

    // Analytical Thinking (10% of total, scaled to 4 points here)
    const analyticalScore = analyzeAnalyticalThinking(statement);
    score += analyticalScore * 0.4;

    // Genuine Curiosity (8% of total, scaled to 3.2 points here)
    const curiosityScore = analyzeGenuineCuriosity(statement);
    score += curiosityScore * 0.32;

    // Academic Preparedness (7% of total, scaled to 2.8 points here)
    const preparednessScore = analyzeAcademicPreparedness(statement);
    score += preparednessScore * 0.28;

    return Math.max(0, Math.min(score, 10));
  };

  const analyzeAnalyticalThinking = (statement) => {
    let score = 0;
    
    // Clear synthesis across sources (7-8 points tier)
    const synthesisIndicators = [
      'building on', 'influenced by', 'this led me to', 'combined with',
      'drawing from', 'integrating', 'synthesis', 'connecting',
      'relationship between', 'link between', 'bridging'
    ];
    
    const synthesisCount = synthesisIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    // Original thinking indicators (7-8 points tier)
    const originalThinking = [
      'I argued', 'I concluded', 'my analysis', 'I believe', 'I proposed',
      'my perspective', 'I developed', 'I created', 'my approach',
      'original research', 'independent analysis'
    ];
    
    const originalCount = originalThinking.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    // Cross-connections between different areas (7-8 points tier)
    const crossConnections = [
      'connection between', 'relationship between', 'links', 'bridges',
      'interdisciplinary', 'across disciplines', 'intersection of'
    ];
    
    const connectionCount = crossConnections.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    // Evidence of reasoning progression
    const reasoningWords = [
      'because', 'therefore', 'consequently', 'thus', 'hence', 'since',
      'as a result', 'leading to', 'which resulted in'
    ];
    
    const reasoningCount = reasoningWords.filter(word =>
      statement.toLowerCase().includes(word.toLowerCase())
    ).length;
    
    // Critical analysis indicators
    const criticalAnalysis = [
      'however', 'although', 'while', 'despite', 'nevertheless',
      'on the other hand', 'conversely', 'in contrast'
    ];
    
    const criticalCount = criticalAnalysis.filter(word =>
      statement.toLowerCase().includes(word.toLowerCase())
    ).length;
    
    // Scoring based on updated framework
    if (synthesisCount >= 2 && originalCount >= 2 && connectionCount >= 1) {
      score = 8; // Clear synthesis + original thinking + cross-connections
    } else if ((synthesisCount >= 2 && originalCount >= 1) || (synthesisCount >= 1 && connectionCount >= 1)) {
      score = 7; // Strong analytical thinking
    } else if (synthesisCount >= 1 || originalCount >= 1) {
      score = 6; // Good analysis with some connections
    } else if (reasoningCount >= 3 && criticalCount >= 2) {
      score = 4; // Basic analytical thinking
    } else if (reasoningCount >= 1) {
      score = 3; // Some reasoning evident
    } else {
      score = 1; // Minimal analysis
    }
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeGenuineCuriosity = (statement) => {
    let score = 2;
    
    // Intrinsic interest indicators
    const intrinsicIndicators = [
      'fascinated', 'intrigued', 'curious', 'wondered', 'questioned',
      'captivated', 'compelled', 'driven to understand', 'eager to explore'
    ];
    
    const intrinsicCount = intrinsicIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    score += intrinsicCount * 1.2;
    
    // Independent exploration evidence
    const explorationIndicators = [
      'read', 'researched', 'investigated', 'explored', 'delved',
      'discovered', 'learned', 'studied independently'
    ];
    
    const explorationCount = explorationIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    if (explorationCount >= 3) score += 3;
    else if (explorationCount >= 2) score += 2;
    else if (explorationCount >= 1) score += 1;
    
    // Penalty for clichéd expressions
    const cliches = [
      'always been interested', 'from a young age', 'as long as I can remember'
    ];
    
    if (cliches.some(cliche => statement.toLowerCase().includes(cliche.toLowerCase()))) {
      score -= 2;
    }
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeIntellectualDevelopment = (statement) => {
    let score = 2; // Base score for any statement
    
    // Progression indicators - key phrases that show intellectual journey
    const progressionIndicators = [
      'this led me to', 'building on this', 'which prompted me to', 'consequently I',
      'as a result I', 'this sparked my interest in', 'following this', 'subsequently',
      'which deepened my understanding', 'this experience taught me', 'I then explored',
      'expanding on', 'further investigation revealed', 'this inspired me to'
    ];
    
    const progressionCount = progressionIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    // Development vs listing detection
    const developmentPatterns = [
      'evolved', 'developed', 'grew', 'expanded', 'deepened', 'matured',
      'refined', 'enhanced', 'strengthened', 'transformed', 'progressed'
    ];
    
    const developmentCount = developmentPatterns.filter(pattern =>
      statement.toLowerCase().includes(pattern.toLowerCase())
    ).length;
    
    // Sequential learning indicators
    const sequentialIndicators = [
      'first', 'then', 'later', 'finally', 'initially', 'subsequently',
      'after', 'before', 'during', 'eventually', 'ultimately'
    ];
    
    const sequentialCount = sequentialIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    // Causal connections between experiences
    const causalConnectors = [
      'because of', 'due to', 'as a result of', 'thanks to', 'stemming from',
      'which led to', 'resulting in', 'consequently', 'therefore'
    ];
    
    const causalCount = causalConnectors.filter(connector =>
      statement.toLowerCase().includes(connector.toLowerCase())
    ).length;
    
    // Activity listing patterns (negative scoring)
    const listingPatterns = [
      'I have', 'I also', 'I did', 'I participated', 'I attended',
      'I completed', 'I achieved', 'I obtained'
    ];
    
    const listingCount = listingPatterns.filter(pattern =>
      statement.toLowerCase().includes(pattern.toLowerCase())
    ).length;
    
    // Check for clear intellectual progression (like the PPE example)
    const hasIntellectualProgression = (
      progressionCount >= 2 && 
      developmentCount >= 1 && 
      causalCount >= 1
    );
    
    // Scoring based on intellectual development evidence
    if (hasIntellectualProgression && progressionCount >= 3) {
      score = 8; // Clear intellectual development journey (PPE example level)
    } else if (progressionCount >= 2 && developmentCount >= 1) {
      score = 7; // Good intellectual development
    } else if (progressionCount >= 1 && causalCount >= 1) {
      score = 6; // Some intellectual development shown
    } else if (sequentialCount >= 3 && causalCount >= 1) {
      score = 5; // Sequential thinking with some connections
    } else if (sequentialCount >= 2) {
      score = 4; // Basic sequential organization
    } else if (listingCount > 5 && progressionCount === 0) {
      score = 2; // Heavy listing with no development
    } else if (listingCount > 8) {
      score = 1; // Primarily just listing activities
    }
    
    // Penalty for excessive listing without development
    const listingPenalty = Math.max(0, listingCount - 3) * 0.3;
    score = Math.max(1, score - listingPenalty);
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeAcademicPreparedness = (statement) => {
    let score = 3;
    
    // University readiness indicators
    const readinessIndicators = [
      'research', 'critical thinking', 'independent study', 'academic rigor',
      'scholarly', 'theoretical', 'methodology', 'analysis'
    ];
    
    const readinessCount = readinessIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    score += readinessCount * 0.8;
    
    // Evidence of academic skills
    if (statement.toLowerCase().includes('essay') || statement.toLowerCase().includes('wrote')) score += 1;
    if (statement.toLowerCase().includes('research') || statement.toLowerCase().includes('investigation')) score += 1.5;
    if (statement.toLowerCase().includes('presentation') || statement.toLowerCase().includes('presented')) score += 1;
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeSubjectEngagement = (statement) => {
    let score = 0;

    // Academic vs Popular Engagement (8% of total, scaled to 3.2 points here)
    const academicEngagementScore = analyzeAcademicVsPopularEngagement(statement);
    score += academicEngagementScore * 0.32;

    // Intellectual Maturity (7% of total, scaled to 2.8 points here)
    const maturityScore = analyzeIntellectualMaturity(statement);
    score += maturityScore * 0.28;

    return Math.max(0, Math.min(score, 10));
  };

  const analyzeAcademicVsPopularEngagement = (statement) => {
    let score = 3;
    
    // Academic/scholarly sources mentioned
    const academicSources = [
      'journal', 'paper', 'research', 'study', 'textbook', 'academic',
      'scholarly', 'peer-reviewed', 'university press', 'dissertation'
    ];
    
    const academicCount = academicSources.filter(source =>
      statement.toLowerCase().includes(source.toLowerCase())
    ).length;
    
    if (academicCount >= 3) score += 4;
    else if (academicCount >= 2) score += 3;
    else if (academicCount >= 1) score += 2;
    
    // Technical/specialist content
    const technicalIndicators = [
      'equation', 'theorem', 'principle', 'law', 'mechanism', 'process',
      'methodology', 'framework', 'model', 'theory'
    ];
    
    const technicalCount = technicalIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    score += technicalCount * 0.5;
    
    // Penalty for popular science only
    const popularIndicators = ['documentary', 'youtube', 'blog', 'article', 'news'];
    const popularCount = popularIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    if (popularCount > academicCount && academicCount === 0) score -= 2;
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeIntellectualMaturity = (statement) => {
    let score = 4;
    
    // Appropriate respect for expertise
    const respectIndicators = [
      'learned from', 'guided by', 'inspired by', 'according to',
      'research shows', 'evidence suggests', 'experts believe'
    ];
    
    const respectCount = respectIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    score += respectCount * 0.8;
    
    // Avoiding overconfidence
    const humilityIndicators = [
      'hope to learn', 'beginning to understand', 'starting to appreciate',
      'would like to explore', 'seek to understand'
    ];
    
    if (humilityIndicators.some(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    )) {
      score += 2;
    }
    
    // Penalty for dismissing expertise
    const dismissalIndicators = [
      'experts are wrong', 'traditional view is flawed', 'outdated thinking'
    ];
    
    if (dismissalIndicators.some(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    )) {
      score -= 4;
    }
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeCommunicationStructure = (statement) => {
    let score = 0;

    // Narrative Coherence (5% of total, scaled to 2 points here)
    const coherenceScore = analyzeNarrativeCoherence(statement);
    score += coherenceScore * 0.2;

    // Specificity & Evidence (5% of total, scaled to 2 points here)
    const specificityScore = analyzeSpecificityEvidence(statement);
    score += specificityScore * 0.2;

    return Math.max(0, Math.min(score, 10));
  };

  const analyzeNarrativeCoherence = (statement) => {
    let score = 3;

    // Logical flow indicators
    const transitionWords = [
      'however', 'furthermore', 'moreover', 'consequently', 'therefore',
      'nevertheless', 'additionally', 'similarly', 'in contrast', 'as a result'
    ];
    
    const transitionCount = transitionWords.filter(word =>
      statement.toLowerCase().includes(word.toLowerCase())
    ).length;
    
    if (transitionCount >= 3) score += 3;
    else if (transitionCount >= 2) score += 2;
    else if (transitionCount >= 1) score += 1;
    
    // Clear progression
    const progressionIndicators = [
      'initially', 'first', 'then', 'subsequently', 'finally',
      'began', 'started', 'developed', 'evolved', 'culminated'
    ];
    
    const progressionCount = progressionIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    if (progressionCount >= 2) score += 2;
    else if (progressionCount >= 1) score += 1;
    
    // Paragraph structure (estimate)
    const paragraphEstimate = (statement.match(/\.\s+[A-Z]/g) || []).length + 1;
    if (paragraphEstimate >= 3 && paragraphEstimate <= 5) score += 1;
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeSpecificityEvidence = (statement) => {
    let score = 2;
    
    // Concrete examples
    const exampleIndicators = [
      'for example', 'such as', 'specifically', 'particularly',
      'instance', 'case', 'namely', 'including', 'demonstrated by'
    ];
    
    const exampleCount = exampleIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    if (exampleCount >= 3) score += 4;
    else if (exampleCount >= 2) score += 3;
    else if (exampleCount >= 1) score += 2;
    
    // Specific details (numbers, names, titles)
    const specificDetails = [
      statement.match(/\d+/g) || [], // Numbers
      statement.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [], // Proper names
      statement.match(/'[^']*'/g) || [] // Quoted titles
    ].flat().length;
    
    if (specificDetails >= 5) score += 2;
    else if (specificDetails >= 3) score += 1.5;
    else if (specificDetails >= 1) score += 1;
    
    // Penalty for vague language
    const vagueWords = [
      'something', 'things', 'stuff', 'many', 'various', 'several',
      'always', 'never', 'everyone', 'everything'
    ];
    
    const vagueCount = vagueWords.filter(word =>
      statement.toLowerCase().includes(word.toLowerCase())
    ).length;
    
    score -= vagueCount * 0.3;
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzePersonalDevelopment = (statement) => {
    let score = 0;

    // Reflection & Growth (3% of total, scaled to 1.2 points here)
    const reflectionScore = analyzeReflectionGrowth(statement);
    score += reflectionScore * 0.12;

    // Future Vision (2% of total, scaled to 0.8 points here)
    const visionScore = analyzeFutureVision(statement);
    score += visionScore * 0.08;

    return Math.max(0, Math.min(score, 10));
  };

  const analyzeReflectionGrowth = (statement) => {
    let score = 3;
    
    // Learning from experiences
    const learningIndicators = [
      'learned that', 'realized that', 'discovered that', 'understood that',
      'came to understand', 'began to see', 'recognized that'
    ];
    
    const learningCount = learningIndicators.filter(indicator =>
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    if (learningCount >= 3) score += 4;
    else if (learningCount >= 2) score += 3;
    else if (learningCount >= 1) score += 2;
    
    // Growth and development
    const growthWords = [
      'developed', 'improved', 'enhanced', 'gained', 'strengthened',
      'refined', 'deepened', 'expanded', 'evolved'
    ];
    
    const growthCount = growthWords.filter(word =>
      statement.toLowerCase().includes(word.toLowerCase())
    ).length;
    
    score += growthCount * 0.4;
    
    // Penalty for superficial claims
    const superficialClaims = [
      'made me a better person', 'taught me a lot', 'changed my life',
      'opened my eyes', 'life-changing experience'
    ];
    
    if (superficialClaims.some(claim =>
      statement.toLowerCase().includes(claim.toLowerCase())
    )) {
      score -= 3;
    }
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeFutureVision = (statement) => {
    let score = 4;
    
    // Realistic university goals
    const universityGoals = [
      'hope to', 'aim to', 'plan to', 'intend to', 'would like to',
      'aspire to', 'seek to', 'want to contribute', 'looking forward to'
    ];
    
    const goalCount = universityGoals.filter(goal =>
      statement.toLowerCase().includes(goal.toLowerCase())
    ).length;
    
    if (goalCount >= 2) score += 3;
    else if (goalCount >= 1) score += 2;
    
    // Specific future interests
    const futureWords = [
      'research', 'explore', 'investigate', 'study', 'pursue',
      'continue', 'develop', 'contribute', 'advance'
    ];
    
    const futureCount = futureWords.filter(word =>
      statement.toLowerCase().includes(word.toLowerCase())
    ).length;
    
    score += futureCount * 0.3;
    
    // Penalty for unrealistic claims
    const unrealisticClaims = [
      'change the world', 'revolutionary breakthrough', 'solve all problems',
      'cure cancer', 'end poverty', 'save humanity'
    ];
    
    if (unrealisticClaims.some(claim =>
      statement.toLowerCase().includes(claim.toLowerCase())
    )) {
      score -= 4;
    }
    
    return Math.max(0, Math.min(score, 10));
  };

  /**
   * Comprehensive Filler Language and Vague Content Detection
   */
  const analyzeFillerLanguage = (statement) => {
    let penalty = 0;
    const sentences = statement.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim().toLowerCase();
      
      // Vague interest statements without detail
      const vagueInterestPatterns = [
        /i became interested in .+ when (an incident|something|an event) happened/gi,
        /i have always been interested in .+ since (a young age|childhood|school)/gi,
        /my interest in .+ began when i (watched|read|heard) (something|about)/gi,
        /i was inspired by .+ to pursue/gi,
        /this made me realize that i wanted to study/gi,
        /i knew that .+ was the subject for me/gi
      ];
      
      vagueInterestPatterns.forEach(pattern => {
        if (trimmed.match(pattern)) penalty += 0.4;
      });

      // Generic passion statements without specifics
      const genericPassionPatterns = [
        /i am passionate about .+ because it is (interesting|fascinating|important)/gi,
        /i love .+ because it (interests|fascinates|excites) me/gi,
        /i find .+ (very|extremely|really) (interesting|exciting|compelling)/gi,
        /this subject is (important|relevant|significant) in today's world/gi,
        /i want to make a difference in the world/gi
      ];
      
      genericPassionPatterns.forEach(pattern => {
        if (trimmed.match(pattern)) penalty += 0.3;
      });

      // Filler phrases that add no value
      const fillerPhrases = [
        /in conclusion/gi,
        /to conclude/gi,
        /in summary/gi,
        /overall/gi,
        /it is clear that/gi,
        /there is no doubt that/gi,
        /it is obvious that/gi,
        /needless to say/gi,
        /as you can see/gi,
        /as mentioned above/gi,
        /in my opinion/gi,
        /i believe that/gi,
        /i think that/gi,
        /it seems to me that/gi
      ];
      
      fillerPhrases.forEach(phrase => {
        if (trimmed.match(phrase)) penalty += 0.2;
      });

      // Meaningless qualifiers and intensifiers
      const meaninglessQualifiers = [
        /very (good|bad|important|interesting|exciting)/gi,
        /extremely (good|bad|important|interesting|exciting)/gi,
        /really (good|bad|important|interesting|exciting)/gi,
        /quite (good|bad|important|interesting|exciting)/gi,
        /rather (good|bad|important|interesting|exciting)/gi,
        /somewhat (good|bad|important|interesting|exciting)/gi
      ];
      
      meaninglessQualifiers.forEach(qualifier => {
        if (trimmed.match(qualifier)) penalty += 0.15;
      });

      // Clichéd university application phrases
      const clichedPhrases = [
        /unique perspective/gi,
        /diverse background/gi,
        /well-rounded individual/gi,
        /outside the box/gi,
        /think outside the box/gi,
        /comfort zone/gi,
        /step out of my comfort zone/gi,
        /broaden my horizons/gi,
        /expand my knowledge/gi,
        /deepen my understanding/gi,
        /pursue my dreams/gi,
        /follow my passion/gi,
        /achieve my goals/gi,
        /bright future/gi,
        /promising career/gi
      ];
      
      clichedPhrases.forEach(cliche => {
        if (trimmed.match(cliche)) penalty += 0.25;
      });

      // Vague references without detail
      const vagueReferences = [
        /when i was in year \d+ an incident occurred/gi,
        /something happened that changed my perspective/gi,
        /an event in my life made me realize/gi,
        /after a particular experience/gi,
        /through various experiences/gi,
        /during my time at school/gi,
        /throughout my education/gi,
        /over the years/gi,
        /as i have grown/gi,
        /as i have matured/gi
      ];
      
      vagueReferences.forEach(vague => {
        if (trimmed.match(vague)) penalty += 0.3;
      });

      // Empty statements that could apply to any subject
      const emptyStatements = [
        /this subject is important because it affects everyone/gi,
        /this field is growing rapidly/gi,
        /there are many opportunities in this area/gi,
        /this subject is relevant to modern society/gi,
        /i want to contribute to society/gi,
        /i want to help people/gi,
        /i want to make a positive impact/gi,
        /this subject has many applications/gi,
        /this field is constantly evolving/gi
      ];
      
      emptyStatements.forEach(empty => {
        if (trimmed.match(empty)) penalty += 0.35;
      });

      // Redundant explanations
      const redundantExplanations = [
        /what i mean by this is/gi,
        /in other words/gi,
        /that is to say/gi,
        /let me explain/gi,
        /to put it simply/gi,
        /to clarify/gi,
        /what this means is/gi
      ];
      
      redundantExplanations.forEach(redundant => {
        if (trimmed.match(redundant)) penalty += 0.2;
      });
    });

    // Additional penalties for overall statement quality issues
    
    // Excessive use of first person without substance
    const firstPersonCount = (statement.match(/\bi\s/gi) || []).length;
    const sentenceCount = sentences.length;
    if (sentenceCount > 0 && (firstPersonCount / sentenceCount) > 0.6) {
      penalty += 0.5; // Too self-focused without substantial content
    }

    // Repetitive sentence structures
    const sentenceStarters = sentences.map(s => s.trim().substring(0, 20).toLowerCase());
    const uniqueStarters = [...new Set(sentenceStarters)];
    if (sentences.length > 0 && (uniqueStarters.length / sentences.length) < 0.7) {
      penalty += 0.4; // Too repetitive in structure
    }

    // Lack of concrete examples
    const concreteIndicators = /specifically|for example|in particular|such as|including|namely/gi;
    const concreteCount = (statement.match(concreteIndicators) || []).length;
    if (statement.length > 1000 && concreteCount < 2) {
      penalty += 0.6; // Long statement without concrete examples
    }

    return Math.min(penalty, 3); // Cap penalty at 3 points
  };

  const analyzeFactualAccuracy = (statement) => {
    let score = 8; // Assume accurate unless major problems found
    
    // Only penalize major factual errors, not exploratory thinking
    // Look for obviously incorrect scientific/mathematical statements
    const majorErrors = [
      // Physics errors
      /light travels faster than sound through vacuum/i,
      /gravity works differently in space/i,
      /atoms are the smallest particles/i,
      
      // Chemistry errors  
      /water is not a compound/i,
      /oxygen is heavier than carbon/i,
      
      // Mathematics errors
      /zero is positive/i,
      /infinity is a number/i,
      
      // Biology errors
      /humans have more chromosomes than plants/i,
      /dna is not found in all cells/i
    ];
    
    const foundErrors = majorErrors.filter(errorPattern =>
      statement.match(errorPattern)
    );
    
    // Heavy penalty only for major factual errors
    score -= foundErrors.length * 3;
    
    // Minor penalty for overconfident claims about complex topics
    const overconfidentClaims = [
      /i have solved/i,
      /i have proven/i,
      /i have discovered/i,
      /i am certain that/i,
      /there is no doubt/i
    ];
    
    const overconfidenceCount = overconfidentClaims.filter(pattern =>
      statement.match(pattern)
    ).length;
    
    if (overconfidenceCount > 0) score -= overconfidenceCount * 0.5;
    
    return Math.max(0, Math.min(score, 10));
  };

  const analyzeUniversitySpecificContent = (statement, university) => {
    if (!university) return 5;

    let score = 5;

    // University mentioned by name
    if (statement.includes(university.name)) score += 2;

    // Course-specific content
    if (statement.includes(university.course)) score += 1.5;

    // Department/modules mentioned
    if (university.modules?.year1Core?.some(module => statement.includes(module))) {
      score += 1.5;
    }

    // Research areas mentioned
    if (university.department?.specializations?.some(spec => statement.includes(spec))) {
      score += 1;
    }

    return Math.min(score, 10);
  };

  const calculateUniversityFit = (statement, books, insights, projects, university) => {
    if (!university) return 7;

    let fit = 5;

    // Course alignment
    const courseKeywords = getCourseKeywords(university.course);
    const alignmentScore = courseKeywords.reduce((score, keyword) => {
      return statement.toLowerCase().includes(keyword) ? score + 1 : score;
    }, 0);
    fit += Math.min(alignmentScore * 0.5, 3);

    // University culture fit
    if (isOxbridge(university.name) && insights.some(i => i.intellectualDepth > 8)) {
      fit += 2;
    }

    return Math.min(fit, 10);
  };

  // Helper functions for analysis
  const countTechnicalTerms = (statement) => {
    const technicalTerms = [
      'methodology', 'analysis', 'theoretical', 'empirical', 'framework',
      'paradigm', 'synthesis', 'hypothesis', 'correlation', 'causation'
    ];
    
    return technicalTerms.reduce((count, term) => {
      return statement.toLowerCase().includes(term) ? count + 1 : count;
    }, 0);
  };

  const countSubjectSpecificWords = (statement, course) => {
    if (!course) return 0;

    const subjectWords = {
      economics: ['market', 'economic', 'policy', 'trade', 'inflation', 'gdp', 'demand', 'supply'],
      medicine: ['medical', 'patient', 'research', 'clinical', 'health', 'diagnosis', 'treatment'],
      engineering: ['design', 'technical', 'innovation', 'system', 'optimization', 'efficiency'],
      'computer science': ['algorithm', 'computational', 'programming', 'software', 'data', 'artificial']
    };

    const lowerStatement = statement.toLowerCase();
    const lowerCourse = course.toLowerCase();

    for (const [subject, words] of Object.entries(subjectWords)) {
      if (lowerCourse.includes(subject)) {
        return words.reduce((count, word) => {
          return lowerStatement.includes(word) ? count + 1 : count;
        }, 0);
      }
    }

    return 0;
  };

  const getCourseKeywords = (course) => {
    const courseKeywordMap = {
      economics: ['economic', 'market', 'policy', 'analytical'],
      medicine: ['medical', 'scientific', 'research', 'patient'],
      engineering: ['technical', 'problem-solving', 'innovation', 'design'],
      'computer science': ['computational', 'algorithmic', 'programming', 'data']
    };

    const lowerCourse = course?.toLowerCase() || '';
    for (const [courseKey, keywords] of Object.entries(courseKeywordMap)) {
      if (lowerCourse.includes(courseKey)) {
        return keywords;
      }
    }
    return [];
  };

  // Enhanced feedback generation for Personal Statement Builder - INTELLIGENT SYSTEM
  const generateDetailedFeedback = (statement, evidence, universityTargets) => {
    // Use existing scoring system to get real scores
    const scores = calculateDetailedScores(statement, evidence);
    
    // Extract actual content from the statement
    const content = analyzeStatementContent(statement);
    
    // Generate intelligent feedback based on actual content
    return generateIntelligentFeedback(statement, scores, evidence, universityTargets?.[0], content);
  };

  // Intelligent feedback system that adapts to statement content
  const generateIntelligentFeedback = (statement, scores, evidence, targetUniversity, content) => {
    return {
      overallScore: scores.overallScore || 7.0,
      grade: getContextualGrade(scores.overallScore || 7.0, content),
      
      academicStrength: generateAcademicFeedback(scores.academic || 7.0, content, statement),
      intellectualQualities: generateIntellectualFeedback(scores.intellectual || 7.0, content, statement),
      intellectualDevelopment: generateDevelopmentFeedback(scores.intellectual || 7.0, content, statement),
      subjectEngagement: generateEngagementFeedback(scores.engagement || 7.0, content, statement, targetUniversity),
      communicationStructure: generateCommunicationFeedback(scores.communication || 7.0, content, statement),
      personalDevelopment: generatePersonalFeedback(scores.personal || 6.0, content, statement),
      
      overallNarrative: generateOverallNarrative(scores, content, targetUniversity),
      topPriorities: generateIntelligentPriorities(scores, content, statement),
      keyStrengths: generateContextualStrengths(scores, content, statement),
      concerns: generateSmartConcerns(scores, content, statement),
      universityAdvice: targetUniversity ? generateUniversityAdvice(content, targetUniversity) : null,
      gradeJustification: generateGradeJustification(scores, content)
    };
  };

  // Content analysis that extracts meaningful information
  const analyzeStatementContent = (statement) => {
    return {
      // Academic content
      books: extractBooks(statement),
      academicTerms: extractAcademicTerms(statement),
      researchMentions: extractResearchMentions(statement),
      courseReferences: extractCourseReferences(statement),
      
      // Subject identification
      subject: identifySubject(statement),
      technicalDepth: assessTechnicalDepth(statement),
      
      // Narrative structure
      progressionPhrases: extractProgressionPhrases(statement),
      listingPatterns: countListingPatterns(statement),
      connectionWords: extractConnectionWords(statement),
      
      // Engagement indicators
      passionIndicators: extractPassionIndicators(statement),
      specificExamples: extractSpecificExamples(statement),
      personalReflection: extractPersonalReflection(statement),
      
      // Quality metrics
      fillerPhrases: extractFillerPhrases(statement),
      cliches: extractCliches(statement),
      vagueStatements: extractVagueStatements(statement),
      
      // Basic stats
      characterCount: statement.length,
      sentenceCount: statement.split(/[.!?]+/).filter(s => s.trim().length > 10).length,
      paragraphCount: statement.split('\n\n').length
    };
  };

  // Academic feedback with intelligent adaptation
  const generateAcademicFeedback = (score, content, statement) => {
    let narrative = '';
    let standoutMoment = null;
    let subtitle = '';
    
    if (score >= 8.5) {
      subtitle = "Exceptional academic engagement";
      
      if (content.books.length >= 3) {
        const bookList = content.books.length > 3 
          ? `${content.books.slice(0, 2).join(', ')} and ${content.books.length - 2} others`
          : content.books.join(', ');
        narrative += `Your reading list is genuinely impressive with sophisticated sources including ${bookList}. `;
      }
      
      if (content.academicTerms.length >= 3) {
        narrative += `The integration of advanced concepts like ${content.academicTerms.slice(0, 3).join(', ')} demonstrates university-level understanding that will catch admissions tutors' attention. `;
        standoutMoment = `The sophisticated use of terminology like "${content.academicTerms[0]}" shows genuine academic depth beyond A-level requirements.`;
      }
      
      if (content.researchMentions.length > 0) {
        narrative += `Your engagement with independent research ${content.researchMentions[0] ? `including ${content.researchMentions[0]}` : ''} shows the kind of intellectual initiative universities specifically seek. `;
      }
      
      narrative += "This level of academic preparation positions you as a serious candidate who has gone well beyond curriculum requirements.";
      
    } else if (score >= 7) {
      subtitle = "Strong academic foundation";
      
      if (content.books.length >= 2) {
        narrative += `Your reading shows good academic engagement with sources like ${content.books.slice(0, 2).join(' and ')}. `;
      }
      
      if (content.academicTerms.length >= 1) {
        narrative += `The use of concepts like ${content.academicTerms.slice(0, 2).join(' and ')} demonstrates developing academic sophistication. `;
      }
      
      narrative += "You're building a solid foundation for university-level study, though there's room to showcase even more advanced engagement.";
      
    } else if (score >= 5) {
      subtitle = "Developing academic engagement";
      narrative = `Your statement shows some academic content${content.books.length > 0 ? ` including ${content.books[0]}` : ''}, but could benefit from more sophisticated sources and deeper engagement with advanced concepts. Consider adding more university-level reading and technical terminology to strengthen your academic credibility.`;
      
    } else {
      subtitle = "Limited academic evidence";
      narrative = "Your statement currently lacks sufficient evidence of engagement with university-level academic content. This is a critical area for improvement as admissions tutors specifically look for students who have explored beyond the curriculum. Add substantial reading, research projects, or advanced coursework to strengthen this section.";
    }
    
    return {
      score: score,
      title: `Academic Criteria: ${score.toFixed(1)}/10 ${score >= 8 ? '⭐' : score >= 6 ? '✅' : '⚠️'}`,
      subtitle: subtitle,
      narrative: narrative,
      standoutMoment: standoutMoment
    };
  };

  // Intellectual development with smart content analysis
  const generateDevelopmentFeedback = (score, content, statement) => {
    let narrative = '';
    let actionable = null;
    let subtitle = '';
    
    if (score >= 7) {
      subtitle = "Clear intellectual progression shown";
      
      if (content.progressionPhrases.length >= 3) {
        narrative = `Excellent intellectual development journey! Your use of connecting phrases like "${content.progressionPhrases.slice(0, 2).join('", "')}" creates a compelling narrative showing how each experience built upon the previous one. `;
        
        if (content.listingPatterns <= 2) {
          narrative += "You've successfully avoided the trap of simply listing activities, instead crafting a coherent story of intellectual growth. ";
        }
        
        narrative += "This developmental approach is exactly what universities want to see - evidence that you can learn from experiences and build sophisticated understanding over time.";
      } else {
        narrative = `Your statement shows good intellectual progression. ${content.connectionWords.length > 0 ? `The use of connecting language helps show development, ` : ''}though you could strengthen this further with more explicit causal connections between experiences.`;
      }
      
    } else if (score >= 5) {
      subtitle = "Some development shown, needs strengthening";
      
      const ratio = content.listingPatterns / Math.max(content.progressionPhrases.length, 1);
      
      if (ratio > 2) {
        narrative = `Your statement leans toward listing activities rather than showing intellectual development. You have ${content.listingPatterns} listing phrases compared to only ${content.progressionPhrases.length} progression indicators. `;
        actionable = `Transform your activity lists into development story by adding phrases like "This led me to...", "Building on this understanding...", "Consequently, I explored...". Show how each experience caused the next.`;
      } else {
        narrative = `You show some intellectual development but the progression could be clearer. ${content.progressionPhrases.length > 0 ? `Your use of "${content.progressionPhrases[0]}" is good, ` : ''}but more connecting phrases would strengthen the narrative flow.`;
        actionable = "Add 2-3 more causal connections between paragraphs to show how your thinking evolved.";
      }
      
    } else {
      subtitle = "Critical issue: Activity listing detected";
      
      narrative = `CRITICAL WEAKNESS: Your statement reads as a list of activities rather than an intellectual journey. With ${content.listingPatterns} listing patterns and only ${content.progressionPhrases.length} progression phrases, you're missing the developmental narrative that universities require. This pattern significantly weakens your application.`;
      
      actionable = `URGENT ACTION NEEDED: Completely restructure your statement to show intellectual progression. Replace every "I did X, I also did Y" with "Doing X taught me Z, which led me to explore Y, where I discovered..." Create a clear chain of intellectual development.`;
    }
    
    return {
      score: score,
      title: `Intellectual Development: ${score.toFixed(1)}/10 ${score >= 7 ? '⭐' : score >= 5 ? '✅' : '⚠️'}`,
      subtitle: subtitle,
      narrative: narrative,
      actionable: actionable
    };
  };

  // Subject engagement with subject-specific intelligence
  const generateEngagementFeedback = (score, content, statement, targetUniversity) => {
    let narrative = '';
    let advice = null;
    let subtitle = '';
    
    const subject = content.subject || targetUniversity?.course?.toLowerCase() || 'your chosen field';
    
    if (score >= 8) {
      subtitle = "Authentic passion clearly demonstrated";
      
      if (content.specificExamples.length >= 2) {
        narrative = `Your engagement with ${subject} feels completely authentic, particularly through specific examples like ${content.specificExamples.slice(0, 2).join(' and ')}. `;
      }
      
      if (content.passionIndicators.length > 0 && !content.cliches.includes('always been interested')) {
        narrative += `The way you describe ${content.passionIndicators[0]} shows genuine intellectual curiosity rather than generic interest statements. `;
      }
      
      if (content.technicalDepth > 0) {
        narrative += `Your technical understanding evident through ${content.academicTerms.slice(0, 2).join(' and ')} demonstrates serious engagement beyond surface-level interest. `;
      }
      
      narrative += "This authenticity and depth will resonate strongly with admissions tutors who can easily distinguish between genuine passion and manufactured interest.";
      
    } else if (score >= 6) {
      subtitle = "Good engagement with room for improvement";
      
      narrative = `Your interest in ${subject} comes through clearly${content.specificExamples.length > 0 ? ` with examples like ${content.specificExamples[0]}` : ''}. `;
      
      if (content.cliches.length > 0) {
        narrative += `However, phrases like "${content.cliches[0]}" sound generic. `;
        advice = `Replace clichéd expressions with specific moments or discoveries that sparked your interest. What exactly happened? What did you think? How did it change your perspective?`;
      } else if (content.specificExamples.length < 2) {
        advice = "Add more concrete examples of your engagement to make your passion more convincing and memorable.";
      }
      
    } else {
      subtitle = "Limited evidence of genuine engagement";
      
      if (content.cliches.length >= 2) {
        narrative = `Your statement relies heavily on clichéd expressions like "${content.cliches.slice(0, 2).join('" and "')}" which undermine your credibility. `;
      }
      
      narrative += `Your engagement with ${subject} needs to feel more authentic and specific. `;
      advice = `Replace all generic passion statements with specific incidents, discoveries, or moments that genuinely sparked your interest. Admissions tutors can spot manufactured interest immediately.`;
    }
    
    return {
      score: score,
      title: `Subject Engagement: ${score.toFixed(1)}/10 ${score >= 8 ? '⭐' : score >= 6 ? '✅' : '⚠️'}`,
      subtitle: subtitle,
      narrative: narrative,
      advice: advice
    };
  };

  // Helper functions for content extraction and analysis
  const extractBooks = (statement) => {
    const bookMatches = statement.match(/'([^']+)'/g) || [];
    const quotedBooks = bookMatches.map(match => match.replace(/'/g, '')).slice(0, 5);
    
    // Also look for common book patterns without quotes
    const bookKeywords = ['reading', 'book', 'novel', 'text', 'literature', 'publication'];
    const sentences = statement.split(/[.!?]+/);
    const bookMentions = [];
    
    sentences.forEach(sentence => {
      if (bookKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        // Look for potential book titles (capitalized words)
        const words = sentence.split(' ');
        let potentialTitle = '';
        for (let i = 0; i < words.length - 1; i++) {
          if (words[i].match(/^[A-Z][a-z]+/) && words[i + 1].match(/^[A-Z][a-z]+/)) {
            potentialTitle = `${words[i]} ${words[i + 1]}`;
            if (!quotedBooks.includes(potentialTitle) && !bookMentions.includes(potentialTitle)) {
              bookMentions.push(potentialTitle);
            }
          }
        }
      }
    });
    
    return [...quotedBooks, ...bookMentions.slice(0, 3)].slice(0, 5);
  };

  const extractAcademicTerms = (statement) => {
    const terms = [
      'methodology', 'theoretical', 'empirical', 'optimization', 'algorithm',
      'differential', 'integral', 'matrix', 'quantum', 'molecular', 'pathophysiology',
      'econometric', 'stochastic', 'synthesis', 'paradigm', 'correlation', 'causation',
      'hypothesis', 'variable', 'regression', 'analysis', 'statistical', 'significant',
      'framework', 'model', 'theory', 'concept', 'principle', 'phenomenon'
    ];
    return terms.filter(term => statement.toLowerCase().includes(term.toLowerCase())).slice(0, 5);
  };

  const extractResearchMentions = (statement) => {
    const researchPhrases = [
      'independent research', 'research project', 'investigation', 'study', 'analysis',
      'extended project qualification', 'epq', 'dissertation', 'thesis'
    ];
    return researchPhrases.filter(phrase => statement.toLowerCase().includes(phrase.toLowerCase()));
  };

  const extractCourseReferences = (statement) => {
    const coursePatterns = [
      'A-level', 'A level', 'GCSE', 'course', 'curriculum', 'syllabus', 'module',
      'coursework', 'assignment', 'exam', 'qualification'
    ];
    return coursePatterns.filter(pattern => statement.toLowerCase().includes(pattern.toLowerCase()));
  };

  const extractProgressionPhrases = (statement) => {
    const phrases = [
      'this led me to', 'building on this', 'consequently', 'as a result',
      'which prompted me to', 'following this', 'subsequently', 'this sparked',
      'inspired by this', 'this experience taught me', 'building upon',
      'this motivated me to', 'which encouraged me to', 'from this I learned'
    ];
    return phrases.filter(phrase => statement.toLowerCase().includes(phrase.toLowerCase()));
  };

  const countListingPatterns = (statement) => {
    const patterns = [
      'I have', 'I also', 'I did', 'I participated', 'I attended', 'I completed', 
      'I achieved', 'I was involved in', 'I took part in', 'I engaged with',
      'Additionally, I', 'Furthermore, I', 'Moreover, I', 'I have also'
    ];
    return patterns.filter(pattern => statement.toLowerCase().includes(pattern.toLowerCase())).length;
  };

  const extractConnectionWords = (statement) => {
    const connectors = [
      'however', 'therefore', 'furthermore', 'moreover', 'consequently',
      'subsequently', 'nevertheless', 'thus', 'hence', 'accordingly'
    ];
    return connectors.filter(word => statement.toLowerCase().includes(word.toLowerCase()));
  };

  const extractPassionIndicators = (statement) => {
    const indicators = [
      'fascinated', 'intrigued', 'captivated', 'inspired', 'motivated',
      'driven', 'compelled', 'drawn to', 'passionate about', 'enthusiastic'
    ];
    return indicators.filter(indicator => statement.toLowerCase().includes(indicator.toLowerCase()));
  };

  const extractSpecificExamples = (statement) => {
    const examples = [];
    
    // Numbers and percentages
    const numbers = statement.match(/\d+(?:\.\d+)?%?/g) || [];
    if (numbers.length > 0) examples.push(`quantified results (${numbers[0]})`);
    
    // Proper nouns (likely specific examples)
    const properNouns = statement.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    const relevantNouns = properNouns.filter(noun => 
      !['I', 'The', 'This', 'That', 'My', 'University', 'College', 'However', 'Therefore'].includes(noun)
    ).slice(0, 3);
    
    examples.push(...relevantNouns);
    
    return examples.slice(0, 3);
  };

  const extractPersonalReflection = (statement) => {
    const reflectionPhrases = [
      'I learned', 'I discovered', 'I realized', 'I understood', 'I developed',
      'I grew', 'I came to understand', 'I found myself', 'this taught me',
      'I became aware', 'I reflected on', 'I recognized'
    ];
    return reflectionPhrases.filter(phrase => statement.toLowerCase().includes(phrase.toLowerCase()));
  };

  const extractFillerPhrases = (statement) => {
    const fillers = [
      'i am passionate about', 'i have always been interested', 'from a young age',
      'it is clear that', 'needless to say', 'in my opinion', 'i believe that',
      'it goes without saying', 'obviously', 'undoubtedly', 'without a doubt'
    ];
    return fillers.filter(filler => statement.toLowerCase().includes(filler.toLowerCase()));
  };

  const extractCliches = (statement) => {
    const cliches = [
      'always been interested', 'from a young age', 'passion for', 'fascinated by',
      'unique perspective', 'think outside the box', 'comfort zone', 'make a difference',
      'pursue my dreams', 'follow my passion', 'achieve my goals', 'bright future'
    ];
    return cliches.filter(cliche => statement.toLowerCase().includes(cliche.toLowerCase()));
  };

  const extractVagueStatements = (statement) => {
    const vague = [
      'something happened', 'an event occurred', 'through various experiences',
      'over the years', 'throughout my education', 'during my time',
      'as I have grown', 'in many ways', 'to some extent'
    ];
    return vague.filter(v => statement.toLowerCase().includes(v.toLowerCase()));
  };

  const identifySubject = (statement) => {
    const subjects = {
      'economics': ['economic', 'market', 'trade', 'inflation', 'gdp', 'econometric', 'finance'],
      'medicine': ['medical', 'patient', 'clinical', 'pathophysiology', 'anatomy', 'health'],
      'engineering': ['engineering', 'design', 'technical', 'optimization', 'systems', 'mechanical'],
      'computer science': ['algorithm', 'programming', 'computational', 'software', 'code', 'computer'],
      'physics': ['physics', 'quantum', 'relativity', 'particle', 'mechanics', 'energy'],
      'mathematics': ['mathematical', 'theorem', 'proof', 'algebra', 'calculus', 'statistics'],
      'chemistry': ['chemical', 'molecule', 'reaction', 'compound', 'organic', 'laboratory'],
      'biology': ['biological', 'organism', 'cell', 'evolution', 'ecology', 'genetics'],
      'psychology': ['psychological', 'behavior', 'cognitive', 'mental', 'therapy', 'research'],
      'history': ['historical', 'period', 'century', 'revolution', 'war', 'empire'],
      'english': ['literature', 'poetry', 'novel', 'author', 'narrative', 'literary'],
      'law': ['legal', 'justice', 'court', 'legislation', 'constitutional', 'rights']
    };
    
    for (const [subject, keywords] of Object.entries(subjects)) {
      if (keywords.some(keyword => statement.toLowerCase().includes(keyword))) {
        return subject;
      }
    }
    return null;
  };

  const assessTechnicalDepth = (statement) => {
    const technicalIndicators = [
      'methodology', 'analysis', 'research', 'study', 'investigation',
      'experiment', 'data', 'results', 'hypothesis', 'theory',
      'algorithm', 'optimization', 'statistical', 'mathematical'
    ];
    return technicalIndicators.filter(indicator => 
      statement.toLowerCase().includes(indicator.toLowerCase())
    ).length;
  };

  // Additional feedback generation functions
  const generateIntellectualFeedback = (score, content, statement) => {
    let narrative = '';
    let needsWork = null;
    let subtitle = '';
    
    if (score >= 8) {
      subtitle = "Strong analytical thinking demonstrated";
      narrative = `Your analytical abilities shine through clearly${content.academicTerms.length > 0 ? ` with sophisticated use of concepts like ${content.academicTerms.slice(0, 2).join(' and ')}` : ''}. `;
      
      if (content.specificExamples.length >= 2) {
        narrative += `The specific examples you provide (${content.specificExamples.slice(0, 2).join(', ')}) demonstrate concrete application of your thinking. `;
      }
      
      narrative += "This level of intellectual rigor will serve you well in university-level study.";
      
    } else if (score >= 6) {
      subtitle = "Good intellectual foundation";
      narrative = `Your statement shows developing analytical skills${content.academicTerms.length > 0 ? ` with use of terms like ${content.academicTerms[0]}` : ''}. `;
      needsWork = "Consider adding more examples of how you analyze problems or draw connections between different ideas.";
      
    } else {
      subtitle = "Limited intellectual depth shown";
      narrative = "Your statement would benefit from demonstrating more analytical thinking and intellectual curiosity. ";
      needsWork = "Add examples of how you question assumptions, analyze problems, or make connections between different concepts.";
    }
    
    return {
      score: score,
      title: `Intellectual Qualities: ${score.toFixed(1)}/10 ${score >= 8 ? '⭐' : score >= 6 ? '✅' : '⚠️'}`,
      subtitle: subtitle,
      narrative: narrative,
      needsWork: needsWork
    };
  };

  const generateCommunicationFeedback = (score, content, statement) => {
    let narrative = '';
    let quickFix = null;
    let subtitle = '';
    
    const avgSentenceLength = content.characterCount / Math.max(content.sentenceCount, 1);
    const avgParagraphLength = content.sentenceCount / Math.max(content.paragraphCount, 1);
    
    if (score >= 8) {
      subtitle = "Excellent communication and structure";
      narrative = `Your writing flows exceptionally well${content.connectionWords.length > 0 ? ` with effective use of connecting words like ${content.connectionWords.slice(0, 2).join(' and ')}` : ''}. `;
      
      if (content.progressionPhrases.length >= 2) {
        narrative += `The logical progression you create with phrases like "${content.progressionPhrases[0]}" makes your statement easy to follow. `;
      }
      
      narrative += "Your communication style is clear, engaging, and appropriate for university applications.";
      
    } else if (score >= 6) {
      subtitle = "Good communication with room for improvement";
      narrative = `Your writing is generally clear and well-structured. `;
      
      if (avgSentenceLength > 150) {
        narrative += "Some sentences are quite long - consider breaking them up for better readability. ";
        quickFix = "Aim for an average sentence length of 15-25 words for better flow.";
      } else if (content.connectionWords.length < 2) {
        quickFix = "Add more connecting words between paragraphs to improve flow and show logical progression.";
      }
      
    } else {
      subtitle = "Communication needs significant improvement";
      narrative = "Your statement has structural issues that make it harder to follow. ";
      
      if (content.listingPatterns > content.progressionPhrases.length * 2) {
        quickFix = "Transform activity lists into narrative flow by adding connecting phrases that show how experiences relate to each other.";
      } else {
        quickFix = "Focus on creating clearer paragraph structure and logical progression between ideas.";
      }
    }
    
    return {
      score: score,
      title: `Communication & Structure: ${score.toFixed(1)}/10 ${score >= 8 ? '⭐' : score >= 6 ? '✅' : '⚠️'}`,
      subtitle: subtitle,
      narrative: narrative,
      quickFix: quickFix
    };
  };

  const generatePersonalFeedback = (score, content, statement) => {
    let narrative = '';
    let actionable = null;
    let subtitle = '';
    
    if (score >= 7) {
      subtitle = "Good personal development shown";
      
      if (content.personalReflection.length >= 3) {
        narrative = `Excellent personal reflection! Your use of phrases like "${content.personalReflection.slice(0, 2).join('", "')}" shows real self-awareness and growth. `;
        narrative += "Universities want to see this kind of personal development alongside academic achievement.";
      } else {
        narrative = "Your statement shows some personal reflection, though there's room to demonstrate more growth and self-awareness.";
        actionable = "Add 1-2 more examples of how experiences changed you personally, not just academically.";
      }
      
    } else if (score >= 5) {
      subtitle = "Limited personal development shown";
      narrative = `Your statement focuses heavily on academic content but shows limited personal reflection. `;
      
      if (content.personalReflection.length > 0) {
        narrative += `While you mention "${content.personalReflection[0]}", you could explore this further. `;
      }
      
      actionable = "Add specific examples of how experiences challenged you personally and what you learned about yourself.";
      
    } else {
      subtitle = "Critical gap: No personal development";
      narrative = "MAJOR WEAKNESS: Your statement lacks personal reflection and growth narratives. Universities want to understand you as a person, not just as an academic profile. ";
      actionable = "URGENT: Add substantial content about how experiences changed you, challenged your assumptions, or helped you grow as a person.";
    }
    
    return {
      score: score,
      title: `Personal Development: ${score.toFixed(1)}/10 ${score >= 7 ? '⭐' : score >= 5 ? '✅' : '⚠️'}`,
      subtitle: subtitle,
      narrative: narrative,
      actionable: actionable
    };
  };

  const getContextualGrade = (score, content) => {
    if (score >= 9.0) return "A+ (Outstanding University Readiness)";
    if (score >= 8.5) return "A (Excellent University Readiness)";
    if (score >= 7.5) return "A- (Strong University Readiness)";
    if (score >= 6.5) return "B+ (Good University Readiness)";
    if (score >= 5.5) return "B (Acceptable University Readiness)";
    if (score >= 4.5) return "B- (Below Average - Needs Improvement)";
    if (score >= 3.5) return "C (Significant Issues - Major Revision Needed)";
    return "D (Critical Problems - Complete Rewrite Required)";
  };

  const generateOverallNarrative = (scores, content, targetUniversity) => {
    let narrative = '';
    
    // Academic strength assessment
    if (content.books.length >= 3 || content.academicTerms.length >= 3) {
      narrative += `This statement demonstrates excellent academic preparation${content.books.length > 0 ? ` with impressive reading including ${content.books.slice(0, 2).join(' and ')}` : ''}. `;
    }
    
    // Intellectual development
    if (content.progressionPhrases.length >= 3) {
      narrative += "The intellectual journey you've crafted shows real developmental thinking that universities specifically seek. ";
    } else if (content.listingPatterns > content.progressionPhrases.length) {
      narrative += "However, the statement leans toward activity listing rather than intellectual development - this weakens the overall impact. ";
    }
    
    // Subject engagement
    if (content.subject && content.specificExamples.length >= 2) {
      narrative += `Your engagement with ${content.subject} feels authentic and well-supported with specific examples. `;
    } else if (content.cliches.length >= 2) {
      narrative += "The passion for your subject could feel more authentic - avoid clichéd expressions in favor of specific incidents. ";
    }
    
    // Overall assessment
    const avgScore = (scores.academic + scores.intellectual + scores.engagement + scores.communication + scores.personal) / 5;
    
    if (avgScore >= 8) {
      narrative += "With minor refinements, this could be an exceptional statement that will strongly support your applications.";
    } else if (avgScore >= 7) {
      narrative += "This is a solid foundation that with targeted improvements could become highly competitive.";
    } else if (avgScore >= 6) {
      narrative += "The statement needs significant strengthening in key areas to meet university expectations.";
    } else {
      narrative += "Major revision is needed across multiple criteria to create a competitive application.";
    }
    
    return narrative;
  };

  const generateIntelligentPriorities = (scores, content, statement) => {
    const priorities = [];
    
    // Critical issues first
    if (content.listingPatterns > content.progressionPhrases.length * 2) {
      priorities.push({
        priority: "CRITICAL",
        issue: "Activity listing instead of development",
        solution: `Replace listing patterns with intellectual progression. You have ${content.listingPatterns} listing phrases vs ${content.progressionPhrases.length} progression phrases. Add causal connections like "This led me to..." between experiences.`
      });
    }
    
    if (content.personalReflection.length === 0) {
      priorities.push({
        priority: "HIGH",
        issue: "No personal development shown",
        solution: "Add 2-3 examples of how experiences changed you personally and what you learned about yourself, not just academically."
      });
    }
    
    if (content.cliches.length >= 3) {
      priorities.push({
        priority: "HIGH",
        issue: "Overuse of clichéd language",
        solution: `Replace generic phrases like "${content.cliches.slice(0, 2).join('", "')}" with specific incidents and personal discoveries.`
      });
    }
    
    // Academic improvements
    if (content.books.length < 2 && content.academicTerms.length < 2) {
      priorities.push({
        priority: "MEDIUM",
        issue: "Limited academic evidence",
        solution: "Add more university-level reading and technical terminology to demonstrate academic engagement beyond curriculum."
      });
    }
    
    // Structure improvements
    if (content.connectionWords.length < 2) {
      priorities.push({
        priority: "MEDIUM",
        issue: "Poor paragraph flow",
        solution: "Add connecting words and phrases between paragraphs to create logical progression and improve readability."
      });
    }
    
    // Character limit
    if (statement.length > 4000) {
      priorities.push({
        priority: "MEDIUM",
        issue: "Exceeds character limit",
        solution: `Reduce from ${statement.length} to 4,000 characters by removing filler language and redundant explanations.`
      });
    }
    
    return priorities.slice(0, 4); // Limit to top 4 priorities
  };

  const generateContextualStrengths = (scores, content, statement) => {
    const strengths = [];
    
    if (content.books.length >= 3) {
      strengths.push(`Impressive reading list demonstrating genuine academic curiosity (${content.books.length} sources mentioned)`);
    }
    
    if (content.academicTerms.length >= 3) {
      strengths.push(`Sophisticated academic vocabulary showing university-level understanding (${content.academicTerms.slice(0, 3).join(', ')})`);
    }
    
    if (content.progressionPhrases.length >= 3) {
      strengths.push("Clear intellectual development narrative showing how experiences built upon each other");
    }
    
    if (content.specificExamples.length >= 2) {
      strengths.push(`Concrete examples that make your experiences memorable and credible (${content.specificExamples.slice(0, 2).join(', ')})`);
    }
    
    if (content.subject && content.technicalDepth >= 3) {
      strengths.push(`Strong technical engagement with ${content.subject} beyond surface-level interest`);
    }
    
    if (content.personalReflection.length >= 2) {
      strengths.push("Good personal reflection showing self-awareness and growth mindset");
    }
    
    return strengths.length > 0 ? strengths : ["Statement shows basic structure and subject interest"];
  };

  const generateSmartConcerns = (scores, content, statement) => {
    const concerns = [];
    
    if (content.listingPatterns > content.progressionPhrases.length) {
      concerns.push(`Activity listing pattern detected (${content.listingPatterns} listing vs ${content.progressionPhrases.length} progression phrases)`);
    }
    
    if (content.cliches.length >= 2) {
      concerns.push(`Overuse of clichéd language undermines authenticity ("${content.cliches.slice(0, 2).join('", "')}")`);
    }
    
    if (content.fillerPhrases.length >= 2) {
      concerns.push("Excessive filler language reduces impact and wastes valuable character space");
    }
    
    if (content.personalReflection.length === 0) {
      concerns.push("No evidence of personal growth or self-reflection - universities want to see personal development");
    }
    
    if (statement.length > 4000) {
      concerns.push(`Exceeds UCAS character limit by ${statement.length - 4000} characters`);
    }
    
    if (content.vagueStatements.length >= 2) {
      concerns.push("Vague statements without specific details weaken credibility and memorability");
    }
    
    return concerns.length > 0 ? concerns : [];
  };

  const generateUniversityAdvice = (content, targetUniversity) => {
    const name = targetUniversity?.name?.toLowerCase() || '';
    const course = targetUniversity?.course?.toLowerCase() || '';
    
    if (name.includes('oxford') || name.includes('cambridge')) {
      return `For Oxbridge: Your ${content.academicTerms.length > 0 ? 'academic terminology shows tutorial readiness' : 'statement needs more academic sophistication'}. ${content.books.length >= 2 ? 'Reading list is appropriate for tutorial discussions.' : 'Add more university-level reading to demonstrate tutorial preparation.'}`;
    }
    
    if (name.includes('lse')) {
      return `For LSE: ${content.subject === 'economics' ? 'Strong subject match with LSE strengths' : 'Consider connecting your interests to LSE\'s strengths'}. ${content.specificExamples.length > 0 ? 'Policy-relevant examples align well with LSE values.' : 'Add policy-relevant thinking and real-world applications.'}`;
    }
    
    if (name.includes('imperial')) {
      return `For Imperial: ${content.technicalDepth >= 2 ? 'Technical depth shows good preparation' : 'Add more technical/scientific content'}. ${content.researchMentions.length > 0 ? 'Research experience aligns with Imperial\'s focus.' : 'Consider adding research or project experience.'}`;
    }
    
    if (course.includes('medicine')) {
      return `For Medicine: ${content.personalReflection.length > 0 ? 'Personal reflection important for medical schools' : 'Add substantial personal reflection and empathy examples'}. Include patient interaction experience and ethical awareness.`;
    }
    
    return `For ${targetUniversity.name}: Your ${content.academicTerms.length > 0 ? 'academic preparation' : 'statement'} ${content.books.length >= 2 ? 'shows good university readiness' : 'needs strengthening with more academic content'}.`;
  };

  const generateGradeJustification = (scores, content) => {
    const avgScore = (scores.academic + scores.intellectual + scores.engagement + scores.communication + scores.personal) / 5;
    
    let justification = '';
    
    if (avgScore >= 8.5) {
      justification = `This statement demonstrates exceptional university readiness with ${content.books.length >= 3 ? 'outstanding academic preparation' : 'strong intellectual engagement'}${content.progressionPhrases.length >= 3 ? ' and excellent developmental narrative' : ''}. Minor refinements could make this truly exceptional.`;
    } else if (avgScore >= 7.5) {
      justification = `Strong university readiness shown through ${content.academicTerms.length >= 2 ? 'good academic engagement' : 'developing intellectual curiosity'}. ${content.listingPatterns > content.progressionPhrases.length ? 'Main improvement needed is transforming activity listing into intellectual development.' : 'Primary areas for improvement are well-defined and achievable.'}`;
    } else if (avgScore >= 6.5) {
      justification = `Acceptable foundation with ${content.books.length > 0 ? 'some academic content' : 'basic subject engagement'}. ${content.cliches.length >= 2 ? 'Significant improvement needed in authenticity and avoiding clichés.' : 'Multiple areas need strengthening for competitive applications.'}`;
    } else if (avgScore >= 5.5) {
      justification = `Below university expectations. ${content.listingPatterns > content.progressionPhrases.length * 2 ? 'Critical issue: activity listing instead of intellectual development.' : 'Major revision needed across academic content, personal reflection, and structure.'}`;
    } else {
      justification = `Significant problems across multiple criteria. ${content.personalReflection.length === 0 ? 'No personal development shown.' : ''} Complete restructuring required to meet university standards.`;
    }
    
    return justification;
  };

  // University-specific advice generator
  const getUniversitySpecificAdvice = (university) => {
    const name = university?.name?.toLowerCase() || '';
    const course = university?.course?.toLowerCase() || '';
    
    if (name.includes('oxford') || name.includes('cambridge')) {
      return "Your academic reading list is exactly what Oxbridge tutors want to see. The mathematical economics content shows tutorial readiness. Consider adding one sentence about how you'd contribute to tutorial discussions.";
    }
    
    if (name.includes('lse')) {
      return "LSE values the kind of policy-relevant thinking you show. Your development economics focus aligns well with their strengths. The Current Affairs society leadership demonstrates the kind of intellectual engagement they seek.";
    }
    
    if (course.includes('ppe')) {
      return "Your cross-disciplinary thinking (history→economics) is perfect for PPE. The political economy elements (North Korea analysis) show PPE readiness. Consider briefly mentioning philosophical thinking if you have any.";
    }
    
    return "Your academic preparation shows strong university readiness. The independent research and mathematical content demonstrate the analytical skills needed for degree-level study.";
  };

  // Enhanced scoring rubric that integrates with intelligent feedback system
  const calculateDetailedScores = (statement, evidence) => {
    const scores = {
      academic: assessAcademicCriteria(statement, evidence),
      intellectual: assessIntellectualQualities(statement),
      engagement: assessSubjectEngagement(statement),
      communication: assessCommunicationStructure(statement),
      personal: assessPersonalDevelopment(statement),
      factual: assessFactualAccuracy(statement),
      universityFit: assessUniversityFit(statement, evidence?.universityTargets)
    };
    
    // Calculate overall score as weighted average
    const weights = {
      academic: 0.25,
      intellectual: 0.20,
      engagement: 0.20,
      communication: 0.15,
      personal: 0.20
    };
    
    scores.overallScore = (
      scores.academic * weights.academic +
      scores.intellectual * weights.intellectual +
      scores.engagement * weights.engagement +
      scores.communication * weights.communication +
      scores.personal * weights.personal
    );
    
    return scores;
  };

  // Additional assessment functions to support the detailed scoring
  const assessAcademicCriteria = (statement, evidence) => {
    let score = 5;
    // Add logic to assess academic engagement based on evidence and statement content
    if (evidence?.books?.length > 3) score += 2;
    if (evidence?.insights?.length > 5) score += 1.5;
    return Math.min(score, 10);
  };

  const assessIntellectualQualities = (statement) => {
    let score = 5;
    // Check for analytical thinking indicators
    const analyticalWords = ['analyze', 'synthesize', 'evaluate', 'compare', 'contrast', 'examine'];
    const foundWords = analyticalWords.filter(word => statement.toLowerCase().includes(word));
    score += foundWords.length * 0.5;
    return Math.min(score, 10);
  };

  const assessSubjectEngagement = (statement) => {
    let score = 5;
    // Check for passion and specific engagement
    const passionWords = ['fascinated', 'intrigued', 'passionate', 'interested', 'curious'];
    const foundWords = passionWords.filter(word => statement.toLowerCase().includes(word));
    score += foundWords.length * 0.7;
    return Math.min(score, 10);
  };

  const assessCommunicationStructure = (statement) => {
    let score = 5;
    // Check for good structure indicators
    const structureWords = ['furthermore', 'however', 'therefore', 'moreover', 'consequently'];
    const foundWords = structureWords.filter(word => statement.toLowerCase().includes(word));
    score += foundWords.length * 0.3;
    
    // Check for paragraph length variety (basic heuristic)
    const sentences = statement.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 8) score += 1;
    
    return Math.min(score, 10);
  };

  const assessPersonalDevelopment = (statement) => {
    let score = 4;
    // Check for reflection and growth indicators
    const reflectionWords = ['learned', 'discovered', 'realized', 'understood', 'developed', 'grew'];
    const foundWords = reflectionWords.filter(word => statement.toLowerCase().includes(word));
    score += foundWords.length * 0.8;
    return Math.min(score, 10);
  };

  const assessFactualAccuracy = (statement) => {
    // Basic implementation - can be enhanced with fact-checking
    return 7.5;
  };

  const assessUniversityFit = (statement, targets) => {
    if (!targets?.length) return 7;
    // Implementation would check alignment with university values/requirements
    return 8;
  };

  // This function is used by analyzeStatementAdvanced - keep existing implementation
  const generateStrengths = (scores) => {
    const strengths = [];
    
    if (scores.academicCriteria >= 8) {
      strengths.push('Excellent demonstration of academic engagement with university-level content');
    }
    if (scores.intellectualQualities >= 8) {
      strengths.push('Strong evidence of critical thinking and independent intellectual development');
    }
    if (scores.intellectualDevelopment >= 8) {
      strengths.push('Outstanding intellectual development journey with clear progression and causal connections');
    } else if (scores.intellectualDevelopment >= 7) {
      strengths.push('Good intellectual development shown through connected experiences and growth');
    }
    if (scores.subjectEngagement >= 8) {
      strengths.push('Clear passion and deep engagement with the subject beyond curriculum requirements');
    }
    if (scores.communicationStructure >= 8) {
      strengths.push('Well-structured narrative with excellent flow and coherence');
    }

    return strengths;
  };

  const generateWeaknesses = (scores) => {
    const weaknesses = [];
    
    if (scores.academicCriteria < 6) {
      weaknesses.push('Limited evidence of engagement with university-level academic content');
    }
    if (scores.intellectualDevelopment < 5) {
      weaknesses.push('Statement reads more like activity listing rather than intellectual development journey');
    }
    if (scores.intellectualDevelopment < 3) {
      weaknesses.push('Critical weakness: No clear progression or causal connections between experiences - appears to just list activities');
    }
    if (scores.personalDevelopment < 5) {
      weaknesses.push('Insufficient reflection on personal growth and learning journey');
    }
    if (scores.subjectEngagement < 6) {
      weaknesses.push('Could demonstrate stronger passion and commitment to the subject');
    }

    return weaknesses;
  };

  const generateImprovements = (scores, statement) => {
    const improvements = [];
    
    if (scores.academicCriteria < 7) {
      improvements.push('Include more specific references to academic texts or concepts');
    }
    if (scores.intellectualQualities < 7) {
      improvements.push('Demonstrate more critical analysis and independent thinking');
    }
    if (scores.intellectualDevelopment < 6) {
      improvements.push('CRITICAL: Transform activity listing into intellectual journey - show how each experience built on the previous one using phrases like "this led me to..." and "building on this..."');
    }
    if (scores.intellectualDevelopment < 4) {
      improvements.push('URGENT: Add causal connections between experiences. Example: "Taking an edX course on economics led me to read academic papers, which prompted me to conduct independent research on market behavior"');
    }
    if (statement.length > 4000) {
      improvements.push('Reduce length to meet UCAS character limit (4,000 characters)');
    }
    if (scores.universitySpecific < 6) {
      improvements.push('Add more specific references to the target university and course');
    }
    
    // Filler language specific improvements
    if (scores.fillerLanguagePenalty > 1.5) {
      improvements.push('Remove filler language and vague statements - replace with specific examples and concrete details');
    }
    if (scores.fillerLanguagePenalty > 1.0) {
      improvements.push('Avoid clichéd phrases like "passion for," "unique perspective," and "make a difference"');
    }
    if (scores.fillerLanguagePenalty > 0.8) {
      improvements.push('Replace generic interest statements with specific incidents and detailed explanations');
    }
    if (statement.includes('I became interested') && !statement.includes('specifically')) {
      improvements.push('When describing how your interest developed, provide specific details about what happened and why it mattered');
    }
    if (scores.fillerLanguagePenalty > 0.5) {
      improvements.push('Eliminate meaningless qualifiers (very, extremely, really) and empty concluding phrases');
    }

    return improvements;
  };

  // Component rendering continues with enhanced UI...
  const EvidencePickerSection = () => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      padding: '40px',
      borderRadius: '32px',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
      marginBottom: '32px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ 
          ...TYPOGRAPHY.h3,
          margin: '0 0 12px 0', 
          color: COLORS.darkGreen,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}></span>
          Intelligent Evidence Selection
        </h3>
        <p style={{ 
          ...TYPOGRAPHY.body,
          margin: '0', 
          color: COLORS.mediumGreen,
          fontWeight: '500'
        }}>
          Our AI analyzes your evidence against university admission criteria. Higher scores indicate stronger personal statement value.
        </p>
      </div>

      {/* University Target Selector - Apple-inspired */}
      {universityTargets?.length > 1 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.85) 100%)',
          backdropFilter: 'blur(16px)',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '12px', 
            ...TYPOGRAPHY.h6,
            fontWeight: '600', 
            color: COLORS.darkGreen 
          }}>
            🎯 Optimize for University:
          </label>
          <select
            value={targetUniversity?.name || ''}
            onChange={(e) => {
              const selected = universityTargets.find(uni => uni.name === e.target.value);
              setTargetUniversity(selected);
            }}
            style={{
              width: '100%',
              padding: '16px 20px',
              border: '2px solid rgba(91, 143, 138, 0.2)',
              borderRadius: '16px',
              ...TYPOGRAPHY.body,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.primary;
              e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(91, 143, 138, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {universityTargets.map((uni, index) => (
              <option key={index} value={uni.name}>
                {uni.name} - {uni.course}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Enhanced Evidence Sections */}
      {renderEnhancedEvidenceSection('Books', 'books', books, '📚')}
      {renderEnhancedEvidenceSection('Insights', 'insights', insights, '💡')}
      {renderEnhancedEvidenceSection('Project Insights', 'projects', projectEngagements, '🚀')}
    </div>
  );

  const renderEnhancedEvidenceSection = (title, key, items, icon) => {
    if (items.length === 0) return null;

    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        padding: '32px',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
        marginBottom: '24px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <h5 style={{ 
          ...TYPOGRAPHY.h5,
          margin: '0 0 24px 0', 
          color: COLORS.darkGreen,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          {title} 
          <span style={{
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            ...TYPOGRAPHY.caption,
            fontWeight: '600',
            marginLeft: 'auto'
          }}>
            {items.filter((_, idx) => selectedEvidence[key].includes(idx) || selectedEvidence[key].includes(items[idx]?.title || items[idx]?.name || items[idx]?.id)).length}/{items.length} selected
          </span>
        </h5>
        
        <div style={{ display: 'grid', gap: '16px' }}>
          {items.map((item, index) => {
            const scoring = scoreEvidence(item, key.slice(0, -1)); // Remove 's' from key
            const itemId = item.title || item.name || item.id || index;
            const isSelected = selectedEvidence[key].includes(itemId) || selectedEvidence[key].includes(index);
            
            return (
              <div key={index} style={{
                background: isSelected 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                padding: '24px',
                borderRadius: '20px',
                border: isSelected 
                  ? `2px solid ${COLORS.primary}`
                  : `2px solid ${getScoreColor(scoring.score)}40`,
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected
                  ? `0 12px 40px ${COLORS.primary}20`
                  : '0 8px 32px rgba(0, 0, 0, 0.08)',
                transform: 'translateY(0)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => toggleEvidence(key, itemId, index)}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = isSelected
                  ? `0 16px 48px ${COLORS.primary}25`
                  : '0 12px 40px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = isSelected
                  ? `0 12px 40px ${COLORS.primary}20`
                  : '0 8px 32px rgba(0, 0, 0, 0.08)';
              }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h6 style={{ 
                      ...TYPOGRAPHY.h6,
                      margin: '0 0 8px 0', 
                      color: COLORS.darkGreen,
                      fontWeight: '700'
                    }}>
                      {item.title || item.name || 
                        (item.bookId && books.find(b => b.id === item.bookId) ? 
                          `${books.find(b => b.id === item.bookId)?.title}${books.find(b => b.id === item.bookId)?.author ? ` by ${books.find(b => b.id === item.bookId)?.author}` : ''}` : 
                          null) || 
                        (item.concept && item.concept !== 'Book Insight' && `${item.concept}: ${item.learning}`) ||
                        (item.type === 'full_response' && 'Study Buddy - Full Response') ||
                        (item.originalThought && `Study Buddy: ${item.originalThought.substring(0, 60)}...`) ||
                        (item.application && `Application: ${item.application.substring(0, 50)}...`) ||
                        'Unnamed item'}
                    </h6>
                    {(item.evidence || item.content || item.description || item.reflection || item.application || item.insight || item.learning) && (
                      <p style={{ 
                        ...TYPOGRAPHY.bodySmall,
                        margin: '0', 
                        color: COLORS.mediumGreen,
                        lineHeight: '1.5'
                      }}>
                        {item.evidence || item.content || item.description || item.reflection || item.insight || item.learning || item.application}
                      </p>
                    )}
                    
                    {/* Display original thought for Study Buddy insights */}
                    {item.originalThought && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: 'linear-gradient(135deg, rgba(0, 206, 209, 0.1) 0%, rgba(91, 143, 138, 0.1) 100%)',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 206, 209, 0.2)'
                      }}>
                        <div style={{
                          ...TYPOGRAPHY.caption,
                          color: COLORS.primary,
                          fontWeight: '700',
                          marginBottom: '4px'
                        }}>
                          🧠 Original Question:
                        </div>
                        <p style={{ 
                          ...TYPOGRAPHY.bodySmall,
                          margin: '0', 
                          color: COLORS.darkGreen,
                          lineHeight: '1.4',
                          fontStyle: 'italic'
                        }}>
                          {item.originalThought}
                        </p>
                      </div>
                    )}
                    
                    {/* Display book insights if they exist */}
                    {item.insights && item.insights.length > 0 && (
                      <div style={{ 
                        marginTop: '12px',
                        padding: '16px',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(139, 92, 246, 0.1)'
                      }}>
                        <div style={{ 
                          ...TYPOGRAPHY.caption,
                          color: COLORS.primary,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '8px'
                        }}>
                          💡 Insights ({item.insights.length})
                        </div>
                        {item.insights.map((insight, idx) => (
                          <div key={insight.id || idx} style={{
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '8px',
                            marginBottom: idx < item.insights.length - 1 ? '8px' : '0',
                            border: '1px solid rgba(139, 92, 246, 0.1)'
                          }}>
                            <p style={{ 
                              ...TYPOGRAPHY.bodySmall,
                              margin: '0', 
                              color: COLORS.darkGreen,
                              lineHeight: '1.4'
                            }}>
                              {insight.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginLeft: '20px', textAlign: 'center' }}>
                    <div style={{
                      background: `linear-gradient(135deg, ${getScoreColor(scoring.score)}, ${getScoreColor(scoring.score)}CC)`,
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      ...TYPOGRAPHY.caption,
                      fontWeight: '700',
                      marginBottom: '6px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(8px)'
                    }}>
                      {scoring.score.toFixed(1)}/10
                    </div>
                    <div style={{ 
                      ...TYPOGRAPHY.caption,
                      color: COLORS.mediumGreen,
                      fontWeight: '500'
                    }}>
                      {scoring.recommendation.split(' - ')[0]}
                    </div>
                  </div>
                </div>

                {/* Enhanced scoring breakdown - Apple-inspired */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  padding: '16px',
                  borderRadius: '16px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        ...TYPOGRAPHY.caption,
                        color: COLORS.mediumGreen,
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>Academic</div>
                      <div style={{ 
                        ...TYPOGRAPHY.bodySmall,
                        fontWeight: '700',
                        color: COLORS.darkGreen
                      }}>{scoring.breakdown.academicDepth.toFixed(1)}/4</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        ...TYPOGRAPHY.caption,
                        color: COLORS.mediumGreen,
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>Relevance</div>
                      <div style={{ 
                        ...TYPOGRAPHY.bodySmall,
                        fontWeight: '700',
                        color: COLORS.darkGreen
                      }}>{scoring.breakdown.universityRelevance.toFixed(1)}/3</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        ...TYPOGRAPHY.caption,
                        color: COLORS.mediumGreen,
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>Personal</div>
                      <div style={{ 
                        ...TYPOGRAPHY.bodySmall,
                        fontWeight: '700',
                        color: COLORS.darkGreen
                      }}>{scoring.breakdown.personalEngagement.toFixed(1)}/2</div>
                    </div>
                  </div>
                </div>

                {/* Improvement suggestions - Apple-inspired */}
                {scoring.improvementSuggestions.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>💡</span>
                    <span style={{ 
                      ...TYPOGRAPHY.caption,
                      color: '#92400e',
                      fontWeight: '600',
                      lineHeight: '1.4'
                    }}>
                      {scoring.improvementSuggestions[0]}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 8.5) return '#10b981'; // Green
    if (score >= 7) return '#3b82f6';   // Blue
    if (score >= 5.5) return '#f59e0b'; // Yellow
    if (score >= 4) return '#ef4444';   // Red
    return '#6b7280'; // Gray
  };

  const toggleEvidence = (category, itemId, index) => {
    const currentIds = selectedEvidence[category];
    const identifier = itemId !== undefined ? itemId : index;
    
    if (currentIds.includes(identifier)) {
      setSelectedEvidence(prev => ({
        ...prev,
        [category]: currentIds.filter(id => id !== identifier)
      }));
    } else {
      setSelectedEvidence(prev => ({
        ...prev,
        [category]: [...currentIds, identifier]
      }));
    }
  };

  const StatementGeneratorSection = () => (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '20px', fontWeight: '600' }}>
          ✨ University-Optimized Statement Generator
        </h3>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
          Generate a personalized statement optimized for your target university's admission criteria.
        </p>
      </div>

      {/* Generation Controls */}
      <div style={{
        background: '#f8fafc',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Target University:
          </label>
          <div style={{
            padding: '8px 12px',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            {targetUniversity ? `${targetUniversity.name} - ${targetUniversity.course}` : 'No target selected'}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h6 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Selected Evidence Summary:
          </h6>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
            <span>{selectedEvidence.books.length} books</span>
            <span>{selectedEvidence.insights.length} insights</span>
            <span>{selectedEvidence.projects.length} projects</span>
          </div>
        </div>


        <button
          onClick={handleGenerateStatement}
          disabled={isGenerating || Object.values(selectedEvidence).every(arr => arr.length === 0)}
          style={{
            background: isGenerating ? '#e5e7eb' : '#8b5cf6',
            color: isGenerating ? '#9ca3af' : 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isGenerating ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #d1d5db',
                borderTop: '2px solid #9ca3af',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Generating University-Optimized Statement...
            </>
          ) : (
            '✨ Generate Personal Statement'
          )}
        </button>
      </div>


      {/* Generated Statement Display */}
      {generatedStatement && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: '0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
              Generated Personal Statement
            </h4>
            <div style={{
              background: wordCount > 4000 ? '#fef2f2' : wordCount > 3500 ? '#fffbeb' : '#f0fdf4',
              color: wordCount > 4000 ? '#dc2626' : wordCount > 3500 ? '#d97706' : '#166534',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {wordCount}/4,000 characters
            </div>
          </div>
          
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            lineHeight: '1.6',
            fontSize: '14px',
            color: '#374151',
            whiteSpace: 'pre-wrap'
          }}>
            {generatedStatement}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => navigator.clipboard?.writeText(generatedStatement)}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              📋 Copy to Clipboard
            </button>
            <button
              onClick={() => {
                const element = document.createElement('a');
                const file = new Blob([generatedStatement], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = 'personal_statement.txt';
                element.click();
              }}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              💾 Download
            </button>
          </div>
        </div>
      )}

      {/* Advanced Analysis */}
      {scoringAnalysis && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #a8dcc6'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
            📈 Advanced Statement Analysis
          </h4>

          {/* Overall Score */}
          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Overall Score</span>
              <div style={{
                background: getScoreColor(scoringAnalysis.overallScore),
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '700'
              }}>
                {scoringAnalysis.overallScore.toFixed(1)}/10
              </div>
            </div>
            <div style={{
              background: '#e5e7eb',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
              marginTop: '8px'
            }}>
              <div style={{
                background: getScoreColor(scoringAnalysis.overallScore),
                height: '100%',
                width: `${scoringAnalysis.overallScore * 10}%`,
                borderRadius: '4px'
              }} />
            </div>
          </div>

          {/* Detailed Criteria Scores */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {Object.entries(scoringAnalysis.criteriaScores).map(([criterion, score]) => {
              const isFillerPenalty = criterion === 'fillerLanguagePenalty';
              const displayName = isFillerPenalty 
                ? 'Filler Language Penalty' 
                : criterion.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              
              return (
                <div key={criterion} style={{
                  background: isFillerPenalty ? '#fef2f2' : 'white',
                  padding: '12px',
                  borderRadius: '6px',
                  border: isFillerPenalty ? '1px solid #fecaca' : '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                    {displayName}
                  </div>
                  <div style={{
                    background: isFillerPenalty 
                      ? (score > 1.5 ? '#dc2626' : score > 1.0 ? '#ea580c' : score > 0.5 ? '#d97706' : '#6b7280')
                      : getScoreColor(score),
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'inline-block'
                  }}>
                    {isFillerPenalty ? `-${score.toFixed(1)}` : `${score.toFixed(1)}/10`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* University Fit Score */}
          {scoringAnalysis.universityFit > 0 && (
            <div style={{
              background: '#f0f9ff',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #0ea5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
                  🎯 {targetUniversity?.name} Fit Score
                </span>
                <div style={{
                  background: '#0ea5e9',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {scoringAnalysis.universityFit.toFixed(1)}/10
                </div>
              </div>
            </div>
          )}

          {/* Strengths */}
          {scoringAnalysis.strengths.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h6 style={{ margin: '0 0 8px 0', color: '#059669', fontSize: '14px', fontWeight: '600' }}>
                ✅ Strengths
              </h6>
              {scoringAnalysis.strengths.map((strength, index) => (
                <div key={index} style={{
                  background: '#f0fdf4',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '13px',
                  color: '#166534',
                  border: '1px solid #bbf7d0'
                }}>
                  {strength}
                </div>
              ))}
            </div>
          )}

          {/* Improvements */}
          {scoringAnalysis.improvements.length > 0 && (
            <div>
              <h6 style={{ margin: '0 0 8px 0', color: '#d97706', fontSize: '14px', fontWeight: '600' }}>
                🔧 Suggested Improvements
              </h6>
              {scoringAnalysis.improvements.map((improvement, index) => (
                <div key={index} style={{
                  background: '#fffbeb',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '13px',
                  color: '#92400e',
                  border: '1px solid #fed7aa'
                }}>
                  {improvement}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // Statement Grading Section Component
  const StatementGradingSection = () => {
    const [inputStatement, setInputStatement] = useState('');
    const [gradingResults, setGradingResults] = useState(null);
    const [isGrading, setIsGrading] = useState(false);
    const [eligibility, setEligibility] = useState(null);
    const [previousStatements, setPreviousStatements] = useState([]);
    const [showPreviousStatements, setShowPreviousStatements] = useState(false);
    const [loadingEligibility, setLoadingEligibility] = useState(true);

    // Check eligibility and load previous statements on mount
    useEffect(() => {
      const checkUserEligibility = async () => {
        // Load saved draft from user-specific storage first
        userStorage.migrateExistingData(['personalStatementDraft']);
        const savedDraft = userStorage.getItem('personalStatementDraft', '');
        if (savedDraft) {
          setInputStatement(savedDraft);
        }

        if (!auth.currentUser) {
          setLoadingEligibility(false);
          return;
        }

        try {
          const eligibilityResult = await checkGradingEligibility(auth.currentUser.uid);
          setEligibility(eligibilityResult);

          // Load previous statements
          const statementsResult = await getUserStatements(auth.currentUser.uid);
          if (statementsResult.success && statementsResult.statements.length > 0) {
            setPreviousStatements(statementsResult.statements);
            // If free user with existing statement, load it (only if no saved draft)
            if (!savedDraft && !eligibilityResult.isPaid && statementsResult.statements.length > 0) {
              const latestStatement = statementsResult.statements[0];
              setInputStatement(latestStatement.statement || '');
              setGradingResults(latestStatement.gradingResults || null);
            }
          }
        } catch (error) {
          console.error('Error checking eligibility:', error);
        } finally {
          setLoadingEligibility(false);
        }
      };

      checkUserEligibility();
    }, []);

    // Save draft to user-specific storage whenever inputStatement changes
    useEffect(() => {
      if (inputStatement) {
        userStorage.setItem('personalStatementDraft', inputStatement);
      }
    }, [inputStatement]);

    const handleGradeStatement = async () => {
      console.log('=== Statement Grading Section Analysis Started ===');
      console.log('Input statement length:', inputStatement.length);
      console.log('Statement preview:', inputStatement.substring(0, 200) + '...');
      
      if (!inputStatement.trim()) {
        alert('Please paste your personal statement to grade');
        return;
      }

      if (inputStatement.trim().length < 100) {
        alert('Personal statement must be at least 100 characters long for analysis.');
        return;
      }

      // Check if user is logged in
      if (!auth.currentUser) {
        alert('Please log in to grade your personal statement');
        return;
      }

      // Check eligibility for free users
      if (eligibility && !eligibility.canGrade) {
        alert(eligibility.message || 'You have reached your grading limit. Please upgrade to premium for unlimited grading.');
        return;
      }

      setIsGrading(true);
      
      try {
        console.log('Importing analyzePersonalStatement...');
        const { analyzePersonalStatement } = await import('../services/personalStatementAnalyzer');
        
        console.log('Calling analyzePersonalStatement with OpenAI...');
        
        // Determine target course from university targets
        const targetCourse = (universityTargets && universityTargets.length > 0) 
          ? universityTargets[0].targetCourse || '' 
          : '';
        
        console.log('Target course determined:', targetCourse);
        console.log('University targets available:', !!universityTargets, 'Count:', universityTargets?.length || 0);
        
        const analysisResult = await analyzePersonalStatement(inputStatement, targetCourse);
        
        console.log('Analysis result received:', analysisResult);
        console.log('Overall score:', analysisResult?.overallScore);
        console.log('Has insights:', !!analysisResult?.insights);
        console.log('Analysis result keys:', Object.keys(analysisResult || {}));
        console.log('Insights structure:', analysisResult?.insights);
        console.log('Detailed analysis structure:', analysisResult?.detailedAnalysis);
        console.log('Narrative analysis structure:', analysisResult?.narrativeAnalysis);
        console.log('Top priorities:', analysisResult?.topPriorities);
        console.log('Using OpenAI:', analysisResult?.overallScore ? 'YES' : 'FALLBACK');
        
        // Transform the analysis result into the format expected by the UI
        const detailedFeedback = {
          overallScore: analysisResult.overallScore || 5,
          grade: analysisResult.grade || (analysisResult.overallScore >= 8 ? 'A - Excellent' : analysisResult.overallScore >= 6 ? 'B - Good' : 'C - Satisfactory'),
          
          // Add detailed sections from OpenAI narrativeAnalysis
          ...(analysisResult.narrativeAnalysis || {}),
          
          // Add weighted scoring details
          detailedScores: analysisResult.detailedScores || {},
          academicCriteria: analysisResult.academicCriteria || 0,
          intellectualQualities: analysisResult.intellectualQualities || 0,
          subjectEngagement: analysisResult.subjectEngagement || 0,
          communicationStructure: analysisResult.communicationStructure || 0,
          personalDevelopment: analysisResult.personalDevelopment || 0,
          factualAccuracy: analysisResult.factualAccuracy || 0,
          
          // Add key feedback arrays that the UI expects
          keyStrengths: analysisResult.keyStrengths || analysisResult.insights?.strengths || [],
          concerns: analysisResult.concerns || analysisResult.insights?.improvements || [],
          topPriorities: analysisResult.topPriorities || [],
          overallNarrative: analysisResult.overallNarrative || '',
          
          // Add university-specific advice if available
          universityAdvice: analysisResult.universityAdvice || '',
          gradeJustification: analysisResult.gradeJustification || `Score of ${(analysisResult.overallScore || 5).toFixed(1)}/10 reflects the overall quality and university readiness demonstrated in this personal statement.`,
          calculationNotes: analysisResult.calculationNotes || '',
          redFlags: analysisResult.redFlags || [],
          
          // Add raw OpenAI data for debugging
          _rawOpenAI: analysisResult
        };
        
        console.log('Transformed feedback for UI:', detailedFeedback);
        console.log('Feedback has specificFeedback?', !!detailedFeedback.specificFeedback);
        console.log('Feedback has strengths?', !!detailedFeedback.strengths?.length);
        console.log('Feedback has improvements?', !!detailedFeedback.improvements?.length);
        setGradingResults(detailedFeedback);
        
        // Save the graded statement to Firestore
        try {
          const saveResult = await saveGradedStatement(auth.currentUser.uid, {
            statement: inputStatement,
            gradingResults: detailedFeedback,
            targetCourse: targetCourse,
            wordCount: inputStatement.split(/\s+/).length,
            version: previousStatements.length + 1
          });
          
          if (saveResult.success) {
            console.log('Statement saved successfully:', saveResult.statementId);
            // Refresh the statements list
            const statementsResult = await getUserStatements(auth.currentUser.uid);
            if (statementsResult.success) {
              setPreviousStatements(statementsResult.statements);
            }
          }
        } catch (saveError) {
          console.error('Error saving statement:', saveError);
          // Don't alert on save error - the grading still succeeded
        }
        
      } catch (error) {
        console.error('Error in handleGradeStatement:', error);
        console.error('Error details:', error.message);
        
        // Fallback to local analysis
        console.log('Falling back to local generateDetailedFeedback...');
        const detailedFeedback = generateDetailedFeedback(
          inputStatement, 
          { books: books || [], insights: insights || [], projects: [...(highLevelProjects || []), ...(mediumLevelActivities || [])] },
          universityTargets || []
        );
        
        setGradingResults(detailedFeedback);
        alert(`Analysis completed with local fallback. Error: ${error.message}`);
      } finally {
        setIsGrading(false);
      }
    };

    return (
      <div 
        data-grading-section="true"
        style={{
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #a8dcc6'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
             Grade Your Personal Statement
          </h4>
          <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
            Get detailed feedback with actionable improvements for your personal statement
          </p>
        </div>

        {/* Eligibility Status */}
        {loadingEligibility ? (
          <div style={{
            background: '#f3f4f6',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Loading grading eligibility...
          </div>
        ) : eligibility && (
          <div style={{
            background: eligibility.canGrade ? '#dcfce7' : '#fee2e2',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid ${eligibility.canGrade ? '#86efac' : '#fca5a5'}`
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: eligibility.canGrade ? '#15803d' : '#991b1b',
              fontWeight: '500'
            }}>
              {eligibility.isPaid ? (
                <>✅ Premium Member - Unlimited Grading</>
              ) : eligibility.canGrade ? (
                <>📝 {eligibility.remainingGrades} free grading available</>
              ) : (
                <>❌ {eligibility.message}</>
              )}
            </div>
          </div>
        )}

        {/* Previous Statements for Premium Users */}
        {eligibility?.isPaid && previousStatements.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowPreviousStatements(!showPreviousStatements)}
              style={{
                background: 'transparent',
                border: '1px solid #d1d5db',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📚 Previous Statements ({previousStatements.length})
              <span style={{ marginLeft: 'auto' }}>
                {showPreviousStatements ? '▼' : '▶'}
              </span>
            </button>
            
            {showPreviousStatements && (
              <div style={{
                marginTop: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {previousStatements.map((stmt, index) => (
                  <div
                    key={stmt.id}
                    style={{
                      padding: '12px',
                      borderBottom: index < previousStatements.length - 1 ? '1px solid #e5e7eb' : 'none',
                      cursor: 'pointer',
                      background: 'white',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    onClick={() => {
                      setInputStatement(stmt.statement);
                      setGradingResults(stmt.gradingResults);
                      setShowPreviousStatements(false);
                    }}
                  >
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}>
                      Version {stmt.version || index + 1} - Score: {stmt.overallScore?.toFixed(1) || 'N/A'}/10
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280' 
                    }}>
                      {new Date(stmt.createdAt?.seconds ? stmt.createdAt.seconds * 1000 : stmt.createdAt).toLocaleDateString()}
                      {stmt.targetCourse && ` • ${stmt.targetCourse}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statement Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Paste Your Personal Statement
          </label>
          <textarea
            value={inputStatement}
            onChange={(e) => setInputStatement(e.target.value)}
            placeholder="Paste your personal statement here for detailed grading and feedback..."
            style={{
              width: '100%',
              height: '200px',
              padding: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ 
            marginTop: '4px',
            fontSize: '12px',
            color: inputStatement.length > 4000 ? '#dc2626' : '#6b7280'
          }}>
            {inputStatement.length}/4,000 characters
            {inputStatement.length > 4000 && ' (Over UCAS limit)'}
          </div>
        </div>

        {/* Grade Button */}
        <button
          onClick={handleGradeStatement}
          disabled={isGrading || !inputStatement.trim() || (eligibility && !eligibility.canGrade)}
          style={{
            background: (isGrading || (eligibility && !eligibility.canGrade)) ? '#9ca3af' : '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: (isGrading || (eligibility && !eligibility.canGrade)) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isGrading && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          {isGrading ? 'Analyzing Statement...' : 
           eligibility && !eligibility.canGrade ? '🔒 Upgrade for More Grading' : 
           '🎯 Grade My Statement'}
        </button>

        {/* Enhanced Grading Results */}
        {gradingResults && (
          <div style={{ marginTop: '32px' }}>
            {/* Overall Grade Header */}
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: 'white',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
                {gradingResults.overallScore.toFixed(1)}/10
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>
                {gradingResults.grade}
              </div>
            </div>

            {/* Detailed Feedback Sections */}
            {Object.entries(gradingResults).map(([key, section]) => {
              if (key === 'overallScore' || key === 'grade' || !section?.title) return null;
              
              return (
                <div key={key} style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '16px', 
                      fontWeight: '700',
                      color: '#111827'
                    }}>
                      {section.title}
                    </h5>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '14px', 
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      {section.subtitle}
                    </p>
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: '#374151',
                    marginBottom: '16px'
                  }}>
                    {section.narrative}
                  </div>
                  
                  {section.standoutMoment && (
                    <div style={{
                      background: '#f0fdf4',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      marginBottom: '12px'
                    }}>
                      <strong style={{ color: '#059669' }}>Standout Moment: </strong>
                      <span style={{ color: '#166534' }}>{section.standoutMoment}</span>
                    </div>
                  )}
                  
                  {section.needsWork && (
                    <div style={{
                      background: '#fffbeb',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #fed7aa',
                      marginBottom: '12px'
                    }}>
                      <strong style={{ color: '#d97706' }}>Needs Work: </strong>
                      <span style={{ color: '#92400e' }}>{section.needsWork}</span>
                    </div>
                  )}
                  
                  {section.advice && (
                    <div style={{
                      background: '#f0f9ff',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <strong style={{ color: '#0369a1' }}>Advice: </strong>
                      <span style={{ color: '#1e40af' }}>{section.advice}</span>
                    </div>
                  )}
                  
                  {section.quickFix && (
                    <div style={{
                      background: '#f0f9ff',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <strong style={{ color: '#0369a1' }}>Quick Fix: </strong>
                      <span style={{ color: '#1e40af' }}>{section.quickFix}</span>
                    </div>
                  )}
                  
                  {section.actionable && (
                    <div style={{
                      background: '#fef2f2',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      <strong style={{ color: '#dc2626' }}>Action Needed: </strong>
                      <span style={{ color: '#991b1b' }}>{section.actionable}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Overall Narrative */}
            {gradingResults.overallNarrative && (
              <div style={{
                background: '#f8fafc',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0'
              }}>
                <h5 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  color: '#111827'
                }}>
                  📝 Overall Assessment
                </h5>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.7',
                  color: '#374151',
                  whiteSpace: 'pre-line'
                }}>
                  {gradingResults.overallNarrative}
                </div>
              </div>
            )}

            {/* Top Priorities */}
            {gradingResults.topPriorities && (
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #e5e7eb'
              }}>
                <h5 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  color: '#111827'
                }}>
                  🎯 Priority Improvements
                </h5>
                {gradingResults.topPriorities.map((item, index) => (
                  <div key={index} style={{
                    marginBottom: '16px',
                    padding: '16px',
                    borderRadius: '8px',
                    border: `2px solid ${
                      item.priority === 'HIGH' ? '#dc2626' : 
                      item.priority === 'MEDIUM' ? '#d97706' : '#059669'
                    }`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        background: item.priority === 'HIGH' ? '#dc2626' : 
                                  item.priority === 'MEDIUM' ? '#d97706' : '#059669',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '12px'
                      }}>
                        {item.priority}
                      </span>
                      <strong style={{ fontSize: '14px', color: '#111827' }}>
                        {item.issue}
                      </strong>
                    </div>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '14px', 
                      color: '#6b7280',
                      lineHeight: '1.6'
                    }}>
                      {item.solution}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Key Strengths */}
            {gradingResults.keyStrengths && (
              <div style={{
                background: '#f0fdf4',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #bbf7d0'
              }}>
                <h5 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  color: '#059669'
                }}>
                  ✅ Key Strengths
                </h5>
                {gradingResults.keyStrengths.map((strength, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: '#059669', marginRight: '8px', marginTop: '2px' }}>•</span>
                    <span style={{ fontSize: '14px', color: '#166534', lineHeight: '1.6' }}>
                      {strength}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Concerns */}
            {gradingResults.concerns && (
              <div style={{
                background: '#fef2f2',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #fecaca'
              }}>
                <h5 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  color: '#dc2626'
                }}>
                  ⚠️ Areas of Concern
                </h5>
                {gradingResults.concerns.map((concern, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: '#dc2626', marginRight: '8px', marginTop: '2px' }}>•</span>
                    <span style={{ fontSize: '14px', color: '#991b1b', lineHeight: '1.6' }}>
                      {concern}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* University Advice */}
            {gradingResults.universityAdvice && (
              <div style={{
                background: '#f0f9ff',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #bfdbfe'
              }}>
                <h5 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  color: '#0369a1'
                }}>
                  🎓 University-Specific Advice
                </h5>
                <p style={{ 
                  margin: '0', 
                  fontSize: '14px', 
                  color: '#1e40af',
                  lineHeight: '1.6'
                }}>
                  {gradingResults.universityAdvice}
                </p>
              </div>
            )}

            {/* Grade Justification */}
            {gradingResults.gradeJustification && (
              <div style={{
                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #d1d5db'
              }}>
                <h5 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  color: '#111827'
                }}>
                  📊 Grade Justification
                </h5>
                <p style={{ 
                  margin: '0', 
                  fontSize: '14px', 
                  color: '#374151',
                  lineHeight: '1.6'
                }}>
                  {gradingResults.gradeJustification}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Saved Statements History Component
  const SavedStatementsSection = () => {
    const [savedStatements, setSavedStatements] = useState([]);
    const [loadingStatements, setLoadingStatements] = useState(true);
    const [selectedStatement, setSelectedStatement] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
      const loadSavedStatements = async () => {
        if (!auth.currentUser) {
          setLoadingStatements(false);
          return;
        }

        try {
          const result = await getUserStatements(auth.currentUser.uid);
          if (result.success) {
            setSavedStatements(result.statements);
          }
        } catch (error) {
          console.error('Error loading saved statements:', error);
        } finally {
          setLoadingStatements(false);
        }
      };

      loadSavedStatements();
    }, []);

    const getGradeColor = (score) => {
      if (score >= 8) return '#10b981';
      if (score >= 6) return '#3b82f6';
      if (score >= 4) return '#f59e0b';
      return '#ef4444';
    };

    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            color: '#111827', 
            fontSize: '18px', 
            fontWeight: '600' 
          }}>
            Your Statement History
          </h4>
          <p style={{ 
            margin: '0', 
            color: '#6b7280', 
            fontSize: '14px' 
          }}>
            Review your previously graded personal statements and track your progress
          </p>
        </div>

        {loadingStatements ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280'
          }}>
            Loading your saved statements...
          </div>
        ) : savedStatements.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px dashed #d1d5db'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              No statements graded yet. Grade your first statement to see it here!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {savedStatements.map((stmt) => (
              <div
                key={stmt.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Statement Header */}
                <div
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    background: expandedId === stmt.id ? '#f9fafb' : 'white',
                    borderBottom: expandedId === stmt.id ? '1px solid #e5e7eb' : 'none'
                  }}
                  onClick={() => setExpandedId(expandedId === stmt.id ? null : stmt.id)}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          background: getGradeColor(stmt.overallScore || 0),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {(stmt.overallScore || 0).toFixed(1)}/10
                        </span>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#111827'
                        }}>
                          {stmt.gradingResults?.grade || 'Graded Statement'}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '16px',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        <span>
                          📅 {new Date(stmt.createdAt?.seconds ? stmt.createdAt.seconds * 1000 : stmt.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          📝 {stmt.wordCount || stmt.statement?.split(/\s+/).length || 0} words
                        </span>
                        {stmt.targetCourse && (
                          <span>🎯 {stmt.targetCourse}</span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      transform: expandedId === stmt.id ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.3s ease',
                      fontSize: '20px',
                      color: '#9ca3af'
                    }}>
                      ▼
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === stmt.id && (
                  <div style={{ padding: '20px' }}>
                    {/* Statement Text */}
                    <div style={{
                      background: '#f9fafb',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}>
                      <h5 style={{ 
                        margin: '0 0 12px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Statement Text
                      </h5>
                      <div style={{
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#4b5563',
                        maxHeight: '200px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {stmt.statement}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    {stmt.gradingResults?.detailedScores && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '12px',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          background: '#f0f9ff',
                          padding: '12px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: '600',
                            color: '#0369a1'
                          }}>
                            {stmt.gradingResults.academicCriteria?.toFixed(1) || 'N/A'}
                          </div>
                          <div style={{ 
                            fontSize: '12px',
                            color: '#64748b'
                          }}>
                            Academic
                          </div>
                        </div>
                        <div style={{
                          background: '#fef3c7',
                          padding: '12px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: '600',
                            color: '#d97706'
                          }}>
                            {stmt.gradingResults.intellectualQualities?.toFixed(1) || 'N/A'}
                          </div>
                          <div style={{ 
                            fontSize: '12px',
                            color: '#64748b'
                          }}>
                            Intellectual
                          </div>
                        </div>
                        <div style={{
                          background: '#ede9fe',
                          padding: '12px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: '600',
                            color: '#7c3aed'
                          }}>
                            {stmt.gradingResults.communicationStructure?.toFixed(1) || 'N/A'}
                          </div>
                          <div style={{ 
                            fontSize: '12px',
                            color: '#64748b'
                          }}>
                            Communication
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feedback Sections */}
                    {stmt.gradingResults?.overallNarrative && (
                      <div style={{
                        background: '#f8fafc',
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '16px'
                      }}>
                        <h5 style={{ 
                          margin: '0 0 8px 0',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#111827'
                        }}>
                          Overall Assessment
                        </h5>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#4b5563'
                        }}>
                          {stmt.gradingResults.overallNarrative}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <button
                        onClick={() => {
                          // Load this statement into the grading section
                          setActiveSection('statement-grading');
                          // Small delay to ensure section switches first
                          setTimeout(() => {
                            const gradingSection = document.querySelector('[data-grading-section]');
                            if (gradingSection) {
                              gradingSection.scrollIntoView({ behavior: 'smooth' });
                            }
                          }, 100);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        View Full Feedback
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(stmt.statement);
                          alert('Statement copied to clipboard!');
                        }}
                        style={{
                          padding: '10px 20px',
                          background: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{
        background: 'radial-gradient(ellipse at center, rgba(216, 240, 237, 0.3) 0%, transparent 70%)',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Subtle background overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, padding: '0 8px' }}>
        {/* Header - Apple-inspired */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          padding: '40px 48px',
          borderRadius: '32px',
          marginBottom: '32px',
          border: '1px solid rgba(91, 143, 138, 0.3)',
          boxShadow: '0 16px 48px rgba(91, 143, 138, 0.12)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundImage: `url(${ICONS.bulb})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              marginRight: '24px',
              transform: 'scale(1.1)'
            }}></div>
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                ...TYPOGRAPHY.h2,
                margin: '0 0 8px 0', 
                color: COLORS.darkGreen
              }}>
                Personal Statement Builder
              </h2>
              <p style={{ 
                ...TYPOGRAPHY.body,
                margin: '0', 
                color: COLORS.mediumGreen,
                fontWeight: '500'
              }}>
                AI-powered evidence analysis and statement generation
              </p>
            </div>
            {/* Builder Status Summary */}
            <div style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'center'
            }}>
              <div style={{
                padding: '12px 20px',
                background: `linear-gradient(135deg, ${COLORS.mint}, rgba(255, 255, 255, 0.9))`,
                borderRadius: '16px',
                border: `1px solid ${COLORS.mediumGreen}30`,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  ...TYPOGRAPHY.h4,
                  color: COLORS.darkGreen,
                  margin: '0 0 4px 0'
                }}>
                  {wordCount}
                </div>
                <div style={{ 
                  ...TYPOGRAPHY.caption,
                  color: COLORS.mediumGreen,
                  fontWeight: '600'
                }}>
                  Characters
                </div>
              </div>
              <div style={{
                padding: '12px 20px',
                background: `linear-gradient(135deg, ${COLORS.lavenderLight}, rgba(255, 255, 255, 0.9))`,
                borderRadius: '16px',
                border: `1px solid ${COLORS.purpleDark}30`,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                textAlign: 'center'
              }}>
                <div style={{ 
                  ...TYPOGRAPHY.h4,
                  color: COLORS.purpleDark,
                  margin: '0 0 4px 0'
                }}>
                  {Object.values(selectedEvidence).flat().length}
                </div>
                <div style={{ 
                  ...TYPOGRAPHY.caption,
                  color: COLORS.purpleDark,
                  fontWeight: '600'
                }}>
                  Evidence Items
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Apple-inspired */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '32px',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}>
          {[
            { id: 'evidence-picker', label: 'Evidence Analysis', icon: '🤠' },
            { id: 'statement-generator', label: 'Statement Generator', icon: '' },
            { id: 'statement-grading', label: 'Grade My Statement', icon: '' },
            { id: 'saved-statements', label: 'Saved Statements', icon: '🤓' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                background: activeSection === tab.id 
                  ? `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)` 
                  : 'transparent',
                border: 'none',
                padding: '16px 24px',
                borderRadius: '20px',
                cursor: 'pointer',
                ...TYPOGRAPHY.bodySmall,
                fontWeight: activeSection === tab.id ? '700' : '600',
                color: activeSection === tab.id ? 'white' : '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: activeSection === tab.id ? '0 8px 24px rgba(0, 206, 209, 0.3)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateY(0)',
                textShadow: activeSection === tab.id ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                minWidth: '140px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== tab.id) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== tab.id) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.background = 'transparent';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeSection === 'evidence-picker' && <EvidencePickerSection />}
        {activeSection === 'statement-generator' && <StatementGeneratorSection />}
        {activeSection === 'statement-grading' && <StatementGradingSection />}
        {activeSection === 'saved-statements' && <SavedStatementsSection />}
        </div>
      </div>
    </>
  );
};

export default EnhancedPersonalStatementBuilder;