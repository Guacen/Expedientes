import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      <NavLink
        to="/"
        end
        className={({ isActive }) => (isActive ? `${styles.item} ${styles.activo}` : styles.item)}
      >
        Biblioteca
      </NavLink>
      <NavLink
        to="/ajustes"
        className={({ isActive }) => (isActive ? `${styles.item} ${styles.activo}` : styles.item)}
      >
        Ajustes
      </NavLink>
    </nav>
  );
}
