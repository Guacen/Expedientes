import styles from './Stepper.module.css';

interface StepperProps {
  valor: number;
  max: number;
  min?: number;
  onChange: (valor: number) => void;
}

export default function Stepper({ valor, max, min = 0, onChange }: StepperProps) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.boton}
        onClick={() => onChange(Math.max(min, valor - 1))}
        disabled={valor <= min}
        aria-label="Restar"
      >
        −
      </button>
      <button
        type="button"
        className={styles.boton}
        onClick={() => onChange(Math.min(max, valor + 1))}
        disabled={valor >= max}
        aria-label="Sumar"
      >
        +
      </button>
    </div>
  );
}
