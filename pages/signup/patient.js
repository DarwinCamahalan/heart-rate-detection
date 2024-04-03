import { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Head from 'next/head';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import styles from './signup.module.scss'
import Link from 'next/link';

const SignUpPatient = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    // Client-side validation for empty email and password fields
    if (!email || !password) {
      setError('Enter Email or Password');
      return;
    }

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Enter Valid Email Address');
      return;
    }

    try {
      // Check if the email already exists in the database
      const querySnapshot = await getDocs(
        query(collection(db, 'patients'), where('email', '==', email))
      );
      if (!querySnapshot.empty) {
        setError('Email Address Already Exist.');
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
        role: 'Patient',
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
        <title>Account Creation</title>
      </Head>
      <div className={styles.mainContainer}>
        <div className={styles.signUpForm}>
          <h2>Patient Sign Up</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleSignUp}>Create Account</button>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <p className={styles.login}>Already have an Account? <Link href="/login/patient">Login as Patient</Link></p>
        </div>
      </div>
    </>
  );
};

export default SignUpPatient;
