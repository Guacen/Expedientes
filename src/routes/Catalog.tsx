import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, importarPlantilla } from '../db';
import { CATALOGO, type EntradaCatalogo } from '../catalogo';
import { yaEnBiblioteca } from '../domain/catalogo';
import { DIFICULTADES } from '../domain/dificultades';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './Catalog.module.css';

function desglosePorDificultad(entrada: EntradaCatalogo): Record<1 | 2 | 3, number> {
  const conteo: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  for (const trofeo of entrada.plantilla.trofeos) conteo[trofeo.dificultad]++;
  return conteo;
}

export default function Catalog() {
  const navigate = useNavigate();
  const juegos = useLiveQuery(() => db.games.toArray(), []);
  const [pendiente, setPendiente] = useState<EntradaCatalogo | null>(null);
  const [importando, setImportando] = useState(false);

  if (juegos === undefined) {
    return <div className={styles.pagina} />;
  }

  async function confirmarImportacion() {
    if (!pendiente) return;
    setImportando(true);
    try {
      const juego = await importarPlantilla(pendiente.plantilla);
      setPendiente(null);
      navigate(`/juegos/${juego.id}`);
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <h1>Catálogo</h1>
      </header>

      {CATALOGO.length === 0 ? (
        <p className={styles.vacio}>Todavía no hay plantillas en el catálogo.</p>
      ) : (
        <div className={styles.lista}>
          {CATALOGO.map((entrada) => {
            const agregado = yaEnBiblioteca(entrada.plantilla, juegos);
            const conteo = desglosePorDificultad(entrada);
            return (
              <article key={entrada.archivo} className={styles.fila}>
                <div className={styles.info}>
                  <h2 className={styles.titulo}>{entrada.plantilla.juego.titulo}</h2>
                  <span className={styles.plataforma}>{entrada.plantilla.juego.plataforma}</span>
                  <div className={styles.desglose}>
                    <span className={styles.total}>{entrada.plantilla.trofeos.length} trofeos</span>
                    {([1, 2, 3] as const)
                      .filter((nivel) => conteo[nivel] > 0)
                      .map((nivel) => (
                        <span
                          key={nivel}
                          className={styles.chip}
                          style={{
                            color: DIFICULTADES[nivel].color,
                            borderColor: DIFICULTADES[nivel].color,
                          }}
                        >
                          {DIFICULTADES[nivel].nombre} · {conteo[nivel]}
                        </span>
                      ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.boton}
                  disabled={agregado}
                  onClick={() => setPendiente(entrada)}
                >
                  {agregado ? 'Ya en tu biblioteca' : 'Importar'}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        abierto={pendiente !== null}
        titulo="Importar plantilla"
        mensaje={
          pendiente
            ? `Se creará "${pendiente.plantilla.juego.titulo}" (${pendiente.plantilla.juego.plataforma}) con ${pendiente.plantilla.trofeos.length} trofeos y su Expediente Cerrado.`
            : ''
        }
        textoConfirmar={importando ? 'Importando…' : 'Importar'}
        onConfirmar={confirmarImportacion}
        onCancelar={() => setPendiente(null)}
      />
    </div>
  );
}
