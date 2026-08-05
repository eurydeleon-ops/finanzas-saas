# 🚀 Guía de Despliegue en Azure Static Web Apps

## Opción 1: Despliegue Automático (Recomendado)

### Requisitos
- Cuenta GitHub
- Cuenta Azure
- Código en repositorio GitHub

### Pasos

1. **Crear Repositorio GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/finanzas-saas.git
git push -u origin main
```

2. **Crear Static Web App en Azure**

   - Ir a [portal.azure.com](https://portal.azure.com)
   - Search "Static Web Apps"
   - Click "Create"
   
   Formulario:
   - **Subscription**: Tu suscripción
   - **Resource Group**: Crear nuevo o seleccionar
   - **Name**: finanzas-saas (o tu nombre)
   - **Plan Type**: Free (para empezar)
   - **Region**: (US) East o Tu región
   - **Sign in with GitHub**: Click, autorizar
   - **Organization**: Tu organización GitHub
   - **Repository**: finanzas-saas
   - **Branch**: main
   - **Build Presets**: Custom
   - **App location**: /
   - **Api location**: (dejar en blanco)
   - **Output location**: /

3. **Confirmar**

   - Azure generará GitHub Actions workflow
   - Revisar en GitHub Actions
   - Deploy se ejecutará automáticamente
   - URL: `https://tu-app.azurestaticapps.net`

4. **Configurar Dominio Personalizado** (Opcional)

   - Azure Portal → Static Web App
   - Custom domains
   - Add custom domain
   - Seguir instrucciones DNS

## Opción 2: Despliegue Manual

### Requisitos
- Azure CLI instalado
- Código listo

### Pasos

1. **Compilar (si es necesario)**

```bash
# En este caso no necesitamos compilar
# La app es vanilla JS
```

2. **Crear Storage Account**

```bash
az storage account create \
  --name finanzassaas \
  --resource-group mi-grupo \
  --location eastus \
  --sku Standard_LRS
```

3. **Subir Archivos**

```bash
az storage blob upload-batch \
  --source . \
  --destination \$web \
  --account-name finanzassaas
```

4. **Configurar Static Web App**

```bash
az staticwebapp create \
  --name finanzas-saas \
  --resource-group mi-grupo \
  --source https://github.com/tu-usuario/finanzas-saas.git \
  --branch main \
  --app-location "/"
```

## Opción 3: GitHub Pages

### Pasos

1. **Settings → Pages**
2. Source: Deploy from a branch
3. Branch: main
4. Folder: / (root)
5. Save

URL: `https://tu-usuario.github.io/finanzas-saas`

## Post-Despliegue

### 1. Actualizar Variables de Configuración

**En `js/config.js`:**

```javascript
// Debe estar en producción (HTTPS)
const SUPABASE_CONFIG = {
  url: 'https://xxxxx.supabase.co',
  anonKey: 'eyJ0...'
};

// Google OAuth - Agregar URL de producción
const GOOGLE_CONFIG = {
  clientId: 'xxxxx.apps.googleusercontent.com'
};
```

**En Google Cloud Console:**
- Credentials → OAuth 2.0 Client IDs
- Edit
- Authorized JavaScript origins:
  - `https://finanzas-saas.azurestaticapps.net`
- Authorized redirect URIs:
  - `https://finanzas-saas.azurestaticapps.net`

**En Supabase:**
- Authentication → Settings
- Site URL: `https://finanzas-saas.azurestaticapps.net`
- Redirect URLs: `https://finanzas-saas.azurestaticapps.net/**`

### 2. Configurar HTTPS

Azure Static Web Apps incluye HTTPS automáticamente ✅

### 3. Agregar Security Headers

Editar `staticwebapp.config.json`:

```json
{
  "defaultHeaders": {
    "Cache-Control": "max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }
}
```

### 4. Configurar CDN (Opcional)

```bash
az cdn endpoint create \
  --name finanzas-saas-cdn \
  --profile-name mi-cdnprofile \
  --resource-group mi-grupo \
  --origin finanzas-saas.azurestaticapps.net
```

## Monitoreo

### Azure Portal

1. Static Web App → Overview
   - Ver estadísticas
   - Ver últimas builds
   - Ver logs

2. Application Insights (Opcional)
   ```bash
   az monitor app-insights component create \
     --app finanzas-saas-ai \
     --resource-group mi-grupo
   ```

3. Alerts
   - Crear alerta por error 5xx
   - Crear alerta por lentitud

### GitHub Actions

Ver logs de deploy:
- GitHub → Actions
- Ver workflow "Azure Static Web Apps CI/CD"
- Click en último run
- Ver logs detallados

## Troubleshooting

### "Build failed"

Verificar logs en GitHub Actions:
1. GitHub → Actions
2. Última ejecución
3. Ver "Build and Deploy" job

Causas comunes:
- Archivos no encontrados
- Errores de sintaxis en JS
- Configuración incorrecta

### "Página en blanco"

Verificar:
- F12 → Console por errores
- Supabase URL configurada
- Anon key correcta
- Service Worker activo

### "401 Unauthorized"

```javascript
// Verificar que el token está en localStorage
console.log(localStorage.getItem('sb-token'));

// Verificar Supabase session
const session = await supabase.auth.getSession();
console.log(session);
```

### "CORS error"

```javascript
// En config.js, verificar:
// - URL no tiene barra al final
// - No hay espacios en credenciales
// - Credenciales son las correctas
```

## Performance

### Verificar Lighthouse

1. F12 → Lighthouse
2. Click "Analyze page load"
3. Objetivo:
   - Performance: >80
   - Accessibility: >90
   - Best Practices: >90
   - SEO: >90

### Optimizar

```bash
# Minificar JS/CSS
npm install -g csso-cli terser

# Comprimir imágenes
npx imagemin *.png --out-dir=compressed
```

## Escalado

### Plan Free
- 100 GB de tráfico/mes
- Suficiente para MVP

### Plan Standard
- Tráfico ilimitado
- Mejor performance
- ~$10-50/mes

Upgrade en Azure Portal → Static Web App → Hosting plan

## Backup & Disaster Recovery

### Backup de Código

```bash
# Crear backup en GitHub
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

### Backup de BD

Supabase automáticamente hace backup:
- Settings → Backups → Manual Backup
- Click "Take a backup"

### Restore

```bash
# Desde backup de Supabase
# Settings → Backups → Restore from backup
```

## Costo Estimado

- Azure Static Web Apps (Free): $0
- Supabase (Free): $0
- Google OAuth: $0
- **Total Inicial: $0** 🎉

Cuando crezcas:
- Supabase Plan: ~$25/mes
- Azure CDN: ~$0.15/GB
- Domain: ~$10/año

---

**Deploy completado!** 🚀

Accede a tu app: `https://finanzas-saas.azurestaticapps.net`
