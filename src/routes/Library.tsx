import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { EstadoJuego } from '../types';
import { calcularPorcentajeJuego } from '../domain/progreso';
import GameCard from '../components/GameCard';
import styles from './Library.module.css';

const FILTROS: { valor: EstadoJuego | 'todos'; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'jugando', etiqueta: 'Jugando' },
  { valor: 'backlog', etiqueta: 'Backlog' },
  { valor: 'completado', etiqueta: 'Completados' },
  { valor: 'abandonado', etiqueta: 'Abandonados' },
];

export default function Library() {
  const [filtro, setFiltro] = useState<EstadoJuego | 'todos'>('todos');
  const juegos = useLiveQuery(() => db.games.toArray(), []);
  const trofeos = useLiveQuery(() => db.trophies.toArray(), []);

  if (juegos === undefined || trofeos === undefined) {
    return <div className={styles.pagina} />;
  }

  const juegosFiltrados = filtro === 'todos' ? juegos : juegos.filter((j) => j.estado === filtro);

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <h1>Biblioteca</h1>
        <Link to="/juegos/nuevo" className={styles.nuevo}>
          + Juego
        </Link>
      </header>

      {juegos.length > 0 && (
        <div className={styles.filtros}>
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              className={
                filtro === f.valor ? `${styles.filtro} ${styles.filtroActivo}` : styles.filtro
              }
              onClick={() => setFiltro(f.valor)}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      )}

      {juegos.length === 0 ? (
        <div className={styles.vacio}>
          <h2 className={styles.vacioTitulo}>Todavía no hay expedientes abiertos</h2>
          <p className={styles.vacioTexto}>
            Añade tu primer juego y su Expediente Cerrado se abrirá solo.
          </p>
          <Link to="/juegos/nuevo" className={styles.vacioBoton}>
            Añadir el primer juego
          </Link>
        </div>
      ) : juegosFiltrados.length === 0 ? (
        <p className={styles.sinResultados}>No hay juegos con este filtro.</p>
      ) : (
        <div className={styles.grid}>
          {juegosFiltrados.map((juego) => (
            <GameCard
              key={juego.id}
              juego={juego}
              porcentaje={calcularPorcentajeJuego(trofeos.filter((t) => t.gameId === juego.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
