import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProductosListPage, ProductoFormPage } from './features/inventario/productos';
import { AlmacenesListPage, AlmacenFormPage } from './features/inventario/almacenes';
import { GrupoUnidadDetallePage, UnidadesMedidaListPage } from './features/inventario/unidades-medida';
import { CategoriasListPage, CategoriaFormPage } from './features/inventario/categorias';
import { ListasPreciosListPage, ListaPreciosFormPage } from './features/inventario/listas-precios';
import { ImportacionesListPage, ImportacionDetallePage } from './features/gestion-datos';
import { PlaceholderPage } from './components/common/PlaceholderPage';
import { InventarioProductosPage } from './features/inventario/inventario-productos';
import { TransferenciaFormPage, TransferenciasListPage } from './features/inventario/transferencias';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/servicio-campo/productos" replace />} />
            
            {/* 1. Catálogo General - Unidades de Medida */}
            <Route path="servicio-campo/unidades-medida" element={<UnidadesMedidaListPage />} />
            <Route path="grupos-unidades" element={<UnidadesMedidaListPage />} />
            <Route path="servicio-campo/unidades-medida/nuevo" element={<Navigate to="/servicio-campo/unidades-medida" replace />} />
            <Route path="servicio-campo/unidades-medida/:id" element={<GrupoUnidadDetallePage />} />
            <Route path="grupos-unidades/:id" element={<GrupoUnidadDetallePage />} />

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
            <Route path="servicio-campo/inventario-productos" element={<InventarioProductosPage />} />
            <Route path="servicio-campo/transferencias" element={<TransferenciasListPage />} />
            <Route path="servicio-campo/transferencias/nuevo" element={<TransferenciaFormPage />} />
            <Route path="servicio-campo/almacenes" element={<AlmacenesListPage />} />
            <Route path="servicio-campo/almacenes/nuevo" element={<AlmacenFormPage />} />
            <Route path="servicio-campo/almacenes/:id" element={<AlmacenFormPage />} />

            {/* Gestión global de datos e importaciones */}
            <Route path="gestion-datos/importaciones" element={<ImportacionesListPage />} />
            <Route path="gestion-datos/importaciones/:id" element={<ImportacionDetallePage />} />
            <Route path="configuracion/gestion-datos/imports" element={<Navigate to="/gestion-datos/importaciones" replace />} />
            <Route path="configuracion/gestion-datos/imports/:id" element={<ImportacionDetallePage />} />
            <Route path="configuracion/data-management/imports" element={<Navigate to="/gestion-datos/importaciones" replace />} />
            <Route path="configuracion/data-management/imports/:id" element={<ImportacionDetallePage />} />

            {/* Vistas en construcción o rutas no mapeadas */}
            <Route path="*" element={<PlaceholderPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
