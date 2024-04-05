import { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Head from 'next/head';
import styles from './login.module.scss';
import Link from 'next/link';
import Cookies from 'js-cookie';

const DoctorLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Enter Email or Password');
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(db, 'doctors'));
      let validUser = false;
      const updatePromises = []; // Array to store promises for document updates

      querySnapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        const docId = docSnapshot.id; // Access the document ID
        if (userData.email === email && userData.password === password) {
          validUser = true;

          Cookies.set('userEmail', email);
          Cookies.set('dbLocation', 'doctors');
          Cookies.set('dashboard', 'doctor-dashboard');
          router.push('/doctor-dashboard');

          // Update the user document in the database to mark login as true
          const userDocRef = doc(db, 'doctors', docId); // Use docId here
          updatePromises.push(updateDoc(userDocRef, { login: true }));
        }
      });

      // Wait for all update operations to complete
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
    <>
      <Head>
        <title>Doctor Login</title>
      </Head>
      <div className={styles.mainContainer}>
        <div className={styles.loginForm}>
          <h2>Doctor Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown}/>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}/>
          <button onClick={handleLogin}>Login</button>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <p className={styles.signup}>No Doctor account? <Link href="/">Contact Administrator</Link></p>
        </div>
      </div>
    </>
  );
};

export default DoctorLogin;
