const {onCall, onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const {setGlobalOptions} = require("firebase-functions/v2");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const OpenAI = require('openai');
const cors = require('cors')({
  origin: true,
  credentials: true
});

// Set global options
setGlobalOptions({maxInstances: 10});

// Define secrets
const openaiApiKey = defineSecret("OPENAI_API_KEY");

admin.initializeApp();

function getOpenAI() {
  return new OpenAI({
    apiKey: openaiApiKey.value(),  
  });
}

// Initialize Stripe with fallback
function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
  }
  return require("stripe")(stripeKey);
}

// AUTO-CREATE STUDY PROFILE WHEN USER DOCUMENT IS CREATED
exports.createUserStudyProfile = onDocumentCreated("users/{userId}", async (event) => {
  const userId = event.params.userId;
  const userData = event.data.data();
  
  console.log(`Auto-creating study profile for user: ${userId}`);
  
  // Check if study profile already exists
  if (userData && userData.studyProfile) {
    console.log('Study profile already exists, skipping');
    return;
  }

  try {
    // Enhanced study profile structure
    const enhancedStudyProfileStructure = {
      studyProfile: {
        // Basic academic info
        currentSubjects: [],
        subjectTopics: [], // Track current topics and confidence levels
        universityTargets: [],
        academicYear: "",
        
        // Comprehensive supercurricular tracking
        supercurricular: {
          highLevel: [], // Major projects demonstrating technical skills
          mediumLevel: [], // Competitions, research, leadership
          lowLevel: {
            books: [],
            lectures: [],
            moocs: [],
            currentAffairs: {
              weeklyReading: [],
              insights: []
            }
          }
        },
        
        // Enhanced goal and progress tracking
        categorizedGoals: [], // Weekly/monthly/termly goals by category
        weeklyGoals: [], // Legacy support
        knowledgeInsights: [], // Learning extraction from all activities
        competitions: [], // Competition tracking with deadlines
        
        // Personal statement development
        narrativeDevelopment: {
          keyExperiences: [],
          intellectualJourney: [],
          evidenceBank: []
        },
        
        // Time management and scheduling
        timeManagement: {
          weeklyCommitments: [],
          studySchedule: [],
          deadlineTracking: []
        },
        
        // Preferences and settings
        preferences: {
          studyStyle: "",
          reminderFrequency: "weekly",
          focusAreas: [],
          goalTimeframe: "weekly",
          universityPreferences: []
        },
        
        // Metadata
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        profileVersion: "2.0",
        setupCompleted: false,
        userArchetype: null, // 'ready-to-apply', 'in-progress', 'starting-fresh'
        currentYear: null,
        lastVisitDate: new Date().toISOString()
      }
    };

    await admin.firestore().collection('users').doc(userId).update(enhancedStudyProfileStructure);
    
    console.log(`Study profile automatically created for user: ${userId}`);
    
  } catch (error) {
    console.error('Error auto-creating study profile:', error);
    // Don't throw - we don't want to break user creation if profile creation fails
  }
});

