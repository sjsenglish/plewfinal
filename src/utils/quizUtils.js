// src/utils/quizUtils.js

// Get next Friday 4PM GMT
export const getNextFriday4PM = () => {
  const now = new Date();
  const nextFriday = new Date();

  // Get days until Friday (5 = Friday, 0 = Sunday)
  const daysUntilFriday = (5 - now.getDay() + 7) % 7;

  // If it's Friday but past 5PM, get next Friday
  if (daysUntilFriday === 0 && now.getUTCHours() >= 17) {
    nextFriday.setDate(now.getDate() + 7);
  } else if (daysUntilFriday === 0) {
    // It's Friday but before 5PM
    nextFriday.setDate(now.getDate());
  } else {
    nextFriday.setDate(now.getDate() + daysUntilFriday);
  }

  // Set to 4PM GMT
  nextFriday.setUTCHours(16, 0, 0, 0);

  return nextFriday;
};

// Get quiz end time (1 hour after start)
export const getQuizEndTime = (startTime) => {
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1);
  return endTime;
};

// Check current quiz status based on time
export const getQuizTimeStatus = (scheduledStart, scheduledEnd) => {
  const now = new Date();

  // Handle Firestore timestamp objects
  const start = scheduledStart.seconds
    ? new Date(scheduledStart.seconds * 1000)
    : new Date(scheduledStart);

  const end = scheduledEnd.seconds ? new Date(scheduledEnd.seconds * 1000) : new Date(scheduledEnd);

  if (now < start) {
    return {
      status: 'upcoming',
      timeUntilStart: start - now,
      message: `Starts ${start.toLocaleString('en-GB', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'GMT',
      })} GMT`,
    };
  }

  if (now >= start && now <= end) {
    return {
      status: 'active',
      timeRemaining: end - now,
      message: `${Math.ceil((end - now) / (1000 * 60))} minutes remaining`,
    };
  }

  return {
    status: 'completed',
    message: 'Quiz completed',
  };
};

// Format time duration
export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

// Format quiz completion time
export const formatCompletionTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

// Get week identifier for quiz organization
export const getWeekIdentifier = (date = new Date()) => {
  const d = new Date(date);
  // Get the Friday of this week
  const friday = new Date(d);
  friday.setDate(d.getDate() + (5 - d.getDay()));

  return friday.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Validate quiz data
export const validateQuizData = (quizData) => {
  const errors = [];

  if (!quizData.subject || !['tsa', 'plew', 'maths'].includes(quizData.subject)) {
    errors.push('Valid subject is required');
  }

  if (!quizData.title || quizData.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (
    !quizData.questions ||
    !Array.isArray(quizData.questions) ||
    quizData.questions.length === 0
  ) {
    errors.push('At least one question is required');
  }

  // Validate each question
  if (quizData.questions) {
    quizData.questions.forEach((question, index) => {
      if (!question.question || question.question.trim().length < 5) {
        errors.push(`Question ${index + 1}: Question text too short`);
      }

      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        errors.push(`Question ${index + 1}: At least 2 options required`);
      }

      if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
        errors.push(`Question ${index + 1}: Valid correct answer required`);
      }
    });
  }

  if (!quizData.scheduledStart) {
    errors.push('Scheduled start time is required');
  }

  if (!quizData.scheduledEnd) {
    errors.push('Scheduled end time is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Calculate quiz statistics
export const calculateQuizStats = (attempts) => {
  if (!attempts || attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      averageTime: 0,
      perfectScores: 0,
    };
  }

  const totalAttempts = attempts.length;
  const averageScore =
    attempts.reduce((sum, attempt) => sum + attempt.percentageScore, 0) / totalAttempts;
  const averageTime =
    attempts.reduce((sum, attempt) => sum + attempt.completionTimeSeconds, 0) / totalAttempts;
  const perfectScores = attempts.filter((attempt) => attempt.percentageScore === 100).length;

  return {
    totalAttempts,
    averageScore: Math.round(averageScore),
    averageTime: Math.round(averageTime),
    perfectScores,
  };
};

// Generate quiz title based on subject and date
export const generateQuizTitle = (subject, date = new Date()) => {
  const subjectNames = {
    tsa: 'TSA Critical Thinking',
    plew: '수능영어',
    maths: 'Maths A Level',
  };

  const weekOf = getWeekIdentifier(date);
  return `Weekly ${subjectNames[subject]} Quiz - ${weekOf}`;
};

// Check if current time is within quiz window
export const isQuizActive = (scheduledStart, scheduledEnd) => {
  const now = new Date();
  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);

  return now >= start && now <= end;
};

// Get time until next event (start or end)
export const getTimeUntilNextEvent = (scheduledStart, scheduledEnd) => {
  const now = new Date();
  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);

  if (now < start) {
    return {
      event: 'start',
      timeRemaining: start - now,
      eventTime: start,
    };
  }

  if (now >= start && now <= end) {
    return {
      event: 'end',
      timeRemaining: end - now,
      eventTime: end,
    };
  }

  return {
    event: 'completed',
    timeRemaining: 0,
    eventTime: end,
  };
};