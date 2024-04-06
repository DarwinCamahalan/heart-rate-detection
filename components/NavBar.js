import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import {motion} from 'framer-motion'
import Link from 'next/link';
import styles from './navBar.module.scss';
import Image from 'next/image';
import logo from '../public/logo.png';
import Cookies from 'js-cookie';
import BpmRecords from './BpmRecords';

const Navbar = () => {
  const userEmail = Cookies.get('userEmail');
  const collectionName = Cookies.get('dbLocation');
  const dashboard = Cookies.get('dashboard');

  const [fullName, setFullName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountName, setShowAccountName] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uid, setUid] = useState('');
  const [showTable, setShowTable] = useState(false); // State to manage table visibility

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

  // Function to toggle table visibility
  const toggleTableVisibility = () => {
    setShowTable(prevState => !prevState);
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
          
            <li className={styles.navText} >

              {dashboard == 'patient-dashboard' ? 
                  <>
                  <div className={styles.navigation}>
                      <span>Schedule Checkup</span>
                      <span onClick={toggleTableVisibility}>BPM Records</span>
                      <span>Graphs</span>
                  </div>
  
                  <div className={styles.bell}>
                    <span className={styles.bellIcon}>&#128365;</span>
                  </div>
                </>
              : null}

              <div className={styles.accountDropdown} onMouseOver={() => setShowDropdown(true)}>

                {fullName} <span>▼</span>
      
                {showDropdown && 
                  <div className={styles.accountDropdown} onMouseLeave={() => setShowDropdown(false)}>

                    <span><Link href="#">My Account</Link></span>

                    <hr />

                    <span onClick={(()=>{setShowConfirmation(true)})}>
                      Logout
                    </span>

                  </div>
                }
              </div>
            </li>

          : null}
        </ul>

      </nav>

      {showConfirmation ? 
        <motion.div className={styles.modalOverlay}
        initial={{ opacity: 0}}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}>

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
        </motion.div>

      : null}

      <BpmRecords showTable={showTable} setShowTable={setShowTable} /> {/* Pass showTable state and setShowTable function as props */}
    </>
  );
};

export default Navbar;
