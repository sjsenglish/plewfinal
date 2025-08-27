// University Research Prompting Logic for Firebase Function
// Add this to your studyBuddyChat function

const generateUniversityResearchPrompts = (universityTargets) => {
  const prompts = [];
  
  // Known UK university requirements (you can expand this database)
  const universityRequirements = {
    'cambridge': {
      'economics': { grades: 'A*A*A', subjects: ['Maths', 'Further Maths'], admissionTest: 'ECAA' },
      'medicine': { grades: 'A*A*A', subjects: ['Chemistry', 'Biology'], admissionTest: 'BMAT' },
      'engineering': { grades: 'A*A*A', subjects: ['Maths', 'Further Maths', 'Physics'], admissionTest: null },
      'computer science': { grades: 'A*A*A', subjects: ['Maths', 'Further Maths'], admissionTest: null }
    },
    'oxford': {
      'ppe': { grades: 'A*AA', subjects: ['Maths recommended'], admissionTest: 'TSA' },
      'medicine': { grades: 'A*AA', subjects: ['Chemistry', 'Biology'], admissionTest: 'BMAT' },
      'physics': { grades: 'A*AA', subjects: ['Maths', 'Further Maths', 'Physics'], admissionTest: 'PAT' },
      'economics and management': { grades: 'A*AA', subjects: ['Maths'], admissionTest: 'TSA' }
    },
    'lse': {
      'economics': { grades: 'A*AA', subjects: ['Maths'], admissionTest: null },
      'ppe': { grades: 'AAA', subjects: ['Maths recommended'], admissionTest: null },
      'politics': { grades: 'AAA', subjects: [], admissionTest: null }
    },
    'imperial': {
      'engineering': { grades: 'A*A*A', subjects: ['Maths', 'Further Maths', 'Physics'], admissionTest: null },
      'medicine': { grades: 'AAA', subjects: ['Chemistry', 'Biology'], admissionTest: 'BMAT' },
      'computer science': { grades: 'A*A*A', subjects: ['Maths', 'Further Maths'], admissionTest: null }
    },
    'ucl': {
      'economics': { grades: 'A*AA', subjects: ['Maths'], admissionTest: null },
      'medicine': { grades: 'A*AA', subjects: ['Chemistry', 'Biology'], admissionTest: 'BMAT' },
      'engineering': { grades: 'A*AA', subjects: ['Maths', 'Physics'], admissionTest: null }
    }
  };

  const courseModules = {
    'cambridge': {
      'economics': {
        year1Core: ['Microeconomics', 'Macroeconomics', 'Mathematics for Economics', 'Statistics'],
        year2Options: ['Game Theory', 'International Trade', 'Development Economics', 'Public Economics'],
        year3Options: ['Behavioral Economics', 'Labor Economics', 'Monetary Economics', 'Industrial Organization']
      },
      'engineering': {
        year1Core: ['Mathematics', 'Mechanics', 'Electrical Circuits', 'Materials Science'],
        year2Options: ['Thermodynamics', 'Fluid Mechanics', 'Structural Engineering', 'Control Systems'],
        year3Options: ['Advanced Materials', 'Robotics', 'Renewable Energy', 'Bioengineering']
      }
    },
    'oxford': {
      'ppe': {
        year1Core: ['Introductory Economics', 'Elements of Deductive Logic', 'General Philosophy', 'British Politics'],
        year2Options: ['Microeconomics', 'Macroeconomics', 'Political Theory', 'Moral Philosophy'],
        year3Options: ['Advanced Economic Theory', 'Political Sociology', 'Philosophy of Mind', 'International Relations']
      }
    },
    'lse': {
      'economics': {
        year1Core: ['Microeconomics', 'Macroeconomics', 'Mathematical Methods', 'Statistics'],
        year2Options: ['Econometrics', 'Game Theory', 'Public Economics', 'Development Economics'],
        year3Options: ['Advanced Econometrics', 'Behavioral Economics', 'Financial Economics', 'Industrial Organization']
      }
    }
  };

  universityTargets.forEach(uni => {
    const uniKey = uni.name?.toLowerCase().replace(/university of /g, '').replace(/\s+/g, '');
    const courseKey = uni.course?.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const knownRequirements = universityRequirements[uniKey]?.[courseKey];
    const knownModules = courseModules[uniKey]?.[courseKey];
    
    // Check what's missing and generate specific prompts
    const missingItems = [];
    
    // Requirements check
    if (!uni.requirements?.grades && knownRequirements) {
      missingItems.push({
        type: 'requirements',
        prompt: `I noticed you're interested in ${uni.name} ${uni.course}. This course typically requires ${knownRequirements.grades} with ${knownRequirements.subjects.join(', ')}${knownRequirements.admissionTest ? ` and the ${knownRequirements.admissionTest} admission test` : ''}. Have you checked these requirements on their website?`,
        data: knownRequirements
      });
    } else if (!uni.requirements?.grades) {
      missingItems.push({
        type: 'requirements',
        prompt: `I'd like to help you research the grade requirements for ${uni.name} ${uni.course}. Could you look up their entry requirements and admission test requirements?`,
        data: null
      });
    }
    
    // Modules check
    if (!uni.modules?.year1Core?.length && knownModules) {
      missingItems.push({
        type: 'modules',
        prompt: `For ${uni.name} ${uni.course}, the first-year core modules typically include ${knownModules.year1Core.slice(0, 3).join(', ')} and others. Have you looked at their full course structure?`,
        data: knownModules
      });
    } else if (!uni.modules?.year1Core?.length) {
      missingItems.push({
        type: 'modules',
        prompt: `I'd love to help you understand the course structure for ${uni.name} ${uni.course}. Could you research what modules you'd study in each year?`,
        data: null
      });
    }
    
    // Department specializations check
    if (!uni.department?.specializations?.length) {
      missingItems.push({
        type: 'department',
        prompt: `Have you looked into the different research areas and specializations within the ${uni.course} department at ${uni.name}? This will help you write a more targeted personal statement.`,
        data: null
      });
    }
    
    // Tutors check
    if (!uni.tutors?.length) {
      missingItems.push({
        type: 'tutors',
        prompt: `For a strong application to ${uni.name}, I recommend finding 2-3 professors whose research interests align with yours. Have you looked at the faculty research areas yet?`,
        data: null
      });
    }
    
    if (missingItems.length > 0) {
      // Set research reminder flag
      uni.researchReminder = true;
      uni.lastReminderDate = new Date().toISOString();
      
      prompts.push({
        university: uni.name,
        course: uni.course,
        missingItems: missingItems,
        priority: uni.priority || 'target'
      });
    }
  });
  
  return prompts;
};

