import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Chart, LinearScale, PointElement, Tooltip, Legend, TimeScale } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import Cookies from 'js-cookie';
import moment from 'moment';
import 'chartjs-adapter-moment';
import styles from './graphs.module.scss';
import { motion } from 'framer-motion';

Chart.register(LinearScale, PointElement, Tooltip, Legend, TimeScale);

const DisplayGraphs = ({ showGraphs, setShowGraphs }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [bpmData, setBpmData] = useState({});
    const [availableDates, setAvailableDates] = useState([]);
    const userEmail = Cookies.get('userEmail');
    const [timeRange, setTimeRange] = useState('daily');

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

    const handleTimeRangeChange = range => {
        setTimeRange(range);
    };

    const handleModalClick = event => {
        if (event.target.classList.contains(styles.modalBackground)) {
            setShowGraphs(false);
        }
    };

    const renderGraph = () => {
        if (selectedDate && bpmData[selectedDate] !== undefined) {
            switch (timeRange) {
                case 'daily':
                    return renderDailyGraph();
                case 'weekly':
                    return renderWeeklyGraph();
                case 'monthly':
                    return renderMonthlyGraph();
                default:
                    return <p className={styles.noData}>Invalid time range.</p>;
            }
        } else {
            return <p className={styles.noData}>No available data for this date.</p>;
        }
    };

    const renderDailyGraph = () => {
        return (
            <Scatter
                style={{ padding: '10px 20px' }}
                data={{
                    datasets: [
                        {
                            label: 'Daily BPM Data',
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
        );
    };

    const renderWeeklyGraph = () => {
        // Logic to calculate weekly average BPM
        const weeklyData = calculateWeeklyData(selectedDate);
    
        if (weeklyData) {
            return (
                <Scatter
                    style={{ padding: '10px 20px' }}
                    data={{
                        datasets: [
                            {
                                label: 'Weekly Average BPM Data',
                                data: weeklyData.map(({ date, avgBpm }) => ({
                                    x: moment(date, 'MM/DD/YYYY').toDate(),
                                    y: avgBpm,
                                    color: avgBpm <= 40 ? 'rgb(162, 255, 0)' :
                                           avgBpm <= 70 ? 'rgb(82, 245, 0)' :
                                           avgBpm <= 90 ? 'rgb(255, 0, 195)' :
                                                          'rgb(255, 0, 5)'
                                })),
                                pointRadius: 6,
                                pointBackgroundColor: ctx => ctx.dataset.data.map(point => point.color)
                            },
                        ],
                    }}
                    options={{
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'day',
                                },
                                title: {
                                    display: true,
                                    text: 'Date',
                                },
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Average BPM Value',
                                },
                            },
                        },
                    }}
                />
            );
        } else {
            return <p className={styles.noData}>No available data for this week.</p>;
        }
    };
    

    const renderMonthlyGraph = () => {
        // Logic to calculate monthly average BPM
        const monthlyData = calculateMonthlyData(selectedDate);

        if (monthlyData) {
            return (
                <Scatter
                    style={{ padding: '10px 20px' }}
                    data={{
                        datasets: [
                            {
                                label: 'Monthly Average BPM Data',
                                data: monthlyData.map(({ date, avgBpm }) => ({
                                    x: moment(date, 'MM/DD/YYYY').toDate(),
                                    y: avgBpm,
                                })),
                                pointRadius: 6,
                                pointBackgroundColor: 'rgb(255, 0, 0)',
                            },
                        ],
                    }}
                    options={{
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'day',
                                },
                                title: {
                                    display: true,
                                    text: 'Date',
                                },
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Average BPM Value',
                                },
                            },
                        },
                    }}
                />
            );
        } else {
            return <p className={styles.noData}>No available data for this month.</p>;
        }
    };

    const calculateWeeklyData = (selectedDate) => {
        const startOfWeek = moment(selectedDate, 'MM/DD/YYYY').startOf('week');
        const endOfWeek = moment(selectedDate, 'MM/DD/YYYY').endOf('week');
        const weeklyData = [];
    
        for (let date = moment(startOfWeek); date.isSameOrBefore(endOfWeek); date.add(1, 'days')) {
            const formattedDate = date.format('M/D/YYYY');
            const dailyData = bpmData[formattedDate];
            if (dailyData) {
                const entries = Object.values(dailyData);
                const totalBpm = entries.reduce((acc, entry) => acc + entry.bpmValue, 0);
                const avgBpm = totalBpm / entries.length;
                weeklyData.push({ date: formattedDate, avgBpm });
            }
        }
    
        return weeklyData;
    };
    

    const calculateMonthlyData = (selectedDate) => {
        const startOfMonth = moment(selectedDate, 'MM/DD/YYYY').startOf('month').format('MM/DD/YYYY');
        const endOfMonth = moment(selectedDate, 'MM/DD/YYYY').endOf('month').format('MM/DD/YYYY');
        const monthlyData = [];

        for (let date = startOfMonth; moment(date, 'MM/DD/YYYY').isSameOrBefore(endOfMonth); date = moment(date, 'MM/DD/YYYY').add(1, 'days').format('MM/DD/YYYY')) {
            const dailyData = bpmData[date];
            if (dailyData) {
                const entries = Object.values(dailyData);
                const totalBpm = entries.reduce((acc, entry) => acc + entry.bpmValue, 0);
                const avgBpm = totalBpm / entries.length;
                monthlyData.push({ date, avgBpm });
            }
        }

        return monthlyData;
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
                                <span onClick={() => handleTimeRangeChange('daily')} style={{backgroundColor: timeRange === 'daily' ? 'rgb(244, 244, 244)' : '', borderBottom: timeRange === 'daily' ? '0.2em solid #0452ce' : ''}}>Daily</span>
                                <span onClick={() => handleTimeRangeChange('weekly')} style={{backgroundColor: timeRange === 'weekly' ? 'rgb(244, 244, 244)' : '', borderBottom: timeRange === 'weekly' ? '0.2em solid #0452ce' : ''}}>Weekly</span>
                                <span onClick={() => handleTimeRangeChange('monthly')} style={{backgroundColor: timeRange === 'monthly' ? 'rgb(244, 244, 244)' : '', borderBottom: timeRange === 'monthly' ? '0.2em solid #0452ce' : ''}}>Monthly</span>
                            </div>

                            <select onChange={handleDateChange} className={styles.selectDate}>
                                <option>Select Date</option>
                                {availableDates.map(date => (
                                    <option key={date} value={date}>
                                        {date}
                                    </option>
                                ))}
                            </select>

                            {renderGraph()}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </>
    )
}

export default DisplayGraphs;
