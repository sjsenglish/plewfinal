// university-data-processor.js - Helper module for processing university information
// Save this as a separate file in your Firebase functions folder

// Process student's response about university research and extract structured data
const processUniversityResponse = (message, existingUniversityTargets) => {
  const updates = [];
  const extractedData = {
    universities: [],
    requirements: [],
    modules: [],
    tutors: [],
    departments: []
  };

  // University name patterns
  const universityPatterns = [
    /(?:interested in|applying to|looking at|considering)\s+([A-Z][a-zA-Z\s]+(?:University|College|School|LSE|UCL|Imperial))/gi,
    /(Cambridge|Oxford|LSE|UCL|Imperial|Edinburgh|Warwick|Bristol|Manchester|Nottingham|Birmingham|Leeds|Sheffield|Southampton|York|Bath|Durham|Exeter|Lancaster|St Andrews|Surrey|Sussex|Cardiff|Glasgow|Newcastle)\s+(Economics|Engineering|Medicine|Physics|Chemistry|Computer Science|PPE|Politics|Law|English|History|Psychology|Mathematics|Biology)/gi
  ];

  // Grade requirements patterns
  const gradePatterns = [
    /(?:requires?|needs?|grade requirements?|entry requirements?)\s*:?\s*([A-Z*]+(?:\s*[A-Z*]+)*)/gi,
    /([A-Z*]{3,})\s+(?:grades?|requirements?|needed|required)/gi,
    /(?:need|require)\s+([A-Z*]{3,})(?:\s+grades?)?/gi
  ];

  // Admission test patterns
  const testPatterns = [
    /(BMAT|ECAA|TSA|PAT|LNAT|UKCAT|GAMSAT|MAT|STEP|AEA)\s*(?:test|exam|assessment)?/gi,
    /(?:admission test|entrance exam|assessment).*?([A-Z]{3,})/gi,
    /no\s+(?:admission\s+)?test(?:\s+required)?/gi
  ];

  // Subject requirements patterns
  const subjectPatterns = [
    /(?:required subjects?|need|must have|prerequisites?).*?([A-Z][a-zA-Z\s,]+(?:Maths|Mathematics|Physics|Chemistry|Biology|Further\s+Maths|Economics|English|History))/gi,
    /(?:with|including|plus)\s+([A-Z][a-zA-Z\s,]+(?:Maths|Mathematics|Physics|Chemistry|Biology|Further\s+Maths|Economics))/gi
  ];

  // Module patterns
  const modulePatterns = [
    /(?:first[- ]?year|year\s*1)\s*(?:modules?|courses?|subjects?).*?:?\s*([A-Z][a-zA-Z\s,]+)/gi,
    /(?:second[- ]?year|year\s*2)\s*(?:modules?|courses?|subjects?).*?:?\s*([A-Z][a-zA-Z\s,]+)/gi,
    /(?:third[- ]?year|year\s*3|final\s*year)\s*(?:modules?|courses?|subjects?).*?:?\s*([A-Z][a-zA-Z\s,]+)/gi,
    /(?:core modules?|compulsory|mandatory).*?:?\s*([A-Z][a-zA-Z\s,]+)/gi,
    /(?:optional modules?|electives?).*?:?\s*([A-Z][a-zA-Z\s,]+)/gi
  ];

  // Tutor/Professor patterns
  const tutorPatterns = [
    /(?:Dr\.?|Professor|Prof\.?)\s+([A-Z][a-zA-Z\s]+)(?:\s+(?:specializes?|researches?|focuses?\s+on|works?\s+on)\s+([a-zA-Z\s,]+))?/gi,
    /([A-Z][a-zA-Z\s]+)\s+(?:researches?|studies|focuses?\s+on|specializes?\s+in)\s+([a-zA-Z\s,]+)/gi
  ];

  // Department/specialization patterns
  const departmentPatterns = [
    /(?:department|faculty)\s+(?:of\s+)?([A-Z][a-zA-Z\s]+)/gi,
    /(?:specializations?|research areas?|focuses?).*?:?\s*([A-Z][a-zA-Z\s,]+)/gi
  ];

  // Process university mentions
  universityPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const universityInfo = {
        name: match[1] ? match[1].trim() : match[0].trim(),
        course: match[2] ? match[2].trim() : null,
        dateAdded: new Date().toISOString(),
        source: 'conversation'
      };
      extractedData.universities.push(universityInfo);
    }
  });

  // Process grade requirements
  gradePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      extractedData.requirements.push({
        type: 'grades',
        value: match[1].trim(),
        raw: match[0]
      });
    }
  });

  // Process admission tests
  testPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const testValue = match[0].toLowerCase().includes('no') ? null : match[1]?.trim();
      extractedData.requirements.push({
        type: 'admissionTest',
        value: testValue,
        raw: match[0]
      });
    }
  });

  // Process subject requirements
  subjectPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const subjects = match[1].split(/[,&]/).map(s => s.trim()).filter(s => s.length > 2);
      extractedData.requirements.push({
        type: 'subjects',
        value: subjects,
        raw: match[0]
      });
    }
  });

  // Process modules
  modulePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const modules = match[1].split(/[,&]/).map(s => s.trim()).filter(s => s.length > 2);
      const yearType = match[0].toLowerCase().includes('first') || match[0].includes('1') ? 'year1Core' :
                      match[0].toLowerCase().includes('second') || match[0].includes('2') ? 'year2Options' :
                      match[0].toLowerCase().includes('third') || match[0].includes('3') ? 'year3Options' :
                      match[0].toLowerCase().includes('core') ? 'year1Core' :
                      match[0].toLowerCase().includes('optional') ? 'year2Options' : 'general';
      
      extractedData.modules.push({
        type: yearType,
        modules: modules,
        raw: match[0]
      });
    }
  });

  // Process tutors
  tutorPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      extractedData.tutors.push({
        name: match[1].trim(),
        interests: match[2] ? match[2].trim() : null,
        raw: match[0]
      });
    }
  });

  // Process departments
  departmentPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      extractedData.departments.push({
        name: match[1].trim(),
        raw: match[0]
      });
    }
  });

  return {
    extractedData,
    updates
  };
};

