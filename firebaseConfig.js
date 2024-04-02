import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpBfVmnIpganb9-rs1PAujuewC-IAy1EU",
  authDomain: "medical-consultation-5aaf2.firebaseapp.com",
  projectId: "medical-consultation-5aaf2",
  storageBucket: "medical-consultation-5aaf2.appspot.com",
  messagingSenderId: "1071093228336",
  appId: "1:1071093228336:web:2b60be2afffe5b2be3def5"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { app, db };