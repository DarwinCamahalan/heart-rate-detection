import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Medical Consultation</title>
        <meta name="description" content="A Computer Vision project that detects a person's Heart Rate Per Minute (BPM) for medical consultation data gathering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/Icon.ico" />
      </Head>
      <div>
        <h1>Welcome to Medical Consultation</h1>
        <Link href="/login/patient"><button>Login as Patient</button></Link>
        <Link href="/login/doctor"><button>Login as Doctor</button></Link>
      </div>
    </>
  );
}
