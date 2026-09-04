import { type ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  exportarDatos,
  importarDatos,
  importarPlantilla,
  validarRespaldo,
  type RespaldoJSON,
} from '../db';
import { validarPlantilla } from '../domain/catalogo';
import type { PlantillaCatalogo } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './Settings.module.css';

function nombreArchivo(): string {
  const fecha = new Date().toISOString().slice(0, 10);
  return `expedientes-${fecha}.json`;
}

export default function Settings() {
  const navigate = useNavigate();
  const [pendiente, setPendiente] = useState<RespaldoJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);

  const [textoPlantilla, setTextoPlantilla] = useState('');
  const [plantillaPendiente, setPlantillaPendiente] = useState<PlantillaCatalogo | null>(null);
  const [errorPlantilla, setErrorPlantilla] = useState<string | null>(null);
  const [importandoPlantilla, setImportandoPlantilla] = useState(false);

  async function exportar() {
    setExportando(true);
    setError(null);
    setMensaje(null);
    try {
      const datos = await exportarDatos();
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombreArchivo();
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      setMensaje('Respaldo descargado.');
    } finally {
      setExportando(false);
    }
  }

  async function alSeleccionarArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    setError(null);
    setMensaje(null);
    try {
      const texto = await archivo.text();
      const json = JSON.parse(texto);
      const resultado = validarRespaldo(json);
      if (!resultado.valido) {
        setError(resultado.error);
        return;
      }
      setPendiente(resultado.datos);
    } catch {
      setError('El archivo no es un JSON válido.');
    }
  }

  async function confirmarImportacion() {
    if (!pendiente) return;
    setImportando(true);
    try {
      await importarDatos(pendiente);
      setMensaje(
        `Se importaron ${pendiente.games.length} juegos y ${pendiente.trophies.length} trofeos.`,
      );
    } finally {
      setImportando(false);
      setPendiente(null);
    }
  }

  function validarYPrepararPlantilla() {
    setErrorPlantilla(null);
    try {
      const json = JSON.parse(textoPlantilla);
      const resultado = validarPlantilla(json);
      if (!resultado.valida) {
        setErrorPlantilla(resultado.error);
        return;
      }
      setPlantillaPendiente(resultado.plantilla);
    } catch {
      setErrorPlantilla('Eso no es un JSON válido.');
    }
  }

  async function confirmarImportacionPlantilla() {
    if (!plantillaPendiente) return;
    setImportandoPlantilla(true);
    try {
      const juego = await importarPlantilla(plantillaPendiente);
      setPlantillaPendiente(null);
      setTextoPlantilla('');
      navigate(`/juegos/${juego.id}`);
    } finally {
      setImportandoPlantilla(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <h1>Ajustes</h1>
      </header>

      {mensaje && <p className={styles.mensaje}>{mensaje}</p>}
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>Exportar</h2>
        <p className={styles.descripcion}>
          Descarga un JSON con todos tus juegos y trofeos. En iPhone, guárdalo en Archivos o
          iCloud desde el diálogo de descarga de Safari.
        </p>
        <button type="button" className={styles.boton} onClick={exportar} disabled={exportando}>
          {exportando ? 'Exportando…' : 'Exportar respaldo'}
        </button>
      </section>

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>Importar</h2>
        <p className={styles.descripcion}>
          Elige un archivo de respaldo. Antes de aplicarlo te muestro un resumen y pido
          confirmación: reemplaza todos los datos actuales.
        </p>
        <label className={styles.boton}>
          Elegir archivo
          <input type="file" accept="application/json" hidden onChange={alSeleccionarArchivo} />
        </label>
      </section>

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>Importar plantilla desde texto</h2>
        <p className={styles.descripcion}>
          Pega el JSON de una plantilla del catálogo. Se valida, te muestro un resumen y
          creo el juego con todos sus trofeos — sin necesidad de desplegar nada nuevo.
        </p>
        <textarea
          className={styles.textarea}
          rows={6}
          placeholder='{ "version": 1, "juego": { ... }, "trofeos": [ ... ] }'
          value={textoPlantilla}
          onChange={(evento) => {
            setTextoPlantilla(evento.target.value);
            setErrorPlantilla(null);
          }}
        />
        {errorPlantilla && <p className={styles.error}>{errorPlantilla}</p>}
        <button
          type="button"
          className={styles.boton}
          onClick={validarYPrepararPlantilla}
          disabled={!textoPlantilla.trim()}
        >
          Validar e importar
        </button>
      </section>

      <ConfirmDialog
        abierto={pendiente !== null}
        titulo="Confirmar importación"
        mensaje={
          pendiente
            ? `Vas a reemplazar todos los datos actuales por ${pendiente.games.length} juegos y ${pendiente.trophies.length} trofeos de este archivo. Esta acción no se puede deshacer.`
            : ''
        }
        textoConfirmar={importando ? 'Importando…' : 'Reemplazar datos'}
        peligroso
        onConfirmar={confirmarImportacion}
        onCancelar={() => setPendiente(null)}
      />

      <ConfirmDialog
        abierto={plantillaPendiente !== null}
        titulo="Importar plantilla"
        mensaje={
          plantillaPendiente
            ? `Se creará "${plantillaPendiente.juego.titulo}" (${plantillaPendiente.juego.plataforma}) con ${plantillaPendiente.trofeos.length} trofeos y su Expediente Cerrado.`
            : ''
        }
        textoConfirmar={importandoPlantilla ? 'Importando…' : 'Importar'}
        onConfirmar={confirmarImportacionPlantilla}
        onCancelar={() => setPlantillaPendiente(null)}
      />
    </div>
  );
}