// Update existing university targets with new information
const updateUniversityTargets = (existingTargets, extractedData) => {
  const updatedTargets = [...existingTargets];
  const updates = [];

  // Helper function to find matching university
  const findUniversityMatch = (universityName, courseName) => {
    return updatedTargets.find(target => {
      const nameMatch = target.name?.toLowerCase().includes(universityName.toLowerCase()) ||
                       universityName.toLowerCase().includes(target.name?.toLowerCase());
      const courseMatch = !courseName || !target.course || 
                         target.course?.toLowerCase().includes(courseName.toLowerCase()) ||
                         courseName.toLowerCase().includes(target.course?.toLowerCase());
      return nameMatch && courseMatch;
    });
  };

  // Add new universities
  extractedData.universities.forEach(newUni => {
    const existing = findUniversityMatch(newUni.name, newUni.course);
    if (!existing && newUni.name && newUni.course) {
      updatedTargets.push({
        name: newUni.name,
        course: newUni.course,
        priority: 'target',
        dateAdded: newUni.dateAdded,
        requirements: {},
        modules: {},
        department: {},
        tutors: [],
        researchReminder: true
      });
      updates.push(`Added ${newUni.name} ${newUni.course} as target university`);
    }
  });

  // Update requirements for existing universities
  if (extractedData.requirements.length > 0) {
    const targetToUpdate = updatedTargets.find(target => 
      !target.requirements?.grades || target.researchReminder
    ) || updatedTargets[updatedTargets.length - 1];

    if (targetToUpdate) {
      extractedData.requirements.forEach(req => {
        if (req.type === 'grades') {
          targetToUpdate.requirements = targetToUpdate.requirements || {};
          targetToUpdate.requirements.grades = req.value;
          updates.push(`Updated grade requirements for ${targetToUpdate.name}`);
        } else if (req.type === 'admissionTest') {
          targetToUpdate.requirements = targetToUpdate.requirements || {};
          targetToUpdate.requirements.admissionTest = req.value;
          updates.push(`Updated admission test info for ${targetToUpdate.name}`);
        } else if (req.type === 'subjects') {
          targetToUpdate.requirements = targetToUpdate.requirements || {};
          targetToUpdate.requirements.subjects = req.value;
          updates.push(`Updated subject requirements for ${targetToUpdate.name}`);
        }
      });
    }
  }

  // Update modules
  if (extractedData.modules.length > 0) {
    const targetToUpdate = updatedTargets.find(target => 
      !target.modules?.year1Core || target.researchReminder
    ) || updatedTargets[updatedTargets.length - 1];

    if (targetToUpdate) {
      targetToUpdate.modules = targetToUpdate.modules || {};
      
      extractedData.modules.forEach(moduleInfo => {
        if (moduleInfo.type && moduleInfo.modules.length > 0) {
          targetToUpdate.modules[moduleInfo.type] = moduleInfo.modules;
          updates.push(`Updated ${moduleInfo.type} modules for ${targetToUpdate.name}`);
        }
      });
    }
  }

  // Update tutors
  if (extractedData.tutors.length > 0) {
    const targetToUpdate = updatedTargets.find(target => 
      !target.tutors?.length || target.researchReminder
    ) || updatedTargets[updatedTargets.length - 1];

    if (targetToUpdate) {
      targetToUpdate.tutors = targetToUpdate.tutors || [];
      
      extractedData.tutors.forEach(tutor => {
        const existingTutor = targetToUpdate.tutors.find(t => t.name === tutor.name);
        if (!existingTutor) {
          targetToUpdate.tutors.push({
            name: tutor.name,
            interests: tutor.interests,
            dateAdded: new Date().toISOString()
          });
          updates.push(`Added tutor ${tutor.name} for ${targetToUpdate.name}`);
        }
      });
    }
  }

  // Update department info
  if (extractedData.departments.length > 0) {
    const targetToUpdate = updatedTargets.find(target => 
      !target.department?.name || target.researchReminder
    ) || updatedTargets[updatedTargets.length - 1];

    if (targetToUpdate) {
      targetToUpdate.department = targetToUpdate.department || {};
      
      extractedData.departments.forEach(dept => {
        if (!targetToUpdate.department.name) {
          targetToUpdate.department.name = dept.name;
          updates.push(`Updated department info for ${targetToUpdate.name}`);
        }
      });
    }
  }

  // Clear research reminder if substantial progress made
  updatedTargets.forEach(target => {
    if (target.researchReminder) {
      const hasRequirements = target.requirements?.grades;
      const hasModules = target.modules?.year1Core?.length > 0;
      const hasTutors = target.tutors?.length > 0;

if (hasRequirements && hasModules && hasTutors) {
      

        target.researchReminder = false;
        target.lastResearchUpdate = new Date().toISOString();
      }
    }
  });

  return {
    updatedTargets,
    updates
  };
};

