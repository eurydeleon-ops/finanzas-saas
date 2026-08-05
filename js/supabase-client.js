// ============================================
// FINANZAS SAAS - Supabase Client
// ============================================

// Configuración de Supabase
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Inicializar cliente
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============= UTILIDADES SUPABASE =============

const SupabaseService = {
  // ============= USUARIOS =============
  
  async signUpWithEmail(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    
    if (error) throw error;
    
    // Crear documento de usuario
    if (data.user) {
      await this.createUser(data.user.id, email, fullName);
    }
    
    return data;
  },

  async signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async createUser(userId, email, fullName) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email,
          full_name: fullName
        }
      ])
      .select();
    
    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    return data;
  },

  // ============= EMPRESAS =============

  async createCompany(ownerId, name, description, ruc, industry, country) {
    const { data, error } = await supabase
      .from('companies')
      .insert([
        {
          owner_id: ownerId,
          name,
          description,
          ruc,
          industry,
          country,
          currency: 'DOP'
        }
      ])
      .select();
    
    if (error) throw error;
    
    // Agregar al propietario como admin
    if (data && data[0]) {
      await this.addCompanyMember(data[0].id, ownerId, 1); // 1 = Admin role
    }
    
    return data;
  },

  async getUserCompanies(userId) {
    const { data, error } = await supabase
      .from('company_members')
      .select('company_id, companies(*), roles(*)')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) throw error;
    return data;
  },

  async getCompanyById(companyId) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCompany(companyId, updates) {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select();
    
    if (error) throw error;
    return data;
  },

  // ============= SUCURSALES =============

  async createBranch(companyId, name, address, city, phone, email, managerId) {
    const { data, error } = await supabase
      .from('branches')
      .insert([
        {
          company_id: companyId,
          name,
          address,
          city,
          phone,
          email,
          manager_id: managerId
        }
      ])
      .select();
    
    if (error) throw error;
    return data;
  },

  async getCompanyBranches(companyId) {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true);
    
    if (error) throw error;
    return data;
  },

  // ============= MIEMBROS DE EMPRESA =============

  async addCompanyMember(companyId, userId, roleId, branchId = null) {
    const { data, error } = await supabase
      .from('company_members')
      .insert([
        {
          company_id: companyId,
          user_id: userId,
          role_id: roleId,
          branch_id: branchId,
          status: 'active',
          joined_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) throw error;
    return data;
  },

  async getCompanyMembers(companyId) {
    const { data, error } = await supabase
      .from('company_members')
      .select('*, users(*), roles(*)')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data;
  },

  async getUserRole(companyId, userId) {
    const { data, error } = await supabase
      .from('company_members')
      .select('roles(*)')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data?.roles;
  },

  // ============= INGRESOS =============

  async createIncome(companyId, userId, description, amount, category, source, date, branchId = null) {
    const { data, error } = await supabase
      .from('income')
      .insert([
        {
          company_id: companyId,
          branch_id: branchId,
          user_id: userId,
          description,
          amount: parseFloat(amount),
          category,
          source,
          date
        }
      ])
      .select();
    
    if (error) throw error;
    return data;
  },

  async getCompanyIncome(companyId, limit = 100) {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('company_id', companyId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getIncomeStats(companyId) {
    const { data, error } = await supabase
      .from('income')
      .select('amount, category')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data;
  },

  // ============= GASTOS =============

  async createExpense(companyId, userId, description, amount, category, paymentMethod, date, branchId = null) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          company_id: companyId,
          branch_id: branchId,
          user_id: userId,
          description,
          amount: parseFloat(amount),
          category,
          payment_method: paymentMethod,
          date
        }
      ])
      .select();
    
    if (error) throw error;
    return data;
  },

  async getCompanyExpenses(companyId, limit = 100) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('company_id', companyId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getExpenseStats(companyId) {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount, category')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data;
  },

  // ============= FACTURAS =============

  async createInvoice(companyId, userId, imagePath, ocrData = {}, branchId = null) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          company_id: companyId,
          branch_id: branchId,
          user_id: userId,
          image_path: imagePath,
          image_url: null,
          ocr_data: ocrData,
          status: 'pending',
          invoice_date: ocrData.invoice_date || new Date().toISOString().split('T')[0],
          vendor_name: ocrData.vendor_name,
          amount: ocrData.amount || 0,
          tax: ocrData.tax || 0
        }
      ])
      .select();
    
    if (error) throw error;
    
    // Incrementar contador de uso
    if (data && data[0]) {
      await this.incrementInvoiceUsage(companyId);
    }
    
    return data;
  },

  async getCompanyInvoices(companyId, status = null) {
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('company_id', companyId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getMonthInvoiceCount(companyId) {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .eq('company_id', companyId)
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString());
    
    if (error) throw error;
    return data?.length || 0;
  },

  async updateInvoice(invoiceId, updates) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .select();
    
    if (error) throw error;
    return data;
  },

  // ============= SUSCRIPCIONES =============

  async getCompanySubscription(companyId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .single();
    
    if (error) return null;
    return data;
  },

  async createSubscription(companyId, planId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        {
          company_id: companyId,
          plan_id: planId,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          renewal_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
        }
      ])
      .select();
    
    if (error) throw error;
    return data;
  },

  async getPlans() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // ============= SUBIDA DE ARCHIVOS =============

  async uploadInvoiceImage(companyId, file) {
    const timestamp = Date.now();
    const fileName = `${companyId}/${timestamp}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(fileName, file);
    
    if (error) throw error;
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);
    
    return {
      path: data.path,
      url: publicUrl
    };
  },

  async deleteInvoiceImage(path) {
    const { error } = await supabase.storage
      .from('invoices')
      .remove([path]);
    
    if (error) throw error;
  },

  // ============= REPORTES =============

  async createReport(companyId, type, periodStart, periodEnd, data) {
    const { data: result, error } = await supabase
      .from('reports')
      .insert([
        {
          company_id: companyId,
          type,
          period_start: periodStart,
          period_end: periodEnd,
          data,
          generated_by: (await this.getCurrentUser())?.id
        }
      ])
      .select();
    
    if (error) throw error;
    return result;
  },

  async getCompanyReports(companyId, limit = 50) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // ============= AUDITORÍA =============

  async logActivity(companyId, userId, action, entityType, entityId, changes = {}) {
    const { error } = await supabase
      .from('audit_logs')
      .insert([
        {
          company_id: companyId,
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          changes,
          ip_address: await this.getUserIP()
        }
      ]);
    
    if (error) console.error('Error logging activity:', error);
  },

  async getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  },

  // ============= UTILIDADES DE INCREMENTO =============

  async incrementInvoiceUsage(companyId) {
    const subscription = await this.getCompanySubscription(companyId);
    if (!subscription) return;

    const now = new Date();
    const monthDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('invoice_usage')
      .select('id, count')
      .eq('subscription_id', subscription.id)
      .eq('month', monthDate)
      .single();

    if (existing) {
      await supabase
        .from('invoice_usage')
        .update({ count: existing.count + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('invoice_usage')
        .insert([
          {
            subscription_id: subscription.id,
            month: monthDate,
            count: 1
          }
        ]);
    }
  },

  // ============= LISTENER DE AUTENTICACIÓN =============

  onAuthStateChanged(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Hacer disponible globalmente
window.SupabaseService = SupabaseService;
