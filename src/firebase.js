import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzMabyHcncz1Ljp6QcdTwfITVvkaRbw9I",
  authDomain: "gamified-quiz-app-702a7.firebaseapp.com",
  projectId: "gamified-quiz-app-702a7",
  storageBucket: "gamified-quiz-app-702a7.firebasestorage.app",
  messagingSenderId: "936507886677",
  appId: "1:936507886677:web:75bcda1ca4e15b94ead8dc",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
