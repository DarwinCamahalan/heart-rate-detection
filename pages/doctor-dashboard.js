import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/doctorDashboard.module.scss';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const DoctorDashboard = () => {
  const [patientsData, setPatientsData] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const columns = [
    { accessorKey: 'firstName', header: 'First Name', size: 150 },
    { accessorKey: 'lastName', header: 'Last Name', size: 150 },
    { accessorKey: 'email', header: 'Email', size: 200 },
    { accessorKey: 'age', header: 'Age', size: 100 },
    { accessorKey: 'birthday', header: 'Birthday', size: 170 },
    { accessorKey: 'gender', header: 'Gender', size: 100 },
    // Add more columns as needed
  ];
  
  const handleRowClick = (row) => {
    console.log('Clicked patient:', row);
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
      onClick: (event) => handleRowClick(event, row),
      sx: {
        cursor: 'pointer',
      },
    }),
    muiTablePaperProps: {
      sx: {
        borderRadius: '16px',
        paddingLeft: '20px',
        paddingRight: '20px',
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

      <div className={styles.mainContainer}>
        <MaterialReactTable table={table} />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Selected Patient:</h2>
            <p>{selectedPatient && `${selectedPatient.firstName} ${selectedPatient.lastName}`}</p>

            <button onClick={handleCloseModal}>Close Modal</button>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorDashboard;
