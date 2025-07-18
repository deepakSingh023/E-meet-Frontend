// firebaseSignaling.js
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// Create a room
export const createRoom = async (roomId) => {
  const roomRef = doc(db, "rooms", roomId);
  const existing = await getDoc(roomRef);

  if (!existing.exists()) {
    await setDoc(roomRef, { created: Date.now() });
    return { roomRef, isInitiator: true };
  }

  return { roomRef, isInitiator: false };
};

// Send Offer
export const sendOffer = async (roomId, senderId, offer) => {
  const offerRef = doc(db, `rooms/${roomId}/offers/${senderId}`);
  await setDoc(offerRef, { sender: senderId, offer });
};

// Listen for Offer
export const listenForOffer = (roomId, remoteId, callback) => {
  const offerRef = doc(db, `rooms/${roomId}/offers/${remoteId}`);
  return onSnapshot(offerRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.offer);
    }
  });
};

// Send Answer
export const sendAnswer = async (roomId, senderId, answer) => {
  const answerRef = doc(db, `rooms/${roomId}/answers/${senderId}`);
  await setDoc(answerRef, { sender: senderId, answer });
};

// Listen for Answer
export const listenForAnswer = (roomId, remoteId, callback) => {
  const answerRef = doc(db, `rooms/${roomId}/answers/${remoteId}`);
  return onSnapshot(answerRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.answer);
    }
  });
};

// Send ICE Candidate
export const sendCandidate = async (roomId, senderId, candidate) => {
  const candidateRef = collection(db, `rooms/${roomId}/candidates`);
  await addDoc(candidateRef, {
    sender: senderId,
    type: "candidate",
    candidate,
    created: Date.now(),
  });
};

// Listen for Remote ICE Candidates
export const listenForCandidates = (roomId, myId, callback) => {
  const candidatesRef = collection(db, `rooms/${roomId}/candidates`);
  return onSnapshot(candidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        if (data.sender !== myId && data.type === "candidate") {
          callback(data.candidate);
        }
      }
    });
  });
};
