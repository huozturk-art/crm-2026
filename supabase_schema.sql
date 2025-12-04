-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. CUSTOMERS
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. PROJECTS (Şantiyeler)
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'passive', 'completed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. JOBS (İş Emirleri)
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  planned_start_date TIMESTAMP WITH TIME ZONE,
  planned_end_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. INVENTORY ITEMS (Malzeme Kartları)
CREATE TABLE inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  unit TEXT, -- adet, metre, kg
  unit_price DECIMAL(10, 2),
  current_stock DECIMAL(10, 2) DEFAULT 0,
  critical_stock_level DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. INVENTORY MOVEMENTS (Depo Hareketleri)
CREATE TABLE inventory_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id),
  job_id UUID REFERENCES jobs(id),
  movement_type TEXT CHECK (movement_type IN ('out', 'in', 'usage', 'adjustment')),
  quantity DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. JOB REPORTS (İş Raporları)
CREATE TABLE job_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id),
  report_type TEXT CHECK (report_type IN ('start', 'end', 'daily')),
  description TEXT,
  location JSONB, -- { lat: ..., lng: ... }
  media_urls TEXT[], -- Array of URLs
  materials_taken JSONB, -- [{ item_id: ..., quantity: ... }]
  materials_returned JSONB,
  materials_used JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. PERFORMANCE RECORDS
CREATE TABLE performance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE,
  period_end DATE,
  total_jobs INT DEFAULT 0,
  on_time_jobs INT DEFAULT 0,
  material_usage_score DECIMAL(5, 2),
  report_compliance BOOLEAN DEFAULT false,
  performance_score DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies (Row Level Security) - Basic Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_reports ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users for now
CREATE POLICY "Allow read access for authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON job_reports FOR SELECT TO authenticated USING (true);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name', 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
