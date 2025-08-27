import React, { useState } from 'react';
import DemoPackCreation from './DemoPackCreation';
import InteractiveQuiz from './InteractiveQuiz';
import { useQuizContext } from '../App';

const DEMO_TSA_QUESTIONS = [
{
  "id": "2022-9",
  "year": 2022,
  "question_number": 9,
  "question_content": "Bicycle owners have a duty to have their bicycles maintained properly. This is to ensure the safety both of the rider and of other road users. If an injury is caused to another person as a result of a failure to maintain a bicycle properly, then the injured person should be entitled to compensation from the owner of the bicycle.",
  "question": "Which one of the following best illustrates the principle used in the above argument?",
  "options": [
    {
      "id": "A",
      "text": "Skiers injured whilst skiing off the official ski run should be entitled to compensation from the manufacturer of the skis."
    },
    {
      "id": "B",
      "text": "A passenger on a train who is injured tripping over luggage not put in the luggage rack should be entitled to compensation from the train company."
    },
    {
      "id": "C",
      "text": "A child injured while playing on a broken swing in a park should be entitled to compensation from the park owner."
    },
    {
      "id": "D",
      "text": "A householder scalded when pouring water from a kettle should be entitled to compensation from the manufacturer of the kettle."
    },
    {
      "id": "E",
      "text": "People who eat too many biscuits and damage their health should be entitled to compensation from the shops which sold the biscuits."
    }
  ],
  "correct_answer": "C",
  "videoSolutionLink": "https://youtu.be/qve19j-CEN0",
  "question_type": "Critical Thinking",
  "sub_types": [
    "Principle Application"
  ],
  "has_image_question": false,
  "has_image_options": false,
  "needs_manual_review": false,
  "last_verified": null,
  "content_hash": "eef2ce87f205",
  "update_status": "ready_for_bulk_update",
  "question_text_clean": "bicycle owners have a duty to have their bicycles maintained properly. this is to ensure the safety both of the rider and of other road users. if an injury is caused to another person as a result of a failure to maintain a bicycle properly, then the injured person should be entitled to compensation from the owner of the bicycle.",
  "options_text_clean": [
    "skiers injured whilst skiing off the official ski run should be entitled to compensation from the manufacturer of the skis.",
    "a passenger on a train who is injured tripping over luggage not put in the luggage rack should be entitled to compensation from the train company.",
    "a child injured while playing on a broken swing in a park should be entitled to compensation from the park owner.",
    "a householder scalded when pouring water from a kettle should be entitled to compensation from the manufacturer of the kettle.",
    "people who eat too many biscuits and damage their health should be entitled to compensation from the shops which sold the biscuits."
  ],
  "searchable_text": "Bicycle owners have a duty to have their bicycles maintained properly. This is to ensure the safety both of the rider and of other road users. If an injury is caused to another person as a result of a failure to maintain a bicycle properly, then the injured person should be entitled to compensation from the owner of the bicycle. Which one of the following best illustrates the principle used in the above argument? Skiers injured whilst skiing off the official ski run should be entitled to compensation from the manufacturer of the skis. A passenger on a train who is injured tripping over luggage not put in the luggage rack should be entitled to compensation from the train company. A child injured while playing on a broken swing in a park should be entitled to compensation from the park owner. A householder scalded when pouring water from a kettle should be entitled to compensation from the manufacturer of the kettle. People who eat too many biscuits and damage their health should be entitled to compensation from the shops which sold the biscuits.",
  "content_type": "text_only",
  "bulk_update_ready": true,
  "structure_enhanced_at": "2025-06-26T02:14:54.671Z",
  "yearQuestionCombined": "2022 9",
  "yearQuestionDashed": "2022-9",
  "questionNumberPadded": "09",
  "yearQuestionPadded": "2022 09",
  "searchableYearQuestion": "year 2022 question 9",
  "questionYearFormat": "question 9 2022",
  "alternativeFormats": [
    "2022 q9",
    "2022 question 9",
    "2022-9",
    "2022 9",
    "q9 2022",
    "question 9 year 2022"
  ],
  "enhancedSearchableText": "Bicycle owners have a duty to have their bicycles maintained properly. This is to ensure the safety both of the rider and of other road users. If an injury is caused to another person as a result of a failure to maintain a bicycle properly, then the injured person should be entitled to compensation from the owner of the bicycle. Which one of the following best illustrates the principle used in the above argument? Skiers injured whilst skiing off the official ski run should be entitled to compensation from the manufacturer of the skis. A passenger on a train who is injured tripping over luggage not put in the luggage rack should be entitled to compensation from the train company. A child injured while playing on a broken swing in a park should be entitled to compensation from the park owner. A householder scalded when pouring water from a kettle should be entitled to compensation from the manufacturer of the kettle. People who eat too many biscuits and damage their health should be entitled to compensation from the shops which sold the biscuits.\n      year 2022 question 9\n      2022 9\n      2022-9\n      q9 2022\n      question 9 2022\n      2022 q9",
  "yearNumber": 2022,
  "questionNumberForRanking": 9,
  "exactYearQuestion": "2022 9",
  "lastUpdated": "2025-06-26T12:45:34.029Z",
  "objectID": "2022-9"
},

{
  "id": "2021-1",
  "year": 2021,
  "question_number": 1,
  "question_content": "'How much does an aeroplane weigh?'; 'Why are manhole covers round?'. Despite the popularity of bizarre questions like this in interviews for jobs in the big technology companies, they have been proved to give little insight into the applicant's ability or personality. Applicants faced with such questions would be well-advised to reconsider their interest in working for such companies. A study which investigated why these approaches persist concluded that these 'brainteaser' questions are popular with interviewers who like to protect and enhance their self-esteem by appearing to know the answers to impossibly difficult questions. They enjoy the feeling of power and superiority over the candidate, revealing a narcissistic or sadistic personality. No-one wants to work for someone like that.",
  "question": "Which one of the following best expresses the main conclusion of the above argument?",
  "options": [
    {
      "id": "A",
      "text": "Brainteaser questions are popular in interviews with the big technology companies."
    },
    {
      "id": "B",
      "text": "Use of brainteaser questions in interviews gives little insight into a candidate's ability or personality."
    },
    {
      "id": "C",
      "text": "Interviewers who use brainteaser questions show personality traits of narcissism or sadism."
    },
    {
      "id": "D",
      "text": "Job applicants faced with brainteaser questions should think carefully about working for that company."
    },
    {
      "id": "E",
      "text": "No-one wants to work for someone with a narcissistic or sadistic personality."
    }
  ],
  "correct_answer": "D",
  "question_type": "Critical Thinking",
  "sub_types": [
    "Main Conclusion"
  ],
  "videoSolutionLink": "https://youtu.be/qrHk2_uj8Q0",
  "has_image_question": false,
  "has_image_options": false,
  "needs_manual_review": false,
  "last_verified": null,
  "content_hash": "9fbfe6d5b10b",
  "update_status": "ready_for_bulk_update",
  "question_text_clean": "\"how much does an aeroplane weigh?\"; \"why are manhole covers round?\". despite the popularity of bizarre questions like this in interviews for jobs in the big technology companies, they have been proved to give little insight into the applicant\"s ability or personality. applicants faced with such questions would be well-advised to reconsider their interest in working for such companies. a study which investigated why these approaches persist concluded that these \"brainteaser\" questions are popular with interviewers who like to protect and enhance their self-esteem by appearing to know the answers to impossibly difficult questions. they enjoy the feeling of power and superiority over the candidate, revealing a narcissistic or sadistic personality. no-one wants to work for someone like that.",
  "options_text_clean": [
    "brainteaser questions are popular in interviews with the big technology companies.",
    "use of brainteaser questions in interviews gives little insight into a candidate\"s ability or personality.",
    "interviewers who use brainteaser questions show personality traits of narcissism or sadism.",
    "job applicants faced with brainteaser questions should think carefully about working for that company.",
    "no-one wants to work for someone with a narcissistic or sadistic personality."
  ],
  "searchable_text": "'How much does an aeroplane weigh?'; 'Why are manhole covers round?'. Despite the popularity of bizarre questions like this in interviews for jobs in the big technology companies, they have been proved to give little insight into the applicant's ability or personality. Applicants faced with such questions would be well-advised to reconsider their interest in working for such companies. A study which investigated why these approaches persist concluded that these 'brainteaser' questions are popular with interviewers who like to protect and enhance their self-esteem by appearing to know the answers to impossibly difficult questions. They enjoy the feeling of power and superiority over the candidate, revealing a narcissistic or sadistic personality. No-one wants to work for someone like that. Which one of the following best expresses the main conclusion of the above argument? Brainteaser questions are popular in interviews with the big technology companies. Use of brainteaser questions in interviews gives little insight into a candidate's ability or personality. Interviewers who use brainteaser questions show personality traits of narcissism or sadism. Job applicants faced with brainteaser questions should think carefully about working for that company. No-one wants to work for someone with a narcissistic or sadistic personality.",
  "content_type": "text_only",
  "bulk_update_ready": true,
  "structure_enhanced_at": "2025-06-26T02:14:54.676Z",
  "yearQuestionCombined": "2021 1",
  "yearQuestionDashed": "2021-1",
  "questionNumberPadded": "01",
  "yearQuestionPadded": "2021 01",
  "searchableYearQuestion": "year 2021 question 1",
  "questionYearFormat": "question 1 2021",
  "alternativeFormats": [
    "2021 q1",
    "2021 question 1",
    "2021-1",
    "2021 1",
    "q1 2021",
    "question 1 year 2021"
  ],
  "enhancedSearchableText": "'How much does an aeroplane weigh?'; 'Why are manhole covers round?'. Despite the popularity of bizarre questions like this in interviews for jobs in the big technology companies, they have been proved to give little insight into the applicant's ability or personality. Applicants faced with such questions would be well-advised to reconsider their interest in working for such companies. A study which investigated why these approaches persist concluded that these 'brainteaser' questions are popular with interviewers who like to protect and enhance their self-esteem by appearing to know the answers to impossibly difficult questions. They enjoy the feeling of power and superiority over the candidate, revealing a narcissistic or sadistic personality. No-one wants to work for someone like that. Which one of the following best expresses the main conclusion of the above argument? Brainteaser questions are popular in interviews with the big technology companies. Use of brainteaser questions in interviews gives little insight into a candidate's ability or personality. Interviewers who use brainteaser questions show personality traits of narcissism or sadism. Job applicants faced with brainteaser questions should think carefully about working for that company. No-one wants to work for someone with a narcissistic or sadistic personality.\n      year 2021 question 1\n      2021 1\n      2021-1\n      q1 2021\n      question 1 2021\n      2021 q1",
  "yearNumber": 2021,
  "questionNumberForRanking": 1,
  "exactYearQuestion": "2021 1",
  "lastUpdated": "2025-06-26T12:45:34.038Z",
  "objectID": "2021-1"
},
{
  "id": "2021-6",
  "year": 2021,
  "question_number": 6,
  "question_content": "I have received the following message that is encrypted with a Caesar cipher: JYMDWEFTQEBAF. This Caesar cipher replaces each letter of the plaintext (the message to be encrypted) with a letter that is a certain fixed number of positions along the 26-letter English alphabet. Knowing this fixed number of positions (the shift parameter) is the key to decrypt the message. For example, if the letter in the plaintext is A (the 1st letter of the alphabet) and the shift parameter is 4, then the encrypted letter is E (the 5th letter of the alphabet). Similarly, with a shift parameter of 7, Y (the 25th letter of the alphabet) is encrypted as F, which is the 32nd letter if the alphabet is repeated immediately after Z. I would like to decrypt the message that I have received but I do not know the shift parameter. I only know that the first letter of the plaintext is X.",
  "question": "What is the sixth letter of the decrypted message?",
  "options": [
    {
      "id": "A",
      "text": "P"
    },
    {
      "id": "B",
      "text": "Q"
    },
    {
      "id": "C",
      "text": "R"
    },
    {
      "id": "D",
      "text": "S"
    },
    {
      "id": "E",
      "text": "T"
    }
  ],
  "correct_answer": "C",
  "question_type": "Problem Solving",
  "sub_types": [
    "Decryption",
    "Cipher"
  ],
  "solution_video": "https://www.youtube.com/watch?v=iwNcmmQ05BI",
  "has_image_question": false,
  "has_image_options": false,
  "needs_manual_review": false,
  "last_verified": null,
  "content_hash": "645583c65a42",
  "update_status": "ready_for_bulk_update",
  "question_text_clean": "i have received the following message that is encrypted with a caesar cipher: jymdweftqebaf this caesar cipher replaces each letter of the plaintext (the message to be encrypted) with a letter that is a certain fixed number of positions along the 26-letter english alphabet. knowing this fixed number of positions (the shift parameter) is the key to decrypt the message. for example, if the letter in the plaintext is a (the 1st letter of the alphabet) and the shift parameter is 4, then the encrypted letter is e (the 5th letter of the alphabet). similarly, with a shift parameter of 7, y (the 25th letter of the alphabet) is encrypted as f, which is the 32nd letter if the alphabet is repeated immediately after z. i would like to decrypt the message that i have received but i do not know the shift parameter. i only know that the first letter of the plaintext is x.",
  "options_text_clean": [
    "p",
    "q",
    "r",
    "s",
    "t"
  ],
  "searchable_text": "I have received the following message that is encrypted with a Caesar cipher: JYMDWEFTQEBAF This Caesar cipher replaces each letter of the plaintext (the message to be encrypted) with a letter that is a certain fixed number of positions along the 26-letter English alphabet. Knowing this fixed number of positions (the shift parameter) is the key to decrypt the message. For example, if the letter in the plaintext is A (the 1st letter of the alphabet) and the shift parameter is 4, then the encrypted letter is E (the 5th letter of the alphabet). Similarly, with a shift parameter of 7, Y (the 25th letter of the alphabet) is encrypted as F, which is the 32nd letter if the alphabet is repeated immediately after Z. I would like to decrypt the message that I have received but I do not know the shift parameter. I only know that the first letter of the plaintext is X. What is the sixth letter of the decrypted message? P Q R S T",
  "content_type": "text_only",
  "bulk_update_ready": true,
  "structure_enhanced_at": "2025-06-26T02:14:54.676Z",
  "yearQuestionCombined": "2021 6",
  "yearQuestionDashed": "2021-6",
  "questionNumberPadded": "06",
  "yearQuestionPadded": "2021 06",
  "searchableYearQuestion": "year 2021 question 6",
  "questionYearFormat": "question 6 2021",
  "alternativeFormats": [
    "2021 q6",
    "2021 question 6",
    "2021-6",
    "2021 6",
    "q6 2021",
    "question 6 year 2021"
  ],
  "enhancedSearchableText": "I have received the following message that is encrypted with a Caesar cipher: JYMDWEFTQEBAF This Caesar cipher replaces each letter of the plaintext (the message to be encrypted) with a letter that is a certain fixed number of positions along the 26-letter English alphabet. Knowing this fixed number of positions (the shift parameter) is the key to decrypt the message. For example, if the letter in the plaintext is A (the 1st letter of the alphabet) and the shift parameter is 4, then the encrypted letter is E (the 5th letter of the alphabet). Similarly, with a shift parameter of 7, Y (the 25th letter of the alphabet) is encrypted as F, which is the 32nd letter if the alphabet is repeated immediately after Z. I would like to decrypt the message that I have received but I do not know the shift parameter. I only know that the first letter of the plaintext is X. What is the sixth letter of the decrypted message? P Q R S T\n      year 2021 question 6\n      2021 6\n      2021-6\n      q6 2021\n      question 6 2021\n      2021 q6",
  "yearNumber": 2021,
  "questionNumberForRanking": 6,
  "exactYearQuestion": "2021 6",
  "lastUpdated": "2025-06-26T12:45:34.038Z",
  "objectID": "2021-6"
}
];
const DEMO_PACK_DATA = {
  packId: 'demo_pack',
  packName: 'TSA Critical Thinking Demo',
  subject: 'tsa',
  totalQuestions: 3,
  styling: {
    color: '#00ced1',
    fontSize: 12,
    includeAnswers: true,
    separateAnswerSheet: false,
    showDate: true
  }
};

