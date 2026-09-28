import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProductosListPage, ProductoFormPage } from './features/inventario/productos';
import { AlmacenesListPage, AlmacenFormPage } from './features/inventario/almacenes';
import { UnidadesMedidaListPage, UnidadMedidaFormPage } from './features/inventario/unidades-medida';
import { CategoriasListPage, CategoriaFormPage } from './features/inventario/categorias';
import { ListasPreciosListPage, ListaPreciosFormPage } from './features/inventario/listas-precios';
import { ImportsListPage, ImportJobDetailPage } from './features/gestion-datos';
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

            {/* 4. Catálogo General - Listas de Precios */}
            <Route path="servicio-campo/listas-precios" element={<ListasPreciosListPage />} />
            <Route path="servicio-campo/listas-precios/nuevo" element={<ListaPreciosFormPage />} />
            <Route path="servicio-campo/listas-precios/:id" element={<ListaPreciosFormPage />} />

            {/* 5. Inventario - Almacenes y Bodegas */}
            <Route path="servicio-campo/almacenes" element={<AlmacenesListPage />} />
            <Route path="servicio-campo/almacenes/nuevo" element={<AlmacenFormPage />} />
            <Route path="servicio-campo/almacenes/:id" element={<AlmacenFormPage />} />

            {/* 6. Gestión de Datos / Importaciones D365 */}
            <Route path="configuracion/gestion-datos/imports" element={<ImportsListPage />} />
            <Route path="configuracion/gestion-datos/imports/:id" element={<ImportJobDetailPage />} />
            <Route path="configuracion/data-management/imports" element={<ImportsListPage />} />
            <Route path="configuracion/data-management/imports/:id" element={<ImportJobDetailPage />} />

            {/* Vistas en construcción o rutas no mapeadas */}
            <Route path="*" element={<PlaceholderPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
