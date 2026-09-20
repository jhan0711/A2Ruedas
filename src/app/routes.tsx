import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { HomePage } from '../pages/public/HomePage';
import { CatalogPage } from '../pages/public/CatalogPage';
import { BikePublicPage } from '../pages/public/BikePublicPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { DesignSystemPage } from '../pages/admin/DesignSystemPage';
import { ModulePlaceholder } from '../pages/admin/ModulePlaceholder';

export const router = createBrowserRouter([
  // Experiencia Pública (Clientes del taller, sin login)
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'productos', element: <CatalogPage /> },
      { path: 'bike/:code', element: <BikePublicPage /> },
    ],
  },

  // Autenticación administrativa
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Experiencia Administrativa (Taller, técnicos y administración)
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'design-system', element: <DesignSystemPage /> },
      {
        path: 'agenda',
        element: (
          <ModulePlaceholder
            title="Agenda y Calendario"
            phase="Fase 11"
            description="Programación de citas y control de carga horaria de mecánicos."
          />
        ),
      },
      {
        path: 'bicicletas',
        element: (
          <ModulePlaceholder
            title="Fichas Técnicas de Bicicletas"
            phase="Fase 7"
            description="Registro de bicicletas, seriales, marca, modelo y fotografías de estado."
          />
        ),
      },
      {
        path: 'ordenes',
        element: (
          <ModulePlaceholder
            title="Órdenes de Trabajo (OT)"
            phase="Fase 9"
            description="Ciclo completo de reparaciones, repuestos y cambio de estados."
          />
        ),
      },
      {
        path: 'ordenes/nueva',
        element: (
          <ModulePlaceholder
            title="Recepción de Bicicleta y Firma Digital"
            phase="Fase 10"
            description="Formulario de ingreso, registro de daños y firma del cliente en pantalla."
          />
        ),
      },
      {
        path: 'inventario',
        element: (
          <ModulePlaceholder
            title="Inventario y Kardex"
            phase="Fase 8"
            description="Control de existencias, alertas de stock mínimo y registro de movimientos."
          />
        ),
      },
      {
        path: 'productos',
        element: (
          <ModulePlaceholder
            title="Gestión de Catálogo de Productos"
            phase="Fase 8"
            description="Administración de precios, costos, categorías y productos para venta."
          />
        ),
      },
      {
        path: 'clientes',
        element: (
          <ModulePlaceholder
            title="Directorio de Clientes"
            phase="Fase 6"
            description="Base de datos de clientes, teléfonos, WhatsApp y bicicletas vinculadas."
          />
        ),
      },
      {
        path: 'caja',
        element: (
          <ModulePlaceholder
            title="Flujo de Caja Diario"
            phase="Fase 15"
            description="Apertura, ingresos, egresos, anticipos y arqueo de caja diario."
          />
        ),
      },
      {
        path: 'facturas',
        element: (
          <ModulePlaceholder
            title="Facturación y Recibos"
            phase="Fase 16"
            description="Emisión de comprobantes internos y detalle de cobros a clientes."
          />
        ),
      },
      {
        path: 'qr',
        element: (
          <ModulePlaceholder
            title="Generación y Escaneo de QR"
            phase="Fase 13"
            description="Emisión de adhesivos para bicicletas y escáner integrado con cámara."
          />
        ),
      },
      {
        path: 'impresion',
        element: (
          <ModulePlaceholder
            title="Centro de Impresión Térmica 58 mm"
            phase="Fase 17"
            description="Plantillas térmicas de alta densidad para órdenes de trabajo y recibos."
          />
        ),
      },
      {
        path: 'configuracion',
        element: (
          <ModulePlaceholder
            title="Configuración del Taller"
            phase="Fase 20"
            description="Datos del establecimiento, usuarios técnicos, parámetros de impresión y seguridad."
          />
        ),
      },
    ],
  },

  // Fallback para rutas inexistentes
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
