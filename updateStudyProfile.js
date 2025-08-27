// Create updateStudyProfile.js for specific update functions

const admin = require('firebase-admin');

// Add a new subject
async function addSubject(userId, subjectData) {
  const userRef = admin.firestore().collection('users').doc(userId);
  
  await userRef.update({
    'studyProfile.currentSubjects': admin.firestore.FieldValue.arrayUnion(subjectData)
  });
}

// Add a new book
async function addBook(userId, bookData) {
  const userRef = admin.firestore().collection('users').doc(userId);
  
  await userRef.update({
    'studyProfile.supercurricular.lowLevel.books': admin.firestore.FieldValue.arrayUnion(bookData)
  });
}

// Add weekly insights to a book
async function addBookInsight(userId, bookTitle, weeklyInsight) {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  // Find the book and update its weeklyInsights
  const books = userData.studyProfile.supercurricular.lowLevel.books;
  const bookIndex = books.findIndex(book => book.title === bookTitle);
  
  if (bookIndex !== -1) {
    books[bookIndex].weeklyInsights = books[bookIndex].weeklyInsights || [];
    books[bookIndex].weeklyInsights.push(weeklyInsight);
    
    await admin.firestore().collection('users').doc(userId).update({
      'studyProfile.supercurricular.lowLevel.books': books
    });
  }
}

module.exports = {
  addSubject,
  addBook,
  addBookInsight
};