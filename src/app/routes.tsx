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
import { CashPage } from '../pages/admin/CashPage';
import { InvoicesPage } from '../pages/admin/InvoicesPage';
import { ThermalPrintPage } from '../pages/admin/ThermalPrintPage';
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
            element: <CashPage />,
          },
          {
            path: 'facturas',
            element: <InvoicesPage />,
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
            element: <ThermalPrintPage />,
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
