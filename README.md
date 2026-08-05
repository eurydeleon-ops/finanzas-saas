# 💰 Finanzas SaaS - Plataforma de Gestión Financiera Empresarial

Plataforma SaaS multiempresa, multiusuario y lista para producción con PWA, Supabase y despliegue en Azure.

## ✨ Características Principales

### 🏢 Multiempresa
- Crear múltiples empresas con roles diferentes
- Sucursales por empresa
- Usuarios con roles específicos (Owner, Admin, Supervisor, User)
- Aislamiento de datos por empresa (Row Level Security)

### 💳 Planes de Suscripción
- **Gratis**: 10 facturas/mes, 1 usuario
- **Básico**: 200 facturas/mes, 5 usuarios
- **Profesional**: Facturas ilimitadas, 20 usuarios
- **Empresarial**: Personalizado

### 📊 Funcionalidades
- Dashboard con gráficos interactivos
- Registro de gastos e ingresos
- Gestión de facturas con OCR
- Presupuestos y alertas
- Reportes (PDF, JSON, CSV)
- Panel administrativo
- Auditoría completa

### 📱 PWA (Progressive Web App)
- Instable en Android e iOS
- Funciona offline
- Sincronización automática
- Notificaciones push

### 🔒 Seguridad
- Autenticación con Google OAuth
- Email/Contraseña con JWT
- Row Level Security (RLS) en Supabase
- Encriptación de datos

## 🚀 Inicio Rápido

