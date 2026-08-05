// ============================================
// FINANZAS SAAS - Lógica SaaS y Suscripciones
// ============================================

const SaaSManager = {
  // ============= GESTIÓN DE SUSCRIPCIONES =============

  async getSubscriptionStatus(companyId) {
    try {
      const subscription = await SupabaseService.getCompanySubscription(companyId);
      
      if (!subscription) {
        // Crear suscripción Free por defecto
        const plans = await SupabaseService.getPlans();
        const freePlan = plans.find(p => p.name === 'Free');
        await SupabaseService.createSubscription(companyId, freePlan.id);
        return await SupabaseService.getCompanySubscription(companyId);
      }

      return subscription;
    } catch (error) {
      console.error('Error obteniendo suscripción:', error);
      return null;
    }
  },

  async canProcessInvoice(companyId) {
    const subscription = await this.getSubscriptionStatus(companyId);
    
    if (!subscription || subscription.status !== 'active') {
      return { allowed: false, reason: 'Suscripción inactiva' };
    }

    // Si es ilimitado
    if (!subscription.plans.max_invoices_per_month) {
      return { allowed: true };
    }

    const monthInvoices = await SupabaseService.getMonthInvoiceCount(companyId);
    
    if (monthInvoices >= subscription.plans.max_invoices_per_month) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de ${subscription.plans.max_invoices_per_month} facturas para este mes`,
        current: monthInvoices,
        limit: subscription.plans.max_invoices_per_month
      };
    }

    return { allowed: true };
  },

  async getFeatureAccess(companyId, feature) {
    const subscription = await this.getSubscriptionStatus(companyId);
    
    if (!subscription) return false;

    const features = subscription.plans.features || {};
    
    return features[feature] === true;
  },

  // ============= PLANES DISPONIBLES =============

  async getAvailablePlans() {
    try {
      return await SupabaseService.getPlans();
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      return [];
    }
  },

  async getPlanComparison() {
    const plans = await this.getAvailablePlans();
    
    return {
      'Free': {
        price: 0,
        features: {
          invoices: '10/mes',
          users: '1',
          branches: '1',
          reports: 'Básicos',
          api: '❌',
          support: 'Community'
        }
      },
      'Basic': {
        price: 29.99,
        features: {
          invoices: '200/mes',
          users: '3',
          branches: '2',
          reports: 'Avanzados',
          api: '❌',
          support: 'Email'
        }
      },
      'Professional': {
        price: 99.99,
        features: {
          invoices: 'Ilimitadas',
          users: '10',
          branches: '5',
          reports: 'Avanzados',
          api: '✓',
          support: 'Email + Chat'
        }
      },
      'Enterprise': {
        price: 299.99,
        features: {
          invoices: 'Ilimitadas',
          users: 'Ilimitados',
          branches: 'Ilimitadas',
          reports: 'Avanzados + Personalizados',
          api: '✓ Premium',
          support: '24/7 Dedicado'
        }
      }
    };
  },

  // ============= LÍMITES DE USO =============

  async checkUserLimit(companyId) {
    const subscription = await this.getSubscriptionStatus(companyId);
    
    if (!subscription) return { allowed: false };
    
    if (!subscription.plans.max_users) {
      return { allowed: true, unlimited: true };
    }

    const members = await SupabaseService.getCompanyMembers(companyId);
    const activeUsers = members.filter(m => m.status === 'active').length;

    return {
      allowed: activeUsers < subscription.plans.max_users,
      current: activeUsers,
      limit: subscription.plans.max_users,
      unlimited: false
    };
  },

  async checkBranchLimit(companyId) {
    const subscription = await this.getSubscriptionStatus(companyId);
    
    if (!subscription) return { allowed: false };
    
    if (!subscription.plans.max_branches) {
      return { allowed: true, unlimited: true };
    }

    const branches = await SupabaseService.getCompanyBranches(companyId);

    return {
      allowed: branches.length < subscription.plans.max_branches,
      current: branches.length,
      limit: subscription.plans.max_branches,
      unlimited: false
    };
  },

  // ============= FACTURACIÓN STRIPE (Integración) =============

  async initiateStripePayment(companyId, planId) {
    try {
      const plan = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      // En producción, llamar a endpoint de Stripe
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          planId,
          planName: plan.data.name,
          amount: plan.data.price * 100 // Convertir a centavos
        })
      });

      const { sessionId } = await response.json();
      
      // Redirigir a Stripe Checkout
      if (window.Stripe) {
        const stripe = Stripe('pk_test_YOUR_STRIPE_KEY');
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error iniciando pago:', error);
      throw error;
    }
  },

  async handleStripeWebhook(event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.updateSubscriptionFromStripe(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.updateSubscriptionStatus(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object);
        break;
    }
  },

  // ============= REPORTE DE USO =============

  async generateUsageReport(companyId) {
    try {
      const subscription = await this.getSubscriptionStatus(companyId);
      const members = await SupabaseService.getCompanyMembers(companyId);
      const monthInvoices = await SupabaseService.getMonthInvoiceCount(companyId);
      const branches = await SupabaseService.getCompanyBranches(companyId);

      return {
        plan: subscription?.plans.name || 'N/A',
        status: subscription?.status || 'N/A',
        invoices: {
          current: monthInvoices,
          limit: subscription?.plans.max_invoices_per_month || '∞',
          percentage: subscription?.plans.max_invoices_per_month 
            ? Math.round((monthInvoices / subscription.plans.max_invoices_per_month) * 100)
            : 0
        },
        users: {
          current: members.length,
          limit: subscription?.plans.max_users || '∞',
          percentage: subscription?.plans.max_users
            ? Math.round((members.length / subscription.plans.max_users) * 100)
            : 0
        },
        branches: {
          current: branches.length,
          limit: subscription?.plans.max_branches || '∞',
          percentage: subscription?.plans.max_branches
            ? Math.round((branches.length / subscription.plans.max_branches) * 100)
            : 0
        },
        features: subscription?.plans.features || {},
        renewalDate: subscription?.renewal_date || 'N/A'
      };
    } catch (error) {
      console.error('Error generando reporte de uso:', error);
      return null;
    }
  },

  // ============= NOTIFICACIONES DE LÍMITES =============

  async checkAndNotifyLimits(companyId) {
    const usage = await this.generateUsageReport(companyId);
    
    if (!usage) return;

    const notifications = [];

    if (usage.invoices.percentage >= 80) {
      notifications.push({
        type: 'warning',
        message: `Alerta: Has utilizado el ${usage.invoices.percentage}% de tu límite de facturas`,
        action: 'upgrade'
      });
    }

    if (usage.users.percentage >= 90 && usage.users.limit !== '∞') {
      notifications.push({
        type: 'danger',
        message: `Alerta crítica: Solo ${usage.users.limit - usage.users.current} usuario(s) disponible(s)`,
        action: 'upgrade'
      });
    }

    if (usage.branches.percentage >= 100 && usage.branches.limit !== '∞') {
      notifications.push({
        type: 'danger',
        message: `Has alcanzado el límite de sucursales. Actualiza tu plan para agregar más`,
        action: 'upgrade'
      });
    }

    return notifications;
  },

  // ============= ANALYTICS =============

  async getAnalytics(companyId, period = 'month') {
    try {
      const [income, expenses, invoices, members] = await Promise.all([
        SupabaseService.getCompanyIncome(companyId),
        SupabaseService.getCompanyExpenses(companyId),
        SupabaseService.getCompanyInvoices(companyId),
        SupabaseService.getCompanyMembers(companyId)
      ]);

      const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const balance = totalIncome - totalExpenses;

      // Categorías
      const categories = {};
      expenses.forEach(e => {
        if (!categories[e.category]) categories[e.category] = 0;
        categories[e.category] += e.amount;
      });

      return {
        period,
        summary: {
          totalIncome,
          totalExpenses,
          balance,
          profitMargin: totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(2) : 0
        },
        invoices: {
          total: invoices.length,
          pending: invoices.filter(i => i.status === 'pending').length,
          approved: invoices.filter(i => i.status === 'approved').length,
          rejected: invoices.filter(i => i.status === 'rejected').length
        },
        team: {
          totalMembers: members.length,
          activeMembers: members.filter(m => m.status === 'active').length
        },
        topCategories: Object.entries(categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, amount]) => ({ name, amount }))
      };
    } catch (error) {
      console.error('Error obteniendo analytics:', error);
      return null;
    }
  },

  // ============= EXPORT DE DATOS =============

  async exportCompanyData(companyId, format = 'csv') {
    try {
      const [income, expenses, invoices, members] = await Promise.all([
        SupabaseService.getCompanyIncome(companyId),
        SupabaseService.getCompanyExpenses(companyId),
        SupabaseService.getCompanyInvoices(companyId),
        SupabaseService.getCompanyMembers(companyId)
      ]);

      if (format === 'csv') {
        return this.convertToCSV({
          income,
          expenses,
          invoices,
          members
        });
      } else if (format === 'json') {
        return JSON.stringify({
          exported_at: new Date().toISOString(),
          income,
          expenses,
          invoices,
          members
        }, null, 2);
      }
    } catch (error) {
      console.error('Error exportando datos:', error);
      throw error;
    }
  },

  convertToCSV(data) {
    let csv = 'INGRESOS\n';
    csv += 'Fecha,Descripción,Categoría,Monto\n';
    data.income.forEach(item => {
      csv += `${item.date},"${item.description}",${item.category},${item.amount}\n`;
    });

    csv += '\nGASTOS\n';
    csv += 'Fecha,Descripción,Categoría,Monto\n';
    data.expenses.forEach(item => {
      csv += `${item.date},"${item.description}",${item.category},${item.amount}\n`;
    });

    csv += '\nFACTURAS\n';
    csv += 'Proveedor,Monto,Estado,Fecha\n';
    data.invoices.forEach(item => {
      csv += `"${item.vendor_name}",${item.amount},"${item.status}",${item.invoice_date}\n`;
    });

    return csv;
  },

  // ============= DOWNGRADES =============

  async downgradeSubscription(companyId, newPlanId) {
    try {
      const currentSubscription = await SupabaseService.getCompanySubscription(companyId);
      const newPlan = await supabase
        .from('plans')
        .select('*')
        .eq('id', newPlanId)
        .single();

      // Validar compatibilidad
      const [members, branches, monthInvoices] = await Promise.all([
        SupabaseService.getCompanyMembers(companyId),
        SupabaseService.getCompanyBranches(companyId),
        SupabaseService.getMonthInvoiceCount(companyId)
      ]);

      const warnings = [];

      if (newPlan.data.max_users && members.length > newPlan.data.max_users) {
        warnings.push(`Tendrás que remover ${members.length - newPlan.data.max_users} usuario(s)`);
      }

      if (newPlan.data.max_branches && branches.length > newPlan.data.max_branches) {
        warnings.push(`Tendrás que eliminar ${branches.length - newPlan.data.max_branches} sucursal(es)`);
      }

      if (newPlan.data.max_invoices_per_month && monthInvoices > newPlan.data.max_invoices_per_month) {
        warnings.push(`Tu consumo mensual actual excedeería el nuevo límite`);
      }

      return {
        canDowngrade: warnings.length === 0,
        warnings,
        newPlan: newPlan.data
      };
    } catch (error) {
      console.error('Error verificando downgrade:', error);
      throw error;
    }
  }
};

// Hacer disponible globalmente
window.SaaSManager = SaaSManager;
