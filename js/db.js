// ============================================================================
// MÓDULO DE BASE DE DATOS - Operaciones Supabase
// ============================================================================

class DatabaseService {
  constructor() {
    this.supabase = null;
    this.init();
  }

  init() {
    this.supabase = authService.supabase;
  }

  /**
   * ==================== GASTOS ====================
   */

  async getExpenses(filters = {}) {
    try {
      const { companyId, branchId, categoryId, startDate, endDate } = filters;
      
      if (!companyId) throw new Error('Company ID required');
      
      let query = this.supabase
        .from('expenses')
        .select('*, expense_categories(*)')
        .eq('company_id', companyId)
        .order('date', { ascending: false });
      
      if (branchId) query = query.eq('branch_id', branchId);
      if (categoryId) query = query.eq('category_id', categoryId);
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  async createExpense(expenseData) {
    try {
      const { data, error } = await this.supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Registrar en auditoría
      await this.logAudit('CREATE', 'expenses', data.id);
      
      showNotification('success', MESSAGES.es.expense_created);
      return { success: true, data };
    } catch (error) {
      showNotification('error', MESSAGES.es.expense_error);
      return { success: false, error };
    }
  }

  async updateExpense(expenseId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('expenses')
        .update(updates)
        .eq('id', expenseId)
        .select()
        .single();
      
      if (error) throw error;
      
      await this.logAudit('UPDATE', 'expenses', expenseId, updates);
      showNotification('success', MESSAGES.es.expense_updated);
      return { success: true, data };
    } catch (error) {
      showNotification('error', MESSAGES.es.expense_error);
      return { success: false, error };
    }
  }

  async deleteExpense(expenseId) {
    try {
      const { error } = await this.supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      
      if (error) throw error;
      
      await this.logAudit('DELETE', 'expenses', expenseId);
      showNotification('success', MESSAGES.es.expense_deleted);
      return { success: true };
    } catch (error) {
      showNotification('error', MESSAGES.es.expense_error);
      return { success: false, error };
    }
  }

  /**
   * ==================== INGRESOS ====================
   */

  async getIncomes(filters = {}) {
    try {
      const { companyId, branchId, categoryId, startDate, endDate } = filters;
      
      if (!companyId) throw new Error('Company ID required');
      
      let query = this.supabase
        .from('incomes')
        .select('*, income_categories(*)')
        .eq('company_id', companyId)
        .order('date', { ascending: false });
      
      if (branchId) query = query.eq('branch_id', branchId);
      if (categoryId) query = query.eq('category_id', categoryId);
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting incomes:', error);
      return [];
    }
  }

  async createIncome(incomeData) {
    try {
      const { data, error } = await this.supabase
        .from('incomes')
        .insert([incomeData])
        .select()
        .single();
      
      if (error) throw error;
      
      await this.logAudit('CREATE', 'incomes', data.id);
      showNotification('success', MESSAGES.es.income_created);
      return { success: true, data };
    } catch (error) {
      showNotification('error', 'Error al crear ingreso');
      return { success: false, error };
    }
  }

  /**
   * ==================== FACTURAS ====================
   */

  async uploadInvoice(file, companyId, branchId) {
    try {
      showLoader();
      
      // Validar archivo
      if (!validateFileSize(file, 10)) return { success: false };
      if (!validateFileType(file, APP_CONFIG.allowedImageTypes)) return { success: false };
      
      // Procesar imagen
      const processedFile = await processImageForOCR(file);
      
      // Subir a Storage
      const fileName = `${companyId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(APP_CONFIG.storage.invoices)
        .upload(fileName, processedFile);
      
      if (uploadError) throw uploadError;
      
      // Crear registro en BD
      const { data: invoice, error: dbError } = await this.supabase
        .from('invoices')
        .insert([{
          company_id: companyId,
          branch_id: branchId,
          uploaded_by: authService.user.id,
          file_path: fileName,
          file_size: processedFile.size,
          file_type: processedFile.type
        }])
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      // Procesar OCR (aquí iría integración con Azure/Google Cloud)
      // await this.processInvoiceOCR(invoice.id);
      
      await this.logAudit('CREATE', 'invoices', invoice.id);
      hideLoader();
      showNotification('success', MESSAGES.es.invoice_uploaded);
      
      return { success: true, data: invoice };
    } catch (error) {
      hideLoader();
      showNotification('error', MESSAGES.es.invoice_error);
      console.error('Error uploading invoice:', error);
      return { success: false, error };
    }
  }

  async getInvoices(filters = {}) {
    try {
      const { companyId, branchId, startDate, endDate } = filters;
      
      if (!companyId) throw new Error('Company ID required');
      
      let query = this.supabase
        .from('invoices')
        .select('*')
        .eq('company_id', companyId)
        .order('invoice_date', { ascending: false });
      
      if (branchId) query = query.eq('branch_id', branchId);
      if (startDate) query = query.gte('invoice_date', startDate);
      if (endDate) query = query.lte('invoice_date', endDate);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting invoices:', error);
      return [];
    }
  }

  /**
   * ==================== CATEGORÍAS ====================
   */

  async getExpenseCategories(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('expense_categories')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting expense categories:', error);
      return [];
    }
  }

  async getIncomeCategories(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('income_categories')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting income categories:', error);
      return [];
    }
  }

  /**
   * ==================== PRESUPUESTOS ====================
   */

  async getBudgets(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('budgets')
        .select('*, expense_categories(*)')
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting budgets:', error);
      return [];
    }
  }

  async createBudget(budgetData) {
    try {
      const { data, error } = await this.supabase
        .from('budgets')
        .insert([budgetData])
        .select()
        .single();
      
      if (error) throw error;
      
      await this.logAudit('CREATE', 'budgets', data.id);
      showNotification('success', 'Presupuesto creado');
      return { success: true, data };
    } catch (error) {
      showNotification('error', 'Error al crear presupuesto');
      return { success: false, error };
    }
  }

  /**
   * ==================== USUARIOS ====================
   */

  async getCompanyUsers(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('company_users')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async inviteUser(email, role, companyId, branchId = null) {
    try {
      const { data, error } = await this.supabase
        .from('company_users')
        .insert([{
          auth_user_id: generateUUID(), // Será actualizado después de que se registre
          company_id: companyId,
          branch_id: branchId,
          email,
          role,
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // TODO: Enviar email de invitación
      
      showNotification('success', 'Usuario invitado');
      return { success: true, data };
    } catch (error) {
      showNotification('error', 'Error al invitar usuario');
      return { success: false, error };
    }
  }

  /**
   * ==================== SUCURSALES ====================
   */

  async getBranches(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('branches')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting branches:', error);
      return [];
    }
  }

  /**
   * ==================== SUSCRIPCIÓN ====================
   */

  async getSubscription(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  async checkPlanLimit(companyId, limitType) {
    try {
      const subscription = await this.getSubscription(companyId);
      if (!subscription) return true;
      
      const planLimits = SUBSCRIPTION_PLANS[subscription.plan];
      
      if (limitType === 'invoices') {
        const count = await this.countInvoicesThisMonth(companyId);
        const limit = planLimits.limits.invoices_per_month;
        return count < limit;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking plan limit:', error);
      return true;
    }
  }

  async countInvoicesThisMonth(companyId) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { count, error } = await this.supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .gte('invoice_date', startOfMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error counting invoices:', error);
      return 0;
    }
  }

  /**
   * ==================== REPORTES ====================
   */

  async getMonthlyReport(companyId, month) {
    try {
      const range = getMonthRange(month);
      
      const expenses = await this.getExpenses({
        companyId,
        startDate: range.start,
        endDate: range.end
      });
      
      const incomes = await this.getIncomes({
        companyId,
        startDate: range.start,
        endDate: range.end
      });
      
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalIncomes = incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);
      const balance = totalIncomes - totalExpenses;
      const savingsRate = totalIncomes > 0 ? (balance / totalIncomes * 100).toFixed(2) : 0;
      
      return {
        month,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalIncomes: parseFloat(totalIncomes.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        savingsRate: parseFloat(savingsRate),
        expenses,
        incomes
      };
    } catch (error) {
      console.error('Error generating report:', error);
      return null;
    }
  }

  /**
   * ==================== AUDITORÍA ====================
   */

  async logAudit(action, resourceType, resourceId, changes = null) {
    try {
      if (!authService.company) return;
      
      await this.supabase
        .from('audit_logs')
        .insert([{
          company_id: authService.company.id,
          user_id: authService.user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          changes: changes ? JSON.stringify(changes) : null,
          ip_address: '0.0.0.0' // TODO: Obtener IP real
        }]);
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  /**
   * ==================== MÉTRICAS ====================
   */

  async recordMetric(metricType, value, companyId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await this.supabase
        .from('usage_metrics')
        .upsert([{
          company_id: companyId,
          metric_type: metricType,
          metric_value: value,
          period_date: today
        }]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }
}

// Crear instancia global
const dbService = new DatabaseService();
