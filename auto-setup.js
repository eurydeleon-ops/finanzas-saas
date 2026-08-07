// ============================================================================
// AUTO-SETUP FINANZAS SAAS
// Ejecuta este script en: F12 → Console → Pega esto y presiona ENTER
// ============================================================================

const sqlContent = `-- ============================================
-- FINANZAS SAAS - Schema Completo Supabase
-- ============================================

CREATE TABLE plans (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  features JSONB DEFAULT '{}',
  max_invoices_per_month INTEGER,
  max_users INTEGER,
  max_branches INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO plans (name, description, price, billing_cycle, features, max_invoices_per_month, max_users, max_branches) VALUES
('Free', 'Plan gratuito para principiantes', 0, 'monthly', '{"invoices": true, "reports": false, "api": false}', 10, 1, 1),
('Basic', 'Plan básico para pequeñas empresas', 29.99, 'monthly', '{"invoices": true, "reports": true, "api": false}', 200, 3, 2),
('Professional', 'Plan profesional con funciones avanzadas',29.99, 'monthly', '{"invoices": true, "reports": true, "api": true}', NULL, 10, 5),
('Enterprise', 'Plan empresarial con soporte dedicado', 299.99, 'monthly', '{"invoices": true, "reports": true, "api": true, "sso": true}', NULL, NULL, NULL);

CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description, permissions) VALUES
('Admin', 'Administrador de empresa', '{"view_all": true, "edit_all": true, "delete_all": true, "manage_users": true}'),
('Manager', 'Gerente de empresa', '{"view_all": true, "edit_all": true, "delete_all": false, "manage_users": false}'),
('Supervisor', 'Supervisor de sucursal', '{"view_branch": true, "edit_branch": true, "delete_branch": false}'),
('User', 'Usuario estándar', '{"view_own": true, "edit_own": true, "delete_own": false}'),
('Auditor', 'Solo lectura para auditoría', '{"view_all": true, "edit_all": false, "delete_all": false}');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  google_id VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  ruc VARCHAR(20) UNIQUE,
  industry VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Dominican Republic',
  currency VARCHAR(3) DEFAULT 'DOP',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id BIGINT NOT NULL REFERENCES plans(id),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  renewal_date DATE,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_usage (
  id BIGSERIAL PRIMARY KEY,
  subscription_id BIGINT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subscription_id, month)
);

CREATE TABLE branches (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  manager_id UUID REFERENCES users(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE company_members (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id BIGINT REFERENCES branches(id),
  role_id BIGINT NOT NULL REFERENCES roles(id),
  status VARCHAR(50) DEFAULT 'active',
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, user_id)
);

CREATE TABLE income (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id BIGINT REFERENCES branches(id),
  user_id UUID NOT NULL REFERENCES users(id),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100),
  source VARCHAR(100),
  date DATE NOT NULL,
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_income_company ON income(company_id);
CREATE INDEX idx_income_date ON income(date);
CREATE INDEX idx_income_category ON income(category);

CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id BIGINT REFERENCES branches(id),
  user_id UUID NOT NULL REFERENCES users(id),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(100),
  payment_method VARCHAR(100),
  date DATE NOT NULL,
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id BIGINT REFERENCES branches(id),
  user_id UUID NOT NULL REFERENCES users(id),
  invoice_number VARCHAR(50),
  vendor_name VARCHAR(255),
  invoice_date DATE,
  amount DECIMAL(12, 2),
  tax DECIMAL(12, 2) DEFAULT 0,
  category VARCHAR(100),
  payment_method VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  image_url TEXT,
  image_path TEXT,
  ocr_data JSONB,
  expense_id BIGINT REFERENCES expenses(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(50),
  period_start DATE,
  period_end DATE,
  data JSONB,
  generated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id BIGINT,
  changes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_company ON audit_logs(company_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

CREATE OR REPLACE VIEW company_stats AS
SELECT 
  c.id,
  c.name,
  (SELECT COUNT(*) FROM company_members WHERE company_id = c.id) as member_count,
  (SELECT COUNT(*) FROM invoices WHERE company_id = c.id) as invoice_count,
  (SELECT COALESCE(SUM(amount), 0) FROM income WHERE company_id = c.id) as total_income,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE company_id = c.id) as total_expenses,
  (SELECT COALESCE(SUM(amount), 0) FROM income WHERE company_id = c.id) - 
  (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE company_id = c.id) as balance
FROM companies c;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view their own companies" ON companies
  FOR SELECT USING (owner_id = auth.uid() OR 
    id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view company members" ON company_members
  FOR SELECT USING (company_id IN 
    (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view company income" ON income
  FOR SELECT USING (company_id IN 
    (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert income for their company" ON income
  FOR INSERT WITH CHECK (company_id IN 
    (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view company expenses" ON expenses
  FOR SELECT USING (company_id IN 
    (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert expenses for their company" ON expenses
  FOR INSERT WITH CHECK (company_id IN 
    (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view company invoices" ON invoices
  FOR SELECT USING (company_id IN 
    (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert invoices for their company" ON invoices
  FOR INSERT WITH CHECK (company_id IN 
    (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their company subscription" ON subscriptions
  FOR SELECT USING (company_id IN 
    (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION check_invoice_limit(company_id BIGINT)
RETURNS BOOLEAN AS \$$
DECLARE
  subscription_id BIGINT;
  plan_id BIGINT;
  max_invoices INTEGER;
  current_month DATE;
  current_count INTEGER;
BEGIN
  SELECT s.id, s.plan_id INTO subscription_id, plan_id
  FROM subscriptions s
  WHERE s.company_id = check_invoice_limit.company_id
    AND s.status = 'active'
  LIMIT 1;
  
  IF subscription_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT p.max_invoices_per_month INTO max_invoices
  FROM plans p
  WHERE p.id = plan_id;
  
  IF max_invoices IS NULL THEN
    RETURN TRUE;
  END IF;
  
  current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  SELECT COALESCE(count, 0) INTO current_count
  FROM invoice_usage
  WHERE invoice_usage.subscription_id = check_invoice_limit.subscription_id
    AND month = current_month;
  
  RETURN current_count < max_invoices;
END;
\$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_invoice_count(company_id BIGINT)
RETURNS VOID AS \$$
DECLARE
  subscription_id BIGINT;
  current_month DATE;
BEGIN
  SELECT s.id INTO subscription_id
  FROM subscriptions s
  WHERE s.company_id = increment_invoice_count.company_id
    AND s.status = 'active'
  LIMIT 1;
  
  current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  INSERT INTO invoice_usage (subscription_id, month, count)
  VALUES (subscription_id, current_month, 1)
  ON CONFLICT (subscription_id, month) 
  DO UPDATE SET count = invoice_usage.count + 1, updated_at = CURRENT_TIMESTAMP;
END;
\$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_invoice_count()
RETURNS TRIGGER AS \$$
BEGIN
  IF NEW.image_url IS NOT NULL THEN
    PERFORM increment_invoice_count(NEW.company_id);
  END IF;
  RETURN NEW;
END;
\$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_count_trigger
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION trigger_invoice_count();

CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_members_company ON company_members(company_id);
CREATE INDEX idx_members_user ON company_members(user_id);`;

// Copiar al portapapeles
navigator.clipboard.writeText(sqlContent).then(() => {
  alert('✅ SQL copiado al portapapeles!\n\n1. Abre SQL Editor en Supabase\n2. Haz click en "+ New Query"\n3. Pega (Ctrl+V)\n4. Haz click en "RUN"');
  console.log('%c✅ Schema SQL listo para pegar en Supabase', 'color: green; font-size: 16px');
}).catch(() => {
  alert('❌ Error al copiar');
  console.log('Copia manualmente este contenido:');
  console.log(sqlContent);
});

