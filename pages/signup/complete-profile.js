import { db } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { motion } from "framer-motion"
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import PatientForm from '../../components/PatientForm';
import Cookies from 'js-cookie';
import moment from 'moment';
import Head from 'next/head';

const CompleteProfile = () => {
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [showModal, setShowModal] = useState(true);
  const [accountCreationInfo, setAccountCreationInfo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [uid, setUid] = useState('');
  const userEmail = Cookies.get('userEmail');

  useEffect(() => {
      const fetchPatientData = async () => {
        try {
          const patientCollectionRef = collection(db, 'patients');
          const q = query(patientCollectionRef, where('email', '==', userEmail));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const patientDoc = querySnapshot.docs[0];
            const data = patientDoc.data();
            setEmail(data.email);
            setUid(patientDoc.id);
            setRole(data.role);
            setAccountCreationInfo(data.createdOn);

          } else {
            console.log('No patient data found for this email.');
          }

        } catch (error) {
          console.error('Error fetching patient data:', error);
        }

      };
    
      if (userEmail) {
        fetchPatientData();

      } else {
        console.log('No patient email found in cookies.');
      }
    
      const showModalCookie = Cookies.get('showModal');

      if (showModalCookie !== undefined) {
        setShowModal(showModalCookie === 'true');
      }

    }, [userEmail]);

    const handleSubmit = async () => {
      try {
        if (!firstName || !lastName || !age || !birthday || !gender) {
          setFormError('Please fill in all fields.');
          return;
        }
  
        const parsedBirthday = moment(birthday, 'YYYY-MM-DD').toDate();
  
        await updateDoc(doc(db, 'patients', uid), {
          firstName,
          lastName,
          age,
          birthday: parsedBirthday,
          gender,
        });

        setShowModal(false);
        setFirstName('');
        setLastName('');
        setAge('');
        setBirthday('');
        setGender('');
        Cookies.set('showModal', false);
        window.location.href = '/patient-dashboard';

      } catch (error) {
        console.error('Error updating patient account:', error);
      }
    };
  
    const handleCloseModal = () => {
      setShowModal(false);
    };

  const handleKeyDown = event => {
      if (event.key === 'Enter') {
      handleSubmit();
      }
  };
    
  return (
    <motion.div
    initial={{ opacity: 0}}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}>

      <Head>
        <title>Complete Profile</title>
      </Head>

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
          handleKeyDown={handleKeyDown}
          />
      </Modal>
    </motion.div>
  )
}

export default CompleteProfile