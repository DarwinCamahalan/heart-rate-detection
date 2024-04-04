import { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Link from 'next/link';
import Head from 'next/head';
import Cookies from 'js-cookie';
import styles from './login.module.scss'

const PatientLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Enter Email or Password');
      return;
    }
  
    try {
      const querySnapshot = await getDocs(collection(db, 'patients'));
      let validUser = false;
      const updatePromises = []; // Array to store promises for document updates
  
      querySnapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        const docId = docSnapshot.id; // Access the document ID
        if (userData.email === email && userData.password === password && userData.role === 'Patient') {
          validUser = true;

          Cookies.set('userEmail', email);
          Cookies.set('dbLocation', 'patients');
          Cookies.set('showModal', false);
      
          // Update the user document in the database to mark login as true
          const userDocRef = doc(db, 'patients', docId); // Use docId here
          updatePromises.push(updateDoc(userDocRef, { login: true }));
        }
      });
      
      // Wait for all update operations to complete
      await Promise.all(updatePromises);
  
      if (validUser) {
        window.location.href = '/patient-dashboard';
      } else {
        setError('Invalid Credentials for Patient.');
      }
    } catch (error) {
      setError('Error logging in. Please try again.');
      console.log(error)
    }
  };
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <>
      <Head>
        <title>Patient Login</title>
      </Head>
      <div className={styles.mainContainer}>
          <div className={styles.loginForm}>
            <h2>Patient Login</h2>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown}/>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}/>
            <button onClick={handleLogin}>Login</button>
            {error && <p className={styles.errorMsg}>{error}</p>}
            <p className={styles.signup}>No Patient account? <Link href="/signup/patient">Sign Up as a Patient</Link></p>
          </div>
      </div>
    </>
  );
};

export default PatientLogin;
