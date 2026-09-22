import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { PageLoadingFallback } from '../components/ui/PageLoadingFallback';

// Carga perezosa (Code-Splitting) de páginas públicas
const HomePage = lazy(() =>
  import('../pages/public/HomePage').then((m) => ({ default: m.HomePage }))
);
const CatalogPage = lazy(() =>
  import('../pages/public/CatalogPage').then((m) => ({ default: m.CatalogPage }))
);
const BikePublicPage = lazy(() =>
  import('../pages/public/BikePublicPage').then((m) => ({ default: m.BikePublicPage }))
);

// Autenticación administrativa
const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);

// Módulos administrativos (descargados bajo demanda)
const DashboardPage = lazy(() =>
  import('../pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const CustomersPage = lazy(() =>
  import('../pages/admin/CustomersPage').then((m) => ({ default: m.CustomersPage }))
);
const BicyclesPage = lazy(() =>
  import('../pages/admin/BicyclesPage').then((m) => ({ default: m.BicyclesPage }))
);
const InventoryPage = lazy(() =>
  import('../pages/admin/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const ProductsAdminPage = lazy(() =>
  import('../pages/admin/ProductsAdminPage').then((m) => ({ default: m.ProductsAdminPage }))
);
const WorkOrdersPage = lazy(() =>
  import('../pages/admin/WorkOrdersPage').then((m) => ({ default: m.WorkOrdersPage }))
);
const ReceptionPage = lazy(() =>
  import('../pages/admin/ReceptionPage').then((m) => ({ default: m.ReceptionPage }))
);
const AppointmentsPage = lazy(() =>
  import('../pages/admin/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage }))
);
const QRCodesPage = lazy(() =>
  import('../pages/admin/QRCodesPage').then((m) => ({ default: m.QRCodesPage }))
);
const WhatsAppPage = lazy(() =>
  import('../pages/admin/WhatsAppPage').then((m) => ({ default: m.WhatsAppPage }))
);
const CashPage = lazy(() =>
  import('../pages/admin/CashPage').then((m) => ({ default: m.CashPage }))
);
const InvoicesPage = lazy(() =>
  import('../pages/admin/InvoicesPage').then((m) => ({ default: m.InvoicesPage }))
);
const ThermalPrintPage = lazy(() =>
  import('../pages/admin/ThermalPrintPage').then((m) => ({ default: m.ThermalPrintPage }))
);
const SettingsPage = lazy(() =>
  import('../pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);


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
    element: (
      <Suspense fallback={<PageLoadingFallback message="Cargando acceso al taller..." />}>
        <LoginPage />
      </Suspense>
    ),
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
            element: <SettingsPage />,
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
