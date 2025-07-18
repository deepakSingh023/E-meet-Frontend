// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBuCYHjd8wdqyOPQ6QqVdqL5TGRe2DMc5I",
  authDomain: "e-meet-app-4adb1.firebaseapp.com",
  projectId: "e-meet-app-4adb1",
  storageBucket: "e-meet-app-4adb1.firebasestorage.app",
  messagingSenderId: "380946255878",
  appId: "1:380946255878:web:347ed42dbede2d423c7387",
  measurementId: "G-G151HQH3QQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);