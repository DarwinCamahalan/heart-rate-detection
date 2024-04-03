import Link from 'next/link';
import styles from './navBar.module.scss'
import Image from 'next/image';
import logo from '../public/logo.png'
const Navbar = () => {
  return (
    <nav className={styles.navMainContainer}>
      <ul>
        <li>
          <Link className={styles.homepageLink} href="/">
            <Image className={styles.logoImage} src={logo} alt='Medical Consultation Logo'/>
            Medical Consultation
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
