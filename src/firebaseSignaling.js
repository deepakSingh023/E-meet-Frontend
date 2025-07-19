import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";

export const createRoom = async (roomId) => {
  try {
    const roomRef = doc(db, "rooms", roomId);
    const existing = await getDoc(roomRef);

    if (!existing.exists()) {
      await setDoc(roomRef, { 
        created: Date.now(),
        active: true
      });
      return { isInitiator: true };
    }

    return { isInitiator: false };
  } catch (error) {
    console.error("Error creating/joining room:", error);
    throw error;
  }
};

export const sendOffer = async (roomId, userId, offer) => {
  try {
    const offerRef = doc(db, `rooms/${roomId}/offers`, userId);
    await setDoc(offerRef, { 
      userId, 
      offer,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error sending offer:", error);
    throw error;
  }
};

export const listenForOffer = (roomId, myUserId, callback) => {
  try {
    const offersRef = collection(db, `rooms/${roomId}/offers`);
    
    return onSnapshot(offersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.userId !== myUserId && data.offer) {
            // Delete offer after receiving
            deleteDoc(change.doc.ref);
            callback(data.offer);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error listening for offers:", error);
    return () => {};
  }
};

export const sendAnswer = async (roomId, userId, answer) => {
  try {
    const answerRef = doc(db, `rooms/${roomId}/answers`, userId);
    await setDoc(answerRef, { 
      userId, 
      answer,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error sending answer:", error);
    throw error;
  }
};

export const listenForAnswer = (roomId, myUserId, callback) => {
  try {
    const answersRef = collection(db, `rooms/${roomId}/answers`);
    
    return onSnapshot(answersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.userId !== myUserId && data.answer) {
            // Delete answer after receiving
            deleteDoc(change.doc.ref);
            callback(data.answer);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error listening for answers:", error);
    return () => {};
  }
};

export const sendCandidate = async (roomId, userId, candidate) => {
  try {
    const candidateRef = collection(db, `rooms/${roomId}/candidates`);
    await addDoc(candidateRef, {
      userId,
      candidate,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error sending ICE candidate:", error);
  }
};

export const listenForCandidates = (roomId, myUserId, callback) => {
  try {
    const candidatesRef = collection(db, `rooms/${roomId}/candidates`);
    const q = query(candidatesRef, orderBy("timestamp", "asc"));
    
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.userId !== myUserId && data.candidate) {
            callback(data.candidate);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error listening for ICE candidates:", error);
    return () => {};
  }
};