// Generate contextual response based on what information was provided
const generateContextualResponse = (extractedData, updates) => {
  let response = "";
  
  if (extractedData.universities.length > 0) {
    const uni = extractedData.universities[0];
    response += `Great choice with ${uni.name}${uni.course ? ` for ${uni.course}` : ''}! `;
  }
  
  if (extractedData.requirements.length > 0) {
    response += "I've noted the entry requirements you've researched. ";
    
    const grades = extractedData.requirements.find(r => r.type === 'grades');
    const test = extractedData.requirements.find(r => r.type === 'admissionTest');
    const subjects = extractedData.requirements.find(r => r.type === 'subjects');
    
    if (grades) {
      response += `${grades.value} grades will be your target. `;
    }
    
    if (test) {
      if (test.value) {
        response += `Make sure to prepare well for the ${test.value} admission test. `;
      } else {
        response += "Good to know there's no admission test required. ";
      }
    }
    
    if (subjects && subjects.value.length > 0) {
      response += `Your ${subjects.value.join(', ')} subjects align well with the requirements. `;
    }
  }
  
  if (extractedData.modules.length > 0) {
    response += "Excellent research on the course modules! ";
    
    const coreModules = extractedData.modules.find(m => m.type === 'year1Core');
    if (coreModules && coreModules.modules.length > 0) {
      response += `Understanding the first-year structure with modules like ${coreModules.modules.slice(0, 2).join(' and ')} shows great preparation. `;
    }
  }
  
  if (extractedData.tutors.length > 0) {
    response += `Fantastic work identifying potential supervisors! `;
    extractedData.tutors.forEach(tutor => {
      response += `${tutor.name}${tutor.interests ? ` with their focus on ${tutor.interests}` : ''} could be a great match. `;
    });
  }
  
  if (extractedData.departments.length > 0) {
    response += `Good research on the department structure. `;
  }
  
  return response.trim();
};

// Export functions for use in Firebase function
module.exports = {
  processUniversityResponse,
  updateUniversityTargets,
  generateContextualResponse
};