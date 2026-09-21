import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { HomePage } from '../pages/public/HomePage';
import { CatalogPage } from '../pages/public/CatalogPage';
import { BikePublicPage } from '../pages/public/BikePublicPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { DesignSystemPage } from '../pages/admin/DesignSystemPage';
import { CustomersPage } from '../pages/admin/CustomersPage';
import { BicyclesPage } from '../pages/admin/BicyclesPage';
import { InventoryPage } from '../pages/admin/InventoryPage';
import { ProductsAdminPage } from '../pages/admin/ProductsAdminPage';
import { WorkOrdersPage } from '../pages/admin/WorkOrdersPage';
import { ReceptionPage } from '../pages/admin/ReceptionPage';
import { AppointmentsPage } from '../pages/admin/AppointmentsPage';
import { QRCodesPage } from '../pages/admin/QRCodesPage';
import { WhatsAppPage } from '../pages/admin/WhatsAppPage';
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

  // Experiencia Administrativa Protegida (Taller, técnicos y administración)
  {
    path: '/admin',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'design-system', element: <DesignSystemPage /> },
          {
            path: 'agenda',
            element: <AppointmentsPage />,
          },
          {
            path: 'bicicletas',
            element: <BicyclesPage />,
          },
          {
            path: 'ordenes',
            element: <WorkOrdersPage />,
          },
          {
            path: 'ordenes/nueva',
            element: <ReceptionPage />,
          },
          {
            path: 'inventario',
            element: <InventoryPage />,
          },
          {
            path: 'productos',
            element: <ProductsAdminPage />,
          },
          {
            path: 'clientes',
            element: <CustomersPage />,
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
            element: <QRCodesPage />,
          },
          {
            path: 'whatsapp',
            element: <WhatsAppPage />,
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
    ],
  },

  // Fallback para rutas inexistentes
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
