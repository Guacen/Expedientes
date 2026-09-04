import { useEffect, useState } from 'react';
import styles from './ProgressRing.module.css';

interface ProgressRingProps {
  /** 0 a 1 */
  porcentaje: number;
  tamano?: number;
  grosor?: number;
  mostrarEtiqueta?: boolean;
}

export default function ProgressRing({
  porcentaje,
  tamano = 64,
  grosor = 6,
  mostrarEtiqueta = true,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, porcentaje));
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;

  // El anillo arranca en 0 y anima hacia el valor real solo al montar.
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const offset = circunferencia * (1 - (montado ? clamped : 0));

  return (
    <div className={styles.contenedor} style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`}>
        <circle
          className={styles.pista}
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          strokeWidth={grosor}
          fill="none"
        />
        <circle
          className={styles.progreso}
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          strokeWidth={grosor}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
        />
      </svg>
      {mostrarEtiqueta && (
        <span className={styles.etiqueta} style={{ fontSize: tamano * 0.22 }}>
          {Math.round(clamped * 100)}%
        </span>
      )}
    </div>
  );
}
