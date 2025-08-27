/**
 * Enhanced Insight Extraction System
 * Extracts structured, detailed insights from study conversations
 * Designed for university application evidence building
 */

export class EnhancedInsightExtractor {
  constructor(profile = {}) {
    this.profile = profile;
    this.currentSubjects = profile?.currentSubjects || [];
    this.universityTargets = profile?.universityTargets || [];
    this.userArchetype = profile?.userArchetype;
  }

  /**
   * Extract structured insights from conversation text
   */
  extractInsights(conversationText, context = {}) {
    const insights = [];
    const sentences = this.splitIntoSentences(conversationText);
    
    // Different extraction strategies based on content type
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const nextSentence = sentences[i + 1];
      const contextWindow = sentences.slice(Math.max(0, i - 2), i + 3).join(' ');
      
      // Extract different types of insights
      const conceptualInsight = this.extractConceptualInsight(sentence, contextWindow, context);
      if (conceptualInsight) insights.push(conceptualInsight);
      
      const connectionInsight = this.extractConnectionInsight(sentence, contextWindow, context);
      if (connectionInsight) insights.push(connectionInsight);
      
      const applicationInsight = this.extractApplicationInsight(sentence, contextWindow, context);
      if (applicationInsight) insights.push(applicationInsight);
      
      const reflectiveInsight = this.extractReflectiveInsight(sentence, contextWindow, context);
      if (reflectiveInsight) insights.push(reflectiveInsight);
    }
    
