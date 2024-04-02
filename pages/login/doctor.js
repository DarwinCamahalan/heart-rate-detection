import { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Head from 'next/head';

const DoctorLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      // Check if the user exists in Firestore and has the role 'patient'
      const querySnapshot = await getDocs(collection(db, 'doctors'));
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email === email && userData.password === password) {
          // Redirect to patient dashboard or desired page
          router.push('/doctor-dashboard');
        } else {
          setError('Invalid credentials for doctor.');
        }
      });
    } catch (error) {
      setError('Error logging in. Please try again.'); // Display error message if login fails
    }
  };

  return (
    <>
      <Head>
        <title>Doctor Login</title>
      </Head>
      <div>
        <h2>Doctor Login</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin}>Login</button>
        {error && <p>{error}</p>}
      </div>
    </>
  );
};

export default DoctorLogin;
