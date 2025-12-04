import { Bell, User } from 'lucide-react';

export function Header() {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
            </div>

            <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <Bell className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-gray-900">Kullanıcı Adı</p>
                        <p className="text-xs text-gray-500">Yönetici</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
