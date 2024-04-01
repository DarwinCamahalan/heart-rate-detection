import firebase from 'firebase/compat/app'; // Import Firebase version 10
import 'firebase/compat/auth'; // Import Firebase Authentication from version 10

const firebaseConfig = {
  apiKey: "AIzaSyBpBfVmnIpganb9-rs1PAujuewC-IAy1EU",
  authDomain: "medical-consultation-5aaf2.firebaseapp.com",
  projectId: "medical-consultation-5aaf2",
  storageBucket: "medical-consultation-5aaf2.appspot.com",
  messagingSenderId: "1071093228336",
  appId: "1:1071093228336:web:2b60be2afffe5b2be3def5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase;