import { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Head from 'next/head';

const SignUpPatient = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    try {
      // Add patient data to Firestore
      const docRef = await addDoc(collection(db, 'patients'), {
        email,
        password,
        role: 'patient'
      });
      console.log('Document written with ID: ', docRef.id);
      // Redirect to patient dashboard or desired page
      router.push('/patient-dashboard');
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
