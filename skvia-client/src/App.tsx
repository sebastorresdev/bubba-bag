import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProductosListPage, ProductoFormPage } from './features/inventario/productos';
import { PlaceholderPage } from './components/common/PlaceholderPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/servicio-campo/productos" replace />} />
            <Route path="servicio-campo/productos" element={<ProductosListPage />} />
            <Route path="servicio-campo/productos/nuevo" element={<ProductoFormPage />} />
            <Route path="servicio-campo/productos/:id" element={<ProductoFormPage />} />
            <Route path="*" element={<PlaceholderPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
