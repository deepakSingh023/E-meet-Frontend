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

export const createOrJoinRoom = async (roomId) => {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    await setDoc(roomRef, { created: Date.now() });
    return { roomRef, isInitiator: true };
  }

  return { roomRef, isInitiator: false };
};

export const saveOffer = async (roomId, offer) => {
  await setDoc(doc(db, `rooms/${roomId}`), { offer }, { merge: true });
};

export const listenForOffer = (roomId, callback) => {
  const roomRef = doc(db, `rooms/${roomId}`);
  return onSnapshot(roomRef, (docSnap) => {
    const data = docSnap.data();
    if (data?.offer) callback(data.offer);
  });
};

export const saveAnswer = async (roomId, answer) => {
  await setDoc(doc(db, `rooms/${roomId}`), { answer }, { merge: true });
};

export const listenForAnswer = (roomId, callback) => {
  const roomRef = doc(db, `rooms/${roomId}`);
  return onSnapshot(roomRef, (docSnap) => {
    const data = docSnap.data();
    if (data?.answer) callback(data.answer);
  });
};

export const sendIceCandidate = async (roomId, peerType, candidate) => {
  const candidatesRef = collection(db, `rooms/${roomId}/candidates/${peerType}`);
  await addDoc(candidatesRef, { candidate });
};

export const listenForIceCandidates = (roomId, peerType, callback) => {
  return onSnapshot(
    collection(db, `rooms/${roomId}/candidates/${peerType}`),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          callback(change.doc.data().candidate);
        }
      });
    }
  );
};