### Requisitos Previos
- Cuenta Supabase ([supabase.com](https://supabase.com))
- Proyecto Google Cloud para OAuth (opcional)
- Cuenta Azure (para despliegue)

### 1. Crear Proyecto Supabase

```bash
# 1. Crear proyecto en supabase.com
# 2. Copiar credenciales:
#    - URL
#    - ANON KEY (para cliente público)

# 3. Ejecutar schema SQL
# - Ir a SQL Editor en Supabase
# - Crear nuevo query
# - Copiar contenido de sql/schema.sql
# - Ejecutar

# 4. Configurar Storage
# - Ir a Storage
# - Crear bucket: "invoices"
# - Configurar acceso público
```

### 2. Configurar Aplicación

```bash
# 1. Editar js/config.js
SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT.supabase.co',
  anonKey: 'YOUR_ANON_KEY'
}

# 2. (Opcional) Configurar Google OAuth
GOOGLE_CONFIG = {
  clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com'
}
```

### 3. Desplegar en Azure

```bash
# 1. Crear repositorio GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/finanzas-saas.git
git push -u origin main

# 2. Crear Static Web App en Azure Portal
# - Static Web Apps
# - Crear recurso
# - Conectar GitHub
# - Rama: main
# - Ubicación de compilación: /
# - Configuración: automática

# 3. URL accesible en: https://tu-app.azurestaticapps.net
```

## 📁 Estructura del Proyecto

```
finanzas-saas/
├── index.html              # SPA principal
├── js/
│   ├── config.js          # Configuración global
│   ├── utils.js           # Funciones auxiliares
│   ├── auth.js            # Autenticación
│   ├── db.js              # Operaciones DB
│   └── app.js             # Lógica principal
├── css/
│   └── styles.css         # Estilos
├── sql/
│   └── schema.sql         # Schema PostgreSQL
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker
├── staticwebapp.config.json # Configuración Azure
├── README.md              # Este archivo
└── .gitignore
```

## 🔐 Configuración de Supabase

### Tablas Principales
- `companies` - Empresas
- `company_users` - Usuarios por empresa
- `subscriptions` - Planes de suscripción
- `expenses` - Gastos
- `incomes` - Ingresos
- `invoices` - Facturas subidas
- `branches` - Sucursales
- `budgets` - Presupuestos
- `audit_logs` - Registro de auditoría
- `usage_metrics` - Métricas de uso

### Row Level Security (RLS)
- Los usuarios solo ven datos de su empresa
- Los datos se filtran automáticamente
- Políticas configuradas en schema.sql

## 🎨 Personalización

### Colores
Editar en `css/styles.css`:
```css
:root {
  --color-primary: #1e40af;
  --color-success: #059669;
  --color-danger: #dc2626;
  ...
}
```

### Textos
Editar en `js/config.js`:
```javascript
const MESSAGES = {
  es: {
    login_success: 'Sesión iniciada...',
    ...
  }
}
```

### Categorías Predefinidas
En `js/config.js`:
```javascript
const DEFAULT_EXPENSE_CATEGORIES = [...]
const DEFAULT_INCOME_CATEGORIES = [...]
```

## 📚 API & Integración

### Autenticación
```javascript
// Login con email
const result = await authService.loginWithEmail(email, password);

// Crear empresa
const result = await authService.createCompany({
  name: 'Mi Empresa',
  email: 'contacto@empresa.com'
});

// Logout
await authService.logout();
```

### Base de Datos
```javascript
// Crear gasto
const result = await dbService.createExpense({
  company_id: companyId,
  created_by: userId,
  category_id: categoryId,
  amount: 100.00,
  date: '2024-01-15'
});

// Obtener ingresos
const incomes = await dbService.getIncomes({
  companyId: companyId,
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

// Subir factura
const result = await dbService.uploadInvoice(
  file, 
  companyId, 
  branchId
);
```

## 🔄 Flujo de Datos

1. **Autenticación**
   - Usuario inicia sesión con Google o email
   - Supabase genera JWT token
   - Token se almacena en localStorage

2. **Carga de Empresa**
   - Al autenticarse, se carga empresa del usuario
   - Se obtiene el rol (Owner, Admin, Supervisor, User)

3. **Operaciones CRUD**
   - Frontend envía datos a Supabase
   - RLS filtra datos automáticamente
   - Service Worker cachea respuestas

4. **Sincronización Offline**
   - Cambios se guardan en IndexedDB
   - Cuando hay conexión, se sincronizan
   - Service Worker maneja requests offline

## 📊 Gráficos & Reportes

### Chart.js
- Gráficos de línea (Ingresos vs Gastos)
- Gráficos de pastel (Gastos por categoría)
- Totalmente responsive

### Reportes
- Formato JSON para procesar
- Exportación a CSV
- (Próximamente: PDF con jsPDF)

## ♿ Accesibilidad

- WCAG 2.1 AA compliant
- Navegación por teclado
- Etiquetas y ARIA
- Contraste de colores
- Modo oscuro soportado

## 📈 Performance

- Aplicación <500KB
- Carga inicial <2s
- Offline-first
- Progressive enhancement

## 🐛 Debugging

### Browser Console
```javascript
// Ver usuario actual
console.log(authService.getCurrentUser());

// Ver estado de app
console.log(appState);

// Limpiar cache
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

## 📱 Instalación en Dispositivos

### Android
1. Abrir en Chrome
2. Menú > "Instalar aplicación"
3. Aparecerá en pantalla inicio

### iPhone/iPad
1. Abrir en Safari
2. Compartir > "Agregar a pantalla inicio"
3. Instalar

## 🚨 Troubleshooting

### "Supabase no está cargado"
- Verificar CDN de Supabase en HTML
- Verificar credenciales en config.js

### "CORS error"
- Configurar Supabase URL correcta
- Verificar ANON_KEY

### "Service Worker no funciona"
- Verificar HTTPS (requerido en producción)
- Limpiar caché del navegador
- Desactivar extensiones

### "Offline no sincroniza"
- Service Worker debe estar activo
- Verificar IndexedDB en DevTools

## 📞 Soporte

- Documentación: Ver README.md
- Issues: GitHub
- Email: soporte@finanzassaas.com

## 📄 Licencia

MIT License - Libre para uso comercial

## 🎯 Roadmap

- [ ] OCR real con Azure/Google
- [ ] Pagos con Stripe
- [ ] API REST completa
- [ ] Notificaciones por email
- [ ] Integración con bancos
- [ ] App nativa iOS/Android
- [ ] Análisis predictivo con IA
- [ ] Multi-idioma

## 👤 Autor

Eury De León - Founder, LUREVIX GROUP

---

**Hecho con ❤️ para revolucionar la gestión financiera empresarial**

[Documentación Técnica](./TECH.md) | [API Reference](./API.md) | [Changelog](./CHANGELOG.md)
