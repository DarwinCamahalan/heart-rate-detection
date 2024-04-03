// SignUpPatient.js
import { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Head from 'next/head';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie'; // Import js-cookie library

const SignUpPatient = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    try {
      // Check if the email already exists in the database
      const querySnapshot = await getDocs(
        query(collection(db, 'patients'), where('email', '==', email))
      );
      if (!querySnapshot.empty) {
        setError('Email already exists. Please use a different email.');
        return;
      }

      // Generate a UUID
      const uid = uuidv4();

      // Format the creation date to MM/DD/YYYY
      const currentDate = new Date();
      const formattedCreationDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;

      // Add patient data to Firestore with provided UID
      await addDoc(collection(db, 'patients'), {
        uid,
        email,
        password,
        role: 'patient',
        createdOn: formattedCreationDate // Use formatted date
      });

      // Set email and showModal cookies upon successful signup
      Cookies.set('patientEmail', email);
      Cookies.set('showModal', true);

      // Redirect to patient dashboard or desired page
      window.location.href = '/patient-dashboard'; // Redirect without using router
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <>
      <Head>
        <title>Patient Sign Up</title>
      </Head>
      <div>
        <h2>Patient Sign Up</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleSignUp}>Sign Up</button>
        {error && <p>{error}</p>}
      </div>
    </>
  );
};

export default SignUpPatient;
