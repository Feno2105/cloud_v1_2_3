// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVzRBM1hyxUo37zZ1ABBqzSIMiaDLzzPI",
  authDomain: "cloud-s5-groupe.firebaseapp.com",
  projectId: "cloud-s5-groupe",
  storageBucket: "cloud-s5-groupe.firebasestorage.app",
  messagingSenderId: "1027801121111",
  appId: "1:1027801121111:web:5eec03685e185d2b3cbe12",
  measurementId: "G-R88V5N3VP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app)
export const db = getFirestore(app)