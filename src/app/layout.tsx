
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { I18nProvider } from '@/context/i18n-provider';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { AuthProvider } from '@/context/auth-provider';
import { RoleProvider } from '@/context/role-provider';
import { ProfileProvider } from '@/context/profile-provider';
import { TasksProvider } from '@/context/tasks-provider';
import { RecordsProvider } from '@/context/records-provider';
import { Header } from '@/components/layout/header';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';

export const metadata: Metadata = {
  title: 'Kisaan Sevak',
  description: 'Your smart farming companion',
  applicationName: 'Kisaan Sevak',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: 'Kisaan Sevak', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#4A824A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        <I18nProvider>
          <AuthProvider>
            <RoleProvider>
              <TasksProvider>
                <RecordsProvider>
                  <ProfileProvider>
                  <SidebarProvider>
                    <Sidebar>
                      <SidebarNav />
                    </Sidebar>
                    <div className="flex flex-col w-full">
                      <Header />
                      <SidebarInset>{children}</SidebarInset>
                    </div>
                  </SidebarProvider>
                </ProfileProvider>
              </RecordsProvider>
            </TasksProvider>
          </RoleProvider>
        </AuthProvider>
      </I18nProvider>
      <Toaster />
      <RegisterServiceWorker />
    </body>
  </html>
);
}
