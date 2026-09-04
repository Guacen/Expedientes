import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, crearJuego, actualizarJuego, type DatosNuevoJuego } from '../db';
import type { EstadoJuego, Plataforma } from '../types';
import styles from './GameForm.module.css';

const PLATAFORMAS: Plataforma[] = [
  'Switch',
  'Switch 2',
  '3DS',
  'Wii U',
  'Wii',
  'GameCube',
  'N64',
  'SNES',
  'NES',
  'Game Boy',
  'DS',
  'Otra',
];

const ESTADOS: { valor: EstadoJuego; etiqueta: string }[] = [
  { valor: 'backlog', etiqueta: 'Backlog' },
  { valor: 'jugando', etiqueta: 'Jugando' },
  { valor: 'completado', etiqueta: 'Completado' },
  { valor: 'abandonado', etiqueta: 'Abandonado' },
];

interface FormularioJuego {
  titulo: string;
  plataforma: Plataforma;
  portadaUrl: string;
  estado: EstadoJuego;
  fechaInicio: string;
  fechaFin: string;
  horas: string;
  notas: string;
}

const VACIO: FormularioJuego = {
  titulo: '',
  plataforma: 'Switch',
  portadaUrl: '',
  estado: 'backlog',
  fechaInicio: '',
  fechaFin: '',
  horas: '0',
  notas: '',
};

export default function GameForm() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const esEdicion = Boolean(gameId);

  const juegoExistente = useLiveQuery(() => (gameId ? db.games.get(gameId) : undefined), [gameId]);

  const [form, setForm] = useState<FormularioJuego>(VACIO);
  const [cargado, setCargado] = useState(!esEdicion);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (esEdicion && juegoExistente && !cargado) {
      setForm({
        titulo: juegoExistente.titulo,
        plataforma: juegoExistente.plataforma,
        portadaUrl: juegoExistente.portadaUrl ?? '',
        estado: juegoExistente.estado,
        fechaInicio: juegoExistente.fechaInicio ?? '',
        fechaFin: juegoExistente.fechaFin ?? '',
        horas: String(juegoExistente.horas),
        notas: juegoExistente.notas ?? '',
      });
      setCargado(true);
    }
  }, [esEdicion, juegoExistente, cargado]);

  function actualizarCampo<K extends keyof FormularioJuego>(campo: K, valor: FormularioJuego[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!form.titulo.trim()) return;
    setEnviando(true);
    const datos: DatosNuevoJuego = {
      titulo: form.titulo.trim(),
      plataforma: form.plataforma,
      portadaUrl: form.portadaUrl.trim() || undefined,
      estado: form.estado,
      fechaInicio: form.fechaInicio || undefined,
      fechaFin: form.fechaFin || undefined,
      horas: Number(form.horas) || 0,
      notas: form.notas.trim() || undefined,
    };
    try {
      if (esEdicion && gameId) {
        await actualizarJuego(gameId, datos);
        navigate(`/juegos/${gameId}`);
      } else {
        const juego = await crearJuego(datos);
        navigate(`/juegos/${juego.id}`);
      }
    } finally {
      setEnviando(false);
    }
  }

  if (esEdicion && !cargado) {
    return <div className={styles.pagina} />;
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <h1>{esEdicion ? 'Editar juego' : 'Nuevo juego'}</h1>
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
          <span>Plataforma</span>
          <select
            value={form.plataforma}
            onChange={(evento) => actualizarCampo('plataforma', evento.target.value as Plataforma)}
          >
            {PLATAFORMAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.campo}>
          <span>Portada (URL)</span>
          <input
            type="url"
            placeholder="https://..."
            value={form.portadaUrl}
            onChange={(evento) => actualizarCampo('portadaUrl', evento.target.value)}
          />
        </label>

        <label className={styles.campo}>
          <span>Estado</span>
          <select
            value={form.estado}
            onChange={(evento) => actualizarCampo('estado', evento.target.value as EstadoJuego)}
          >
            {ESTADOS.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.etiqueta}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.fila}>
          <label className={styles.campo}>
            <span>Fecha de inicio</span>
            <input
              type="date"
              value={form.fechaInicio}
              onChange={(evento) => actualizarCampo('fechaInicio', evento.target.value)}
            />
          </label>
          <label className={styles.campo}>
            <span>Fecha de fin</span>
            <input
              type="date"
              value={form.fechaFin}
              onChange={(evento) => actualizarCampo('fechaFin', evento.target.value)}
            />
          </label>
        </div>

        <label className={styles.campo}>
          <span>Horas jugadas</span>
          <input
            type="number"
            min={0}
            step="0.5"
            inputMode="decimal"
            value={form.horas}
            onChange={(evento) => actualizarCampo('horas', evento.target.value)}
          />
        </label>

        <label className={styles.campo}>
          <span>Notas</span>
          <textarea
            rows={4}
            value={form.notas}
            onChange={(evento) => actualizarCampo('notas', evento.target.value)}
          />
        </label>

        <div className={styles.acciones}>
          <Link to={esEdicion && gameId ? `/juegos/${gameId}` : '/'} className={styles.cancelar}>
            Cancelar
          </Link>
          <button type="submit" className={styles.guardar} disabled={enviando}>
            {esEdicion ? 'Guardar cambios' : 'Crear juego'}
          </button>
        </div>
      </form>
    </div>
  );
}
