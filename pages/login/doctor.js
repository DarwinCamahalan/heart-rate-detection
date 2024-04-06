import { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { motion } from "framer-motion"
import { useRouter } from 'next/router'
import Head from 'next/head';
import styles from './login.module.scss';
import Link from 'next/link';
import Cookies from 'js-cookie';

const DoctorLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter()
  const handleLogin = async () => {

    if (!email || !password) {
      setError('Enter Email or Password');
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(db, 'doctors'));
      let validUser = false;
      const updatePromises = [];

      querySnapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        const docId = docSnapshot.id;

        if (userData.email === email && userData.password === password) {
          validUser = true;

          Cookies.set('userEmail', email);
          Cookies.set('dbLocation', 'doctors');
          Cookies.set('dashboard', 'doctor-dashboard');
          const userDocRef = doc(db, 'doctors', docId);
          updatePromises.push(updateDoc(userDocRef, { login: true }));

          router.push('/doctor-dashboard') 

        }
      });

      await Promise.all(updatePromises);

      if (!validUser) {
        setError('Invalid Credentials for Doctor.');
      }

    } catch (error) {
      setError('Error logging in. Please try again.');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }

  };

  return (
    <motion.div
    initial={{ opacity: 0}}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}>

      <Head>
        <title>Doctor Login</title>
        <meta name="description" content="A Computer Vision project that detects a person's Heart Rate Per Minute (BPM) for medical consultation data gathering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>

      <div className={styles.mainContainer}>
        <div className={styles.loginForm}>
          <h2>Doctor Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown}/>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}/>
          <motion.button onClick={handleLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.9 }}>Login</motion.button>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <p className={styles.signup}>No Doctor account? <Link href="/">Contact Administrator</Link></p>
        </div>
      </div>
    </motion.div>
  );
};

export default DoctorLogin;
