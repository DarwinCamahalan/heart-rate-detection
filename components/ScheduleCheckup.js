import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, query, where, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import moment from 'moment';
import styles from './checkup.module.scss';

const ScheduleCheckup = ({ showCheckup, setShowCheckup }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [scheduleApproved, setScheduleApproved] = useState(false);
  const router = useRouter()

  useEffect(() => { 
    const fetchScheduleApproved = async () => {
      try {
        const userEmail = Cookies.get('userEmail');
        if (!userEmail) {
          setError('User email not found in cookies.');
          return;
        }

        const patientCollectionRef = collection(db, 'patients');
        const q = query(patientCollectionRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const patientDoc = querySnapshot.docs[0];
          const data = patientDoc.data();
          if (data.schedules && data.schedules.scheduleApproved !== undefined) {
            setScheduleApproved(data.schedules.scheduleApproved);
            
            if(data.schedules.scheduleApproved == false){
                setError("Existing Schedule is Pending")
            }

          }else{
            setScheduleApproved(true)
          }

        }
      } catch (error) {
        console.error('Error fetching schedule approval status:', error);
        setError('Error fetching schedule approval status.');
      }
    };

    fetchScheduleApproved();
  }, [setScheduleApproved]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setError('');
  };

  const handleTimeChange = (event) => {
    setSelectedTime(event.target.value);
    setError('');
  };

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
    setError('');
  };

  const hideCheckup = () => {
    setShowCheckup(false);
  };

  const handleSubmit = async () => {
    try {
      const userEmail = Cookies.get('userEmail');
      if (!userEmail) {
        setError('User email not found in cookies.');
        return;
      }
  
      if (!selectedDate || !selectedTime || !message) {
        setError('Please fill out all fields.');
        return;
      }
  
      if (moment(selectedDate).isBefore(moment(), 'day')) {
        setError('Please select a date in the future.');
        return;
      }
  
      const selectedHour = parseInt(selectedTime.split(':')[0], 10);
      if (selectedHour < 9 || selectedHour >= 17) {
        setError('Please select a time between 9:00 AM and 5:00 PM.');
        return;
      }
  
      // Add AM or PM to the selectedTime
      const hour = parseInt(selectedTime.split(':')[0], 10);
      const minute = selectedTime.split(':')[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedTime = `${hour % 12 || 12}:${minute} ${ampm}`;
  
      const patientCollectionRef = collection(db, 'patients');
      const q = query(patientCollectionRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const patientDoc = querySnapshot.docs[0];
        const patientDocRef = doc(db, 'patients', patientDoc.id);
  
        const scheduleData = {
          time: formattedTime, // Use the formattedTime here
          date: selectedDate,
          message: message,
          scheduleApproved: false,
          notify: false,
        };
  
        await updateDoc(patientDocRef, {
          schedules: scheduleData,
        });
  
        setSuccess(true);
      }
      
    } catch (error) {
      console.error('Error adding schedule document: ', error);
      setError('Error submitting checkup request.');
    }
  
    setShowCheckup(false);
    router.reload()
  };
  
  return (
    <>
      {showCheckup ? (
        <motion.div
          className={styles.mainContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.checkupClose} onClick={hideCheckup}></div>

          <div className={styles.checkupModal}>
            <p>Schedule a Checkup</p>
            <label>Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={handleDateChange} 
              min={moment().format('YYYY-MM-DD')} 
              disabled={!scheduleApproved} 
            />
            <label>Time</label>
            <input
              type="time"
              value={selectedTime}
              onChange={handleTimeChange}
              min="09:00"
              max="17:00"
              step="3600"
              disabled={!scheduleApproved} 
            />
            <label>Message</label>
            <textarea
              value={message}
              onChange={handleMessageChange}
              maxLength={3000}
              className={error ? styles.error : null}
              disabled={!scheduleApproved} 
            />
            {error && <p className={styles.errorMessage}>{error}</p>} 

            <motion.button 
              onClick={handleSubmit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.9 }}
              disabled={!scheduleApproved} 
            >
              Submit
            </motion.button>

          </div>
        </motion.div>
      ) : null}
    </>
  );
};

export default ScheduleCheckup;
