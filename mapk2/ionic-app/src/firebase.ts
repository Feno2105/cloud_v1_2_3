import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDVzRBM1hyxUo37zZ1ABBqzSIMiaDLzzPI",
  authDomain: "cloud-s5-groupe.firebaseapp.com",
  projectId: "cloud-s5-groupe",
  storageBucket: "cloud-s5-groupe.firebasestorage.app",
  messagingSenderId: "1027801121111",
  appId: "1:1027801121111:web:5eec03685e185d2b3cbe12",
  measurementId: "G-R88V5N3VP9"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
