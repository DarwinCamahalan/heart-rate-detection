import styles from './graphs.module.scss'
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Chart, LinearScale, PointElement, Tooltip, Legend, TimeScale } from 'chart.js';
import {motion} from 'framer-motion'
Chart.register(LinearScale, PointElement, Tooltip, Legend, TimeScale);
import { Scatter } from 'react-chartjs-2';
import Cookies from 'js-cookie';
import moment from 'moment';
import 'chartjs-adapter-moment';

const DisplayGraphs = ({ showGraphs, setShowGraphs }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [bpmData, setBpmData] = useState({});
    const [availableDates, setAvailableDates] = useState([]);
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
                    setBpmData(data.bpm);
                    const dates = Object.keys(data.bpm || {}).filter(date =>
                        Object.keys(data.bpm[date]).length > 0
                    );

                    setAvailableDates(dates);

                    if (dates.length > 0) {
                        const sortedDates = dates.sort((a, b) => moment(b, 'MM/DD/YYYY').diff(moment(a, 'MM/DD/YYYY')));
                        setSelectedDate(sortedDates[0]);
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
    }, [userEmail]);


    const handleDateChange = event => {
        setSelectedDate(event.target.value);
    };

    const handleModalClick = event => {
        if (event.target.classList.contains(styles.modalBackground)) {
            setShowGraphs(false);
        }
    };

    return (
        <>
            {showGraphs && (
                <motion.div className={styles.mainContainer}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}>

                    <div className={styles.modalBackground} onClick={handleModalClick}>
                        <motion.div className={styles.modal}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}>

                            <div className={styles.tabs}>
                                <span>Daily</span>
                                <span>Weekly</span>
                                <span>Monthly</span>
                            </div>

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
                                    style={{padding: '10px 20px'}}
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
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </>
    )
}

export default DisplayGraphs;
