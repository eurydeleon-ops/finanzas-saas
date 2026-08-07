// ============================================================================
// CONFIGURACIÓN - Supabase & Constantes de la Aplicación
// ============================================================================

// REEMPLAZA ESTAS VARIABLES CON TUS CREDENCIALES DE SUPABASE
const SUPABASE_CONFIG = {
  url: 'https://xvdxyvjubvsgtbcttrfs.supabase.co',
  anonKey: 'sb_publishable__-uzRd3PyPVu18SWMt2Pmg_8uCWfhs9',
  apiKey: 'sb_publishable__-uzRd3PyPVu18SWMt2Pmg_8uCWfhs9'
};

// Google OAuth (copia del proyecto Google Cloud Console)
const GOOGLE_CONFIG = {
  clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  scope: 'openid profile email'
};

// Configuración de Stripe (opcional para pagos)
const STRIPE_CONFIG = {
  publishableKey: 'pk_test_YOUR_STRIPE_KEY',
  priceIds: {
    basic: 'price_xxxxx_basic',
    professional: 'price_xxxxx_professional',
    enterprise: 'price_xxxxx_enterprise'
  }
};

// ============================================================================
// CONSTANTES DE PLANES
// ============================================================================

const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Gratis',
    price: 0,
    billing_cycle: null,
    limits: {
      invoices_per_month: 10,
      users: 1,
      branches: 1,
      categories: 5
    },
    features: {
      expenses: true,
      incomes: true,
      invoices: true,
      reports: true,
      analytics: false,
      api: false,
      support: 'email'
    }
  },
  basic: {
    name: 'Básico',
    price: 9.99,
    currency: 'USD',
    billing_cycle: 'monthly',
    limits: {
      invoices_per_month: 200,
      users: 5,
      branches: 3,
      categories: 15
    },
    features: {
      expenses: true,
      incomes: true,
      invoices: true,
      reports: true,
      analytics: true,
      api: false,
      support: 'email'
    }
  },
  professional: {
    name: 'Profesional',
    price: 9.99,
    currency: 'USD',
    billing_cycle: 'monthly',
    limits: {
      invoices_per_month: 9999,
      users: 20,
      branches: 10,
      categories: 50
    },
    features: {
      expenses: true,
      incomes: true,
      invoices: true,
      reports: true,
      analytics: true,
      api: true,
      support: 'priority'
    }
  },
  enterprise: {
    name: 'Empresarial',
    price: null,
    billing_cycle: 'custom',
    limits: {
      invoices_per_month: 9999,
      users: 9999,
      branches: 9999,
      categories: 9999
    },
    features: {
      expenses: true,
      incomes: true,
      invoices: true,
      reports: true,
      analytics: true,
      api: true,
      support: 'dedicated'
    }
  }
};

// ============================================================================
// CONSTANTES DE ROLES
// ============================================================================

const USER_ROLES = {
  owner: {
    name: 'Propietario',
    description: 'Control total sobre la empresa',
    permissions: ['all']
  },
  admin: {
    name: 'Administrador',
    description: 'Gestión de usuarios, configuración',
    permissions: ['manage_users', 'manage_branches', 'view_reports', 'approve_expenses', 'manage_settings']
  },
  supervisor: {
    name: 'Supervisor',
    description: 'Supervisa usuarios y aprueba transacciones',
    permissions: ['view_reports', 'approve_expenses', 'manage_users_limited']
  },
  user: {
    name: 'Usuario',
    description: 'Registra transacciones',
    permissions: ['create_expenses', 'create_incomes', 'upload_invoices', 'view_own_data']
  }
};

// ============================================================================
// CONSTANTES DE CATEGORÍAS PREDEFINIDAS
// ============================================================================

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentación', icon: '🍽️', color: '#FF6B6B' },
  { name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
  { name: 'Servicios', icon: '💡', color: '#FFE66D' },
  { name: 'Salud', icon: '⚕️', color: '#95E1D3' },
  { name: 'Entretenimiento', icon: '🎮', color: '#C7CEEA' },
  { name: 'Educación', icon: '📚', color: '#A8D8EA' },
  { name: 'Vivienda', icon: '🏠', color: '#C38D9E' },
  { name: 'Otros', icon: '📋', color: '#888888' }
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salario', icon: '💰', color: '#059669' },
  { name: 'Ventas', icon: '💳', color: '#0891B2' },
  { name: 'Inversiones', icon: '📈', color: '#7C3AED' },
  { name: 'Freelance', icon: '💻', color: '#EC4899' },
  { name: 'Otros', icon: '📋', color: '#888888' }
];

