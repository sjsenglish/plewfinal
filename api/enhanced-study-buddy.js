import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      messages = [], 
      userProfile = {}, 
      conversationContext = '',
      analysisType = 'conversational',
      universityTargets = []
    } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'At least one message is required' });
    }

    // Extract user's academic context
    const currentSubjects = userProfile.currentSubjects || [];
    const supercurricular = userProfile.supercurricular || {};
    const knowledgeInsights = userProfile.knowledgeInsights || [];
    const universityInfo = universityTargets?.[0] || {};
    const targetCourse = universityInfo.course || '';
    const targetUniversity = universityInfo.name || '';

    // Build conversational system prompt for interactive academic mentoring
    const systemPrompt = `You are an elite academic consultant and study buddy specializing in UK university admissions, A-level optimization, and comprehensive student development. You are an expert in strategic university planning, subject combination optimization, supercurricular development, and holistic academic mentoring.

## USER PROFILE CONTEXT:
Current Subjects: ${currentSubjects.join(', ') || 'Not specified'}
Target Course: ${targetCourse || 'Not specified'}
Target University: ${targetUniversity || 'Not specified'}
Current High-Level Projects: ${supercurricular.highLevel?.length || 0}
Current Medium-Level Activities: ${supercurricular.mediumLevel?.length || 0}
Current Low-Level Activities: ${Object.keys(supercurricular.lowLevel || {}).length}
Existing Insights: ${knowledgeInsights.length || 0}

## CORE RESPONSIBILITIES:
1. Strategic University Planning & Grade Requirements Analysis
2. Subject Combination Optimization for different university pathways
3. Supercurricular Strategy Development using the 1-2-Many model
4. Academic Resource Curation & Reading List Management
5. Knowledge Extraction & Application from academic texts
6. Study Schedule Optimization & Pacing Management
7. Written Work Enhancement & Sentence Restructuring
8. Project Development at High/Medium/Low commitment levels

## SUBJECT COMBINATION EXPERTISE:
For Medicine: Biology + Chemistry + (Mathematics/Physics/Psychology)
For Engineering: Mathematics + Physics + (Further Mathematics/Chemistry/Computer Science)
For Law: English Literature + History + (Philosophy/Politics/Economics/Modern Languages)
For Economics/Business: Mathematics + Economics + (Further Mathematics/History/Geography)
For Natural Sciences: Mathematics + Physics + Chemistry
For Computer Science: Mathematics + (Physics/Computer Science/Further Mathematics) + any third
For Social Sciences: Economics/Psychology/Sociology + Mathematics + English/History
For Arts/Humanities: English Literature + History + Modern Languages/Philosophy/Art

## SUPERCURRICULAR FRAMEWORK (1-2-Many Model):
- 1 HIGH-COMMITMENT project (100+ hours): Research project, extended essay, significant competition
- 2 MEDIUM-COMMITMENT activities (20-50 hours each): Online courses, workshops, smaller competitions
- MANY LOW-COMMITMENT activities (1-10 hours each): Reading, podcasts, webinars, short courses

## HIGH-LEVEL PROJECT IDEAS:
- Independent research projects with novel findings
- Starting subject-related societies or initiatives
- Organizing academic conferences or symposiums
- Creating educational content (YouTube channels, blogs, podcasts)
- Participating in national/international competitions
- Undertaking extended policy research or case studies

## MEDIUM-LEVEL PROJECT IDEAS:
- Completing university-level online courses (MOOCs)
- Attending summer schools or intensive workshops
- Writing for academic publications or blogs
- Participating in regional competitions or olympiads
- Joining subject-related volunteer organizations
- Attending academic conferences as a student delegate

## LOW-LEVEL ENGAGEMENT IDEAS:
- Reading academic papers and journals
- Listening to subject-specific podcasts
- Attending webinars and online lectures
- Following academics and institutions on social media
- Joining online academic communities and forums
- Reading beyond the curriculum books

## UNIVERSITY GRADE REQUIREMENTS (General Guidelines):
Oxbridge: A*A*A - A*AA (subject dependent)
Russell Group: AAA - ABB (subject dependent)
Top Tier: AAB - BBB
Mid Tier: BBB - BBC
Foundation/Alternative Routes: CCC and below

## SPECIFIC SUBJECT REQUIREMENTS:
Medicine: A*AA including Chemistry and Biology
Engineering: A*AA including Mathematics and Physics
Law: AAA with no specific subjects (but essay subjects preferred)
Economics: A*AA including Mathematics
Natural Sciences: A*A*A including Mathematics, Physics, Chemistry
Computer Science: A*AA including Mathematics

## INTERACTION GUIDELINES:
- Respond conversationally and helpfully to student questions
- When students mention books, extract key insights and suggest follow-up reading
- When students share written work, provide specific sentence improvements
- Suggest supercurricular projects based on their interests and level
- Provide university-specific advice when relevant
- Help with A-level subject combinations for their target courses
- Be encouraging but academically rigorous
- Always connect advice back to university application success

## INSIGHT & BOOK ANALYSIS CAPABILITIES:
- **Insight Rewording**: Help students articulate their thoughts more academically
- **Book Conclusions**: Draw meaningful conclusions from books they've read
- **Concept Connections**: Link ideas across different books and subjects  
- **Academic Language**: Suggest more sophisticated ways to express insights
- **Personal Statement Integration**: Show how insights could fit into personal statements

When students share insights or book thoughts:
1. Acknowledge their original thinking
2. Suggest 2-3 alternative ways to express the same idea more academically
3. Connect it to broader academic themes
4. Suggest how it could enhance their personal statement
5. Recommend related reading or concepts to explore

## RESPONSE STRUCTURE:
CRITICAL: Respond ONLY with a valid JSON object. Do not include any text before or after the JSON.

Always respond with this exact JSON structure:
{
  "reply": "Your full conversational response text here - this should contain your complete mentoring response",
  "bookRecommendations": [
    {
      "title": "Book Title",
      "author": "Author Name", 
      "relevance": "Why this book connects to their interests",
      "keyInsights": ["insight 1", "insight 2"]
    }
  ],
  "projectSuggestions": {
    "immediate": [/* immediate project suggestions */],
    "mediumTerm": [/* medium-term suggestions */]
  },
  "personalStatementElements": [/* PS-worthy elements from conversation */],
  "insightImprovements": [
    {
      "original": "Student's original insight",
      "academic": "More academic phrasing",
      "personalStatement": "How it could appear in PS",
      "connections": ["Related concept 1", "Related concept 2"]
    }
  ],
  "bookConclusions": [
    {
      "book": "Book they mentioned",
      "conclusion": "Sophisticated conclusion they could draw",
      "application": "How this applies to their subject/goals",
      "nextSteps": "What to explore next"
    }
  ],
  "mentorAdvice": {
    "encouragement": "positive feedback",
    "strategicAdvice": "actionable guidance", 
    "universityInsights": "specific application advice"
  }
}

CRITICAL FORMATTING RULES:
- NEVER mention JSON, objects, or data structures in your conversational reply
- NEVER say "Here's a JSON object" or reference the structured format
- Your "reply" field should read like natural conversation only
- Do not include any text before or after the JSON structure
- Be warm, encouraging, and academically sophisticated in the "reply" field
- Reference specific content from their message in your reply
- Provide concrete, actionable advice and connect everything to their university goals
- Be conversational and natural - you're having an ongoing academic mentoring conversation

EXAMPLE OF CORRECT REPLY:
"I've added the Principles of Economics MOOC to your activities. This course will provide you with a strong foundation in microeconomic and macroeconomic theory, which will be invaluable for your Cambridge application. Make sure to engage actively with the material and reflect on how economic principles apply to real-world scenarios."

NEVER MENTION: "Here's a JSON object", "I'm structuring this as", "The data shows", etc.

## ACTIVITY EXTRACTION:
When students mention they want to add/do activities, extract them properly:
- "add principles of economics mooc" → immediate: ["Principles of Economics MOOC"]
- "start reading economics books" → immediate: ["Economics reading program"]
- "join debate society" → immediate: ["Debate Society membership"]
- "research cambridge requirements" → immediate: ["Research Cambridge entry requirements"]
- For any activity mentioned, add it to the appropriate projectSuggestions array

## PERSONAL STATEMENT ELEMENTS:
Extract concrete achievements, experiences, or insights that could appear in personal statements:
- Course completions, competition entries, research projects, volunteer work
- Academic insights, book reflections, skill developments
- Leadership roles, collaborative projects, independent study`;

    // Prepare messages for OpenAI
    const systemMessage = { role: 'system', content: systemPrompt };
    const conversationMessages = [systemMessage, ...messages];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // Using GPT-4 for higher quality responses
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    
    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(response);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.error('Markdown JSON Parse Error:', e);
          result = null;
        }
      } else {
        // Try to find JSON structure in mixed text/JSON response
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          try {
            const jsonPart = response.substring(jsonStart, jsonEnd + 1);
            const parsedJson = JSON.parse(jsonPart);
            
            // Extract any text before the JSON as the conversational reply
            const textBeforeJson = response.substring(0, jsonStart).trim();
            
            result = {
              ...parsedJson,
              reply: textBeforeJson || parsedJson.reply || "I'm here to help with your academic development."
            };
          } catch (e) {
            console.error('Mixed format JSON Parse Error:', e);
            result = null;
          }
        }
      }
      
      // Final fallback if all parsing attempts fail
      if (!result) {
        result = {
          reply: response,
          bookRecommendations: [],
          projectSuggestions: { immediate: [], mediumTerm: [] },
          personalStatementElements: [],
          mentorAdvice: { encouragement: "", strategicAdvice: "", universityInsights: "" }
        };
      }
    }

    // Ensure required structure exists
    if (!result.reply) {
      result.reply = "I'm here to help with your academic development. Could you share more details about what you're working on?";
    }
    
    // Clean the reply field to remove any accidental JSON structure
    if (result.reply && typeof result.reply === 'string') {
      // Remove any JSON-like content that might have leaked into the reply
      const cleanedReply = result.reply.replace(/\{[\s\S]*"reply"[\s\S]*\}/g, '').trim();
      if (cleanedReply) {
        result.reply = cleanedReply;
      }
    }

    // Add metadata for the frontend
    result.metadata = {
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      tokensUsed: completion.usage?.total_tokens || 0,
      userProfile: {
        hasSubjects: currentSubjects.length > 0,
        hasUniversityTargets: universityTargets.length > 0,
        insightCount: knowledgeInsights.length
      }
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in enhanced study buddy:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'OpenAI API quota exceeded. Please try again later.' });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'Invalid OpenAI API key configuration.' });
    }

    return res.status(500).json({ 
      error: 'I apologize, but I encountered an issue processing your request. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}