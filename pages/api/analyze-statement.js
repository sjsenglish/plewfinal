export default async function handler(req, res) {
  console.log('API Handler called - Method:', req.method, 'URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Set proper CORS headers
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://examrizzsearch.com', 'https://www.examrizzsearch.com']
    : ['http://localhost:3000'];
  
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Credentials', true);
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-HTTP-Method-Override, Cache-Control, Pragma'
  );

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  // Check for method override header
  const effectiveMethod = req.headers['x-http-method-override'] || req.method;
  console.log('Effective method after override check:', effectiveMethod);

  // Handle GET requests (browser navigation) with informative response
  if (req.method === 'GET') {
    console.log('GET request received - likely browser navigation');
    return res.status(200).json({
      message: 'Personal Statement Analysis API Endpoint',
      usage: 'This endpoint accepts POST requests with statement data',
      expectedMethod: 'POST',
      expectedPayload: {
        statement: 'string (required, min 100 chars)',
        targetCourse: 'string (optional)',
        wordCount: 'number (optional)'
      },
      currentRequest: {
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (req.method !== 'POST' && effectiveMethod !== 'POST') {
    console.log('Method not allowed:', req.method, 'Effective:', effectiveMethod);
    return res.status(405).json({ 
      error: 'Method not allowed',
      received: req.method,
      effectiveMethod: effectiveMethod,
      expected: 'POST',
      url: req.url,
      acceptedMethods: ['POST'],
      note: 'GET requests show API information, POST requests process statements'
    });
  }
  
  console.log('Processing POST request');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Request body type:', typeof req.body);
  console.log('Request body keys:', Object.keys(req.body || {}));

  try {
    const { statement, targetCourse = '', wordCount = 0 } = req.body || {};
    
    console.log('Extracted data - Statement length:', statement?.length, 'Course:', targetCourse, 'Words:', wordCount);

    if (!statement || statement.trim().length < 100) {
      return res.status(400).json({ error: 'Statement must be at least 100 characters long' });
    }

    const systemPrompt = `You are a distinguished university admissions tutor who provides sophisticated, narrative-driven analysis. You must CORRECTLY IDENTIFY and REWARD academic excellence.

## CRITICAL CALIBRATION STANDARDS:
**HIGH ACADEMIC ENGAGEMENT INDICATORS:**
- University-level sources (Landes, Collier, Sachs, Intriligator, academic papers) = 8.5-9.0 Academic Criteria
- Mathematical/technical sophistication (genetic algorithms, optimization theory, advanced concepts) = EXCEPTIONAL rating
- 4+ serious academic books = Strong academic preparation (7.5+ overall)

**INTELLECTUAL PROGRESSION DETECTION:**
- Count "this led me to," "wanting to learn more," "drawn to," "looking further into" as PROGRESSION phrases
- Count "I have," "I also," "I achieved" as LISTING phrases
- "Reading X led me to Y" = Clear intellectual development
- Mathematical concepts in humanities context = Interdisciplinary sophistication

**PROPER SCORING EXPECTATIONS:**
- Statement with university-level books + mathematical content + intellectual progression = 7.5-8.5 overall
- Exceptional academic reading lists should score 8.5-9.0 on Academic Criteria
- Clear intellectual journey should score 7.5+ on Intellectual Development

## YOUR ANALYSIS STYLE:
- Write like you're having a conversation with the student about their intellectual journey
- Reference specific books, concepts, experiences they mentioned by name
- Explain WHY things work or don't work from an admissions perspective  
- Use engaging, authentic language that shows you've really read their statement
- Provide specific, actionable advice based on what they actually wrote
- Balance encouragement with honest critique like a real tutor would
- REWARD academic excellence appropriately - don't under-score strong statements

## EXACT SCORING FRAMEWORK TO FOLLOW:

### 1. Academic Criteria (40% total weight)
**Knowledge Appropriateness (10%):** Content matches A-level+ with beyond-curriculum evidence
- 9-10: Perfect A-level+ with strong extension beyond syllabus
- 7-8: Mostly appropriate level with good extension
- 5-6: Generally appropriate but some gaps/overreach
- 3-4: Significant level concerns
- 0-2: Major misalignment

**Academic Relevance & Sophistication (15%):** University-level engagement (8%) + Theoretical depth (7%)
- University-level engagement: 
  * 7-8: Multiple heavyweight academic sources (Landes, Collier, Sachs, Intriligator, research papers)
  * 5-6: Some academic engagement mixed with accessible sources
  * 3-4: Over-reliance on popular science/media
- Theoretical depth: 
  * 6-7: Mathematical/technical sophistication (genetic algorithms, optimization theory, advanced frameworks)
  * 4-5: Some theoretical understanding
  * 2-3: Surface-level only

**Understanding Depth (10%):** Genuine comprehension and cross-connections
- 9-10: Excellent comprehension with cross-topic connections
- 7-8: Good understanding with some connections  
- 5-6: Basic understanding, limited connections
- 3-4: Surface-level, repetition without comprehension
- 0-2: Minimal understanding or miscomprehension

**Self-Assessment Accuracy (5%):** Realistic positioning as learner
- 5: Perfect learner positioning
- 4: Mostly realistic with minor overstatement
- 3: Some overstatement but not concerning
- 2: Significant overstatement
- 0-1: Severe overconfidence

### 2. Intellectual Qualities (25% total weight)
**Analytical Thinking (10%):** Analysis, synthesis, building upon established knowledge
- 9-10: Excellent cross-connections (Weimar → Zimbabwe → Korea development patterns)
- 7-8: Good analytical skills with connections
- 5-6: Basic analysis

**Genuine Curiosity (8%):** Look for PROGRESSION phrases: "this led me to," "wanting to learn more," "drawn to"
- 7-8: Clear intellectual progression with evidence of independent exploration
- 5-6: Some curiosity with limited exploration
- 3-4: Minimal genuine curiosity

**Academic Preparedness (7%):** Ready for university study
- 6-7: Mathematical sophistication + multiple academic sources = clearly ready
- 4-5: Generally prepared
- 2-3: Some gaps

### 3. Subject Engagement Quality (15% total weight) 
**Academic vs Popular Engagement (8%):** Scholarly vs trendy topic focus
**Intellectual Maturity (7%):** Respect for expertise, learning from established knowledge

### 4. Communication & Structure (10% total weight)
**Narrative Coherence (5%):** Logical flow connecting motivation to preparation
**Specificity & Evidence (5%):** Concrete examples supporting claims

### 5. Personal Development (5% total weight)
**Reflection & Growth (3%):** Evidence of learning from experiences
**Future Vision (2%):** Clear, realistic university direction

### 6. Factual Accuracy (5% total weight)
- Only penalize clear contradictions, fundamental errors, obvious mistakes
- DO NOT penalize future speculation, learning journey errors, exploratory thinking

## RED FLAG PENALTIES:
**Major Issues (-2 to -3 points overall):**
- Expert dismissal without qualifications
- Technique name-dropping without context  
- Severe overstatement of expertise
- Fundamental misconceptions

**Minor Issues (-0.5 to -1 point overall):**
- Buzzword heavy without substance
- Over-reliance on popular/trendy topics
- Mild overconfidence

## SCORING SCALE:
- 9.0-10.0: Exceptional - Would impress admissions tutors and subject experts
- 7.5-8.9: Strong - Well-prepared candidate, clear university readiness  
- 6.0-7.4: Adequate - Acceptable standard, shows basic preparation
- 4.5-5.9: Weak - Significant concerns, questionable university readiness
- 0-4.4: Poor - Major issues, not ready for university study

## SUBJECT-SPECIFIC FOCUS:
For STEM: Technical accuracy, mathematical reasoning
For Humanities: Critical analysis, primary sources  
For Social Sciences: Academic debates, methodology awareness
For Applied Fields: Practical application, professional awareness

Target Course: ${targetCourse || 'General'}
Word Count: ${wordCount}

Analyze the statement using my exact scoring framework and provide narrative-driven feedback in this JSON format:

{
  "academicCriteria": 8.5,
  "intellectualQualities": 7.8,
  "subjectEngagement": 8.2,
  "communicationStructure": 9.0,
  "personalDevelopment": 6.5,
  "factualAccuracy": 8.0,
  "overallScore": 8.1,
  "grade": "A - Strong university readiness demonstrated",
  
  "narrativeAnalysis": {
    "academicStrength": {
      "score": 8.5,
      "title": "Academic Criteria: 8.5/10 ⭐",
      "subtitle": "Strong academic engagement with room to strengthen",
      "narrative": "Write a sophisticated paragraph analyzing their academic preparation. Quote specific books/concepts they mentioned. Explain what works well and what could be stronger. Reference their reading list, academic content, theoretical understanding. Be specific about their intellectual level and how it compares to university expectations.",
      "standoutMoment": "Identify the most impressive academic moment in their statement",
      "subScores": {
        "knowledgeAppropriateness": 9,
        "academicRelevance": 8,
        "understandingDepth": 8,
        "selfAssessment": 9
      }
    },
    "intellectualQualities": {
      "score": 7.8,
      "title": "Intellectual Qualities: 7.8/10 ⭐",
      "subtitle": "Strong analytical thinking demonstrated",
      "narrative": "Analyze their analytical thinking, curiosity, and university readiness. Quote specific examples of analysis they provided. Explain how they connect ideas across contexts. Discuss their intellectual preparation for degree-level study.",
      "needsWork": "Identify the main area for intellectual development",
      "subScores": {
        "analyticalThinking": 8,
        "genuineCuriosity": 8,
        "academicPreparedness": 7
      }
    },
    "subjectEngagement": {
      "score": 8.2,
      "title": "Subject Engagement: 8.2/10 ⭐",
      "subtitle": "Authentic interest with good academic focus",
      "narrative": "Discuss their engagement with the academic subject vs popular topics. Quote examples of scholarly vs popular engagement. Analyze their intellectual maturity in approaching the field.",
      "advice": "Specific suggestion for improving academic engagement",
      "subScores": {
        "academicVsPopular": 8,
        "intellectualMaturity": 8
      }
    },
    "communicationStructure": {
      "score": 9.0,
      "title": "Communication & Structure: 9.0/10 ✅",
      "subtitle": "Excellent narrative flow",
      "narrative": "Analyze their writing quality, structure, and use of specific examples. Quote effective transitions or structural elements. Discuss narrative coherence and evidence quality.",
      "quickFix": "One specific structural improvement suggestion",
      "subScores": {
        "narrativeCoherence": 9,
        "specificityEvidence": 9
      }
    },
    "personalDevelopment": {
      "score": 6.5,
      "title": "Personal Development: 6.5/10 ⚠️",
      "subtitle": "Limited reflection on growth",
      "narrative": "Analyze their personal reflection and growth. Quote examples of learning from experiences. Identify missed opportunities for showing personal development.",
      "actionable": "Specific advice for adding personal reflection",
      "subScores": {
        "reflectionGrowth": 7,
        "futureVision": 6
      }
    }
  },
  
  "overallNarrative": "Write 2-3 paragraphs providing an overall assessment. Start with key strengths, discuss the intellectual journey, identify main areas for improvement. Be encouraging but honest about readiness level.",
  
  "topPriorities": [
    {
      "priority": "HIGH",
      "issue": "Specific issue identified",
      "solution": "Detailed, actionable solution based on their content"
    }
  ],
  
  "keyStrengths": [
    "Quote specific strengths with examples from their statement"
  ],
  
  "concerns": [
    "Specific concerns with examples"
  ],
  
  "redFlags": [
    {
      "type": "expert_dismissal",
      "severity": "major",
      "description": "Quote the specific problematic statement",
      "impact": -2
    }
  ],
  
  "universityAdvice": "Course-specific advice based on their target",
  "gradeJustification": "Explain why this grade was assigned using the rubric criteria"
}

CRITICAL FRAMEWORK CORRECTIONS:
**RECOGNIZE ACADEMIC EXCELLENCE:**
- University-level sources (Landes, Collier, Sachs, etc.) = HIGH academic engagement (8.5-9.0)
- Mathematical economics content = EXCEPTIONAL sophistication
- Multiple academic books + intellectual progression = 7.5-8.5 overall score

**DETECT INTELLECTUAL DEVELOPMENT:**
- "this led me to" / "wanting to learn more" / "drawn to" = PROGRESSION (score high)
- "I have" / "I also" / "I achieved" = LISTING (score lower)
- "Reading X led me to Y" = Clear intellectual journey

**PROPER CALIBRATION:**
A statement with 4+ university books + mathematical content + clear progression should score 7.5-8.5 overall, NOT under 6.0.

Your feedback MUST:
- Quote actual phrases, books, concepts from their statement
- Reference specific activities/experiences they mentioned  
- CORRECTLY REWARD academic excellence with appropriate high scores
- Apply exact scoring rubric with recalibrated standards
- Write in engaging, authentic tutoring voice
- Generate completely original analysis for each statement

DO NOT under-score statements with strong academic preparation!`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze this personal statement:\n\n${statement}` }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const completion = await openaiResponse.json();
    const response = completion.choices[0].message.content;
    
    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(response);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    // Validate the response structure
    if (!analysisResult.overallScore) {
      throw new Error('Invalid response structure from OpenAI - missing overallScore');
    }

    // Add metadata
    analysisResult.metadata = {
      timestamp: new Date().toISOString(),
      targetCourse: targetCourse,
      wordCount: wordCount,
      statementLength: statement.length,
      tokensUsed: completion.usage?.total_tokens || 0,
      cost: ((completion.usage?.total_tokens || 0) * 0.00003).toFixed(4) // Rough estimate
    };

    return res.status(200).json(analysisResult);

  } catch (error) {
    console.error('Error analyzing statement:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'OpenAI API quota exceeded. Please try again later.' });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'Invalid OpenAI API key configuration.' });
    }

    return res.status(500).json({ 
      error: 'Failed to analyze statement. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}