export type Profile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: 'admin' | 'staff';
    is_active: boolean;
    avatar_url: string | null;
};

export type Customer = {
    id: string;
    company_name: string;
    contact_person: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
};

export type Project = {
    id: string;
    customer_id: string;
    name: string;
    address: string | null;
    description: string | null;
    status: 'active' | 'passive' | 'completed';
    customer?: Customer;
};

export type Job = {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    assigned_to: string | null;
    planned_start_date: string | null;
    planned_end_date: string | null;
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    project?: Project;
    assignee?: Profile;
};

export type InventoryItem = {
    id: string;
    name: string;
    sku: string | null;
    unit: string | null;
    unit_price: number | null;
    current_stock: number;
    critical_stock_level: number;
};
