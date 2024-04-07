import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { motion } from "framer-motion"
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import styles from './records.module.scss'
import Cookies from 'js-cookie';
import moment from 'moment';

const BpmRecords = ({ showTable, setShowTable }) => {
  const [bpmData, setBpmData] = useState([]);
  const userEmail = Cookies.get('userEmail');

  useEffect(() => {
    const fetchBpmData = async () => {
      try {
        const patientCollectionRef = collection(db, 'patients');
        const q = query(patientCollectionRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => doc.data().bpm);
        setBpmData(data);
      } catch (error) {
        console.error('Error fetching BPM data:', error);
      }
    };

    if (userEmail) {
      fetchBpmData();
    }
    
  }, [userEmail]);

  const columns = useMemo(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      size: 150,
    },
    {
      accessorKey: 'time',
      header: 'Time',
      size: 150,
    },
    {
      accessorKey: 'bpmValue',
      header: 'Heart Rate',
      size: 150,
    },
  ], []);

  // Map and format data to match the structure expected by Material React Table
  const formattedData = useMemo(() => {
    return bpmData.flatMap(dateData =>
      dateData ? Object.entries(dateData).flatMap(([date, timeData]) =>
        timeData ? Object.entries(timeData).map(([time, bpmRecord]) => ({
          date: moment(date, 'M/D/YYYY').format('MMMM D, YYYY'),
          time: moment(time, 'h:mm:ss A').format('h:mm A'),
          bpmValue: bpmRecord.bpmValue,
        })) : []
      ) : []
    );
  }, [bpmData]);
  

  // Create the table instance
  const table = useMaterialReactTable({
    columns,
    data: formattedData,
    initialState: { density: 'compact' },
    enableDensityToggle: false,
    muiTablePaperProps: {
      sx: {
        borderRadius: '16px',
        paddingLeft: '20px',
        paddingRight: '20px'
      },
    },
    muiPaginationProps: {
      rowsPerPageOptions: [5, 10],
    },
  });

  // Function to hide the table
  const hideTable = () => {
    setShowTable(false);
  };

  return (
    <>
      {showTable ? (
        <motion.div
          className={styles.mainContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}>

         <div className={styles.tableClose} onClick={hideTable}></div>

          <div className={styles.tableContainer}>
            <MaterialReactTable table={table} />
          </div>

        </motion.div>
      ) : null}
    </>
  );
};

export default BpmRecords;