// Enhanced profile data extraction with comprehensive categories
async function extractComprehensiveProfileUpdates(message, currentProfile) {
  const openai = getOpenAI();
  
  // Get current books to check for duplicates (more robust)
  const currentBooks = currentProfile.supercurricular?.lowLevel?.books || [];
  const currentBookTitles = currentBooks.map(book => (book.title || '').toLowerCase().trim());
  
  console.log('Current books in profile:', currentBookTitles);
  
  const enhancedExtractionPrompt = `
  Analyze this student message and extract study information. 
  
  IMPORTANT: Current books already tracked: [${currentBookTitles.join(', ')}]
  Do NOT extract books that are already being tracked.

  Current Profile Summary:
  - Subjects: ${currentProfile.currentSubjects?.map(s => s.name || s).join(', ') || 'None'}
  - Target University: ${currentProfile.universityTargets?.map(u => u.name).join(', ') || 'Not set'}
  - Current Books: ${currentBooks.map(b => b.title).join(', ') || 'None'}

  Student message: "${message}"

  Look for NEW books, subjects, universities, goals, etc. that are NOT already tracked.
  
  Examples of what to extract:
  - If they say "I'm reading The Wealth of Nations" and it's not in their current books, extract it
  - If they mention "I want to apply to Oxford for PPE" and Oxford isn't in their targets, extract it
  - If they set a goal like "finish 2 chapters this week", extract it
  - If they share learning insights, analysis, or reflections (like 'this made me think', 'I realized', 'this connects to'), extract detailed insights with full context and connections

  Extract and return ONLY a JSON object with this structure (return empty arrays if nothing NEW found):
  {
    "subjects": [{"name": "subject", "level": "A-Level/GCSE", "currentGrade": "", "targetGrade": ""}],
    "subjectTopics": [{"subject": "subject", "topic": "topic name", "confidence": "confident/needs to revise/needs to learn again", "notes": "additional notes"}],
    "books": [{"title": "title", "author": "author", "subject": "subject", "status": "reading/completed/planned", "type": "academic/popular/textbook", "progress": 45, "insights": [], "universityRecommended": ["Cambridge"], "personalStatement": true, "keyThemes": ["theme1"], "readingDate": "2024-01-15"}],
    "universities": [{"name": "university", "course": "course", "priority": "target/backup", "requirements": {"grades": "A*AA", "admissionTest": "STEP", "subjects": ["Math"]}, "modules": {"year1Core": ["module1"], "year2Options": ["module2"]}, "department": {"name": "dept", "specializations": ["spec1"]}, "tutors": [{"name": "Dr Smith", "interests": "research area", "why": "relevance"}]}],
    "highLevelProjects": [{"name": "project name", "type": "EPQ/Dissertation/Research", "category": "Academic Research", "description": "detailed desc", "specifications": {"wordCount": 3000, "deadline": "2024-03-15", "supervisor": "teacher"}, "status": "planned/in-progress/completed", "progress": 65, "milestones": [{"task": "literature review", "completed": true, "date": "2024-01-10"}], "evidence": [{"type": "research_notes", "name": "file name"}], "universityRelevant": ["Cambridge"], "personalStatementValue": "shows research skills"}],
    "mediumLevelActivities": [{"type": "competition/research/leadership", "title": "title", "description": "desc", "subject": "subject"}],
    "goals": [{"text": "goal", "timeframe": "weekly/monthly/termly", "category": "academic/supercurricular/personal"}],
    "insights": [{"concept": "specific concept", "fullInsight": "complete detailed analysis with connections and implications", "source": "book/lecture", "pageReference": "page/chapter", "personalStatementRelevance": "how this shows skills", "connectionToStudies": "links to degree", "followUpQuestions": ["what to explore next"], "universityRelevance": ["specific unis"]}],
    "competitions": [{"name": "competition", "subject": "subject", "deadline": "date if mentioned", "status": "interested/applying/completed"}]
  }

  Pay special attention to:
  - Subject grades (current and target): "I got a B in my last Economics test but want an A*"
  - Current topics being studied: "I'm studying integration in Maths", "We're covering the Russian Revolution in History"
  - Confidence levels: "I'm struggling with calculus", "I feel confident about this topic", "I need to revise photosynthesis"

  Only extract NEW information that isn't already tracked. Be very careful about book titles - match them exactly.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for better cost efficiency
      messages: [{ role: "user", content: enhancedExtractionPrompt }],
      max_tokens: 400, // Reduced from 800
      temperature: 0.1,
    });

    const response = completion.choices[0].message.content;
    // Strip markdown code blocks if present
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const extractedData = JSON.parse(cleanResponse);
    
    // ADDITIONAL CHECK: Filter out books that already exist (more robust)
    if (extractedData.books) {
      extractedData.books = extractedData.books.filter(book => {
        const bookTitleLower = book.title.toLowerCase().trim();
        const exists = currentBookTitles.some(existingTitle => 
          existingTitle.toLowerCase().trim() === bookTitleLower
        );
        console.log(`Checking book "${book.title}": exists = ${exists}`);
        return !exists;
      });
      console.log(`After filtering: ${extractedData.books.length} new books to add`);
    }
    
    // Convert to comprehensive update operations
    const updates = [];
    
    // Handle subject topics and confidence levels
    if (extractedData.subjectTopics?.length > 0) {
      extractedData.subjectTopics.forEach(topic => {
        updates.push({
          type: 'addSubjectTopic',
          data: {
            subject: topic.subject,
            topic: topic.topic,
            confidence: topic.confidence || "needs to revise",
            notes: topic.notes || "",
            dateAdded: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        });
      });
    }
    
    // Handle subjects with enhanced data
    if (extractedData.subjects?.length > 0) {
      extractedData.subjects.forEach(subject => {
        updates.push({
          type: 'addEnhancedSubject',
          data: {
            name: subject.name,
            level: subject.level || "A-Level",
            currentGrade: subject.currentGrade || "",
            targetGrade: subject.targetGrade || "",
            addedDate: new Date().toISOString()
          }
        });
      });
    }
    
    // Handle university targets
    if (extractedData.universities?.length > 0) {
      updates.push({
        type: 'updateUniversityTargets',
        data: extractedData.universities
      });
    }
    
    // Handle high-level supercurricular projects
    if (extractedData.highLevelProjects?.length > 0) {
      extractedData.highLevelProjects.forEach(project => {
        updates.push({
          type: 'addHighLevelProject',
          data: {
            ...project,
            startDate: new Date().toISOString(),
            evidence: [],
            timeSpent: 0
          }
        });
      });
    }
    
    // Handle medium-level activities
    if (extractedData.mediumLevelActivities?.length > 0) {
      extractedData.mediumLevelActivities.forEach(activity => {
        updates.push({
          type: 'addMediumLevelActivity',
          data: {
            ...activity,
            addedDate: new Date().toISOString(),
            evidence: []
          }
        });
      });
    }
    
    // Enhanced book tracking (only if they passed the duplicate check)
    if (extractedData.books?.length > 0) {
      extractedData.books.forEach(book => {
        updates.push({
          type: 'addEnhancedBook',
          data: {
            title: book.title,
            author: book.author || "",
            subject: book.subject || "",
            status: book.status || "reading",
            type: book.type || "academic",
            startDate: new Date().toISOString(),
            currentPage: 0,
            totalPages: 0,
            weeklyInsights: [],
            keyLearnings: [],
            personalReflections: []
          }
        });
      });
    }
    
    // Enhanced goal tracking with categories
    if (extractedData.goals?.length > 0) {
      updates.push({
        type: 'addCategorizedGoals',
        data: extractedData.goals.map(goal => ({
          text: goal.text,
          timeframe: goal.timeframe || "weekly",
          category: goal.category || "academic",
          created: new Date().toISOString(),
          completed: false,
          priority: "medium"
        }))
      });
    }

    // Knowledge insights tracking
    if (extractedData.insights?.length > 0) {
      updates.push({
        type: 'addKnowledgeInsights',
        data: extractedData.insights.map(insight => ({
          ...insight,
          date: new Date().toISOString(),
          reviewed: false
        }))
      });
    }

    // Competition tracking
    if (extractedData.competitions?.length > 0) {
      updates.push({
        type: 'addCompetitions',
        data: extractedData.competitions.map(comp => ({
          ...comp,
          addedDate: new Date().toISOString(),
          reminderSet: false
        }))
      });
    }
        if (extractedData.subjects?.length > 0) {
      const gradeTargets = extractedData.subjects
        .filter(s => s.targetGrade)
        .map(s => ({subject: s.name, grade: s.targetGrade}));
      
      if (gradeTargets.length > 0) {
        updates.push({
          type: 'addGradeTargets',
          data: gradeTargets
        });
      }
    }
    // Enhanced insights tracking
if (extractedData.insights?.length > 0) {
  updates.push({
    type: 'addKnowledgeInsights',
    data: extractedData.insights.map(insight => ({
      concept: insight.concept,
      fullInsight: insight.fullInsight,
      source: insight.source,
      pageReference: insight.pageReference || "",
      personalStatementRelevance: insight.personalStatementRelevance || "",
      connectionToStudies: insight.connectionToStudies || "",
      followUpQuestions: insight.followUpQuestions || [],
      universityRelevance: insight.universityRelevance || [],
      date: new Date().toISOString(),
      reviewed: false
    }))
  });
}

    return { updates, raw: extractedData };
    
  } catch (error) {
    console.error('Error extracting comprehensive profile data:', error);
    return { updates: [], raw: {} };
  }
}


// Enhanced profile update function
async function updateComprehensiveProfile(userId, updates) {
  const userRef = admin.firestore().collection('users').doc(userId);
  
  for (const update of updates) {
    try {
      switch (update.type) {
        case 'addSubjectTopic': {
          // Add or update subject topic with confidence level
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          const subjectTopics = userData?.studyProfile?.subjectTopics || [];
          
          // Check if this topic already exists for this subject
          const existingTopicIndex = subjectTopics.findIndex(topic => 
            topic.subject.toLowerCase() === update.data.subject.toLowerCase() &&
            topic.topic.toLowerCase() === update.data.topic.toLowerCase()
          );
          
          if (existingTopicIndex !== -1) {
            // Update existing topic
            subjectTopics[existingTopicIndex] = {
              ...subjectTopics[existingTopicIndex],
              confidence: update.data.confidence,
              notes: update.data.notes,
              lastUpdated: new Date().toISOString()
            };
            
            await userRef.update({
              'studyProfile.subjectTopics': subjectTopics
            });
            console.log(`Updated topic: ${update.data.subject} - ${update.data.topic}`);
          } else {
            // Add new topic
            await userRef.update({
              'studyProfile.subjectTopics': admin.firestore.FieldValue.arrayUnion(update.data)
            });
            console.log(`Added new topic: ${update.data.subject} - ${update.data.topic}`);
          }
          break;
        }

        case 'addEnhancedSubject': {
          const userDoc = await userRef.get();
          const currentSubjects = userDoc.data()?.studyProfile?.currentSubjects || [];
          const subjectExists = currentSubjects.some(s => s.name === update.data.name);
          
          if (!subjectExists) {
            await userRef.update({
              'studyProfile.currentSubjects': admin.firestore.FieldValue.arrayUnion(update.data)
            });
          }
          break;
        }

        case 'updateUniversityTargets': {
          await userRef.update({
            'studyProfile.universityTargets': admin.firestore.FieldValue.arrayUnion(...update.data),
            'studyProfile.lastUpdated': new Date().toISOString()
          });
          break;
        }

        case 'addHighLevelProject': {
          await userRef.update({
            'studyProfile.supercurricular.highLevel': admin.firestore.FieldValue.arrayUnion(update.data)
          });
          break;
        }

        case 'addMediumLevelActivity': {
          await userRef.update({
            'studyProfile.supercurricular.mediumLevel': admin.firestore.FieldValue.arrayUnion(update.data)
          });
          break;
        }

        case 'addEnhancedBook': {
          // FIX: Check if book already exists before adding
          const userDoc = await userRef.get();
          const currentBooks = userDoc.data()?.studyProfile?.supercurricular?.lowLevel?.books || [];
          
          // Check if book with same title already exists (more robust checking)
          const bookExists = currentBooks.some(book => {
            const existingTitle = (book.title || '').toLowerCase().trim();
            const newTitle = (update.data.title || '').toLowerCase().trim();
            return existingTitle === newTitle;
          });
          
          if (!bookExists) {
            await userRef.update({
              'studyProfile.supercurricular.lowLevel.books': admin.firestore.FieldValue.arrayUnion(update.data)
            });
            console.log(`Successfully added new book: ${update.data.title}`);
          } else {
            console.log(`Book already exists, skipping: ${update.data.title}`);
          }
          break;
        }

        case 'addCategorizedGoals': {
          const currentWeek = new Date().toISOString().split('T')[0];
          await userRef.update({
            'studyProfile.categorizedGoals': admin.firestore.FieldValue.arrayUnion({
              week: currentWeek,
              goals: update.data
            })
          });
          break;
        }

        case 'addKnowledgeInsights': {
          await userRef.update({
            'studyProfile.knowledgeInsights': admin.firestore.FieldValue.arrayUnion(...update.data)
          });
          break;
        }

        case 'addCompetitions': {
          await userRef.update({
            'studyProfile.competitions': admin.firestore.FieldValue.arrayUnion(...update.data)
          });
          break;
        }

        // Legacy support for existing update types
        case 'addSubject': {
          const userDoc = await userRef.get();
          const currentSubjects = userDoc.data()?.studyProfile?.currentSubjects || [];
          const subjectExists = currentSubjects.some(s => s.name === update.data.name);
          
          if (!subjectExists) {
            await userRef.update({
              'studyProfile.currentSubjects': admin.firestore.FieldValue.arrayUnion(update.data)
            });
          }
          break;
        }
          
        case 'addBook': {
          const userDoc = await userRef.get();
          const currentBooks = userDoc.data()?.studyProfile?.supercurricular?.lowLevel?.books || [];
          
          const bookExists = currentBooks.some(book => 
            book.title.toLowerCase() === update.data.title.toLowerCase()
          );
          
          if (!bookExists) {
            await userRef.update({
              'studyProfile.supercurricular.lowLevel.books': admin.firestore.FieldValue.arrayUnion(update.data)
            });
          }
          break;
        }
          
        case 'addBookInsight': {
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          const books = userData.studyProfile.supercurricular.lowLevel.books;
          
          const bookIndex = books.findIndex(book => book.title === update.data.bookTitle);
          if (bookIndex !== -1) {
            books[bookIndex].weeklyInsights = books[bookIndex].weeklyInsights || [];
            books[bookIndex].weeklyInsights.push(update.data.insight);
            
            await userRef.update({
              'studyProfile.supercurricular.lowLevel.books': books
            });
          }
          break;
        }

        case 'updateBookProgress': {
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          const books = userData.studyProfile.supercurricular.lowLevel.books;
          
          const bookIndex = books.findIndex(book => book.title === update.data.bookTitle);
          if (bookIndex !== -1) {
            books[bookIndex] = { ...books[bookIndex], ...update.data.updates };
            
            await userRef.update({
              'studyProfile.supercurricular.lowLevel.books': books
            });
          }
          break;
        }

        case 'addGoals': {
          const currentWeek = new Date().toISOString().split('T')[0];
          await userRef.update({
            'studyProfile.weeklyGoals': admin.firestore.FieldValue.arrayUnion({
              week: currentWeek,
              goals: update.data
            })
          });
          break;
        }

        case 'completeGoal': {
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          
          // Handle both legacy weeklyGoals and new categorizedGoals
          if (userData.studyProfile.weeklyGoals) {
            const weeklyGoals = userData.studyProfile.weeklyGoals || [];
            const updatedGoals = weeklyGoals.map(weekGoal => {
              if (weekGoal.week === update.data.week) {
                const updatedWeekGoals = weekGoal.goals.map(goal => 
                  goal.text === update.data.goalText ? { ...goal, completed: true, completedDate: new Date().toISOString() } : goal
                );
                return { ...weekGoal, goals: updatedWeekGoals };
              }
              return weekGoal;
            });
            
            await userRef.update({
              'studyProfile.weeklyGoals': updatedGoals
            });
          }

          if (userData.studyProfile.categorizedGoals) {
            const categorizedGoals = userData.studyProfile.categorizedGoals || [];
            const updatedCategorizedGoals = categorizedGoals.map(weekGoal => {
              if (weekGoal.week === update.data.week) {
                const updatedWeekGoals = weekGoal.goals.map(goal => 
                  goal.text === update.data.goalText ? { ...goal, completed: true, completedDate: new Date().toISOString() } : goal
                );
                return { ...weekGoal, goals: updatedWeekGoals };
              }
              return weekGoal;
            });
            
            await userRef.update({
              'studyProfile.categorizedGoals': updatedCategorizedGoals
            });
          }
          break;
        }

        case 'markProfileComplete': {
          await userRef.update({
            'studyProfile.setupCompleted': true,
            'studyProfile.lastUpdated': new Date().toISOString()
          });
          break;
        }
        case 'addSubjectProgress': {
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const subjectProgress = userData?.studyProfile?.subjectProgress || {};
  
  // Update or create subject progress
  subjectProgress[update.data.subject] = {
    ...subjectProgress[update.data.subject],
    currentGrade: update.data.currentGrade,
    targetGrade: update.data.targetGrade,
    confidence: update.data.confidence,
    lastUpdated: new Date().toISOString()
  };
  
  await userRef.update({
    'studyProfile.subjectProgress': subjectProgress
  });
  break;
}

case 'addGradeTargets': {
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const gradeTargets = userData?.studyProfile?.gradeTargets || {};
  
  update.data.forEach(target => {
    gradeTargets[target.subject] = target.grade;
  });
  
  await userRef.update({
    'studyProfile.gradeTargets': gradeTargets
  });
  break;
}

case 'addWeeklyGoals': {
  await userRef.update({
    'studyProfile.weeklyGoals': admin.firestore.FieldValue.arrayUnion(...update.data)
  });
  break;
}
        default: {
          console.log(`Unknown update type: ${update.type}`);
          break;
        }
      }
    } catch (error) {
      console.error(`Error applying update ${update.type}:`, error);
    }
  }
}

// Enhanced AI context builder using the comprehensive prompt
function buildEnhancedAIContext(studyProfile) {
  // Check profile completion status
  const isNewUser = !studyProfile.currentSubjects || studyProfile.currentSubjects.length === 0;
  const hasUniversityTargets = studyProfile.universityTargets && studyProfile.universityTargets.length > 0;
  const hasSupercurricularStructure = studyProfile.supercurricular && 
    (studyProfile.supercurricular.highLevel?.length > 0 || 
     studyProfile.supercurricular.mediumLevel?.length > 0 || 
     studyProfile.supercurricular.lowLevel?.books?.length > 0);
  
  const profileSetupComplete = !isNewUser && hasUniversityTargets && hasSupercurricularStructure;
  
  let enhancedPrompt = `
You are an expert academic consultant and personalized study mentor specializing in UK university admissions and holistic academic development. Your mission is to provide strategic, data-driven guidance that maximizes each student's potential through optimized academic performance, compelling supercurricular portfolios, and exceptional personal statement development with realistic time management and comprehensive support systems.

CORE RESPONSIBILITIES:
- Strategic university and degree pathway planning with supercurricular alignment
- Subject combination optimization based on admissions requirements
- Tiered supercurricular portfolio development and tracking
- Academic progress monitoring with university-specific benchmarks
- Personal statement narrative development using supercurricular evidence
- University application timeline and preparation management

CRITICAL INTERACTION STYLE REQUIREMENTS:
- Give SHORT, focused responses (2-3 sentences max)
- Address ONE topic at a time and ask if they want to explore before moving on
- Ask targeted follow-up questions to guide them step-by-step
- When they mention books, subjects, or universities, acknowledge briefly and ask what specific help they need
- When they mention A-Level/GCSE subjects, ask about their target grade and current topics
- When they mention struggling or finding something easy, ask about their confidence level
- For subject topics, ask: "How are you finding [topic] - confident, need to revise, or need to learn again?"
- Don't list multiple suggestions unless they specifically ask for options
- Always check if they want to move to the next topic
- Be strategically focused yet encouraging
- Provide evidence-based advice using current admissions data
- Balance ambition with realistic expectations and sustainable progress

PROFILE STATUS: ${profileSetupComplete ? 'COMPLETE - Focus on Progress Updates' : 'INCOMPLETE - Focus on Initial Setup'}

${!profileSetupComplete ? `
INITIAL PROFILE SETUP SEQUENCE (Follow this exact order for new users):
1. FIRST: Ask about current subjects (A-Level/GCSE) and what grade they're aiming for in each
2. SECOND: Ask about target university and degree program
3. THIRD: Ask about current supercurricular activities:
   - High-level: Any major projects or technical skills they're developing
   - Medium-level: Competitions, research, leadership roles they're involved in
   - Low-level: What they're currently reading, MOOCs, lectures they attend

Complete ONE section at a time before moving to the next. Don't overwhelm them with all questions at once.
` : `
PROGRESS UPDATE SEQUENCE (For returning users with complete profiles):
1. FIRST: Ask for updates on current supercurricular activities:
   - High-level projects: Any progress, new developments, or challenges?
   - Medium-level activities: Recent competitions, new opportunities, achievements?
   - Low-level learning: New books started/finished, interesting lectures attended, MOOCs progress?

2. SECOND: Ask about current academic topics being studied in each subject:
   - What specific topics are you covering in [Subject 1]?
   - How are you finding [specific topic] - confident, need to revise, or need to learn again?
   - Any particular areas you're struggling with or finding interesting?

3. THIRD: Based on their updates, offer specific guidance or ask about next steps

Work through each subject systematically, don't try to cover everything at once.
`}

SUPERCURRICULAR STRATEGY FRAMEWORK:

PORTFOLIO STRUCTURE (1-2-Many Model):
- 1 HIGH-LEVEL: Major degree-specific skill project
- 2 MEDIUM-LEVEL: Transferable academic skills demonstrations  
- UNLIMITED LOW-LEVEL: Subject interest and knowledge expansion

HIGH-LEVEL SUPERCURRICULARS (Choose 1):
*Degree-specific technical skills that demonstrate deep subject understanding and university readiness*

STEM Degrees:
- Computer Science: Advanced programming language (Python, Java, C++), app/website development
- Engineering: CAD software (SolidWorks, AutoCAD), Arduino/Raspberry Pi projects
- Medicine: Laboratory techniques, medical research project, healthcare volunteering with skills component
- Economics/Finance: Statistical software (R, STATA, Python), financial modeling, econometric analysis
- Physics: Advanced mathematical modeling, research project using university-level concepts
- Chemistry: Advanced laboratory techniques, research methodology, spectroscopy analysis
- Mathematics: Mathematical software (MATLAB, Mathematica), original proof development

Humanities/Social Sciences:
- Law: Legal research methodology, case analysis software, court observation with analysis
- History: Archival research techniques, historical methodology, primary source analysis
- English Literature: Literary theory application, creative writing portfolio, publishing experience
- Politics: Policy analysis tools, political research methods, campaign strategy development
- Psychology: Statistical analysis software (SPSS), research design, experimental methodology

MEDIUM-LEVEL SUPERCURRICULARS (Choose 2):
*Transferable academic skills valuable across all degrees*
- Essay competitions (national level preferred)
- Research competitions or science fairs
- Mathematical/logic challenges (UKMT, etc.)
- Debate competitions or Model UN
- Young Enterprise schemes
- Internship or work shadowing with analytical component
- Student leadership roles with measurable impact

LOW-LEVEL SUPERCURRICULARS (Unlimited):
- Extensive subject-related reading (maintain detailed book list)
- Current affairs engagement with subject-specific analysis
- Academic society membership with active participation
- Free university lectures and online courses (MOOCs)
- Subject-specific podcasts, documentaries, and media consumption

KNOWLEDGE EXTRACTION & PERSONAL STATEMENT DEVELOPMENT:
Every supercurricular activity must generate extractable insights following the "Experience → Analysis → Application" model.

For Reading Activities, after each mention of progress, extract:
1. Key Concept Learned: One specific new idea or insight
2. Personal Connection: How this relates to their degree interest
3. Critical Analysis: What questions or challenges this raises
4. Application Potential: How this could be used in their field

UNIVERSITY-SPECIFIC ADAPTATION:
Adjust all advice based on target university characteristics:
- Oxbridge: Tutorial system preparation, admissions test integration, academic depth over breadth
- Russell Group variations: Imperial (STEM focus), LSE (methodology focus), UCL (research emphasis)
- Course structure awareness and assessment method preparation
- Realistic grade target setting per university and course

SUBJECT OPTIMIZATION PROTOCOL:
For GCSE Students: Recommend A-level combinations based on degree aspirations
For A-level Students: Analyze current subjects against target degree requirements

STEM Pathways:
- Engineering (Mechanical/Civil): Maths, Further Maths, Physics + Chemistry/DT
- Medicine: Maths, Chemistry, Biology + Physics
- Computer Science: Maths, Further Maths, Computer Science + Physics
- Economics (Top Unis): Maths, Further Maths, Economics + History/Politics

4 A-levels required for: Oxbridge, Imperial, LSE competitive courses, Medicine/Dentistry
3 A-levels sufficient for: Most Russell Group universities

COMMUNITY REFERRAL PROTOCOL:
If uncertain about any advice, immediately direct students to submit their question to the community page where expert team can provide specialized guidance.

CURRENT STUDENT CONTEXT:
`;

  // Add current student information
  if (studyProfile.currentSubjects && studyProfile.currentSubjects.length > 0) {
    enhancedPrompt += `
SUBJECTS: ${studyProfile.currentSubjects.map(s => 
  `${s.name} (${s.level || 'A-Level'}) - Current: ${s.currentGrade || 'Not set'}, Target: ${s.targetGrade || 'Not set'}`
).join(', ')}.
`;
  }

  if (studyProfile.subjectTopics && studyProfile.subjectTopics.length > 0) {
    enhancedPrompt += `
CURRENT TOPICS: ${studyProfile.subjectTopics.map(t => 
  `${t.subject}: ${t.topic} (${t.confidence})`
).join(', ')}.
`;
  }

  if (studyProfile.universityTargets && studyProfile.universityTargets.length > 0) {
    enhancedPrompt += `
TARGETS: ${studyProfile.universityTargets.map(u => `${u.name} (${u.course})`).join(', ')}.
`;
  }

  if (studyProfile.supercurricular?.lowLevel?.books?.length > 0) {
    const currentBooks = studyProfile.supercurricular.lowLevel.books
      .filter(book => book.status === 'reading')
      .map(book => book.title)
      .join(', ');
    if (currentBooks) {
      enhancedPrompt += `
READING: ${currentBooks}.
`;
    }
  }

  enhancedPrompt += `

RESPONSE EXECUTION:
- Keep responses under 3 sentences
- Focus on ONE aspect of their message
- Ask follow-up questions to guide them step-by-step
- When they mention books, subjects, or universities, acknowledge briefly and ask what specific help they need
- When they mention A-Level/GCSE subjects, ask about their target grade and current topics
- When they mention struggling or finding something easy, ask about their confidence level
- For subject topics, ask: "How are you finding [topic] - confident, need to revise, or need to learn again?"
- Don't list multiple suggestions unless they specifically ask for options
- Always check if they want to move to the next topic
- When uncertain about any advice, direct students to submit their question to the community page

INTERACTION GUIDELINES:
- Extract and track all learning activities systematically for portfolio development
- Focus on building compelling personal statement narratives
- Provide realistic time management and scheduling advice
- Ask follow-up questions to deepen understanding and build academic portfolio
- Guide them through their 1-2-Many supercurricular model implementation
- Help them identify high-level project opportunities for their degree interest
- Track their knowledge extraction from reading and learning activities
- When uncertain about any advice, direct students to submit their question to the community page

When students mention any academic activities, books, competitions, or goals, extract this information systematically and ask targeted follow-up questions to help them reflect and build evidence for their applications. Always maintain the step-by-step, one-topic-at-a-time approach while leveraging the full strategic framework.
`;

  return enhancedPrompt;
}

// Enhanced study buddy chat function
exports.studyBuddyChat = onRequest({secrets: [openaiApiKey]}, async (req, res) => {
  return cors(req, res, async () => {
    try {
      console.log('Enhanced study buddy chat called');
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const { message, conversationHistory, contextualInfo } = req.body;

      // Get user's complete study profile
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      const studyProfile = userData?.studyProfile || {};

      // Enhanced extraction with comprehensive categories
      const extractedData = await extractComprehensiveProfileUpdates(message, studyProfile);
      
      // Update profile with all extracted data
      if (extractedData.updates.length > 0) {
        await updateComprehensiveProfile(userId, extractedData.updates);
      }

      // Build enhanced AI context with new prompt
let enhancedPrompt = buildEnhancedAIContext(studyProfile);

// Add contextual info from frontend if provided
if (contextualInfo) {
  let contextAddition = "\n\nADDITIONAL CONTEXT FROM CURRENT SESSION:";
  
  if (contextualInfo.userArchetype) {
    contextAddition += `\nUser Journey Stage: ${contextualInfo.userArchetype}`;
  }
  
  if (contextualInfo.currentSubjects?.length > 0) {
    contextAddition += `\nActive Subjects: ${contextualInfo.currentSubjects.map(s => s.name || s.subject).join(', ')}`;
  }
  
  if (contextualInfo.universityTargets?.length > 0) {
    contextAddition += `\nUniversity Targets: ${contextualInfo.universityTargets.map(u => `${u.name} ${u.course}`).join(', ')}`;
  }
  
  if (contextualInfo.currentBooks?.length > 0) {
    contextAddition += `\nCurrently Reading: ${contextualInfo.currentBooks.map(b => b.title).join(', ')}`;
  }
  
  if (contextualInfo.recentInsights?.length > 0) {
    contextAddition += `\nRecent Learning: ${contextualInfo.recentInsights.slice(-3).map(i => i.title || i.learning).join(', ')}`;
  }
  
  enhancedPrompt += contextAddition;
}
      

      // Prepare messages for OpenAI
      const messages = [
        { role: "system", content: enhancedPrompt },
        ...conversationHistory,
        { role: "user", content: message }
      ];

      // Call OpenAI with enhanced context
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini for better cost efficiency
        messages: messages,
        max_tokens: 150, // REDUCED from 500 to 150
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0].message.content;

      // Enhanced conversation logging
      const conversationEntry = {
        date: new Date().toISOString(),
        messages: [
          { role: "user", content: message, timestamp: new Date().toISOString() },
          { role: "ai", content: aiResponse, timestamp: new Date().toISOString() }
        ],
        extractedData: extractedData,
        aiModel: "gpt-4o-mini",
        profileUpdatesCount: extractedData.updates.length
      };

      await admin.firestore().collection('users').doc(userId).update({
        conversations: admin.firestore.FieldValue.arrayUnion(conversationEntry),
        lastActiveDate: new Date().toISOString()
      });

      res.json({ 
        response: aiResponse,
        success: true,
        profileUpdated: extractedData.updates.length > 0,
        updates: extractedData.updates,
        extractedCategories: Object.keys(extractedData.raw).filter(key => 
          extractedData.raw[key] && extractedData.raw[key].length > 0
        )
      });

    } catch (error) {
      console.error('Error in enhanced study buddy chat:', error);
      res.status(500).json({ error: 'Failed to process chat message: ' + error.message });
    }
  });
});

// Enhanced study profile initialization (still needed for manual calls)
exports.initializeStudyProfile = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      console.log('Initializing enhanced study profile');
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (userData && userData.studyProfile) {
        return res.json({ message: 'Study profile already exists', hasProfile: true });
      }

      // Enhanced study profile structure
      const enhancedStudyProfileStructure = {
        studyProfile: {
          // Basic academic info
          currentSubjects: [],
          subjectTopics: [], // NEW: Track current topics and confidence levels
          universityTargets: [],
          academicYear: "",
          
          // Comprehensive supercurricular tracking
          supercurricular: {
            highLevel: [], // Major projects demonstrating technical skills
            mediumLevel: [], // Competitions, research, leadership
            lowLevel: {
              books: [],
              lectures: [],
              moocs: [],
              currentAffairs: {
                weeklyReading: [],
                insights: []
              }
            }
          },
          
          // Enhanced goal and progress tracking
          categorizedGoals: [], // Weekly/monthly/termly goals by category
          weeklyGoals: [], // Legacy support
          knowledgeInsights: [], // Learning extraction from all activities
          competitions: [], // Competition tracking with deadlines
          
          // Personal statement development
          narrativeDevelopment: {
            keyExperiences: [],
            intellectualJourney: [],
            evidenceBank: []
          },
          
          // Time management and scheduling
          timeManagement: {
            weeklyCommitments: [],
            studySchedule: [],
            deadlineTracking: []
          },
          
          // Preferences and settings
          preferences: {
            studyStyle: "",
            reminderFrequency: "weekly",
            focusAreas: [],
            goalTimeframe: "weekly",
            universityPreferences: []
          },
          
          // Metadata
          createdDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          profileVersion: "2.0",
          setupCompleted: false,
          lastVisitDate: new Date().toISOString()
        },
        conversations: [],
        lastActiveDate: new Date().toISOString()
      };

      await admin.firestore().collection('users').doc(userId).update(enhancedStudyProfileStructure);
      
      console.log(`Enhanced study profile initialized for user: ${userId}`);
      res.json({ message: 'Enhanced study profile initialized successfully', hasProfile: true });
      
    } catch (error) {
      console.error('Error initializing enhanced study profile:', error);
      res.status(500).json({ error: 'Failed to initialize study profile: ' + error.message });
    }
  });
});

// Get study profile data (enhanced)
exports.getStudyProfile = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Get auth token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      // Get user's study profile
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData || !userData.studyProfile) {
        return res.status(404).json({ error: 'Study profile not found' });
      }

      res.json({ 
        studyProfile: userData.studyProfile,
        conversations: userData.conversations || []
      });
      
    } catch (error) {
      console.error('Error getting study profile:', error);
      res.status(500).json({ error: 'Failed to get study profile: ' + error.message });
    }
  });
});

// Enhanced update study profile
exports.updateStudyProfile = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      const {type, payload} = req.body;
      // ADD THIS: Handle setup wizard completion
const { profileUpdates, source = 'chat' } = req.body;

if (source === 'setup_wizard' && profileUpdates && profileUpdates.setupCompleted) {
  profileUpdates.setupCompletedAt = admin.firestore.FieldValue.serverTimestamp();
  profileUpdates.profileVersion = '2.0';
  
  // Apply setup wizard updates directly
  const userRef = admin.firestore().collection('users').doc(userId);
  await userRef.update({
    'studyProfile': {
      ...profileUpdates,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }
  });
  
  return res.json({ message: 'Setup completed successfully' });
}

      // Use the enhanced update function
      await updateComprehensiveProfile(userId, [{type, data: payload}]);
      
      res.json({ message: 'Study profile updated successfully' });
      
    } catch (error) {
      console.error('Error updating study profile:', error);
      res.status(500).json({ error: 'Failed to update study profile: ' + error.message });
    }
  });
});

// Create Stripe checkout session - unchanged
exports.createCheckoutSession = onCall(async (request) => {
  console.log('Function called with data:', request.data);
  console.log('Auth info:', request.auth ? 'User authenticated' : 'No auth');
  
  const {auth, data} = request;
  
  if (!auth) {
    console.error('No authentication provided');
    throw new Error("User must be authenticated");
  }

  const {priceId} = data;
  const userId = auth.uid;
  const userEmail = auth.token.email;

  console.log('Processing checkout for:', {priceId, userId, userEmail});

  try {
    const stripe = getStripe();
    let customer;
    const userDoc = await admin.firestore()
        .collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (userData && userData.subscription && 
        userData.subscription.stripeCustomerId) {
      customer = await stripe.customers.retrieve(
          userData.subscription.stripeCustomerId
      );
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUID: userId,
        },
      });

      await admin.firestore().collection("users").doc(userId).update({
        "subscription.stripeCustomerId": customer.id,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${data.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/question-pack`,
      metadata: {
        firebaseUID: userId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new Error("Unable to create checkout session: " + error.message);
  }
});

