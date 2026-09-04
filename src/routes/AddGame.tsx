import { Link } from 'react-router-dom';
import styles from './AddGame.module.css';

export default function AddGame() {
  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <h1>Añadir juego</h1>
      </header>

      <div className={styles.opciones}>
        <Link to="/catalogo" className={styles.primaria}>
          <span className={styles.opcionTitulo}>Elegir del catálogo</span>
          <span className={styles.opcionTexto}>
            Plantillas ya redactadas: arman el juego y todos sus trofeos de una vez.
          </span>
        </Link>
        <Link to="/juegos/nuevo/en-blanco" className={styles.secundaria}>
          <span className={styles.opcionTitulo}>Crear en blanco</span>
          <span className={styles.opcionTexto}>Escribe tú el juego y sus trofeos desde cero.</span>
        </Link>
      </div>
    </div>
  );
}
