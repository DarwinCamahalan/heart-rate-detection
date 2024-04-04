import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'; // Import collection function here
import Link from 'next/link';
import styles from './navBar.module.scss';
import Image from 'next/image';
import logo from '../public/logo.png';
import Cookies from 'js-cookie';

const Navbar = () => {
  const patientEmail = Cookies.get('patientEmail');
  const [fullName, setFullName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountName, setShowAccountName] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uid, setUid] = useState('');

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const patientCollectionRef = collection(db, 'patients'); // Use the collection function here
        const q = query(patientCollectionRef, where("email", "==", patientEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const patientDoc = querySnapshot.docs[0];
          const data = patientDoc.data();
          setFullName(`${data.firstName} ${data.lastName}`);
          setShowAccountName(data.login);
          setUid(patientDoc.id);
        } else {
          console.log('No patient data found for this email.');
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    if (patientEmail) {
      fetchPatientData();
    } else {
      console.log('No patient email found in cookies.');
    }
  }, [patientEmail]);

  const handleLogout = async () => {
    try {
      await updateDoc(doc(db, 'patients', uid), {
        login: false
      });
      window.location.href = '/';
      Cookies.remove('patientEmail');
      Cookies.remove('showModal');
    } catch (error) {
      console.error('Error updating patient account:', error);
    }
  };

  return (
    <>
      <nav className={styles.navMainContainer}>
        <ul>
          <li>
            <Link className={styles.homepageLink} href="/">
              <Image className={styles.logoImage} src={logo} alt='Medical Consultation Logo'/>
              Medical Consultation
            </Link>
          </li>
          {showAccountName ? 
            <li className={styles.accountLogout} onMouseOver={() => setShowDropdown(true)}>
              {fullName} <span className={styles.arrowDown}>►</span>
    
              {showDropdown && 
                <div className={styles.accountDropdown} onMouseLeave={() => setShowDropdown(false)}>
                  <span><Link href="#">My Account</Link></span>
                  <hr />
                  <span onClick={(()=>{setShowConfirmation(true)})}>
                    Logout
                  </span>
                </div>
              }
            </li>
          : null}
        </ul>
      </nav>
      {showConfirmation ? 
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h1>Confirmation</h1>
              <p>Do you want to Logout?</p>
              <div className={styles.confirm}>
                <span onClick={(()=>{setShowConfirmation(false)})}>No</span>
                <span onClick={() => {
                      setShowAccountName(false);
                      handleLogout();
                      setShowConfirmation(false)
                    }} ><Link href={"/"}>Yes</Link></span>
              </div>
            </div>
          </div>
        </div>
      : null}

    </>
  );
};

export default Navbar;
