import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import PatientForm from '../components/PatientForm';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import Cookies from 'js-cookie';
import Link from 'next/link';
import styles from '../styles/patientDashboard.module.scss';
import { useRouter } from 'next/router';
import Image from 'next/image';
import heartLogo from '../public/bpm-card-image.png';
import tempImage from '../public/tempImage.jpg';
import { Scatter } from 'react-chartjs-2';
import moment from 'moment';
import 'chartjs-adapter-moment'; // Import Moment.js adapter for Chart.js
import { Chart, LinearScale, PointElement, Tooltip, Legend, TimeScale } from 'chart.js';
Chart.register(LinearScale, PointElement, Tooltip, Legend, TimeScale);

const PatientDashboard = () => {
  const [showModal, setShowModal] = useState(true);
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
  const [selectedDate, setSelectedDate] = useState('');
  const [bpmData, setBpmData] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [userBpm, setUserBpm] = useState(null);
  const [userBpmTime, setUserBpmTime] = useState('');
  const [averageBpm, setAverageBpm] = useState(null);
  const userEmail = Cookies.get('userEmail');
  const router = useRouter();
  const cardTitle = ['X-Ray Camera', 'Tumor Detection', 'Cancer Detection'];

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
          setFullName(`${data.firstName} ${data.lastName}`);
          setBpmData(data.bpm);
          const dates = Object.keys(data.bpm || {}).filter(date =>
            Object.keys(data.bpm[date]).length > 0
          );
          setAvailableDates(dates);
          if (dates.length > 0) {
            setSelectedDate(dates[0]);
          }
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

  useEffect(() => {
    if (selectedDate && bpmData[selectedDate]) {
      const latestEntry = Object.entries(bpmData[selectedDate])
        .sort(([timeA], [timeB]) => moment(timeB, 'HH:mm:ss').diff(moment(timeA, 'HH:mm:ss')))
        .find(([, { bpmValue }]) => bpmValue !== undefined);
  
      if (latestEntry) {
        setUserBpm(latestEntry[1].bpmValue);
        setUserBpmTime(moment(latestEntry[0], 'HH:mm:ss').format('h:mm A'));
      } else {
        setUserBpm(null);
        setUserBpmTime('');
      }
    } else {
      setUserBpm(null);
      setUserBpmTime('');
    }
  }, [bpmData, selectedDate]);
  

  useEffect(() => {
    if (selectedDate && bpmData[selectedDate]) {
      const entries = Object.values(bpmData[selectedDate]);
      const totalBpm = entries.reduce((acc, entry) => acc + entry.bpmValue, 0);
      const avgBpm = totalBpm / entries.length;
      setAverageBpm(avgBpm.toFixed(2));
    } else {
      setAverageBpm(null);
    }
  }, [selectedDate, bpmData]);

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
      router.reload();
    } catch (error) {
      console.error('Error updating patient account:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDateChange = event => {
    setSelectedDate(event.target.value);
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div>
      <div className={styles.mainContainer}>
        <div className={styles.subContainer}>
          <h1>Welcome, {fullName}!</h1>
          <div className={styles.cards}>
            <div className={styles.topCard}>
              <div className={styles.mainCardContainer}>
                <div className={styles.mainCard}>
                  <Link href={'/heart-rate'}>
                    <Image src={heartLogo} alt="Card Image" />
                    <div className={styles.content}>
                      <h2>Heart Rate Detection</h2>
                      <p>Using Computer Vision, Patient Heart Rate will be determined using only a Camera.</p>
                    </div>
                  </Link>
                </div>
                <div className={styles.displayBpm}>
                  <div className={styles.currentBpmCard}>
                    <h1>Current BPM</h1>
                      {userBpm !== null ? 
                        <div>
                          <p>{userBpm}</p>
                          <p>{userBpmTime}</p>
                        </div>
                      : <p className={styles.noDataBpm}>N/A</p>}
                  </div>
                  <div className={styles.currentBpmCard}>
                    <h1>Average BPM</h1>
                      {averageBpm !== null ? 
                        <div>
                          <p style={{color : '#0452ce'}}>{averageBpm}</p>
                          <p>{selectedDate}</p>
                        </div>
                      : <p className={styles.noDataBpm}>N/A</p>}
                  </div>
                </div>
              </div>
              <div className={styles.bpmData}>
                <select onChange={handleDateChange} className={styles.selectDate}>
                  <option>Select Date</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
                {selectedDate && bpmData[selectedDate] !== undefined ? (
                  <Scatter
                    data={{
                      datasets: [
                        {
                          label: 'BPM Data',
                          data: Object.entries(bpmData[selectedDate]).map(([time, { bpmValue }]) => ({
                            x: moment(time, 'HH:mm:ss').toDate(),
                            y: bpmValue || 0,
                          })),
                          pointRadius: 6,
                          pointBackgroundColor: ctx => {
                            const value = ctx.dataset.data[ctx.dataIndex].y;
                            if (value >= 0 && value <= 40) {
                              return 'rgb(162, 255, 0)';
                            } else if (value >= 41 && value <= 70) {
                              return 'rgb(82, 245, 0)';
                            } else if (value >= 71 && value <= 90) {
                              return 'rgb(255, 0, 195)';
                            } else {
                              return 'rgb(255, 0, 5)';
                            }
                          },
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        x: {
                          type: 'time',
                          time: {
                            unit: 'minute',
                          },
                          title: {
                            display: true,
                            text: 'Time',
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'BPM Value',
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <p className={styles.noData}>No available data for this date.</p>
                )}

              </div>
            </div>
            <hr />
            <span>Coming Soon</span>
            <div className={styles.comingCards}>
              {cardTitle.map((title, index) => (
                <div key={index} className={styles.otherCard}>
                  <Link href={'#'}>
                    <Image src={tempImage} alt="Card Image" />
                    <div className={styles.content}>
                      <h2>{title}</h2>
                      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Amet qui recusandae debitis!</p>
                    </div>
                  </Link>
                </div>
              ))}
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
          handleKeyDown={handleKeyDown}
        />
      </Modal>
    </div>
  );
};

export default PatientDashboard;
