import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import PatientForm from '../components/PatientForm';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import Cookies from 'js-cookie'; // Import js-cookie library
import Link from 'next/link';
import styles from '../styles/patientDashboard.module.scss'
import { useRouter } from 'next/router';
import Image from 'next/image';
import heartLogo from '../public/bpm-card-image.png'

const PatientDashboard = () => {
  const [showModal, setShowModal] = useState(true); // Initialize with default value
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [accountCreationInfo, setAccountCreationInfo] = useState('');
  const [uid, setUid] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [fullName, setFullName] = useState('');
  const patientEmail = Cookies.get('patientEmail');
  const router = useRouter();

  useEffect(() => {
    // Fetch patient data based on email from cookie
    const fetchPatientData = async () => {
      try {
        const patientCollectionRef = collection(db, 'patients');
        const q = query(patientCollectionRef, where("email", "==", patientEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const patientDoc = querySnapshot.docs[0];
          const data = patientDoc.data();
          setEmail(data.email);
          setUid(patientDoc.id);
          setRole(data.role);
          setAccountCreationInfo(data.createdOn);
          setFullName(`${data.firstName} ${data.lastName}`)
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

    // Check if the cookie exists and set the modal state accordingly
    const showModalCookie = Cookies.get('showModal');
    if (showModalCookie !== undefined) {
      setShowModal(showModalCookie === 'true');
    }
  }, [patientEmail]);

  // Function to handle form submission
  const handleSubmit = async () => {
    try {
      // Form validation
      if (!firstName || !lastName || !age || !birthday || !gender) {
        setFormError('Please fill in all fields.');
        return;
      }

      // Update patient account with additional information
      await updateDoc(doc(db, 'patients', uid), {
        firstName,
        lastName,
        age,
        birthday,
        gender
      });
      // Close modal and reset form fields
      setShowModal(false);
      setFirstName('');
      setLastName('');
      setAge('');
      setBirthday('');
      setGender('');
      Cookies.set('showModal', false);
      router.reload()
    } catch (error) {
      console.error('Error updating patient account:', error);
    }
  };

  // Function to handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div>

      <div className={styles.mainContainer}>
        <div className={styles.subContainer}>
          <h1>Welcome, {fullName}!</h1>
          <div className={styles.cards}>
            <div className={styles.mainCard}>
            <Link href={"/heart-rate"}>
              <Image src={heartLogo} alt="Card Image"/>
              <div className={styles.content}>
                <h2>Heart Rate Detection</h2>
                <p>Using Computer Vision, Patient Heart Rate will be determine using only a Camera.</p>
              </div>
            </Link>
            </div>
            <span>Coming Soon</span>
            <div className={styles.tempCard}>
              +
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onClose={handleCloseModal}>
        <PatientForm
          firstName={firstName}
          lastName={lastName}
          age={age}
          birthday={birthday}
          gender={gender}
          email={email}
          accountCreationInfo={accountCreationInfo}
          uid={uid}
          role={role}
          formError={formError}
          setFirstName={setFirstName}
          setLastName={setLastName}
          setAge={setAge}
          setBirthday={setBirthday}
          setGender={setGender}
          handleSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
};

export default PatientDashboard;