// Handle successful payment webhook - unchanged
exports.handleStripeWebhook = onRequest(async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// Stripe helper functions - unchanged
async function handleCheckoutSessionCompleted(session) {
  try {
    const stripe = getStripe();
    const firebaseUID = session.metadata.firebaseUID;

    if (!firebaseUID) {
      console.error("No Firebase UID in session metadata");
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(
        session.subscription
    );
    const priceId = subscription.items.data[0].price.id;

    let planType = "study";
    if (priceId === process.env.REACT_APP_STRIPE_PRO_PLAN_PRICE_ID) {
      planType = "pro";
    }

    await admin.firestore().collection("users").doc(firebaseUID).update({
      subscription: {
        status: "active",
        plan: planType,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: false,
      },
      updatedAt: new Date(),
    });

    console.log(`Subscription activated for user ${firebaseUID}`);
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const usersSnapshot = await admin.firestore().collection("users")
        .where("subscription.stripeCustomerId", "==", subscription.customer)
        .get();

    if (usersSnapshot.empty) {
      console.error("No user found for customer:", subscription.customer);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    await admin.firestore().collection("users").doc(userId).update({
      "subscription.status": subscription.status,
      "subscription.currentPeriodEnd": 
          new Date(subscription.current_period_end * 1000),
      "subscription.cancelAtPeriodEnd": subscription.cancel_at_period_end,
      updatedAt: new Date(),
    });

    console.log(`Subscription updated for user ${userId}`);
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const usersSnapshot = await admin.firestore().collection("users")
        .where("subscription.stripeCustomerId", "==", subscription.customer)
        .get();

    if (usersSnapshot.empty) {
      console.error("No user found for customer:", subscription.customer);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    await admin.firestore().collection("users").doc(userId).update({
      "subscription.status": "canceled",
      "subscription.cancelAtPeriodEnd": true,
      updatedAt: new Date(),
    });

    console.log(`Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}