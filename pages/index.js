import { motion } from "framer-motion"
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/homePage.module.scss'

export default function Home() {

  return (
    <>
      <Head>
        <title>Medical Consultation</title>
        <meta name="description" content="A Computer Vision project that detects a person's Heart Rate Per Minute (BPM) for medical consultation data gathering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>

      <motion.div className={styles.mainContainer}
          initial={{ opacity: 0}}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9 }}>
        <div className={styles.banner}>  

            <h1>Medical Consultation Made Online.</h1>

            <p>An online medical consultation website that uses Artificial Intelligence as a primary step to gather information about the patient condition and asses by a professional doctor.</p>
          
            <div className={styles.buttons}>
              <Link className={styles.patientBtn} href="/login/patient">Login As Patient</Link>
              <Link className={styles.doctorBtn} href="/login/doctor">Login as Doctor</Link>
            </div>

        </div>

        <div className={styles.imageContainer}> 
        </div>

      </motion.div>
    </>
  );
}