    // Deduplicate and score insights
    const uniqueInsights = this.deduplicateInsights(insights);
    return uniqueInsights.map(insight => this.scoreInsight(insight));
  }

  /**
   * Extract conceptual understanding insights
   */
  extractConceptualInsight(sentence, context, metadata) {
    // Patterns indicating conceptual learning
    const conceptPatterns = [
      /(?:I (?:learned|discovered|realized|understood) (?:that|how))\s+(.+)/i,
      /(?:This (?:shows|demonstrates|illustrates|reveals))\s+(.+)/i,
      /(?:The concept of|The idea that|The principle of)\s+(.+)/i,
      /(?:What's fascinating|What's interesting) (?:is|about) (.+)/i,
      /(?:This (?:explains|clarifies|illuminates))\s+(?:why|how|that)\s+(.+)/i
    ];

    for (const pattern of conceptPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        const concept = this.extractKeyTerm(sentence);
        const learning = match[1].trim();
        
        if (this.isSubstantialInsight(learning) && concept) {
          return {
            type: 'conceptual',
            concept: concept,
            learning: learning,
            context: this.cleanContext(context),
            source: this.identifySource(context, metadata),
            subjectArea: this.identifySubjectArea(sentence),
            academicLevel: this.assessAcademicLevel(learning),
            universityRelevance: this.assessUniversityRelevance(learning, concept),
            intellectualDepth: this.assessIntellectualDepth(learning),
            personalEngagement: this.assessPersonalEngagement(sentence, context),
            timestamp: new Date().toISOString(),
            evidenceStrength: 0 // Will be scored later
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract connection-making insights
   */
  extractConnectionInsight(sentence, context, metadata) {
    const connectionPatterns = [
      /(?:This (?:connects to|relates to|links with))\s+(.+)/i,
      /(?:I can see (?:how|the connection between))\s+(.+)/i,
      /(?:This (?:reminds me of|is similar to))\s+(.+)/i,
      /(?:The relationship between .+ and .+)\s+(.*)/i,
      /(?:This (?:builds on|extends))\s+(.+)/i
    ];

    for (const pattern of connectionPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        const connection = match[1].trim();
        const primaryConcept = this.extractKeyTerm(sentence);
        const secondaryConcept = this.extractSecondaryConnection(sentence);
        
        if (this.isSubstantialConnection(connection)) {
          return {
            type: 'connection',
            primaryConcept: primaryConcept,
            secondaryConcept: secondaryConcept,
            connection: connection,
            context: this.cleanContext(context),
            source: this.identifySource(context, metadata),
            subjectArea: this.identifySubjectArea(sentence),
            interdisciplinary: this.isInterdisciplinary(primaryConcept, secondaryConcept),
            synthesisLevel: this.assessSynthesisLevel(connection),
            universityRelevance: this.assessUniversityRelevance(connection, primaryConcept),
            intellectualDepth: this.assessIntellectualDepth(connection),
            timestamp: new Date().toISOString(),
            evidenceStrength: 0
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract application-focused insights
   */
  extractApplicationInsight(sentence, context, metadata) {
    const applicationPatterns = [
      /(?:This (?:could be used|applies) (?:to|in|for))\s+(.+)/i,
      /(?:In practice|Practically|In the real world),?\s+(.+)/i,
      /(?:This (?:helps (?:explain|understand)|is relevant to))\s+(.+)/i,
      /(?:I could use this (?:to|for|in))\s+(.+)/i,
      /(?:This has implications for)\s+(.+)/i
    ];

    for (const pattern of applicationPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        const application = match[1].trim();
        const concept = this.extractKeyTerm(sentence);
        
        if (this.isSubstantialApplication(application)) {
          return {
            type: 'application',
            concept: concept,
            application: application,
            context: this.cleanContext(context),
            source: this.identifySource(context, metadata),
            subjectArea: this.identifySubjectArea(sentence),
            practicalRelevance: this.assessPracticalRelevance(application),
            careerRelevance: this.assessCareerRelevance(application),
            universityRelevance: this.assessUniversityRelevance(application, concept),
            innovationPotential: this.assessInnovationPotential(application),
            timestamp: new Date().toISOString(),
            evidenceStrength: 0
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract reflective insights showing personal development
   */
  extractReflectiveInsight(sentence, context, metadata) {
    const reflectivePatterns = [
      /(?:This (?:made me think|got me thinking|made me realize))\s+(.+)/i,
      /(?:I (?:now (?:understand|see|appreciate))|My perspective (?:on|of) .+ (?:has )?changed)\s+(.+)/i,
      /(?:This (?:challenges|questions) my (?:previous )?(?:understanding|assumptions))\s+(.+)/i,
      /(?:I'm (?:starting to|beginning to) (?:see|understand))\s+(.+)/i,
      /(?:This (?:deepened|enhanced) my (?:understanding|appreciation) of)\s+(.+)/i
    ];

    for (const pattern of reflectivePatterns) {
      const match = sentence.match(pattern);
      if (match) {
        const reflection = match[1].trim();
        const concept = this.extractKeyTerm(sentence);
        
        if (this.isSubstantialReflection(reflection)) {
          return {
            type: 'reflective',
            concept: concept,
            reflection: reflection,
            context: this.cleanContext(context),
            source: this.identifySource(context, metadata),
            subjectArea: this.identifySubjectArea(sentence),
            personalGrowth: this.assessPersonalGrowth(reflection),
            metacognitive: this.assessMetacognitive(reflection),
            universityRelevance: this.assessUniversityRelevance(reflection, concept),
            intellectualMaturity: this.assessIntellectualMaturity(reflection),
            timestamp: new Date().toISOString(),
            evidenceStrength: 0
          };
        }
      }
    }
    return null;
  }

  /**
   * Score insight based on university application value
   */
  scoreInsight(insight) {
    let score = 0;

    // Academic level and sophistication
    score += insight.academicLevel * 2;
    score += insight.intellectualDepth * 2;
    
    // University relevance
    score += insight.universityRelevance * 3;
    
    // Subject specificity
    if (insight.subjectArea && this.isTargetSubject(insight.subjectArea)) {
      score += 3;
    }
    
    // Personal engagement and reflection
    score += (insight.personalEngagement || 0) * 1.5;
    score += (insight.personalGrowth || 0) * 1.5;
    
    // Interdisciplinary connections
    if (insight.interdisciplinary) score += 2;
    
    // Practical application potential
    score += (insight.practicalRelevance || 0) * 1;
    score += (insight.innovationPotential || 0) * 1.5;
    
    // Bonus for specific insight types valued by universities
    if (insight.type === 'connection' && insight.synthesisLevel > 7) score += 2;
    if (insight.type === 'reflective' && insight.intellectualMaturity > 7) score += 2;
    if (insight.type === 'conceptual' && insight.academicLevel > 8) score += 3;
    
    insight.evidenceStrength = Math.min(Math.round(score), 10);
    insight.psRecommended = score >= 7;
    
    return insight;
  }

  /**
   * Helper methods for assessment
   */
  assessAcademicLevel(text) {
    let level = 1;
    
    // Technical terminology
    if (this.containsAcademicTerminology(text)) level += 3;
    
    // Complex sentence structures
    if (text.length > 100 && text.includes(',')) level += 1;
    
    // Subject-specific concepts
    if (this.containsSubjectSpecificConcepts(text)) level += 2;
    
    // University-level thinking
    if (this.showsUniversityLevelThinking(text)) level += 3;
    
    return Math.min(level, 10);
  }

  assessUniversityRelevance(text, concept) {
    let relevance = 1;
    
    // Check against target universities and courses
    this.universityTargets.forEach(target => {
      if (text.toLowerCase().includes(target.course?.toLowerCase() || '')) {
        relevance += 4;
      }
      if (concept && concept.toLowerCase().includes(target.course?.toLowerCase() || '')) {
        relevance += 3;
      }
    });
    
    // General university indicators
    const universityKeywords = [
      'research', 'analysis', 'theory', 'methodology', 'framework',
      'hypothesis', 'dissertation', 'academic', 'scholarly', 'critical thinking'
    ];
    
    universityKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) relevance += 1;
    });
    
    return Math.min(relevance, 10);
  }

  assessIntellectualDepth(text) {
    let depth = 1;
    
    // Abstract thinking indicators
    const abstractIndicators = [
      'implications', 'consequences', 'underlying', 'fundamental',
      'paradigm', 'perspective', 'framework', 'philosophical'
    ];
    
    abstractIndicators.forEach(indicator => {
      if (text.toLowerCase().includes(indicator)) depth += 1;
    });
    
    // Question generation
    if (text.includes('?') || text.includes('why') || text.includes('how')) depth += 1;
    
    // Complexity of reasoning
    if (text.includes('because') || text.includes('therefore') || text.includes('thus')) depth += 1;
    
    return Math.min(depth, 10);
  }

  assessPersonalEngagement(sentence, context) {
    let engagement = 1;
    
    const engagementIndicators = [
      'fascinated', 'intrigued', 'passionate', 'curious', 'excited',
      'love', 'enjoy', 'amazing', 'incredible', 'brilliant'
    ];
    
    engagementIndicators.forEach(indicator => {
      if (sentence.toLowerCase().includes(indicator)) engagement += 2;
    });
    
    // First person engagement
    if (sentence.includes('I ') || sentence.includes('my ')) engagement += 1;
    
    return Math.min(engagement, 10);
  }

  // Utility methods
  splitIntoSentences(text) {
    return text.match(/[^\.!?]+[\.!?]+/g) || [text];
  }

  extractKeyTerm(sentence) {
    // Extract the most significant academic term from the sentence
    const words = sentence.toLowerCase().split(' ');
    const academicTerms = words.filter(word => 
      word.length > 6 && 
      !this.isCommonWord(word) &&
      this.couldBeAcademicTerm(word)
    );
    
    return academicTerms[0] || null;
  }

  identifySource(context, metadata) {
    // Try to identify the source of the insight from context
    if (metadata?.currentActivity) return metadata.currentActivity;
    
    const sourceIndicators = [
      { pattern: /reading (.+)/i, prefix: 'Book: ' },
      { pattern: /watching (.+)/i, prefix: 'Video: ' },
      { pattern: /lecture (?:on|about) (.+)/i, prefix: 'Lecture: ' },
      { pattern: /course (?:on|about) (.+)/i, prefix: 'Course: ' }
    ];
    
    for (const indicator of sourceIndicators) {
      const match = context.match(indicator.pattern);
      if (match) {
        return indicator.prefix + match[1];
      }
    }
    
    return 'Study session';
  }

  identifySubjectArea(text) {
    const subjectKeywords = {
      'Mathematics': ['equation', 'theorem', 'proof', 'calculus', 'algebra'],
      'Physics': ['force', 'energy', 'quantum', 'relativity', 'particle'],
      'Chemistry': ['molecule', 'reaction', 'catalyst', 'bond', 'element'],
      'Economics': ['market', 'supply', 'demand', 'inflation', 'gdp'],
      'Biology': ['cell', 'organism', 'evolution', 'gene', 'species'],
      'History': ['revolution', 'empire', 'war', 'society', 'culture'],
      'English': ['literature', 'poetry', 'narrative', 'character', 'theme'],
      'Psychology': ['behavior', 'cognitive', 'consciousness', 'perception']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return subject;
      }
    }
    
    return 'General';
  }

  isSubstantialInsight(text) {
    return text.length > 20 && 
           text.split(' ').length > 4 &&
           !this.isTooGeneric(text);
  }

  isSubstantialConnection(text) {
    return text.length > 15 && 
           (text.includes(' and ') || text.includes(' with ') || text.includes(' to '));
  }

  isSubstantialApplication(text) {
    return text.length > 15 && 
           !text.includes('just') && 
           !text.includes('maybe');
  }

  isSubstantialReflection(text) {
    return text.length > 20 && 
           text.split(' ').length > 5;
  }

  isTooGeneric(text) {
    const genericPhrases = [
      'it is interesting', 'it is good', 'it is nice',
      'i like it', 'it helps', 'it is useful'
    ];
    
    return genericPhrases.some(phrase => 
      text.toLowerCase().includes(phrase)
    );
  }

  containsAcademicTerminology(text) {
    const academicTerms = [
      'analysis', 'methodology', 'theoretical', 'empirical',
      'hypothesis', 'paradigm', 'framework', 'synthesis'
    ];
    
    return academicTerms.some(term => 
      text.toLowerCase().includes(term)
    );
  }

  deduplicateInsights(insights) {
    const seen = new Set();
    return insights.filter(insight => {
      const key = `${insight.type}-${insight.concept}-${insight.learning || insight.connection || insight.application || insight.reflection}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  cleanContext(context) {
    return context.replace(/\s+/g, ' ').trim().substring(0, 200);
  }

  // Additional helper methods...
  isCommonWord(word) {
    const common = ['the', 'and', 'but', 'for', 'are', 'with', 'they', 'have', 'this', 'that', 'from', 'will', 'been'];
    return common.includes(word);
  }

  couldBeAcademicTerm(word) {
    return !word.match(/^\d+$/) && // Not just numbers
           word.length > 4 &&
           !this.isCommonWord(word);
  }

  isTargetSubject(subjectArea) {
    return this.currentSubjects.some(subject => 
      subject.name?.toLowerCase().includes(subjectArea.toLowerCase()) ||
      subjectArea.toLowerCase().includes(subject.name?.toLowerCase() || '')
    );
  }

  showsUniversityLevelThinking(text) {
    const universityIndicators = [
      'critically', 'analytically', 'theoretically', 'conceptually',
      'systematically', 'rigorously', 'comprehensively'
    ];
    
    return universityIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
  }

  containsSubjectSpecificConcepts(text) {
    // This would be expanded with comprehensive subject-specific terminology
    return text.length > 50 && 
           text.split(' ').filter(word => word.length > 8).length > 2;
  }

  // Assessment methods for specific insight types
  assessSynthesisLevel(connection) {
    if (connection.includes('different') && connection.includes('fields')) return 8;
    if (connection.includes('theory') && connection.includes('practice')) return 7;
    if (connection.includes('concept') && connection.includes('application')) return 6;
    return 5;
  }

  assessPersonalGrowth(reflection) {
    const growthIndicators = ['changed', 'developed', 'improved', 'enhanced', 'deepened'];
    return growthIndicators.some(indicator => 
      reflection.toLowerCase().includes(indicator)
    ) ? 8 : 5;
  }

  assessMetacognitive(reflection) {
    const metacognitiveIndicators = ['thinking about', 'aware of', 'understanding how'];
    return metacognitiveIndicators.some(indicator => 
      reflection.toLowerCase().includes(indicator)
    ) ? 8 : 4;
  }

  assessIntellectualMaturity(reflection) {
    if (reflection.includes('complexity') || reflection.includes('nuanced')) return 9;
    if (reflection.includes('perspective') || reflection.includes('viewpoint')) return 7;
    return 5;
  }

  assessPracticalRelevance(application) {
    if (application.includes('real world') || application.includes('practical')) return 8;
    if (application.includes('industry') || application.includes('career')) return 7;
    return 5;
  }

  assessCareerRelevance(application) {
    return this.universityTargets.some(target => 
      application.toLowerCase().includes(target.course?.toLowerCase() || '')
    ) ? 9 : 4;
  }

  assessInnovationPotential(application) {
    const innovationWords = ['new', 'novel', 'innovative', 'creative', 'original'];
    return innovationWords.some(word => 
      application.toLowerCase().includes(word)
    ) ? 8 : 4;
  }

  isInterdisciplinary(primaryConcept, secondaryConcept) {
    if (!primaryConcept || !secondaryConcept) return false;
    
    const subject1 = this.identifySubjectArea(primaryConcept);
    const subject2 = this.identifySubjectArea(secondaryConcept);
    
    return subject1 !== subject2 && subject1 !== 'General' && subject2 !== 'General';
  }

  extractSecondaryConnection(sentence) {
    // Extract secondary concept being connected
    const words = sentence.split(' ');
    const connectWords = ['to', 'with', 'and', 'between'];
    
    for (let i = 0; i < words.length; i++) {
      if (connectWords.includes(words[i].toLowerCase()) && i + 1 < words.length) {
        return words.slice(i + 1, i + 4).join(' ');
      }
    }
    
    return null;
  }
}

// Export for use in StudyBuddy component
export default EnhancedInsightExtractor;