/**
 * Client Layout Wrapper
 * Wraps children with theme provider and sidebar
 */

'use client';

import React from 'react';
import { ThemeProvider, useThemeMode } from '@/components/providers/theme-provider';
import { SidebarLayout } from './sidebar-layout';

interface ClientLayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: ClientLayoutProps) {
  const { mode, toggleMode } = useThemeMode();

  return (
    <SidebarLayout mode={mode} onToggleMode={toggleMode}>
      {children}
    </SidebarLayout>
  );
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>
  );
}
