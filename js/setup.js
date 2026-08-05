// ============================================================================
// SETUP AUTOMÁTICO - Configura Supabase sin tocar archivos
// ============================================================================

class SupabaseSetup {
  constructor() {
    this.setupModal = null;
    this.checkConfiguration();
  }

  checkConfiguration() {
    // Si ya está configurado, no mostrar modal
    if (this.isConfigured()) {
      console.log('✅ Supabase ya configurado');
      return;
    }

    // Mostrar modal de configuración
    this.showSetupModal();
  }

  isConfigured() {
    return (
      SUPABASE_CONFIG.url !== 'https://YOUR_SUPABASE_URL.supabase.co' &&
      SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
    );
  }

  showSetupModal() {
    const modal = document.createElement('div');
    modal.id = 'setup-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <h1 style="
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 16px 0;
          color: #1e40af;
        ">🔗 Conectar a Supabase</h1>
        
        <p style="
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
          line-height: 1.6;
        ">
          Necesito tus credenciales de Supabase para conectar la aplicación.
          <br/><strong>No se guardarán</strong>, solo se usarán para esta sesión.
        </p>

        <div style="margin-bottom: 16px;">
          <label style="
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1f2937;
          ">Project URL</label>
          <input 
            type="text" 
            id="supabase-url" 
            placeholder="https://xxxxx.supabase.co"
            style="
              width: 100%;
              padding: 12px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
              box-sizing: border-box;
            "
          />
          <small style="color: #9ca3af; font-size: 12px; margin-top: 4px; display: block;">
            Lo encuentras en Supabase → Settings → API
          </small>
        </div>

        <div style="margin-bottom: 24px;">
          <label style="
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1f2937;
          ">Anon Public Key</label>
          <input 
            type="password" 
            id="supabase-key" 
            placeholder="eyJ0..."
            style="
              width: 100%;
              padding: 12px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
              box-sizing: border-box;
              font-family: monospace;
            "
          />
          <small style="color: #9ca3af; font-size: 12px; margin-top: 4px; display: block;">
            Es seguro compartir - es una llave pública
          </small>
        </div>

        <button id="setup-save" style="
          width: 100%;
          padding: 12px;
          background: #1e40af;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        ">Conectar Supabase</button>

        <p style="
          font-size: 12px;
          color: #9ca3af;
          margin-top: 16px;
          text-align: center;
        ">
          <a href="https://supabase.com" target="_blank" style="color: #0891b2; text-decoration: none;">
            ¿No tienes proyecto? Crear uno →
          </a>
        </p>
      </div>
    `;

    document.body.appendChild(modal);
    this.setupModal = modal;

    // Event listeners
    document.getElementById('setup-save').addEventListener('click', () => this.saveConfiguration());
    document.getElementById('supabase-url').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveConfiguration();
    });
  }

  saveConfiguration() {
    const url = document.getElementById('supabase-url').value.trim();
    const key = document.getElementById('supabase-key').value.trim();

    if (!url || !key) {
      alert('❌ Por favor completa ambos campos');
      return;
    }

    if (!url.includes('supabase.co')) {
      alert('❌ URL inválida. Debe contener "supabase.co"');
      return;
    }

    if (key.length < 20) {
      alert('❌ Key demasiado corta. Copia la completa desde Supabase');
      return;
    }

    // Actualizar config global
    SUPABASE_CONFIG.url = url;
    SUPABASE_CONFIG.anonKey = key;

    // Guardar en localStorage (opcional)
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);

    // Cerrar modal
    this.setupModal.remove();

    // Reinicializar Supabase
    authService.initializeSupabase();

    showNotification('success', '✅ Supabase conectado correctamente');

    console.log('✅ Configuración guardada:');
    console.log('   URL:', url);
    console.log('   Key (primeros 20 chars):', key.substring(0, 20) + '...');
  }
}

// Inicializar setup cuando el documento carga
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SupabaseSetup();
  });
} else {
  new SupabaseSetup();
}

// Permitir también cargar desde localStorage si existen credenciales guardadas
function loadSupabaseFromStorage() {
  const url = localStorage.getItem('supabase_url');
  const key = localStorage.getItem('supabase_key');

  if (url && key) {
    SUPABASE_CONFIG.url = url;
    SUPABASE_CONFIG.anonKey = key;
    return true;
  }
  return false;
}

// Ejecutar al cargar
loadSupabaseFromStorage();
