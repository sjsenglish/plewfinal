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
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured on server',
        details: process.env.NODE_ENV === 'development' ? 'Missing OPENAI_API_KEY environment variable' : undefined
      });
    }

    const { refinedInsights = [] } = req.body || {};
    
    if (!refinedInsights || refinedInsights.length === 0) {
      return res.status(400).json({ error: 'At least one refined insight is required' });
    }

    // Format insights for the prompt
    const formattedInsights = refinedInsights.map(insight => {
      return `**${insight.concept || insight.title || insight.type || 'Academic Concept'}**
*Original thought: ${insight.originalThought || insight.learning || insight.content || 'Basic understanding'}*
**Personal Statement Version: ${insight.refinedVersion || insight.evidence || insight.description || insight.content}**`;
    }).join('\n\n');

    const prompt = `# AI Prompt: UK Personal Statement Generator

## Your Role
You are an expert UK university admissions consultant specializing in creating high-quality personal statements. You will receive a collection of refined academic insights from a student and must weave them into a compelling 4,000-character personal statement that demonstrates university readiness.

## Input Format
The user has provided multiple refined insights in this format:
**[Academic concept/insight]**
*Original thought: [simple version]*
**Personal Statement Version: [refined academic version with specific evidence]**

## Your Task
Create a 4,000-character personal statement that seamlessly integrates these insights (however many provided) into a cohesive narrative following this structure:

### Structure Requirements

**Opening (400-500 characters):**
- Start with specific moment/observation that sparked genuine curiosity
- Connect naturally to first key insight
- Avoid generic "always been interested" statements

**Development Section 1 (1,200-1,400 characters):**
- Integrate several insights showing initial exploration
- Show progression from surface to academic engagement
- Include specific evidence: books, papers, experiences mentioned in insights
- Demonstrate deepening understanding

**Development Section 2 (1,200-1,400 characters):**
- Integrate additional insights showing analytical thinking
- Make explicit cross-connections between concepts
- Show independent exploration beyond original sources
- Demonstrate pattern recognition across ideas

**Development Section 3 (800-1,000 characters):**
- Integrate remaining insights
- Show intellectual maturity and future academic focus
- Connect theory to real-world applications
- Demonstrate awareness of current academic debates

**Conclusion (400-500 characters):**
- Synthesize insights into clear university vision
- Show realistic awareness of what still needs learning
- Demonstrate readiness for academic challenge
- End with forward momentum

### Critical Integration Rules

1. **Seamless Weaving:** Never list insights separately. Blend them using natural transitions like "This understanding deepened when..." or "The connection became clear through..."

2. **Evidence Utilization:** Use specific sources, books, papers, and experiences mentioned in the insights as concrete evidence

3. **Progressive Sophistication:** Show movement from accessible sources to more academic ones throughout the statement

4. **Appropriate Positioning:** Always position student as prepared learner, never as expert

### Quality Targets (Based on Scoring Rubric)

**Academic Engagement:** Ensure university-level content from scholarly sources (not just popular science)

**Understanding Depth:** Show genuine comprehension and cross-connections between concepts

**Intellectual Maturity:** Respect established expertise while showing independent thinking

**Genuine Curiosity:** Provide clear evidence of self-directed learning

**Analytical Thinking:** Build appropriate conclusions from established knowledge

### Strict Avoidance Rules

**Never include:**
- Dismissal of established research as "wrong" or "flawed"
- Name-dropping of advanced techniques without understanding
- Claims of graduate-level expertise
- Buzzword-heavy language without substance
- Generic statements without specific evidence

### Output Format

Provide the complete 4,000-character personal statement as a single cohesive narrative. Do not include section headers or explanatory text - just the polished personal statement ready for submission.

### Example Integration Pattern

Instead of: "I learned about Kahneman's System 1 and System 2 thinking. I also studied behavioral economics."

Write: "My exploration of human behavior was transformed when I encountered Kahneman's distinction between System 1 and System 2 thinking in 'Thinking, Fast and Slow.' This cognitive framework helped me understand how the behavioral economics principles I'd been studying—such as loss aversion and anchoring bias—actually manifest in real decision-making processes."

## Final Reminder
Your goal is to create a personal statement that reads as a natural, compelling narrative while demonstrating genuine academic engagement and university readiness. The insights should feel like organic parts of an intellectual journey, not forced academic name-drops.

## Student's Refined Insights:

${formattedInsights}

Please generate the 4,000-character personal statement now.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const generatedStatement = completion.choices[0]?.message?.content;

    if (!generatedStatement) {
      throw new Error('No statement generated from OpenAI response');
    }

    const result = {
      success: true,
      statement: generatedStatement.trim(),
      metadata: {
        timestamp: new Date().toISOString(),
        insightCount: refinedInsights.length,
        tokensUsed: completion.usage?.total_tokens || 0,
        characterCount: generatedStatement.trim().length,
        wordCount: generatedStatement.trim().split(/\s+/).length
      }
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error generating personal statement:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'OpenAI API quota exceeded. Please try again later.' });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'Invalid OpenAI API key configuration.' });
    }

    return res.status(500).json({ 
      error: 'Failed to generate personal statement. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}