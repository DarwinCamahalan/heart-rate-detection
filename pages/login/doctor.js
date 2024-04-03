import { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Head from 'next/head';
import styles from './login.module.scss'
import Link from 'next/link';

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
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email === email && userData.password === password) {
          validUser = true;
          router.push('/doctor-dashboard');
        }
      });
      if (!validUser) {
        setError('Invalid Credentials for Doctor.');
      }
    } catch (error) {
      setError('Error logging in. Please try again.');
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
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Login</button>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <p className={styles.signup}>No Doctor account? <Link href="/">Contact Administrator</Link></p>
        </div>
      </div>
    </>
  );
};

export default DoctorLogin;
