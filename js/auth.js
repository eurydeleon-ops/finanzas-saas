// ============================================================================
// MÓDULO DE AUTENTICACIÓN - Supabase Auth + Google OAuth
// ============================================================================

class AuthService {
  constructor() {
    this.supabase = null;
    this.user = null;
    this.company = null;
    this.userRole = null;
    this.initializeSupabase();
  }

  /**
   * Inicializa cliente Supabase
   */
  initializeSupabase() {
    if (typeof supabase === 'undefined') {
      console.error('Supabase no está cargado. Incluye @supabase/supabase-js en el HTML');
      return;
    }
    
    this.supabase = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );
    
    // Restaurar sesión existente
    this.restoreSession();
    
    // Escuchar cambios de autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.user = session.user;
        this.loadUserCompany();
        document.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: true } }));
      } else {
        this.user = null;
        this.company = null;
        document.dispatchEvent(new CustomEvent('auth-change', { detail: { authenticated: false } }));
      }
    });
  }

  /**
   * Restaura sesión del almacenamiento local
   */
  async restoreSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        this.user = session.user;
        await this.loadUserCompany();
      }
    } catch (error) {
      console.error('Error al restaurar sesión:', error);
    }
  }

  /**
   * Login con correo y contraseña
   */
  async loginWithEmail(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw new Error(error.message);
      
      this.user = data.user;
      await this.loadUserCompany();
      
      showNotification('success', MESSAGES.es.login_success);
      return { success: true, user: this.user };
    } catch (error) {
      showNotification('error', `${MESSAGES.es.login_error}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Registro con correo y contraseña
   */
  async registerWithEmail(email, password, fullName) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      
      if (error) throw new Error(error.message);
      
      showNotification('success', MESSAGES.es.registration_success);
      return { success: true, user: data.user };
    } catch (error) {
      showNotification('error', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Login con Google OAuth
   */
  async loginWithGoogle() {
    try {
      // Para desarrollo local
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('En desarrollo local, saltando OAuth');
        return { success: false, error: 'Usa email/password en desarrollo' };
      }
      
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard.html`
        }
      });
      
      if (error) throw new Error(error.message);
      
      return { success: true };
    } catch (error) {
      showNotification('error', `Error al iniciar con Google: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cargar empresa del usuario
   */
  async loadUserCompany() {
    if (!this.user) return;
    
    try {
      // Obtener empresa del usuario
      const { data: userData, error } = await this.supabase
        .from('company_users')
        .select('*, companies(*)')
        .eq('auth_user_id', this.user.id)
        .limit(1)
        .single();
      
      if (error) {
        console.log('Usuario sin empresa aún');
        return;
      }
      
      this.company = userData.companies;
      this.userRole = userData.role;
      
      return { company: this.company, role: this.userRole };
    } catch (error) {
      console.error('Error cargando empresa:', error);
    }
  }

  /**
   * Crear empresa nueva
   */
  async createCompany(companyData) {
    if (!this.user) throw new Error('Usuario no autenticado');
    
    try {
      // 1. Crear empresa
      const { data: company, error: companyError } = await this.supabase
        .from('companies')
        .insert({
          owner_id: this.user.id,
          name: companyData.name,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address
        })
        .select()
        .single();
      
      if (companyError) throw new Error(companyError.message);
      
      // 2. Crear suscripción (plan gratis por defecto)
      const { data: subscription, error: subError } = await this.supabase
        .from('subscriptions')
        .insert({
          company_id: company.id,
          plan: 'free',
          status: 'active'
        })
        .select()
        .single();
      
      if (subError) throw new Error(subError.message);
      
      // 3. Agregar usuario a empresa como owner
      const { data: userCompany, error: ucError } = await this.supabase
        .from('company_users')
        .insert({
          auth_user_id: this.user.id,
          company_id: company.id,
          email: this.user.email,
          full_name: companyData.name,
          role: 'owner'
        })
        .select()
        .single();
      
      if (ucError) throw new Error(ucError.message);
      
      // 4. Crear categorías predefinidas
      await this.createDefaultCategories(company.id);
      
      this.company = company;
      this.userRole = 'owner';
      
      showNotification('success', 'Empresa creada correctamente');
      return { success: true, company };
    } catch (error) {
      showNotification('error', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear categorías predefinidas
   */
  async createDefaultCategories(companyId) {
    try {
      // Gastos
      const expenseInserts = DEFAULT_EXPENSE_CATEGORIES.map(cat => ({
        company_id: companyId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_active: true
      }));
      
      await this.supabase
        .from('expense_categories')
        .insert(expenseInserts);
      
      // Ingresos
      const incomeInserts = DEFAULT_INCOME_CATEGORIES.map(cat => ({
        company_id: companyId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_active: true
      }));
      
      await this.supabase
        .from('income_categories')
        .insert(incomeInserts);
    } catch (error) {
      console.error('Error creando categorías:', error);
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      this.user = null;
      this.company = null;
      this.userRole = null;
      
      showNotification('success', MESSAGES.es.logout_success);
      return { success: true };
    } catch (error) {
      showNotification('error', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cambiar contraseña
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      showNotification('success', 'Contraseña actualizada');
      return { success: true };
    } catch (error) {
      showNotification('error', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Recuperar contraseña
   */
  async resetPassword(email) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`
      });
      
      if (error) throw error;
      
      showNotification('success', 'Correo de recuperación enviado');
      return { success: true };
    } catch (error) {
      showNotification('error', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar si usuario está autenticado
   */
  isAuthenticated() {
    return this.user !== null;
  }

  /**
   * Verificar si usuario tiene permiso para acción
   */
  hasPermission(permission) {
    if (!this.userRole) return false;
    
    const rolePermissions = USER_ROLES[this.userRole]?.permissions || [];
    
    // Owner tiene todos los permisos
    if (this.userRole === 'owner') return true;
    
    // Verificar si tiene permiso específico
    return rolePermissions.includes(permission) || rolePermissions.includes('all');
  }

  /**
   * Obtener datos del usuario actual
   */
  getCurrentUser() {
    return {
      user: this.user,
      company: this.company,
      role: this.userRole
    };
  }
}

// Crear instancia global
const authService = new AuthService();

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Redirigir si no está autenticado
 */
function requireAuth() {
  if (!authService.isAuthenticated()) {
    window.location.href = '/';
  }
}

/**
 * Redirigir si está autenticado (para login page)
 */
function requireNotAuth() {
  if (authService.isAuthenticated()) {
    window.location.href = '/dashboard.html';
  }
}

/**
 * Verificar permisos
 */
function requirePermission(permission) {
  if (!authService.hasPermission(permission)) {
    showNotification('error', MESSAGES.es.error_permission);
    return false;
  }
  return true;
}
