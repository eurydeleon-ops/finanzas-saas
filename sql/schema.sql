-- ============================================================================
-- FINANZAS SaaS - Esquema PostgreSQL Completo
-- ============================================================================
-- Plataforma multiempresa, multiusuario, con suscripciones y límites de plan

-- ============================================================================
-- 1. ENUMS (Tipos)
-- ============================================================================

CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'professional', 'enterprise');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'supervisor', 'user');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE payment_status AS ENUM ('pending', 'active', 'cancelled', 'expired');

-- ============================================================================
-- 2. TABLAS PRINCIPALES
-- ============================================================================

-- Tabla: Empresas
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  rfc VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  logo_url TEXT,
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status payment_status NOT NULL DEFAULT 'active',
  billing_cycle VARCHAR(20), -- 'monthly' o 'annual'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Límites de Planes (configuración)
CREATE TABLE IF NOT EXISTS plan_limits (
  id SERIAL PRIMARY KEY,
  plan subscription_plan NOT NULL UNIQUE,
  max_invoices_per_month INT,
  max_users INT,
  max_branches INT,
  max_categories INT,
  features JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Sucursales
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Usuarios
CREATE TABLE IF NOT EXISTS company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(auth_user_id, company_id)
);

-- Tabla: Categorías de Gasto
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, name)
);

-- Tabla: Categorías de Ingreso
CREATE TABLE IF NOT EXISTS income_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, name)
);

-- Tabla: Gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50), -- 'cash', 'card', 'transfer', etc
  receipt_url TEXT,
  receipt_storage_path TEXT,
  notes TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Ingresos
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES income_categories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source VARCHAR(100),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
  invoice_number VARCHAR(50),
  notes TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Facturas
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50),
  vendor_name VARCHAR(255),
  invoice_date DATE,
  invoice_amount DECIMAL(12, 2),
  tax_amount DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  file_path TEXT NOT NULL,
  file_size INT,
  file_type VARCHAR(50),
  ocr_confidence DECIMAL(3, 2),
  ocr_data JSONB,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Presupuestos
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE,
  alert_threshold_1 INT DEFAULT 80, -- %
  alert_threshold_2 INT DEFAULT 90, -- %
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Métricas de Uso (tracking)
CREATE TABLE IF NOT EXISTS usage_metrics (
  id SERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- 'invoices_uploaded', 'expenses_created', 'users_active'
  metric_value INT NOT NULL,
  period_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, metric_type, period_date)
);

-- Tabla: Auditoría (logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. VISTAS
-- ============================================================================

-- Vista: Balance Mensual por Empresa
CREATE VIEW v_monthly_balance AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  DATE_TRUNC('month', COALESCE(e.date, i.date))::date as month,
  COALESCE(SUM(CASE WHEN e.id IS NOT NULL THEN e.amount ELSE 0 END), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN i.id IS NOT NULL THEN i.amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN i.id IS NOT NULL THEN i.amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN e.id IS NOT NULL THEN e.amount ELSE 0 END), 0) as balance
FROM companies c
LEFT JOIN expenses e ON c.id = e.company_id
LEFT JOIN incomes i ON c.id = i.company_id
GROUP BY c.id, c.name, DATE_TRUNC('month', COALESCE(e.date, i.date));

-- Vista: Gastos por Categoría
CREATE VIEW v_expenses_by_category AS
SELECT 
  c.id as company_id,
  ec.id as category_id,
  ec.name as category_name,
  DATE_TRUNC('month', e.date)::date as month,
  COUNT(*) as count,
  SUM(e.amount) as total
FROM companies c
JOIN expense_categories ec ON c.id = ec.company_id
LEFT JOIN expenses e ON c.id = e.company_id AND ec.id = e.category_id
GROUP BY c.id, ec.id, ec.name, DATE_TRUNC('month', e.date);

-- ============================================================================
-- 4. ÍNDICES
-- ============================================================================

CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_auth_user ON company_users(auth_user_id);
CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_incomes_company ON incomes(company_id);
CREATE INDEX idx_incomes_category ON incomes(category_id);
CREATE INDEX idx_incomes_date ON incomes(date);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_budgets_company ON budgets(company_id);
CREATE INDEX idx_usage_metrics_company ON usage_metrics(company_id);
CREATE INDEX idx_usage_metrics_date ON usage_metrics(period_date);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: companies
CREATE POLICY "Users can see own companies"
  ON companies FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can see companies where they are users"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM company_users WHERE auth_user_id = auth.uid()
    )
  );

-- Políticas: company_users (ver usuarios de su empresa)
CREATE POLICY "Users can see users in their company"
  ON company_users FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE auth_user_id = auth.uid()
    ) OR auth_user_id = auth.uid()
  );

-- Políticas: expenses (ver gastos de su empresa)
CREATE POLICY "Users can see expenses from their company"
  ON expenses FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE auth_user_id = auth.uid()
    ) OR created_by = auth.uid()
  );

-- Políticas: incomes
CREATE POLICY "Users can see incomes from their company"
  ON incomes FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE auth_user_id = auth.uid()
    ) OR created_by = auth.uid()
  );

-- Políticas: invoices
CREATE POLICY "Users can see invoices from their company"
  ON invoices FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE auth_user_id = auth.uid()
    ) OR uploaded_by = auth.uid()
  );

-- Políticas: budgets
CREATE POLICY "Users can see budgets from their company"
  ON budgets FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. FUNCIONES
-- ============================================================================

-- Función: Contar facturas del mes
CREATE OR REPLACE FUNCTION count_invoices_this_month(company_uuid UUID)
RETURNS INT AS $$
  SELECT COUNT(*)::INT
  FROM invoices
  WHERE company_id = company_uuid
  AND DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE);
$$ LANGUAGE SQL;

-- Función: Obtener límite de plan
CREATE OR REPLACE FUNCTION get_plan_limit(company_uuid UUID, limit_name VARCHAR)
RETURNS INT AS $$
  SELECT 
    CASE 
      WHEN limit_name = 'max_invoices' THEN max_invoices_per_month
      WHEN limit_name = 'max_users' THEN max_users
      WHEN limit_name = 'max_branches' THEN max_branches
      WHEN limit_name = 'max_categories' THEN max_categories
      ELSE NULL
    END
  FROM plan_limits
  WHERE plan = (SELECT plan FROM subscriptions WHERE company_id = company_uuid);
$$ LANGUAGE SQL;

-- ============================================================================
-- 7. DATOS INICIALES (Límites de Planes)
-- ============================================================================

INSERT INTO plan_limits (plan, max_invoices_per_month, max_users, max_branches, max_categories, features) VALUES
('free', 10, 1, 1, 5, '{"invoices": true, "expenses": true, "incomes": true, "reports": true, "mobile_app": false}'),
('basic', 200, 5, 3, 15, '{"invoices": true, "expenses": true, "incomes": true, "reports": true, "mobile_app": true, "api": false}'),
('professional', 9999, 20, 10, 50, '{"invoices": true, "expenses": true, "incomes": true, "reports": true, "mobile_app": true, "api": true, "advanced_analytics": true}'),
('enterprise', 9999, 9999, 9999, 9999, '{"invoices": true, "expenses": true, "incomes": true, "reports": true, "mobile_app": true, "api": true, "advanced_analytics": true, "dedicated_support": true}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. COMENTARIOS
-- ============================================================================

COMMENT ON TABLE companies IS 'Empresas/organizaciones en la plataforma SaaS';
COMMENT ON TABLE subscriptions IS 'Suscripciones y planes de cada empresa';
COMMENT ON TABLE plan_limits IS 'Límites y características por plan';
COMMENT ON TABLE company_users IS 'Usuarios asignados a empresas con roles';
COMMENT ON TABLE expenses IS 'Gastos registrados por usuarios';
COMMENT ON TABLE incomes IS 'Ingresos registrados por usuarios';
COMMENT ON TABLE invoices IS 'Facturas subidas y procesadas';
COMMENT ON TABLE usage_metrics IS 'Métricas de uso para facturación y análisis';
COMMENT ON TABLE audit_logs IS 'Log de auditoría de todas las acciones';

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
