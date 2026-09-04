import { Link } from 'react-router-dom';
import type { Game } from '../types';
import ProgressRing from './ProgressRing';
import styles from './GameCard.module.css';

interface GameCardProps {
  juego: Game;
  porcentaje: number;
}

export default function GameCard({ juego, porcentaje }: GameCardProps) {
  return (
    <Link to={`/juegos/${juego.id}`} className={styles.card}>
      <div className={styles.portada}>
        {juego.portadaUrl ? (
          <img src={juego.portadaUrl} alt="" loading="lazy" />
        ) : (
          <span className={styles.sinPortada} aria-hidden="true">
            {juego.titulo.charAt(0).toUpperCase() || '?'}
          </span>
        )}
      </div>
      <div className={styles.pie}>
        <div className={styles.info}>
          <h3 className={styles.titulo}>{juego.titulo}</h3>
          <span className={styles.plataforma}>{juego.plataforma}</span>
        </div>
        <ProgressRing porcentaje={porcentaje} tamano={40} grosor={4} />
      </div>
    </Link>
  );
}
