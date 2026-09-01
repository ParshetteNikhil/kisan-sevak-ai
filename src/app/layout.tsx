
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { I18nProvider } from '@/context/i18n-provider';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { RoleProvider } from '@/context/role-provider';
import { ProfileProvider } from '@/context/profile-provider';
import { TasksProvider } from '@/context/tasks-provider';
import { RecordsProvider } from '@/context/records-provider';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'Kisaan Sevak',
  description: 'Your smart farming companion',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <I18nProvider>
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
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}
