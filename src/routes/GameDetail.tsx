import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, alternarTrofeoBinario, establecerValorTrofeo, borrarTrofeo, borrarJuego } from '../db';
import { calcularPorcentajeJuego, estaDesbloqueado } from '../domain/progreso';
import { DIFICULTADES } from '../domain/dificultades';
import TrophyRow from '../components/TrophyRow';
import ConfirmDialog from '../components/ConfirmDialog';
import ProgressRing from '../components/ProgressRing';
import type { Trophy } from '../types';
import styles from './GameDetail.module.css';

const ORDEN_DIFICULTADES = [1, 2, 3, 4] as const;

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [confirmarBorrarJuego, setConfirmarBorrarJuego] = useState(false);
  const [trofeoABorrar, setTrofeoABorrar] = useState<Trophy | null>(null);

  const juego = useLiveQuery(() => (gameId ? db.games.get(gameId) : undefined), [gameId]);
  const trofeos = useLiveQuery(
    () => (gameId ? db.trophies.where('gameId').equals(gameId).toArray() : []),
    [gameId],
  );

  if (juego === undefined || trofeos === undefined) {
    return <div className={styles.pagina} />;
  }

  if (!juego) {
    return (
      <div className={styles.pagina}>
        <p className={styles.sinTrofeos}>Este expediente ya no existe.</p>
        <Link to="/" className={styles.boton}>
          Volver a la biblioteca
        </Link>
      </div>
    );
  }

  const porcentaje = calcularPorcentajeJuego(trofeos);
  const desbloqueados = trofeos.filter((t) => estaDesbloqueado(t)).length;

  const grupos = ORDEN_DIFICULTADES.map((nivel) => ({
    nivel,
    trofeos: trofeos.filter((t) => t.dificultad === nivel).sort((a, b) => a.orden - b.orden),
  })).filter((g) => g.trofeos.length > 0);

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <div className={styles.portada}>
          {juego.portadaUrl ? (
            <img src={juego.portadaUrl} alt="" />
          ) : (
            <span aria-hidden="true">{juego.titulo.charAt(0).toUpperCase() || '?'}</span>
          )}
        </div>
        <div className={styles.datos}>
          <h1 className={styles.titulo}>{juego.titulo}</h1>
          <span className={styles.plataforma}>{juego.plataforma}</span>
          <span className={styles.conteo}>
            {desbloqueados} / {trofeos.length} trofeos
          </span>
          <div className={styles.acciones}>
            <Link to={`/juegos/${juego.id}/editar`} className={styles.boton}>
              Editar
            </Link>
            <button
              type="button"
              className={styles.botonPeligro}
              onClick={() => setConfirmarBorrarJuego(true)}
            >
              Borrar
            </button>
          </div>
        </div>
        <ProgressRing porcentaje={porcentaje} tamano={72} grosor={6} />
      </header>

      <div className={styles.barraTrofeos}>
        <h2 className={styles.subtitulo}>Trofeos</h2>
        <Link to={`/juegos/${juego.id}/trofeos/nuevo`} className={styles.nuevoTrofeo}>
          + Trofeo
        </Link>
      </div>

      {grupos.length === 0 ? (
        <p className={styles.sinTrofeos}>Este expediente todavía no tiene trofeos.</p>
      ) : (
        grupos.map((grupo) => (
          <section key={grupo.nivel} className={styles.grupo}>
            <h3 className={styles.grupoTitulo} style={{ color: DIFICULTADES[grupo.nivel].color }}>
              {DIFICULTADES[grupo.nivel].nombre}
            </h3>
            <div className={styles.trofeos}>
              {grupo.trofeos.map((trofeo) => (
                <TrophyRow
                  key={trofeo.id}
                  trofeo={trofeo}
                  onAlternar={
                    trofeo.tipo === 'binario' ? () => alternarTrofeoBinario(trofeo.id) : undefined
                  }
                  onCambiarValor={
                    trofeo.tipo === 'contador' ? (v) => establecerValorTrofeo(trofeo.id, v) : undefined
                  }
                  onEditar={
                    trofeo.dificultad === 4
                      ? undefined
                      : () => navigate(`/juegos/${juego.id}/trofeos/${trofeo.id}/editar`)
                  }
                  onBorrar={trofeo.dificultad === 4 ? undefined : () => setTrofeoABorrar(trofeo)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <ConfirmDialog
        abierto={confirmarBorrarJuego}
        titulo="Borrar juego"
        mensaje={`Se borrará "${juego.titulo}" y todos sus trofeos. Esta acción no se puede deshacer.`}
        peligroso
        textoConfirmar="Borrar juego"
        onConfirmar={async () => {
          await borrarJuego(juego.id);
          navigate('/');
        }}
        onCancelar={() => setConfirmarBorrarJuego(false)}
      />

      <ConfirmDialog
        abierto={trofeoABorrar !== null}
        titulo="Borrar trofeo"
        mensaje={trofeoABorrar ? `Se borrará "${trofeoABorrar.titulo}".` : ''}
        peligroso
        textoConfirmar="Borrar trofeo"
        onConfirmar={async () => {
          if (trofeoABorrar) await borrarTrofeo(trofeoABorrar.id);
          setTrofeoABorrar(null);
        }}
        onCancelar={() => setTrofeoABorrar(null)}
      />
    </div>
  );
}
