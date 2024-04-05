import styles from '../styles/doctorDashboard.module.scss'
import Head from 'next/head';

const DoctorDashboard = () => {
  return (
    <>
    <Head>
      <title>Doctor Dashboard</title>
      <meta name="description" content="A Computer Vision project that detects a person's Heart Rate Per Minute (BPM) for medical consultation data gathering" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" type="image/png" href="/favicon.png" />
    </Head>

    <div className={styles.mainContainer}>
        <h1>Welcome Doctor!</h1>
    </div>
    </>
  );
};

export default DoctorDashboard;
