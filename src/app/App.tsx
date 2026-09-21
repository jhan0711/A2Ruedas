import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider } from '../features/auth/AuthContext';
import { PWAProvider } from '../context/PWAContext';
import { ToastProvider } from '../context/ToastContext';
import { OfflineBanner } from '../components/pwa/OfflineBanner';
import { UpdateBanner } from '../components/pwa/UpdateBanner';
import { InstallPromptModal } from '../components/pwa/InstallPromptModal';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PWAProvider>
        <ToastProvider>
          <OfflineBanner />
          <RouterProvider router={router} />
          <UpdateBanner />
          <InstallPromptModal />
        </ToastProvider>
      </PWAProvider>
    </AuthProvider>
  );
};

export default App;
