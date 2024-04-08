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
import DisplayGraphs from './DisplayGraphs';
import ScheduleCheckup from './ScheduleCheckup';

const Navbar = () => {
  const userEmail = Cookies.get('userEmail');
  const collectionName = Cookies.get('dbLocation');
  const dashboard = Cookies.get('dashboard');

  const [fullName, setFullName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showAccountName, setShowAccountName] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uid, setUid] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  const [showCheckup, setShowCheckup] = useState(false);
  const [notify, setNotify] = useState(false);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const patientCollectionRef = collection(db, collectionName === 'patients' ? 'patients' : 'doctors');
        const q = query(patientCollectionRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const patientDoc = querySnapshot.docs[0];
          const data = patientDoc.data();

          if (data.schedules && data.schedules.notify !== undefined) {
            
            if(data.schedules.notify == true){
              setNotify(true);

            }else if(data.schedules.notify == false){
              setNotify(false);
            }

          }

          setFullName(`${data.firstName} ${data.lastName}`);
          setShowAccountName(data.login);
          setUid(patientDoc.id);

        }

      } catch (error) {
        console.error('Error fetching account data:', error);
      }

    };

    if (userEmail) {
      fetchAccountData();
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


  const toggleTableVisibility = () => {
    setShowTable(prevState => !prevState);
  };

  const toggleGraphsVisibility = () => {
    setShowGraphs(prevState => !prevState);
  };

  const toggleCheckupsVisibility = () => {
    setShowCheckup(prevState => !prevState);
  };

  return (
    <>
      <nav className={styles.navMainContainer}>
        <ul>
          <li>
            <Link className={styles.homepageLink} href={userEmail ? `/${dashboard}` : "/"}>
              <Image className={styles.logoImage} src={logo} alt='Medical Consultation Logo'/>
              Medical Consultation
            </Link>
          </li>

          {showAccountName ? 
          
            <li className={styles.navText} >

              {dashboard == 'patient-dashboard' ? 
                  <>
                  <div className={styles.navigation}>
                      <span onClick={toggleTableVisibility}>BPM Records</span>
                      <span onClick={toggleGraphsVisibility}>Graphs</span>
                      <span onClick={toggleCheckupsVisibility}>Schedule Checkup</span>
                  </div>
  
                  <div className={styles.bell}>
                    {notify ? <span className={styles.notificationDot}>●</span> : null}
                    <span className={styles.bellIcon} onMouseOver={(()=>{setShowNotification(true)})}>&#128365;</span>
                  </div>
                </>
              : null}

              <div className={styles.accountDropdown} onMouseOver={() => setShowDropdown(true)}>

                {fullName} <span>▼</span>
      
                {showDropdown && 
                  <motion.div className={styles.accountDropdown} onMouseLeave={() => setShowDropdown(false)}
                  initial={{ opacity: 0}}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}>

                    <span><Link href="#">My Account</Link></span>

                    <hr />

                    <span onClick={(()=>{setShowConfirmation(true)})}>
                      Logout
                    </span>

                  </motion.div>
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

      {showNotification ? 
      <motion.div className={styles.notificationContainer} onMouseLeave={(()=>{setShowNotification(false)})}
      initial={{ opacity: 0}}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}>
        <div className={styles.content}>
          <h5>Notifications</h5>
          <span>All</span>

          <p>Recent</p>
          {notify ? 
      
            <motion.div className={styles.alert}
              initial={{ opacity: 0}}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}>
                Scheduled Checkup has been approved by the Doctor
            </motion.div>

            : 

            <div className={styles.noNotification}>No Notification</div>}

        </div>
      </motion.div>
      : null}

      <BpmRecords showTable={showTable} setShowTable={setShowTable} />
      <DisplayGraphs showGraphs ={showGraphs} setShowGraphs={setShowGraphs}/>
      <ScheduleCheckup showCheckup ={showCheckup} setShowCheckup={setShowCheckup}/>
    </>
  );
};

export default Navbar;
