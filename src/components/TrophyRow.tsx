import { useState } from 'react';
import type { Trophy } from '../types';
import { estaDesbloqueado } from '../domain/progreso';
import { DIFICULTADES } from '../domain/dificultades';
import Stepper from './Stepper';
import styles from './TrophyRow.module.css';

interface TrophyRowProps {
  trofeo: Trophy;
  onAlternar?: () => void;
  onCambiarValor?: (valor: number) => void;
  onEditar?: () => void;
  onBorrar?: () => void;
}

export default function TrophyRow({
  trofeo,
  onAlternar,
  onCambiarValor,
  onEditar,
  onBorrar,
}: TrophyRowProps) {
  const [guiaAbierta, setGuiaAbierta] = useState(false);
  const desbloqueado = estaDesbloqueado(trofeo);
  const esExpediente = trofeo.dificultad === 4;
  const oculto = trofeo.oculto && !desbloqueado;
  const info = DIFICULTADES[trofeo.dificultad];
  const colorBorde = esExpediente ? 'var(--sangre)' : info.color;

  return (
    <article
      className={`${styles.fila} ${desbloqueado ? styles.desbloqueado : ''}`}
      style={{ borderLeftColor: colorBorde }}
    >
      <div className={styles.cuerpo}>
        <span className={styles.chip} style={{ color: info.color, borderColor: info.color }}>
          {info.nombre} · {info.puntos}
        </span>
        <h4 className={styles.titulo}>{oculto ? '???' : trofeo.titulo}</h4>
        {!oculto && trofeo.descripcion && <p className={styles.descripcion}>{trofeo.descripcion}</p>}
        {!oculto && trofeo.guia && (
          <div className={styles.guiaBloque}>
            <button
              type="button"
              className={styles.guiaToggle}
              aria-expanded={guiaAbierta}
              onClick={() => setGuiaAbierta((v) => !v)}
            >
              {guiaAbierta ? 'Ocultar guía' : 'Ver guía'}
            </button>
            {guiaAbierta && (
              <div className={styles.guia}>
                <span className={styles.guiaEtiqueta}>Guía</span>
                <p className={styles.guiaTexto}>{trofeo.guia}</p>
              </div>
            )}
          </div>
        )}
        {!esExpediente && trofeo.tipo === 'contador' && (
          <p className={styles.contadorTexto}>
            {trofeo.valorActual} / {trofeo.meta}
          </p>
        )}
      </div>

      <div className={styles.controles}>
        {esExpediente ? (
          <span className={styles.selloExpediente}>{desbloqueado ? 'Cerrado' : 'Abierto'}</span>
        ) : trofeo.tipo === 'binario' ? (
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={desbloqueado}
            onClick={onAlternar}
          >
            {desbloqueado ? 'Cumplido' : 'Marcar'}
          </button>
        ) : (
          <div className={styles.contador}>
            <Stepper
              valor={trofeo.valorActual}
              max={trofeo.meta}
              onChange={(v) => onCambiarValor?.(v)}
            />
            <input
              type="number"
              inputMode="numeric"
              className={styles.input}
              min={0}
              max={trofeo.meta}
              value={trofeo.valorActual}
              onChange={(evento) => {
                const v = Number(evento.target.value);
                if (!Number.isNaN(v)) onCambiarValor?.(Math.min(trofeo.meta, Math.max(0, v)));
              }}
            />
          </div>
        )}

        {!esExpediente && (onEditar || onBorrar) && (
          <div className={styles.acciones}>
            {onEditar && (
              <button type="button" className={styles.accionMenor} onClick={onEditar}>
                Editar
              </button>
            )}
            {onBorrar && (
              <button type="button" className={styles.accionMenor} onClick={onBorrar}>
                Borrar
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