// ============================================================================
// CONSTANTES DE APLICACIÓN
// ============================================================================

const APP_CONFIG = {
  appName: 'Finanzas SaaS',
  version: '1.0.0',
  locale: 'es-MX',
  currency: 'USD',
  dateFormat: 'dd/MM/yyyy',
  theme: 'light', // 'light' o 'dark'
  
  // Limitaciones de upload
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Configuración de API
  apiTimeout: 30000, // ms
  retryAttempts: 3,
  
  // Rutas de la aplicación
  routes: {
    login: '/',
    dashboard: '/dashboard.html',
    expenses: '/expenses.html',
    incomes: '/incomes.html',
    invoices: '/invoices.html',
    admin: '/admin.html',
    settings: '/settings.html'
  },
  
  // Paths de Storage
  storage: {
    invoices: 'invoices',
    logos: 'logos',
    avatars: 'avatars'
  }
};

// ============================================================================
// CONSTANTES DE COLORES (Diseño)
// ============================================================================

const COLORS = {
  primary: '#1e40af',      // Azul profesional
  secondary: '#0891b2',    // Celeste
  success: '#059669',      // Verde
  danger: '#dc2626',       // Rojo
  warning: '#ea580c',      // Naranja
  info: '#0284c7',         // Azul claro
  light: '#f3f4f6',        // Gris muy claro
  dark: '#1f2937',         // Gris oscuro
  white: '#ffffff',
  text: '#111827',
  border: '#e5e7eb',
  shadow: 'rgba(0, 0, 0, 0.1)'
};

// ============================================================================
// CONSTANTES DE MENSAJES
// ============================================================================

const MESSAGES = {
  es: {
    // Autenticación
    login_success: 'Sesión iniciada correctamente',
    login_error: 'Error al iniciar sesión',
    logout_success: 'Sesión cerrada',
    registration_success: 'Cuenta creada. Por favor inicia sesión.',
    
    // Gastos
    expense_created: 'Gasto registrado',
    expense_updated: 'Gasto actualizado',
    expense_deleted: 'Gasto eliminado',
    expense_error: 'Error al procesar gasto',
    
    // Ingresos
    income_created: 'Ingreso registrado',
    income_updated: 'Ingreso actualizado',
    income_deleted: 'Ingreso eliminado',
    
    // Facturas
    invoice_uploaded: 'Factura subida correctamente',
    invoice_processing: 'Procesando factura...',
    invoice_error: 'Error al subir factura',
    
    // Errores comunes
    error_network: 'Error de conexión. Intenta nuevamente.',
    error_permission: 'No tienes permiso para esta acción',
    error_validation: 'Completa los campos requeridos',
    error_duplicate: 'Este registro ya existe',
    
    // Confirmaciones
    confirm_delete: '¿Estás seguro? Esta acción no se puede deshacer.',
    confirm_logout: '¿Deseas cerrar sesión?'
  }
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene la configuración actual
 */
function getConfig() {
  return {
    supabase: SUPABASE_CONFIG,
    google: GOOGLE_CONFIG,
    stripe: STRIPE_CONFIG,
    app: APP_CONFIG,
    plans: SUBSCRIPTION_PLANS,
    roles: USER_ROLES,
    colors: COLORS,
    messages: MESSAGES.es
  };
}

/**
 * Valida que las credenciales están configuradas
 */
function validateConfig() {
  const errors = [];
  
  if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url.includes('YOUR_')) {
    errors.push('Supabase URL no configurada');
  }
  if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey.includes('YOUR_')) {
    errors.push('Supabase ANON_KEY no configurada');
  }
  if (!GOOGLE_CONFIG.clientId || GOOGLE_CONFIG.clientId.includes('YOUR_')) {
    console.warn('Google OAuth no configurada (opcional)');
  }
  
  if (errors.length > 0) {
    console.error('Errores de configuración:');
    errors.forEach(e => console.error(`- ${e}`));
  }
  
  return errors.length === 0;
}

// Validar configuración al cargar
if (typeof window !== 'undefined') {
  validateConfig();
}
