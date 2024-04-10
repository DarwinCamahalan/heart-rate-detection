import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/doctorDashboard.module.scss';
import { motion } from 'framer-motion'
import { useRouter } from 'next/router';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

import { Chart, LinearScale, PointElement, Tooltip, Legend, TimeScale } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import moment from 'moment';
import 'chartjs-adapter-moment';



Chart.register(LinearScale, PointElement, Tooltip, Legend, TimeScale);

const DoctorDashboard = () => {
  const [patientsData, setPatientsData] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter()

  const [selectedDate, setSelectedDate] = useState('');
  const [bpmData, setBpmData] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [timeRange, setTimeRange] = useState('daily');

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8, //customize the default page size
  });

  useEffect(() => {
    const fetchPatientsData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'patients'));
        const data = querySnapshot.docs.map((doc) => {
          const patient = doc.data();
          patient.birthday = patient.birthday.toDate();
          patient.birthday = patient.birthday.toLocaleDateString();
          return patient;
        });
        setPatientsData(data);
      } catch (error) {
        console.error('Error fetching patients data:', error);
      }
    };

    fetchPatientsData();
  }, []);

  const handleDateChange = event => {
    setSelectedDate(event.target.value);
};

const handleTimeRangeChange = range => {
    setTimeRange(range);
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
                                return '#eefa05';
                              } else if (value >= 41 && value <= 70) {
                                  return '#2afa05';
                              } else if (value >= 71 && value <= 90) {
                                  return '#fc0303';
                              } else {
                                  return '#0452ce';
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
                                color: avgBpm <= 40 ? '#eefa05' :
                                       avgBpm <= 70 ? '#2afa05' :
                                       avgBpm <= 90 ? '#fc0303' :
                                                      '#0452ce'
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
    const monthlyData = calculateMonthlyData();

    if (monthlyData.length > 0) {
        return (
            <Scatter
                style={{ padding: '10px 20px' }}
                data={{
                    datasets: [
                        {
                            label: 'Monthly Average BPM Data',
                            data: monthlyData.map(({ month, avgBpm }) => ({
                                x: moment(month, 'MM/YYYY').toDate(),
                                y: avgBpm,
                                color: avgBpm <= 40 ? '#eefa05' :
                                       avgBpm <= 70 ? '#2afa05' :
                                       avgBpm <= 90 ? '#fc0303' :
                                                      '#0452ce'
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
                                unit: 'month',
                            },
                            title: {
                                display: true,
                                text: 'Month',
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


const calculateMonthlyData = () => {
    const monthlyData = {};

    // Group BPM values by month
    Object.keys(bpmData).forEach(date => {
        const month = moment(date, 'MM/DD/YYYY').format('MM/YYYY');
        const bpmValues = Object.values(bpmData[date]);
        const totalBpm = bpmValues.reduce((acc, { bpmValue }) => acc + bpmValue, 0);
        const avgBpm = totalBpm / bpmValues.length;

        if (!monthlyData[month]) {
            monthlyData[month] = { totalBpm: 0, count: 0 };
        }

        monthlyData[month].totalBpm += avgBpm;
        monthlyData[month].count += 1;
    });


    const monthlyAverages = Object.keys(monthlyData).map(month => ({
        month,
        avgBpm: monthlyData[month].totalBpm / monthlyData[month].count
    }));

    return monthlyAverages;
};


  const handleApproveAndNotify = async () => {
    try {
      const patientDocRef = doc(db, 'patients', selectedPatient.original.id);
      await updateDoc(patientDocRef, {
        'schedules.notify': true,
        'schedules.scheduleApproved': true
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
    }

    router.reload()
  };

  const getLatestBPMValue = (bpm) => {
    let latestDate;
    let latestTime;
  
    for (const dateKey in bpm) {
      for (const timeKey in bpm[dateKey]) {
        if (!latestDate || new Date(dateKey + ' ' + timeKey) > new Date(latestDate + ' ' + latestTime)) {
          latestDate = dateKey;
          latestTime = timeKey;
        }
      }
    }
  
    if (latestDate !== undefined && latestTime !== undefined) {
      if (bpm[latestDate] && bpm[latestDate][latestTime]) {
        return bpm[latestDate][latestTime].bpmValue;
      }
    }

    return 'N/A';
  };
  

  const getLatestBPMDate = (bpm) => {
    const dates = Object.keys(bpm);
    dates.sort((a, b) => new Date(b) - new Date(a));
    return dates[0];
  };
  

  const columns = [
    { accessorKey: 'firstName', header: 'First Name', size: 150 },
    { accessorKey: 'lastName', header: 'Last Name', size: 150 },
    { accessorKey: 'email', header: 'Email', size: 200 },
    { accessorKey: 'age', header: 'Age', size: 100 },
    { accessorKey: 'birthday', header: 'Birthday', size: 170 },
    { accessorKey: 'gender', header: 'Gender', size: 100 },
  ];

  const handleRowClick = (row) => {
    setSelectedPatient(row);
    setIsModalOpen(true);

    const { bpm } = row.original;

    if (bpm) {
        const dates = Object.keys(bpm).sort((a, b) => new Date(a) - new Date(b));
        const patientBpmData = {};

        dates.forEach(date => {
            patientBpmData[date] = bpm[date];
        });

        setSelectedDate(dates[dates.length - 1]);
        setBpmData(patientBpmData);
        setAvailableDates(dates);
    } else {
        // Handle the case where BPM data doesn't exist
        setSelectedDate('');
        setBpmData({});
        setAvailableDates([]);
    }
};

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const table = useMaterialReactTable({
    columns,
    data: patientsData,
    enableDensityToggle: false,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      sx: {
        cursor: 'pointer',
      },
    }),
    muiTablePaperProps: {
      sx: {
        borderRadius: '16px',
        paddingLeft: '20px',
        paddingRight: '20px',
        border: '1px solid rgb(219, 219, 219)',
      },
    },
    initialState: { // REMOVE THIS IF YOU WAN TO SORT BY NEW PATIENT DATA, from here
      sorting: [
        {
          id: 'firstName', 
          desc: true,
        },
      ],
    }, // to here

    onPaginationChange: setPagination,
    state: { pagination }, 
  });

  let latestDate = null;
  let latestBpmAverage = 'N/A';

  if (selectedPatient && selectedPatient.original.bpmAverages) {
    const dates = Object.keys(selectedPatient.original.bpmAverages).sort((a, b) => new Date(b) - new Date(a));
    latestDate = dates[0];
    latestBpmAverage = selectedPatient.original.bpmAverages[latestDate];
  }

  return (
    <>
      <Head>
        <title>Doctor Dashboard</title>
        <meta
          name="description"
          content="A Computer Vision project that detects a person's Heart Rate Per Minute (BPM) for medical consultation data gathering"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>

      <div className={styles.dashboardLayout}>
        <div className={styles.sideBar}>
          <span>All Patient Information</span>
        </div>
        <div className={styles.tableContainer}>
          <MaterialReactTable table={table} />
        </div>
      </div>

      {isModalOpen && (
        <motion.div className={styles.modal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}>
          <div className={styles.modalBackground} onClick={handleCloseModal}></div>

            <div className={styles.modalContent}>

              <div className={styles.patientInfo}>
                <h5>Patient Information</h5>

                <p>Name</p>
                <span>{selectedPatient.original.firstName} {selectedPatient.original.lastName}</span>
                <p>Email</p>
                <span>{selectedPatient.original.email}</span>
                <p>Age</p>
                <span>{selectedPatient.original.age}</span>
                <p>Birthday</p>
                <span>{selectedPatient.original.birthday}</span>
                <p>Gender</p>
                <span>{selectedPatient.original.gender}</span>
              </div>

              <div className={styles.column2}>

                <div className={styles.bpm}>
                  <div className={styles.currentBpmCard}>
                    <h1>Current BPM</h1>
                      {selectedPatient.original.bpm !== undefined ? 
                        <div>
                          <p>{getLatestBPMValue(selectedPatient.original.bpm)}</p>
                          <p>
                            {getLatestBPMDate(selectedPatient.original.bpm)}</p>
                        </div>
                      : <p className={styles.noDataBpm}>N/A</p>}
                  </div>


                  <div className={styles.currentBpmCard}>
                    <h1>Average BPM</h1>
                      {selectedPatient.original.bpmAverages !== undefined ? 
                        <div>
                          <p style={{color : '#0452ce'}}>
                            {latestBpmAverage}
                          </p>
                          <p>
                            {latestDate}
                          </p>
                        </div>
                      : <p className={styles.noDataBpm}>N/A</p>}
                  </div>
                </div>

                {selectedPatient.original.schedules != undefined ? 
                (
                  <div className={styles.schedule}>
                    <h5>Requested Checkup Schedule</h5>

                    <div className={styles.schedDateTime}>
                      
                      <div className={styles.time}>
                        <p>Time</p>
                        <span>{selectedPatient.original.schedules.time}</span>
                      </div>

                      <div className={styles.date}>
                        <p>Date</p>
                        <span>{selectedPatient.original.schedules.date}</span>
                      </div>

                    </div>

                    <p>Message</p>
                    <span className={styles.message}>{selectedPatient.original.schedules.message}</span>

                    {selectedPatient.original.schedules != undefined && selectedPatient.original.bpm != undefined ?
                        <motion.button
                        onClick={handleApproveAndNotify}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={selectedPatient.original.schedules.scheduleApproved}
                        style={{backgroundColor: `${selectedPatient.original.schedules.scheduleApproved == true ? 'green' : null}`
                          , cursor: `${selectedPatient.original.schedules.scheduleApproved == true ? 'no-drop' : null}`}}
                      >{selectedPatient.original.schedules.scheduleApproved == true ? 'Approved' : 'Approve & Notify'}</motion.button>
                    :
                    <div className={styles.incomplete}><span>&#9888;</span> Incomplete Information for Checkup</div>
                    }
                  </div>
                )
                :

                <div className={styles.noCheckup}>
                  No Schedule for Checkup
                </div>

                }
              </div>
            </div>

            <div className={styles.graphContainer}>

                {selectedPatient.original.bpmAverages !== undefined ? 
                    <>
                      {getLatestBPMValue(selectedPatient.original.bpm) > 120 || getLatestBPMValue(selectedPatient.original.bpm) < 60 ? 
                        <div className={styles.warningContainer}>
                        <div className={styles.warning}>
                          <span>&#9888;</span>
                          <p>Patient Heart Rate is concerning.</p>
                        </div>
                        </div>
                      : null}
                    </>
                  : null}
                
                  <div className={styles.graph}>

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

                  </div>

            </div>

        </motion.div>
      )}
    </>
  );
};

export default DoctorDashboard;
