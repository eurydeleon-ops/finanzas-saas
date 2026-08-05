// ============================================================================
// MÓDULO DE UTILIDADES
// ============================================================================

/**
 * Mostrar notificación
 */
function showNotification(type, message, duration = 4000) {
  const container = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-message">${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">✕</button>
  `;
  
  container.appendChild(notification);
  
  setTimeout(() => notification.remove(), duration);
}

/**
 * Formatear moneda
 */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatear fecha corta
 */
function formatDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Obtener rango de fechas del mes
 */
function getMonthRange(dateString) {
  const date = new Date(dateString + '-01');
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

/**
 * Validar email
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validar contraseña
 */
function validatePassword(password) {
  return password.length >= 8;
}

/**
 * Generar UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Ocultar loader
 */
function hideLoader() {
  const loader = document.querySelector('.loader');
  if (loader) loader.style.display = 'none';
}

/**
 * Mostrar loader
 */
function showLoader() {
  let loader = document.querySelector('.loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
}

/**
 * Copiar al portapapeles
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('success', 'Copiado al portapapeles');
  } catch (error) {
    console.error('Error copiando:', error);
  }
}

/**
 * Descargar archivo JSON
 */
function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Descargar archivo CSV
 */
function downloadCSV(data, filename) {
  const headers = Object.keys(data[0] || {});
  const rows = data.map(obj => 
    headers.map(header => {
      const value = obj[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );
  
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Procesar imagen para OCR (redimensionar)
 */
async function processImageForOCR(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionar si es muy grande
        if (width > 2000 || height > 2000) {
          const scale = Math.min(2000 / width, 2000 / height);
          width *= scale;
          height *= scale;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validar tamaño de archivo
 */
function validateFileSize(file, maxSizeMB) {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    showNotification('error', `Archivo demasiado grande. Máximo: ${maxSizeMB}MB`);
    return false;
  }
  return true;
}

/**
 * Validar tipo de archivo
 */
function validateFileType(file, allowedTypes) {
  if (!allowedTypes.includes(file.type)) {
    showNotification('error', 'Tipo de archivo no permitido');
    return false;
  }
  return true;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Formatear número
 */
function formatNumber(num) {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Calcular porcentaje
 */
function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Obtener mes actual en formato YYYY-MM
 */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Formatear segundos a HH:MM:SS
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Obtener colores por categoría
 */
function getCategoryColor(categoryName) {
  const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  const category = allCategories.find(c => c.name === categoryName);
  return category?.color || COLORS.light;
}

/**
 * Calcular días transcurridos
 */
function daysAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const ms = now - date;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} semanas`;
  return `hace ${Math.floor(days / 30)} meses`;
}

/**
 * Validar que los datos no estén vacíos
 */
function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Intercalar dos arrays
 */
function interleaveArrays(arr1, arr2) {
  const result = [];
  for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
    if (i < arr1.length) result.push(arr1[i]);
    if (i < arr2.length) result.push(arr2[i]);
  }
  return result;
}

/**
 * Agrupar array por propiedad
 */
function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Detectar dispositivo móvil
 */
function isMobile() {
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Abrir modal
 */
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

/**
 * Cerrar modal
 */
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

/**
 * Cargar datos en select
 */
function populateSelect(selectId, data, valueKey = 'id', labelKey = 'name') {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '<option value="">Seleccionar...</option>';
  data.forEach(item => {
    const option = document.createElement('option');
    option.value = item[valueKey];
    option.textContent = item[labelKey];
    select.appendChild(option);
  });
}