const formatUniversityResearchResponse = (baseResponse, researchPrompts) => {
  if (researchPrompts.length === 0) return baseResponse;
  
  let researchSection = "\n\n🎯 **University Research Updates:**\n\n";
  
  researchPrompts.forEach(prompt => {
    researchSection += `**${prompt.university} ${prompt.course}:**\n`;
    
    // Ask about most important missing items first
    const priorities = ['requirements', 'modules', 'department', 'tutors'];
    const sortedItems = prompt.missingItems.sort((a, b) => 
      priorities.indexOf(a.type) - priorities.indexOf(b.type)
    );
    
    // Ask top 2 most important items to avoid overwhelming
    sortedItems.slice(0, 2).forEach(item => {
      researchSection += `• ${item.prompt}\n`;
    });
    
    if (prompt.missingItems.length > 2) {
      researchSection += `• Plus ${prompt.missingItems.length - 2} more research areas to explore.\n`;
    }
    
    researchSection += "\n";
  });
  
  researchSection += "💡 **Research Tips:**\n";
  researchSection += "• Visit official university course pages\n";
  researchSection += "• Look at department faculty research interests\n";
  researchSection += "• Check recent admissions statistics\n";
  researchSection += "• Read current student experiences\n\n";
  researchSection += "*Tell me what you discover and I'll organize it for your applications!*";
  
  return baseResponse + researchSection;
};

// Usage in your Firebase function:
const handleUniversityResearchPrompting = async (userMessage, profile, baseResponse) => {
  if (!profile.universityTargets?.length) return baseResponse;
  
  // Check if user mentioned "later" or "remind me" - respect their timing
  const wantsToDeferResearch = /later|remind|next time|not now|busy/i.test(userMessage);
  if (wantsToDeferResearch) {
    // Set gentler reminder for next conversation
    profile.universityTargets.forEach(uni => {
      if (!uni.requirements?.grades || !uni.modules?.year1Core?.length) {
        uni.researchReminder = true;
        uni.gentleReminder = true; // Flag for softer approach next time
      }
    });
    return baseResponse + "\n\nNo problem! I'll remind you about university research next time we chat. 😊";
  }
  
  // Check if this is a follow-up conversation and we have pending research
  const needsResearchReminder = profile.universityTargets.some(uni => 
    uni.researchReminder && (!uni.lastReminderDate || 
    Date.now() - new Date(uni.lastReminderDate).getTime() > 24 * 60 * 60 * 1000) // 24 hours
  );
  
  if (needsResearchReminder) {
    const researchPrompts = generateUniversityResearchPrompts(profile.universityTargets);
    return formatUniversityResearchResponse(baseResponse, researchPrompts);
  }
  
  return baseResponse;
};

// Export for use in Firebase function
module.exports = {
  generateUniversityResearchPrompts,
  formatUniversityResearchResponse,
  handleUniversityResearchPrompting
};