const DemoMode = ({ onClose }) => {
  const [currentStage, setCurrentStage] = useState(1); // 1: Pack Creation, 2: Quiz, 3: Review
  const [demoResults, setDemoResults] = useState(null);
  const { showQuiz, hideQuiz } = useQuizContext();

  const handleStageComplete = (stage, data) => {
    if (stage === 1) {
      setCurrentStage(2);
      showQuiz(); // Hide navbar for quiz
    } else if (stage === 2) {
      setDemoResults(data);
      setCurrentStage(3);
      hideQuiz(); // Show navbar again
    }
  };

  const handleDemoComplete = () => {
    hideQuiz();
    onClose();
  };

  return (
    <div className="demo-mode-overlay">
      {/* Demo Progress Indicator */}
      <div className="demo-progress">
        <div className="demo-steps">
          {[1, 2, 3].map(step => (
            <div key={step} className={`demo-step ${currentStage >= step ? 'active' : ''}`}>
              <span>{step}</span>
              <div className="step-label">
                {step === 1 ? 'Create Pack' : step === 2 ? 'Take Quiz' : 'Review'}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleDemoComplete} className="demo-close">×</button>
      </div>

      {/* Stage Content */}
      {currentStage === 1 && (
        <DemoPackCreation 
          onComplete={(data) => handleStageComplete(1, data)}
          questions={DEMO_TSA_QUESTIONS}
          packData={DEMO_PACK_DATA}
        />
      )}
      
      {currentStage === 2 && (
        <InteractiveQuiz
          packData={DEMO_PACK_DATA}
          questions={DEMO_TSA_QUESTIONS}
          onComplete={(results) => handleStageComplete(2, results)}
          onClose={handleDemoComplete}
          reviewMode={false}
          isDemoMode={true}
        />
      )}
      
      {currentStage === 3 && demoResults && (
        <div className="demo-completion">
          <InteractiveQuiz
            packData={DEMO_PACK_DATA}
            questions={DEMO_TSA_QUESTIONS}
            onComplete={() => {}}
            onClose={handleDemoComplete}
            reviewMode={true}
            existingAttempt={demoResults}
            isDemoMode={true}
          />
          <div className="demo-cta">
            <button onClick={handleDemoComplete} className="demo-signup-btn">
              🚀 Sign Up to Create Real Packs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoMode;