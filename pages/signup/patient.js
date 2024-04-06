import { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { motion } from "framer-motion"
import { v4 as uuidv4 } from 'uuid';
import Head from 'next/head';
import Cookies from 'js-cookie';
import styles from './signup.module.scss'
import Link from 'next/link';

const SignUpPatient = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {

    if (!email || !password) {
      setError('Enter Email or Password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Enter Valid Email Address');
      return;
    }

    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'patients'), where('email', '==', email))
      );

      if (!querySnapshot.empty) {
        setError('Email Address Already Exist.');
        return;
      }

      const uid = uuidv4();

      const currentDate = new Date();
      const formattedCreationDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;

      await addDoc(collection(db, 'patients'), {
        uid,
        email,
        password,
        role: 'Patient',
        createdOn: formattedCreationDate,
        login: true
      });

      Cookies.set('userEmail', email);
      Cookies.set('dbLocation', 'patients');
      Cookies.set('dashboard', 'patient-dashboard');
      Cookies.set('showModal', true);

      window.location.href = '/signup/complete-profile'; 

    } catch (error) {
      setError(error.message);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSignUp();
    }
  };

  return (
    <motion.div
    initial={{ opacity: 0}}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}>

      <Head>
        <title>Account Creation</title>
        <meta name="description" content="A Computer Vision project that detects a person's Heart Rate Per Minute (BPM) for medical consultation data gathering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      
      <div className={styles.mainContainer}>
        <div className={styles.signUpForm}>
          <h2>Patient Sign Up</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown}/>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}/>
          <motion.button onClick={handleSignUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.9 }}>Create Account</motion.button>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <p className={styles.login}>Already have an Account? <Link href="/login/patient">Login as Patient</Link></p>
        </div>
      </div>
    </motion.div>
  );
};

export default SignUpPatient;
