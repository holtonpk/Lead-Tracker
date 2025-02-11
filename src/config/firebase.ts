// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuResyLl3t2RIc4DBN10yywakYX3FxDfQ",
  authDomain: "lead-tracker-3541c.firebaseapp.com",
  projectId: "lead-tracker-3541c",
  storageBucket: "lead-tracker-3541c.firebasestorage.app",
  messagingSenderId: "417415173987",
  appId: "1:417415173987:web:96a737085ce1e64cd16556",
  measurementId: "G-4WE7KBX2TG",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
