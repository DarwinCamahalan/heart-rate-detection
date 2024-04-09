import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/doctorDashboard.module.scss';
import {motion} from 'framer-motion'
import { useRouter } from 'next/router';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const DoctorDashboard = () => {
  const [patientsData, setPatientsData] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter()

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
  
    // Loop through dates
    for (const dateKey in bpm) {
      // Loop through times within each date
      for (const timeKey in bpm[dateKey]) {
        // Update latestDate and latestTime if it's the latest
        if (!latestDate || new Date(dateKey + ' ' + timeKey) > new Date(latestDate + ' ' + latestTime)) {
          latestDate = dateKey;
          latestTime = timeKey;
        }
      }
    }
  
    // Check if latestDate and latestTime are defined
    if (latestDate !== undefined && latestTime !== undefined) {
      // Check if bpm[latestDate] and bpm[latestDate][latestTime] are defined
      if (bpm[latestDate] && bpm[latestDate][latestTime]) {
        return bpm[latestDate][latestTime].bpmValue;
      }
    }
  
    // Return a default value or handle the error as per your application's requirements
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
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const table = useMaterialReactTable({
    columns,
    data: patientsData,
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
        height: '100%',
        border: '1px solid rgb(219, 219, 219)'
      },
    },
  });

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
        <div className={styles.sideBar}>test</div>
        <div className={styles.tableContainer}>
          <MaterialReactTable table={table} />
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalBackground} onClick={handleCloseModal}></div>

            <div className={styles.modalContent}>

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
                            {Object.values(selectedPatient.original.bpmAverages).sort((a, b) => new Date(b) - new Date(a))[0]}
                          </p>
                          <p>
                            {Object.keys(selectedPatient.original.bpmAverages).sort((a, b) => new Date(b) - new Date(a))[0]}
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
                    <div className={styles.incomplete}>Incomplete Information for Checkup</div>
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

        </div>
      )}
    </>
  );
};

export default DoctorDashboard;
