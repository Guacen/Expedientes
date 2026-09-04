import { HashRouter, Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import styles from './App.module.css';
import Library from './routes/Library';
import GameDetail from './routes/GameDetail';
import GameForm from './routes/GameForm';
import TrophyForm from './routes/TrophyForm';
import Settings from './routes/Settings';

export default function App() {
  return (
    <HashRouter>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/juegos/nuevo" element={<GameForm />} />
          <Route path="/juegos/:gameId" element={<GameDetail />} />
          <Route path="/juegos/:gameId/editar" element={<GameForm />} />
          <Route path="/juegos/:gameId/trofeos/nuevo" element={<TrophyForm />} />
          <Route path="/juegos/:gameId/trofeos/:trophyId/editar" element={<TrophyForm />} />
          <Route path="/ajustes" element={<Settings />} />
        </Routes>
      </main>
      <BottomNav />
    </HashRouter>
  );
}
