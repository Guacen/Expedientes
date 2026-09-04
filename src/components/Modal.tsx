import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: ReactNode;
}

export default function Modal({ abierto, onCerrar, titulo, children }: ModalProps) {
  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onCerrar}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
      >
        {titulo && <h2 className={styles.titulo}>{titulo}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  );
}
