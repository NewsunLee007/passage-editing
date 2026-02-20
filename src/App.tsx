import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Preview from './pages/Preview';
import Edit from './pages/Edit';
import Settings from './pages/Settings';
import About from './pages/About';
import HistoryPage from './pages/History';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="edit" element={<Edit />} />
          <Route path="preview" element={<Preview />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
