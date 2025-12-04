'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Users, Package, FileText, Settings, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';

const menuItems = [
    { name: 'Dashboard', icon: Home, href: '/dashboard' },
    { name: 'İş Emirleri', icon: Briefcase, href: '/jobs' },
    { name: 'Müşteriler', icon: Users, href: '/customers' },
    { name: 'Personel', icon: Users, href: '/staff' },
    { name: 'Stok & Malzeme', icon: Package, href: '/inventory' },
    { name: 'Raporlar', icon: FileText, href: '/reports' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-screen w-64 bg-card border-r border-border text-card-foreground">
            <div className="p-6 flex items-center justify-center">
                <img
                    src="https://yildizenerji.com/wp-content/uploads/2022/02/yildiz-enerji.png"
                    alt="Yıldız Enerji"
                    className="h-12 w-auto object-contain"
                />
            </div>

            <nav className="flex-1 px-3 space-y-1 mt-4">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border mt-auto">
                <button className="flex items-center w-full px-3 py-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
            </div>
        </div>
    );
}
