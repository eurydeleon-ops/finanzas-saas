// ============================================
// MANEJO DE SUSCRIPCIONES - finanzas-saas
// ============================================

class SubscriptionsManager {
  constructor() {
    this.supabaseClient = null;
    this.plans = [];
    this.currentUser = null;
    this.currentSubscription = null;
  }

  async init(supabaseClient) {
    this.supabaseClient = supabaseClient;
    await this.loadPlans();
    await this.checkCurrentSubscription();
  }

  async loadPlans() {
    try {
      const { data, error } = await this.supabaseClient
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      this.plans = data || [];
      return this.plans;
    } catch (error) {
      console.error('Error cargando planes:', error);
      return [];
    }
  }

  getPlanById(planId) {
    return this.plans.find(p => p.id === planId);
  }

  getAllPlans() {
    return this.plans;
  }

  async checkCurrentSubscription() {
    try {
      const { data: { user } } = await this.supabaseClient.auth.getUser();
      if (!user) return null;

      this.currentUser = user;

      const { data, error } = await this.supabaseClient
        .from('user_subscriptions')
        .select('*, plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      this.currentSubscription = data || null;
      return this.currentSubscription;
    } catch (error) {
      console.error('Error verificando suscripción:', error);
      return null;
    }
  }

  async createSubscription(userId, planId, paymentId, paymentStatus = 'completed') {
    try {
      const now = new Date();
      const expiryDate = new Date(now.setMonth(now.getMonth() + 1));

      const { data, error } = await this.supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: expiryDate.toISOString(),
          payment_id: paymentId,
          payment_status: paymentStatus,
          auto_renewal: true
        })
        .select();

      if (error) throw error;
      this.currentSubscription = data[0];
      return data[0];
    } catch (error) {
      console.error('Error creando suscripción:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const { data, error } = await this.supabaseClient
        .from('user_subscriptions')
        .update({ status: 'cancelled', auto_renewal: false })
        .eq('id', subscriptionId)
        .select();

      if (error) throw error;
      this.currentSubscription = null;
      return data[0];
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      throw error;
    }
  }

  hasAccess(feature) {
    if (!this.currentSubscription) return false;
    const plan = this.currentSubscription.plans;
    if (!plan) return false;
    const features = plan.features ? JSON.parse(plan.features) : {};
    return features[feature] === true;
  }

  getPlanLimits() {
    if (!this.currentSubscription) return null;
    return {
      invoices: this.currentSubscription.plans.max_invoices_per_month,
      users: this.currentSubscription.plans.max_users,
      branches: this.currentSubscription.plans.max_branches
    };
  }

  async recordPayment(userId, planId, paymentDetails) {
    try {
      const { data, error } = await this.supabaseClient
        .from('payment_requests')
        .insert({
          user_id: userId,
          plan_id: planId,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency || 'USD',
          payment_method: paymentDetails.method || 'paypal',
          payment_id: paymentDetails.payment_id,
          status: 'completed',
          description: 'Suscripción SaaS'
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error registrando pago:', error);
      throw error;
    }
  }
}

let subscriptionsManager = new SubscriptionsManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SubscriptionsManager;
}
