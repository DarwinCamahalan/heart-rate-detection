import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import Link from 'next/link';
import styles from './navBar.module.scss';
import Image from 'next/image';
import logo from '../public/logo.png';
import Cookies from 'js-cookie';

const Navbar = () => {
  const userEmail = Cookies.get('userEmail');
  const collectionName = Cookies.get('dbLocation');
  const dashboard = Cookies.get('dashboard');

  const [fullName, setFullName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountName, setShowAccountName] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uid, setUid] = useState('');

  useEffect(() => {

    const fetchAccountData = async () => {

      try {
        const patientCollectionRef = collection(db, collectionName === 'patients' ? 'patients' : 'doctors');
        const q = query(patientCollectionRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const patientDoc = querySnapshot.docs[0];
          const data = patientDoc.data();
          setFullName(`${data.firstName} ${data.lastName}`);
          setShowAccountName(data.login);
          setUid(patientDoc.id);

        } else {
          console.log('No account data found for this email.');
        }

      } catch (error) {
        console.error('Error fetching account data:', error);
      }

    };

    if (userEmail) {
      fetchAccountData();

    } else {
      console.log('No account email found in cookies.');
    }

  }, [userEmail, collectionName]);

  const handleLogout = async () => {

    try {
      await updateDoc(doc(db, collectionName === 'patients' ? 'patients' : 'doctors', uid), {
        login: false
      });

      window.location.href = '/';
      Cookies.remove('userEmail');
      Cookies.remove('dbLocation');
      Cookies.remove('showModal');
      Cookies.remove('dashboard');

    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  return (
    <>
      <nav className={styles.navMainContainer}>
        <ul>
          <li>
            <Link className={styles.homepageLink} href={userEmail != undefined ? dashboard : "/"}>
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
