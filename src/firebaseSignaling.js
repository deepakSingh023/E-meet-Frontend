import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// Create a room
export const createRoom = async (roomId) => {
  try {
    const roomRef = doc(db, "rooms", roomId);
    const existing = await getDoc(roomRef);

    if (!existing.exists()) {
      await setDoc(roomRef, { 
        created: Date.now(),
        participants: []
      });
      console.log("Created new room:", roomId);
      return { roomRef, isInitiator: true };
    }

    console.log("Joined existing room:", roomId);
    return { roomRef, isInitiator: false };
  } catch (error) {
    console.error("Error creating/joining room:", error);
    throw error;
  }
};

// Send Offer
export const sendOffer = async (roomId, senderId, offer) => {
  try {
    const offerRef = doc(db, `rooms/${roomId}/offers`, senderId);
    await setDoc(offerRef, { 
      sender: senderId, 
      offer,
      timestamp: Date.now()
    });
    console.log("Offer sent successfully");
  } catch (error) {
    console.error("Error sending offer:", error);
    throw error;
  }
};

// Listen for Offer (listen for offers NOT from current user)
export const listenForOffer = (roomId, myId, callback) => {
  try {
    const offersRef = collection(db, `rooms/${roomId}/offers`);
    
    return onSnapshot(offersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const senderId = change.doc.id;
          
          // Only process offers from other users
          if (senderId !== myId && data.offer) {
            console.log("Received offer from:", senderId);
            callback(data.offer);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error listening for offers:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Send Answer
export const sendAnswer = async (roomId, senderId, answer) => {
  try {
    const answerRef = doc(db, `rooms/${roomId}/answers`, senderId);
    await setDoc(answerRef, { 
      sender: senderId, 
      answer,
      timestamp: Date.now()
    });
    console.log("Answer sent successfully");
  } catch (error) {
    console.error("Error sending answer:", error);
    throw error;
  }
};

// Listen for Answer (listen for answers NOT from current user)
export const listenForAnswer = (roomId, myId, callback) => {
  try {
    const answersRef = collection(db, `rooms/${roomId}/answers`);
    
    return onSnapshot(answersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const senderId = change.doc.id;
          
          // Only process answers from other users
          if (senderId !== myId && data.answer) {
            console.log("Received answer from:", senderId);
            callback(data.answer);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error listening for answers:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Send ICE Candidate
export const sendCandidate = async (roomId, senderId, candidate) => {
  try {
    const candidateRef = collection(db, `rooms/${roomId}/candidates`);
    await addDoc(candidateRef, {
      sender: senderId,
      candidate,
      timestamp: Date.now(),
    });
    console.log("ICE candidate sent successfully");
  } catch (error) {
    console.error("Error sending ICE candidate:", error);
    // Don't throw here as ICE candidates are not critical
  }
};

// Listen for Remote ICE Candidates
export const listenForCandidates = (roomId, myId, callback) => {
  try {
    const candidatesRef = collection(db, `rooms/${roomId}/candidates`);
    const q = query(candidatesRef, orderBy("timestamp", "asc"));
    
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          
          // Only process candidates from other users
          if (data.sender !== myId && data.candidate) {
            console.log("Received ICE candidate from:", data.sender);
            callback(data.candidate);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error listening for ICE candidates:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Helper function to clean up old room data (optional)
export const cleanupRoom = async (roomId) => {
  try {
    // This would require additional logic to delete subcollections
    // For now, just log that cleanup was requested
    console.log("Cleanup requested for room:", roomId);
  } catch (error) {
    console.error("Error cleaning up room:", error);
  }
};