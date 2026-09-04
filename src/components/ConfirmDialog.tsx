import Modal from './Modal';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligroso?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligroso = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  return (
    <Modal abierto={abierto} onCerrar={onCancelar} titulo={titulo}>
      <p className={styles.mensaje}>{mensaje}</p>
      <div className={styles.acciones}>
        <button type="button" className={styles.cancelar} onClick={onCancelar}>
          {textoCancelar}
        </button>
        <button
          type="button"
          className={peligroso ? styles.confirmarPeligroso : styles.confirmar}
          onClick={onConfirmar}
        >
          {textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}
