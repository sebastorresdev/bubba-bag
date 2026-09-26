import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProductosListPage, ProductoFormPage } from './features/inventario/productos';
import { UnidadesMedidaListPage, UnidadMedidaFormPage } from './features/inventario/unidades-medida';
import { CategoriasListPage, CategoriaFormPage } from './features/inventario/categorias';
import { PlaceholderPage } from './components/common/PlaceholderPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/servicio-campo/productos" replace />} />
            
            {/* 1. Catálogo General - Unidades de Medida */}
            <Route path="servicio-campo/unidades-medida" element={<UnidadesMedidaListPage />} />
            <Route path="servicio-campo/unidades-medida/nuevo" element={<UnidadMedidaFormPage />} />
            <Route path="servicio-campo/unidades-medida/:id" element={<UnidadMedidaFormPage />} />

            {/* 2. Catálogo General - Categorías y Familias */}
            <Route path="servicio-campo/categorias-producto" element={<CategoriasListPage />} />
            <Route path="servicio-campo/categorias-producto/nuevo" element={<CategoriaFormPage />} />
            <Route path="servicio-campo/categorias-producto/:id" element={<CategoriaFormPage />} />

            {/* 3. Catálogo General - Productos y Servicios */}
            <Route path="servicio-campo/productos" element={<ProductosListPage />} />
            <Route path="servicio-campo/productos/nuevo" element={<ProductoFormPage />} />
            <Route path="servicio-campo/productos/:id" element={<ProductoFormPage />} />

            {/* Vistas en construcción o rutas no mapeadas */}
            <Route path="*" element={<PlaceholderPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
