/**
 * PAYPAL INTEGRATION FOR FINANZAS SAAS
 * Sistema de pagos con PayPal + BanReservas
 */

class PayPalManager {
  constructor() {
    this.clientId = 'ARat5aSmQfC1t7KnR3gtjspZM8F1-BZ9GG_czDY6IKpLtgTL58cGEfm4oaqf5NZ5Y3tu0BQ8LgqgWiKD';
    this.currency = 'USD';
    this.initPayPalScript();
  }

  /**
   * Inicializa el script de PayPal
   */
  initPayPalScript() {
    if (document.getElementById('paypal-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${this.clientId}&currency=${this.currency}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('✅ PayPal cargado correctamente');
    };

    script.onerror = () => {
      console.error('❌ Error cargando PayPal');
    };

    document.head.appendChild(script);
  }

  /**
   * Crea un botón de PayPal para un plan
   */
  createPayPalButton(containerId, planData) {
    if (!window.paypal) {
      console.error('PayPal no está cargado');
      return;
    }

    window.paypal.Buttons({
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              currency_code: this.currency,
              value: planData.price.toString()
            },
            description: `${planData.name} - ${planData.monthly_invoices} facturas/mes`
          }],
          intent: 'CAPTURE'
        });
      },

      onApprove: async (data, actions) => {
        try {
          const order = await actions.order.capture();
          
          // Guardar en Supabase
          await this.savePayPalPayment({
            orderId: order.id,
            planId: planData.id,
            amount: planData.price,
            status: 'COMPLETED',
            paymentMethod: 'paypal'
          });

          showNotification('success', '✅ Pago completado con PayPal');
          
          // Redirigir o actualizar
          setTimeout(() => {
            location.reload();
          }, 2000);

        } catch (error) {
          console.error('Error procesando pago:', error);
          showNotification('error', '❌ Error procesando pago');
        }
      },

      onError: (err) => {
        console.error('PayPal error:', err);
        showNotification('error', '❌ Error con PayPal');
      }
    }).render(`#${containerId}`);
  }

  /**
   * Guarda el pago de PayPal en Supabase
   */
  async savePayPalPayment(paymentData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          plan_id: paymentData.planId,
          amount: paymentData.amount,
          payment_method: 'paypal',
          paypal_order_id: paymentData.orderId,
          status: 'completed',
          requested_at: new Date().toISOString(),
          approved_at: new Date().toISOString()
        });

      if (error) throw error;

      // Activar suscripción automáticamente
      await this.activateSubscription(paymentData.planId);

      return data;

    } catch (error) {
      console.error('Error guardando pago:', error);
      throw error;
    }
  }

  /**
   * Activa la suscripción automáticamente después del pago
   */
  async activateSubscription(planId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          started_at: new Date().toISOString(),
          status: 'active'
        });

      if (error) throw error;

      console.log('✅ Suscripción activada automáticamente');
      return data;

    } catch (error) {
      console.error('Error activando suscripción:', error);
    }
  }

  /**
   * Muestra opciones de pago: PayPal o BanReservas
   */
  displayPaymentOptions(planData) {
    const html = `
      <div class="payment-options">
        <h3>Elige método de pago:</h3>
        
        <div class="payment-method">
          <h4>💳 PayPal</h4>
          <p>Pago inmediato y seguro</p>
          <div id="paypal-button-${planData.id}"></div>
        </div>

        <div class="payment-method">
          <h4>🏦 Transferencia Bancaria</h4>
          <p>BanReservas - Cuenta: 9600833955</p>
          <button class="btn btn-secondary" onclick="showBankTransferInstructions('${planData.id}')">
            Ver instrucciones
          </button>
        </div>
      </div>
    `;

    return html;
  }
}

// Instanciar PayPalManager globalmente
const paypalManager = new PayPalManager();

// Función auxiliar para mostrar instrucciones de transferencia
function showBankTransferInstructions(planId) {
  showNotification('info', `
    Banco: BanReservas
    Cuenta: 9600833955
    Tipo: Ahorro
    Moneda: USD
  `);
}
