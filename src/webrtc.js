import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export const createRoom = async (roomId) => {
  const roomRef = doc(db, "rooms", roomId);
  await setDoc(roomRef, { created: Date.now() });
  return roomRef;
};

export const listenToRemoteCandidates = (roomId, peerId, callback) => {
  return onSnapshot(
    collection(db, `rooms/${roomId}/candidates/${peerId}/remote`),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          callback(change.doc.data().candidate);
        }
      });
    }
  );
};

export const sendIceCandidate = async (roomId, localId, candidate) => {
  const candidatesRef = collection(db, `rooms/${roomId}/candidates/${localId}/remote`);
  await addDoc(candidatesRef, { candidate });
};

export const saveOffer = async (roomId, fromId, offer) => {
  await setDoc(doc(db, `rooms/${roomId}/offers/${fromId}`), { offer });
};

export const listenForOffer = (roomId, userId, callback) => {
  return onSnapshot(doc(db, `rooms/${roomId}/offers/${userId}`), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().offer);
    }
  });
};

export const saveAnswer = async (roomId, toId, answer) => {
  await setDoc(doc(db, `rooms/${roomId}/answers/${toId}`), { answer });
};

export const listenForAnswer = (roomId, peerId, callback) => {
  return onSnapshot(doc(db, `rooms/${roomId}/answers/${peerId}`), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().answer);
    }
  });
};
