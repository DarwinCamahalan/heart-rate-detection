import { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Link from 'next/link';
import Head from 'next/head';

const PatientLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      // Check if the user exists in Firestore and has the role 'patient'
      const querySnapshot = await getDocs(collection(db, 'patients'));
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email === email && userData.password === password && userData.role === 'patient') {
          // Redirect to patient dashboard or desired page
          router.push('/patient-dashboard');
        } else {
          setError('Invalid credentials for patient.');
        }
      });
    } catch (error) {
      setError('Error logging in. Please try again.'); // Display error message if login fails
    }
  };

  return (
    <>
      <Head>
        <title>Patient Login</title>
      </Head>
      <div>
        <h2>Patient Login</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin}>Login</button>
        {error && <p>{error}</p>}
        <p>No patient account? <Link href="/signup/patient">Sign up as a patient</Link></p>
      </div>
    </>
  );
};

export default PatientLogin;