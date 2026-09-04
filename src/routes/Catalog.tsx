import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, actualizarJuegoDesdeCatalogo, importarPlantilla } from '../db';
import { CATALOGO, type EntradaCatalogo } from '../catalogo';
import { buscarJuegoCoincidente, calcularDiffActualizacion, type DiffActualizacion } from '../domain/catalogo';
import { DIFICULTADES } from '../domain/dificultades';
import type { Game } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import styles from './Catalog.module.css';

interface PendienteActualizar {
  entrada: EntradaCatalogo;
  juego: Game;
  diff: DiffActualizacion;
}

function desglosePorDificultad(entrada: EntradaCatalogo): Record<1 | 2 | 3, number> {
  const conteo: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  for (const trofeo of entrada.plantilla.trofeos) conteo[trofeo.dificultad]++;
  return conteo;
}

function hayCambios(diff: DiffActualizacion): boolean {
  return diff.nuevos.length > 0 || diff.cambiados.length > 0 || diff.eliminados.length > 0;
}

export default function Catalog() {
  const navigate = useNavigate();
  const juegos = useLiveQuery(() => db.games.toArray(), []);
  const [pendienteImportar, setPendienteImportar] = useState<EntradaCatalogo | null>(null);
  const [importando, setImportando] = useState(false);
  const [pendienteActualizar, setPendienteActualizar] = useState<PendienteActualizar | null>(null);
  const [actualizando, setActualizando] = useState(false);

  if (juegos === undefined) {
    return <div className={styles.pagina} />;
  }

  async function confirmarImportacion() {
    if (!pendienteImportar) return;
    setImportando(true);
    try {
      const juego = await importarPlantilla(pendienteImportar.plantilla);
      setPendienteImportar(null);
      navigate(`/juegos/${juego.id}`);
    } finally {
      setImportando(false);
    }
  }

  async function abrirActualizacion(entrada: EntradaCatalogo, juego: Game) {
    const trofeosDelJuego = (await db.trophies.where('gameId').equals(juego.id).toArray()).filter(
      (t) => t.dificultad !== 4,
    );
    const diff = calcularDiffActualizacion(entrada.plantilla, trofeosDelJuego);
    setPendienteActualizar({ entrada, juego, diff });
  }

  async function confirmarActualizacion() {
    if (!pendienteActualizar) return;
    setActualizando(true);
    try {
      await actualizarJuegoDesdeCatalogo(pendienteActualizar.juego.id, pendienteActualizar.entrada.plantilla);
      setPendienteActualizar(null);
    } finally {
      setActualizando(false);
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
            const juegoCoincidente = buscarJuegoCoincidente(entrada.plantilla, juegos);
            const conteo = desglosePorDificultad(entrada);
            const conGuias = entrada.plantilla.trofeos.some((t) => t.guia);
            return (
              <article key={entrada.archivo} className={styles.fila}>
                <div className={styles.info}>
                  <h2 className={styles.titulo}>{entrada.plantilla.juego.titulo}</h2>
                  <span className={styles.plataforma}>{entrada.plantilla.juego.plataforma}</span>
                  <div className={styles.desglose}>
                    <span className={styles.total}>{entrada.plantilla.trofeos.length} trofeos</span>
                    {conGuias && <span className={styles.chipGuia}>Con guías</span>}
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
                {juegoCoincidente ? (
                  <button
                    type="button"
                    className={styles.botonActualizar}
                    onClick={() => abrirActualizacion(entrada, juegoCoincidente)}
                  >
                    Actualizar desde el catálogo
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.boton}
                    onClick={() => setPendienteImportar(entrada)}
                  >
                    Importar
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        abierto={pendienteImportar !== null}
        titulo="Importar plantilla"
        mensaje={
          pendienteImportar
            ? `Se creará "${pendienteImportar.plantilla.juego.titulo}" (${pendienteImportar.plantilla.juego.plataforma}) con ${pendienteImportar.plantilla.trofeos.length} trofeos y su Expediente Cerrado.`
            : ''
        }
        textoConfirmar={importando ? 'Importando…' : 'Importar'}
        onConfirmar={confirmarImportacion}
        onCancelar={() => setPendienteImportar(null)}
      />

      <Modal
        abierto={pendienteActualizar !== null}
        onCerrar={() => setPendienteActualizar(null)}
        titulo={
          pendienteActualizar ? `Actualizar ${pendienteActualizar.entrada.plantilla.juego.titulo}` : undefined
        }
      >
        {pendienteActualizar && (
          <div className={styles.diff}>
            {!hayCambios(pendienteActualizar.diff) ? (
              <p className={styles.diffAlDia}>Ya está al día.</p>
            ) : (
              <>
                {pendienteActualizar.diff.nuevos.length > 0 && (
                  <section className={styles.diffSeccion}>
                    <h3 className={styles.diffTitulo}>
                      Nuevos ({pendienteActualizar.diff.nuevos.length})
                    </h3>
                    <ul className={styles.diffLista}>
                      {pendienteActualizar.diff.nuevos.map((t) => (
                        <li key={t.titulo}>{t.titulo}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {pendienteActualizar.diff.cambiados.length > 0 && (
                  <section className={styles.diffSeccion}>
                    <h3 className={styles.diffTitulo}>
                      Cambian ({pendienteActualizar.diff.cambiados.length})
                    </h3>
                    <ul className={styles.diffLista}>
                      {pendienteActualizar.diff.cambiados.map((cambio) => (
                        <li key={cambio.existente.id}>
                          {cambio.existente.titulo}
                          <span className={styles.diffCampos}> — {cambio.campos.join(', ')}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {pendienteActualizar.diff.eliminados.length > 0 && (
                  <section className={styles.diffSeccion}>
                    <h3 className={styles.diffTitulo}>
                      Ya no están ({pendienteActualizar.diff.eliminados.length})
                    </h3>
                    <ul className={styles.diffLista}>
                      {pendienteActualizar.diff.eliminados.map((t) => (
                        <li key={t.id}>{t.titulo}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}

            <div className={styles.diffAcciones}>
              <button
                type="button"
                className={styles.diffCancelar}
                onClick={() => setPendienteActualizar(null)}
              >
                Cancelar
              </button>
              {hayCambios(pendienteActualizar.diff) && (
                <button
                  type="button"
                  className={styles.diffConfirmar}
                  onClick={confirmarActualizacion}
                  disabled={actualizando}
                >
                  {actualizando ? 'Actualizando…' : 'Aplicar actualización'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
