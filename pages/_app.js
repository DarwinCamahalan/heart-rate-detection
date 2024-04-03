// pages/_app.js

import Navbar from '../components/NavBar';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <Navbar />
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
