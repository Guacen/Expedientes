import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, crearTrofeo, actualizarTrofeo, type DatosNuevoTrofeo } from '../db';
import type { TipoTrofeo } from '../types';
import { DIFICULTADES } from '../domain/dificultades';
import styles from './TrophyForm.module.css';

interface FormularioTrofeo {
  titulo: string;
  descripcion: string;
  guia: string;
  dificultad: 1 | 2 | 3;
  tipo: TipoTrofeo;
  meta: string;
  oculto: boolean;
}

const VACIO: FormularioTrofeo = {
  titulo: '',
  descripcion: '',
  guia: '',
  dificultad: 1,
  tipo: 'binario',
  meta: '1',
  oculto: false,
};

export default function TrophyForm() {
  const { gameId, trophyId } = useParams<{ gameId: string; trophyId?: string }>();
  const navigate = useNavigate();
  const esEdicion = Boolean(trophyId);

  const trofeoExistente = useLiveQuery(
    () => (trophyId ? db.trophies.get(trophyId) : undefined),
    [trophyId],
  );

  const [form, setForm] = useState<FormularioTrofeo>(VACIO);
  const [cargado, setCargado] = useState(!esEdicion);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (esEdicion && trofeoExistente && !cargado) {
      setForm({
        titulo: trofeoExistente.titulo,
        descripcion: trofeoExistente.descripcion ?? '',
        guia: trofeoExistente.guia ?? '',
        dificultad: trofeoExistente.dificultad === 4 ? 1 : trofeoExistente.dificultad,
        tipo: trofeoExistente.tipo,
        meta: String(trofeoExistente.meta),
        oculto: trofeoExistente.oculto,
      });
      setCargado(true);
    }
  }, [esEdicion, trofeoExistente, cargado]);

  function actualizarCampo<K extends keyof FormularioTrofeo>(campo: K, valor: FormularioTrofeo[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!form.titulo.trim() || !gameId) return;
    setEnviando(true);
    try {
      const meta = form.tipo === 'binario' ? 1 : Math.max(1, Number(form.meta) || 1);
      if (esEdicion && trophyId) {
        await actualizarTrofeo(trophyId, {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim() || undefined,
          guia: form.guia.trim() || undefined,
          dificultad: form.dificultad,
          tipo: form.tipo,
          meta,
          oculto: form.oculto,
        });
      } else {
        const orden = await db.trophies
          .where('gameId')
          .equals(gameId)
          .and((t) => t.dificultad === form.dificultad)
          .count();
        const datos: DatosNuevoTrofeo = {
          gameId,
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim() || undefined,
          guia: form.guia.trim() || undefined,
          dificultad: form.dificultad,
          tipo: form.tipo,
          meta,
          oculto: form.oculto,
          orden,
        };
        await crearTrofeo(datos);
      }
      navigate(`/juegos/${gameId}`);
    } finally {
      setEnviando(false);
    }
  }

  if (!gameId) return null;

  if (esEdicion && !cargado) {
    return <div className={styles.pagina} />;
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <h1>{esEdicion ? 'Editar trofeo' : 'Nuevo trofeo'}</h1>
      </header>

      <form className={styles.formulario} onSubmit={alEnviar}>
        <label className={styles.campo}>
          <span>Título</span>
          <input
            type="text"
            required
            value={form.titulo}
            onChange={(evento) => actualizarCampo('titulo', evento.target.value)}
          />
        </label>

        <label className={styles.campo}>
          <span>Descripción</span>
          <textarea
            rows={3}
            value={form.descripcion}
            onChange={(evento) => actualizarCampo('descripcion', evento.target.value)}
          />
        </label>

        <label className={styles.campo}>
          <span>Guía (opcional) — cuándo marcarlo exactamente</span>
          <textarea
            rows={3}
            value={form.guia}
            onChange={(evento) => actualizarCampo('guia', evento.target.value)}
          />
        </label>

        <label className={styles.campo}>
          <span>Dificultad</span>
          <select
            value={form.dificultad}
            onChange={(evento) =>
              actualizarCampo('dificultad', Number(evento.target.value) as 1 | 2 | 3)
            }
          >
            {([1, 2, 3] as const).map((n) => (
              <option key={n} value={n}>
                {DIFICULTADES[n].nombre} — {DIFICULTADES[n].puntos} pts
              </option>
            ))}
          </select>
        </label>

        <label className={styles.campo}>
          <span>Tipo</span>
          <select
            value={form.tipo}
            onChange={(evento) => actualizarCampo('tipo', evento.target.value as TipoTrofeo)}
          >
            <option value="binario">Binario (se marca de una vez)</option>
            <option value="contador">Contador (progreso hasta una meta)</option>
          </select>
        </label>

        {form.tipo === 'contador' && (
          <label className={styles.campo}>
            <span>Meta</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={form.meta}
              onChange={(evento) => actualizarCampo('meta', evento.target.value)}
            />
          </label>
        )}

        <label className={styles.campoOculto}>
          <input
            type="checkbox"
            checked={form.oculto}
            onChange={(evento) => actualizarCampo('oculto', evento.target.checked)}
          />
          <span>Oculto (título y descripción se esconden hasta desbloquearse)</span>
        </label>

        <div className={styles.acciones}>
          <Link to={`/juegos/${gameId}`} className={styles.cancelar}>
            Cancelar
          </Link>
          <button type="submit" className={styles.guardar} disabled={enviando}>
            {esEdicion ? 'Guardar cambios' : 'Crear trofeo'}
          </button>
        </div>
      </form>
    </div>
  );
}
