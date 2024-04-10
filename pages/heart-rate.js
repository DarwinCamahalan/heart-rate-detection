import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import {motion} from'framer-motion'
import Head from 'next/head';
import styles from '../styles/heartRate.module.scss';
import 'react-circular-progressbar/dist/styles.css';
import Image from 'next/image';
import hearBeat from '../public/heartbeat.gif';
import Cookies from 'js-cookie';
import moment from 'moment';
import io from 'socket.io-client';

export default function HeartRate() {
  const [bpm, setBpm] = useState(0);
  const [finalBpm, setFinalBpm] = useState(0);
  const [bufferIndex, setBufferIndex] = useState(0);
  const [showFinalBpm, setShowFinalBpm] = useState(false);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('bpm_update', ({ bpm, bufferIndex }) => {
      setBpm(bpm);
      setBufferIndex(bufferIndex);

      if (bufferIndex === 149) {
        setShowFinalBpm(true);
        setFinalBpm(bpm);
      }
    });

    const fetchPatientData = async () => {
      try {
        const userEmail = Cookies.get('userEmail');

        if (userEmail) {
          const q = query(collection(db, 'patients'), where("email", "==", userEmail));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const patientDoc = querySnapshot.docs[0];
            const data = patientDoc.data();
            setPatientData({ ...data, id: patientDoc.id });
          }
        }
        
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    fetchPatientData();

    return () => {
      socket.disconnect();
    };

  }, []);

  const handleSubmit = async () => {
    try {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = moment().format('HH:mm:ss');

      if (!patientData) {
        console.error('Patient data not available.');
        return;
      }

      const newBpmData = {
        bpmValue: finalBpm
      };

      const existingBpm = patientData.bpm || {};
      const updatedBpm = {
        ...existingBpm,
        [currentDate]: {
          ...existingBpm[currentDate],
          [currentTime]: newBpmData
        }
      };

      await updateDoc(doc(db, 'patients', patientData.id), {
        ...patientData,
        bpm: updatedBpm
      });

      window.location.href = '/patient-dashboard';
    } catch (error) {
      console.error('Error submitting BPM:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Heart Rate Detection</title>
        <meta name="description" content="A Computer Vision project that detects a person's Heart Rate Per Minute (BPM) for medical consultation data gathering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>

      <div className={styles.mainContainer}>
        {showFinalBpm ? (
          <div className={styles.modalBPM}>
            <motion.div className={styles.displayBPM}
              animate={{ y: 20 }}
              transition={{ type: "spring", stiffness: 1000 }}>
              <p>BPM</p>
              <h5>{finalBpm}</h5>
              <div className={styles.buttons}>
                <button onClick={handleSubmit}><span>&#128505;</span> Submit</button>
                <button onClick={() => { window.location.href = '/heart-rate'; }}> <span>&#120;</span> Retry</button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className={styles.showCard}>
            <div className={styles.videoContainer}>
              <iframe className={styles.faceVideo} src="http://127.0.0.1:5000/face_detection" scrolling="no" width="600" height="500" frameBorder="0"></iframe>
              <iframe className={styles.bpmVideo} src="http://127.0.0.1:5000/bpm_detection" scrolling="no" width="320" height="240" frameBorder="0"></iframe>
            </div>

            <div className={styles.bpmCounter}>
              <CircularProgressbarWithChildren className={styles.progressBar} value={bufferIndex}
                styles={buildStyles({
                  strokeLinecap: 'butt',
                  pathTransitionDuration: 0.1,
                  transition: 'stroke-dashoffset 0.5s ease 0s',
                  transform: 'rotate(0.25turn)',
                  transformOrigin: 'center center',
                  pathColor: `rgba(222, 0, 56, ${bufferIndex / 100})`,
                  trailColor: '#ffebeb',
                })}
              >
                <Image src={hearBeat} alt='Heart Beat' />
                <span>{bpm}</span>
              </CircularProgressbarWithChildren>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
