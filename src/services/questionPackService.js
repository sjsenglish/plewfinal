// src/services/questionPackService.js
import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Create a new question pack
export const createQuestionPack = async (userId, packData) => {
  try {
    const packId = doc(collection(db, 'temp')).id; // Generate random ID
    const packRef = doc(db, 'users', userId, 'questionPacks', packId);

    const newPack = {
      ...packData,
      packId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'draft',
    };

    await setDoc(packRef, newPack);
    return { success: true, packId, data: newPack };
  } catch (error) {
    console.error('Error creating question pack:', error);
    return { success: false, error: error.message };
  }
};

// Save/update an existing question pack
export const saveQuestionPack = async (userId, packId, packData) => {
  try {
    const packRef = doc(db, 'users', userId, 'questionPacks', packId);

    const updateData = {
      ...packData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(packRef, updateData);
    return { success: true, data: updateData };
  } catch (error) {
    console.error('Error saving question pack:', error);
    return { success: false, error: error.message };
  }
};

// Get all question packs for a user
export const getUserQuestionPacks = async (userId) => {
  try {
    const packsRef = collection(db, 'users', userId, 'questionPacks');
    const snapshot = await getDocs(packsRef);

    const packs = [];
    snapshot.forEach((doc) => {
      packs.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: packs };
  } catch (error) {
    console.error('Error getting user question packs:', error);
    return { success: false, error: error.message };
  }
};

// Get a specific question pack
export const getQuestionPack = async (userId, packId) => {
  try {
    const packRef = doc(db, 'users', userId, 'questionPacks', packId);
    const docSnap = await getDoc(packRef);

    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Question pack not found' };
    }
  } catch (error) {
    console.error('Error getting question pack:', error);
    return { success: false, error: error.message };
  }
};