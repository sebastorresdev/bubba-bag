import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, tokens } from '@fluentui/react-components';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';

import { initializeSession } from './services/authSession';
import { RequireSession } from './features/seguridad/components/RequireSession';
const LoginPage = lazy(() => import('./features/seguridad/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const UsuariosListPage = lazy(() => import('./features/seguridad/pages/UsuariosListPage').then(m => ({ default: m.UsuariosListPage })));
const UsuarioFormPage = lazy(() => import('./features/seguridad/pages/UsuarioFormPage').then(m => ({ default: m.UsuarioFormPage })));
const RolesListPage = lazy(() => import('./features/seguridad/pages/RolesListPage').then(m => ({ default: m.RolesListPage })));
const RolFormPage = lazy(() => import('./features/seguridad/pages/RolFormPage').then(m => ({ default: m.RolFormPage })));

// Code-splitting diferido por rutas y módulos funcionales (React.lazy)
const ProductosListPage = lazy(() => import('./features/inventario/productos').then((m) => ({ default: m.ProductosListPage })));
const ProductoFormPage = lazy(() => import('./features/inventario/productos').then((m) => ({ default: m.ProductoFormPage })));
const AlmacenesListPage = lazy(() => import('./features/inventario/almacenes').then((m) => ({ default: m.AlmacenesListPage })));
const AlmacenFormPage = lazy(() => import('./features/inventario/almacenes').then((m) => ({ default: m.AlmacenFormPage })));
const GrupoUnidadDetallePage = lazy(() => import('./features/inventario/unidades-medida').then((m) => ({ default: m.GrupoUnidadDetallePage })));
const UnidadesMedidaListPage = lazy(() => import('./features/inventario/unidades-medida').then((m) => ({ default: m.UnidadesMedidaListPage })));
const CategoriasListPage = lazy(() => import('./features/inventario/categorias').then((m) => ({ default: m.CategoriasListPage })));
const CategoriaFormPage = lazy(() => import('./features/inventario/categorias').then((m) => ({ default: m.CategoriaFormPage })));
const ListasPreciosListPage = lazy(() => import('./features/inventario/listas-precios').then((m) => ({ default: m.ListasPreciosListPage })));
const ListaPreciosFormPage = lazy(() => import('./features/inventario/listas-precios').then((m) => ({ default: m.ListaPreciosFormPage })));
const ImportacionesListPage = lazy(() => import('./features/gestion-datos').then((m) => ({ default: m.ImportacionesListPage })));
const ImportacionDetallePage = lazy(() => import('./features/gestion-datos').then((m) => ({ default: m.ImportacionDetallePage })));
const InventarioProductosPage = lazy(() => import('./features/inventario/inventario-productos').then((m) => ({ default: m.InventarioProductosPage })));
const TransferenciasListPage = lazy(() => import('./features/inventario/transferencias').then((m) => ({ default: m.TransferenciasListPage })));
const TransferenciaFormPage = lazy(() => import('./features/inventario/transferencias').then((m) => ({ default: m.TransferenciaFormPage })));
const DespachoTecnicoPage = lazy(() => import('./features/inventario/transferencias/pages/DespachoTecnicoPage').then((m) => ({ default: m.DespachoTecnicoPage })));
const DevolucionTecnicoPage = lazy(() => import('./features/inventario/transferencias/pages/DevolucionTecnicoPage').then((m) => ({ default: m.DevolucionTecnicoPage })));
const ComprasListPage = lazy(() => import('./features/inventario/compras/ComprasListPage').then((m) => ({ default: m.ComprasListPage })));
const CompraFormPage = lazy(() => import('./features/inventario/compras/CompraFormPage').then((m) => ({ default: m.CompraFormPage })));
const RecepcionCompraPage = lazy(() => import('./features/inventario/compras/RecepcionCompraPage').then((m) => ({ default: m.RecepcionCompraPage })));
const TrazabilidadSeriesPage = lazy(() => import('./features/inventario/series/TrazabilidadSeriesPage').then((m) => ({ default: m.TrazabilidadSeriesPage })));
const ConfiguracionEmpresaPage = lazy(() => import('./features/configuracion-empresa/pages/ConfiguracionEmpresaPage').then((m) => ({ default: m.ConfiguracionEmpresaPage })));

// Estructura Organizacional (CRUDs reales: Unidades Organizativas, Territorios, Recursos)
const UnidadesOrganizativasListPage = lazy(() => import('./features/organizacion').then((m) => ({ default: m.UnidadesOrganizativasListPage })));
const UnidadOrganizativaFormPage = lazy(() => import('./features/organizacion').then((m) => ({ default: m.UnidadOrganizativaFormPage })));
const TerritoriosListPage = lazy(() => import('./features/organizacion').then((m) => ({ default: m.TerritoriosListPage })));
const TerritorioFormPage = lazy(() => import('./features/organizacion').then((m) => ({ default: m.TerritorioFormPage })));
const RecursosListPage = lazy(() => import('./features/organizacion').then((m) => ({ default: m.RecursosListPage })));
const RecursoFormPage = lazy(() => import('./features/organizacion').then((m) => ({ default: m.RecursoFormPage })));

const PlaceholderPage = lazy(() => import('./components/common/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage })));

const RouteLoadingFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flexGrow: 1,
      height: '100%',
      minHeight: '320px',
      gap: '12px',
      backgroundColor: tokens.colorNeutralBackground3,
    }}
  >
    <Spinner size="large" label="Cargando módulo..." />
  </div>
);

export default function App() {
  useEffect(() => { void initializeSession(); }, []);
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireSession />}>
            <Route path="/" element={<MainLayout />}>
              <Route path="configuracion/usuarios" element={<UsuariosListPage />} />
              <Route path="configuracion/usuarios/nuevo" element={<UsuarioFormPage />} />
              <Route path="configuracion/usuarios/:id" element={<UsuarioFormPage />} />
              <Route path="configuracion/roles" element={<RolesListPage />} />
              <Route path="configuracion/roles/nuevo" element={<RolFormPage />} />
              <Route path="configuracion/roles/:id" element={<RolFormPage />} />
              <Route path="configuracion/empresa" element={<ConfiguracionEmpresaPage />} />
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
              <Route path="servicio-campo/transferencias" element={<TransferenciasListPage tipoFiltro="Traslado" />} />
              <Route path="servicio-campo/transferencias/nuevo" element={<TransferenciaFormPage />} />
              <Route path="servicio-campo/transferencias/:id" element={<TransferenciaFormPage />} />
              <Route path="servicio-campo/despacho-tecnicos" element={<TransferenciasListPage tipoFiltro="Despacho" />} />
              <Route path="servicio-campo/despacho-tecnicos/nuevo" element={<DespachoTecnicoPage />} />
              <Route path="servicio-campo/despacho-tecnicos/:id" element={<DespachoTecnicoPage />} />
              <Route path="servicio-campo/devolucion-tecnicos" element={<TransferenciasListPage tipoFiltro="Devolucion" />} />
              <Route path="servicio-campo/devolucion-tecnicos/nuevo" element={<DevolucionTecnicoPage />} />
              <Route path="servicio-campo/devolucion-tecnicos/:id" element={<DevolucionTecnicoPage />} />
              <Route path="servicio-campo/recepciones-compra" element={<ComprasListPage />} />
              <Route path="servicio-campo/recepciones-compra/nuevo" element={<CompraFormPage key="nueva-compra" />} />
              <Route path="servicio-campo/recepciones-compra/:id" element={<CompraFormPage />} />
              <Route path="servicio-campo/recepciones-compra/:id/recepcion" element={<RecepcionCompraPage />} />
              <Route path="servicio-campo/almacenes" element={<AlmacenesListPage />} />
              <Route path="servicio-campo/almacenes/nuevo" element={<AlmacenFormPage />} />
              <Route path="servicio-campo/almacenes/:id" element={<AlmacenFormPage />} />
              <Route path="servicio-campo/series" element={<TrazabilidadSeriesPage />} />

              {/* 6. Estructura Organizacional (CRUDs Reales: Sedes, Zonas/Territorios, Recursos) */}
              <Route path="servicio-campo/unidades-organizativas" element={<UnidadesOrganizativasListPage />} />
              <Route path="servicio-campo/unidades-organizativas/nuevo" element={<UnidadOrganizativaFormPage />} />
              <Route path="servicio-campo/unidades-organizativas/:id" element={<UnidadOrganizativaFormPage />} />

              <Route path="servicio-campo/territorios" element={<TerritoriosListPage />} />
              <Route path="servicio-campo/territorios/nuevo" element={<TerritorioFormPage />} />
              <Route path="servicio-campo/territorios/:id" element={<TerritorioFormPage />} />

              <Route path="servicio-campo/recursos" element={<RecursosListPage />} />
              <Route path="servicio-campo/recursos/nuevo" element={<RecursoFormPage />} />
              <Route path="servicio-campo/recursos/:id" element={<RecursoFormPage />} />

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
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
