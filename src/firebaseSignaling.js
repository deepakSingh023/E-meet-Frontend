import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

export const createRoom = async (roomId) => {
  try {
    const roomRef = doc(db, "rooms", roomId);
    const existing = await getDoc(roomRef);

    if (!existing.exists()) {
      await setDoc(roomRef, { 
        created: Date.now(),
        participants: []
      });
      return { roomRef, isInitiator: true };
    }

    return { roomRef, isInitiator: false };
  } catch (error) {
    console.error("Error creating/joining room:", error);
    throw error;
  }
};

export const sendOffer = async (roomId, senderId, offer) => {
  try {
    const offerRef = doc(db, `rooms/${roomId}/offers`, senderId);
    await setDoc(offerRef, { 
      sender: senderId, 
      offer,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error sending offer:", error);
    throw error;
  }
};

export const listenForOffer = (roomId, myId, callback) => {
  try {
    const offersRef = collection(db, `rooms/${roomId}/offers`);
    
    return onSnapshot(offersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.sender !== myId && data.offer) {
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

export const sendAnswer = async (roomId, senderId, answer) => {
  try {
    const answerRef = doc(db, `rooms/${roomId}/answers`, senderId);
    await setDoc(answerRef, { 
      sender: senderId, 
      answer,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error sending answer:", error);
    throw error;
  }
};

export const listenForAnswer = (roomId, myId, callback) => {
  try {
    const answersRef = collection(db, `rooms/${roomId}/answers`);
    
    return onSnapshot(answersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.sender !== myId && data.answer) {
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

export const sendCandidate = async (roomId, senderId, candidate) => {
  try {
    const candidateRef = collection(db, `rooms/${roomId}/candidates`);
    await addDoc(candidateRef, {
      sender: senderId,
      candidate,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error sending ICE candidate:", error);
  }
};

export const listenForCandidates = (roomId, myId, callback) => {
  try {
    const candidatesRef = collection(db, `rooms/${roomId}/candidates`);
    const q = query(candidatesRef, orderBy("timestamp", "asc"));
    
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.sender !== myId && data.candidate) {
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