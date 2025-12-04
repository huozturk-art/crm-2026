'use client';

import { usePathname } from 'next/navigation';
import { AppLayout } from './AppLayout';

interface ClientLayoutProps {
    children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return <AppLayout>{children}</AppLayout>;
}
