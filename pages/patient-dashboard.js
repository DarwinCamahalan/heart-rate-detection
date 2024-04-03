import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import PatientForm from '../components/PatientForm';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import Cookies from 'js-cookie'; // Import js-cookie library
import Link from 'next/link';

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
  const patientEmail = Cookies.get('patientEmail');

  useEffect(() => {
    // Fetch patient data from Firestore
    const fetchPatientData = async () => {
      try {
        const patientCollectionRef = collection(db, 'patients');
        const querySnapshot = await getDocs(patientCollectionRef);
        if (!querySnapshot.empty) {
          const mostRecentDoc = querySnapshot.docs[0];
          const data = mostRecentDoc.data();
          setEmail(data.email);
          setUid(mostRecentDoc.id);
          setRole(data.role);
          setAccountCreationInfo(data.createdOn);
        } else {
          console.log('No patient data found.');
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    fetchPatientData();

    // Check if the cookie exists and set the modal state accordingly
    const showModalCookie = Cookies.get('showModal');
    if (showModalCookie !== undefined) {
      setShowModal(showModalCookie === 'true');
    }
  }, []);

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
      <h1>Welcome to the Patient Dashboard</h1>
      <Link href={"/heart-rate"}>Hear Rate Detection</Link>
      <Modal show={showModal} onClose={handleCloseModal}>
        <h2>Complete Your Profile</h2>
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
