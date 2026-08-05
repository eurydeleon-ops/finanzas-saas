# 🚀 FinanzasPro - Guía de Despliegue

## Opción 1: Azure Static Web Apps (Recomendado)

### 1.1 Crear Recurso en Azure Portal

```bash
# Opción A: Usar CLI de Azure
az login
az group create --name finanzas-rg --location eastus
az staticwebapp create \
  --name finanzaspro \
  --resource-group finanzas-rg \
  --location eastus \
  --source https://github.com/YOUR_USERNAME/finanzas-saas \
  --branch main \
  --app-location "/" \
  --output-location ""
```

### 1.2 Configurar en Azure Portal

1. Ir a [portal.azure.com](https://portal.azure.com)
2. Crear "Static Web App"
3. Nombre: `finanzaspro`
4. Región: East US (o similar)
5. Conectar con GitHub
6. Seleccionar repo y branch

### 1.3 Configurar Build

Crear archivo `azure-pipelines.yml` en raíz:

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '16.x'
    displayName: 'Install Node.js'

  - script: |
      echo "No build needed for static site"
    displayName: 'Skip build'

  - task: PublishBuildArtifacts@1
    inputs:
      pathToPublish: '$(Build.SourcesDirectory)'
      artifactName: 'drop'
```

### 1.4 Configurar Producción

En Azure Portal > Static Web App > Configuration:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html"
    }
  },
  "auth": {
    "rolesSource": "/auth/me"
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' https://cdn.jsdelivr.net; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff"
  }
}
```

### 1.5 Variables de Entorno

En Azure Portal > Settings > Configuration:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your_anon_key
STRIPE_PUBLIC_KEY = pk_live_your_key
```

### 1.6 Configurar Dominio Personalizado

1. Settings > Custom domains
2. Agregar dominio
3. Verificar registro CNAME
4. Configurar HTTPS automático

## Opción 2: Netlify

### 2.1 Conectar Repositorio

```bash
# 1. Ir a netlify.com
# 2. "New site from Git"
# 3. Seleccionar GitHub
# 4. Seleccionar repo

# Alternativa: Drag & Drop
# Arrastrar carpeta del proyecto a netlify.com
```

### 2.2 Configurar Build

Crear `netlify.toml`:

```toml
[build]
  publish = "/"
  command = "echo 'Static site'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Cache-Control = "no-cache"
```

### 2.3 Environment Variables

Settings > Build & deploy > Environment:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your_anon_key
```

### 2.4 Dominio Personalizado

Settings > Domain management > Custom domains

## Opción 3: Vercel

### 3.1 Desplegar

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Producción
vercel --prod
```

### 3.2 Configurar

Crear `vercel.json`:

```json
{
  "buildCommand": "echo 'Static site'",
  "outputDirectory": ".",
  "public": true,
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/:path*",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## Opción 4: Firebase Hosting

### 4.1 Inicializar Proyecto

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto
firebase init hosting
```

### 4.2 Configurar

En `firebase.json`:

```json
{
  "hosting": {
    "public": ".",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          }
        ]
      }
    ]
  }
}
```

### 4.3 Desplegar

```bash
firebase deploy
```

## Opción 5: GitHub Pages

### 5.1 Configurar Repositorio

1. Ir a Settings > Pages
2. Source: Deploy from a branch
3. Branch: main
4. Folder: root

### 5.2 Agregar GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

## Configuración de Dominio Personalizado

### Con CNAME

```bash
# En DNS provider (GoDaddy, Namecheap, etc.)
# Crear registro CNAME
www.finanzaspro.com CNAME finanzaspro.web.app
finanzaspro.com CNAME finanzaspro.web.app
```

### Con A Records

```bash
# Para dominio root (sin www)
finanzaspro.com A 34.120.70.150
```

## Configuración de HTTPS

### Automático en Azure/Netlify/Vercel
- ✅ Certificado SSL/TLS automático
- ✅ Renovación automática
- ✅ Sin costo adicional

### Manual
```bash
# Usar Let's Encrypt
# 1. Instalar Certbot
sudo apt-get install certbot

# 2. Generar certificado
sudo certbot certonly --standalone -d finanzaspro.com

# 3. Renovación automática
sudo systemctl enable certbot-renew.timer
```

## Configurar DNS

### En Supabase CORS

1. Ir a Settings > API
2. Agregar dominio:
   ```
   https://finanzaspro.com
   https://www.finanzaspro.com
   ```

### En Google OAuth

1. Google Cloud Console
2. Credenciales > OAuth 2.0
3. URIs autorizados:
   ```
   https://finanzaspro.com
   https://www.finanzaspro.com
   https://finanzaspro.web.app
   ```

## Monitoreo en Producción

### Azure Insights

```bash
# Crear Application Insights
az monitor app-insights component create \
  --app finanzaspro-insights \
  --resource-group finanzas-rg \
  --application-type web
```

### Seguimiento de Errores

En `index.html`:
```html
<script>
  // Log de errores a Supabase
  window.onerror = async (msg, url, lineNo) => {
    await supabase.from('error_logs').insert([{
      message: msg,
      url: url,
      line: lineNo,
      user_id: currentUser?.id,
      timestamp: new Date().toISOString()
    }]);
  };
</script>
```

## Backup y Recovery

### Backup de Base de Datos

```bash
# Descargar backup de Supabase
# 1. Ir a Supabase > Backups
# 2. Click en backup deseado
# 3. "Download" o "Restore"
```

### Backup de Storage

```bash
# Descargar archivos de Storage
gsutil -m cp -r gs://finanzas-storage/* ~/backup/
```

## Escalabilidad

### Autoscaling en Azure

En Azure Portal > Scale settings:
```
Min instances: 1
Max instances: 10
Scale when CPU > 80%
```

### Caché en CDN

```javascript
// En headers de respuesta
Cache-Control: public, max-age=3600
```

### Compresión

En Azure Portal > Compression:
- ✅ Enable compression
- ✅ GZIP
- ✅ Brotli

## Seguridad en Producción

### Headers de Seguridad

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

### Rate Limiting

En Supabase:
1. Settings > API
2. Rate limiting: Enabled
3. Límite: 1000 req/min por IP

### WAF (Web Application Firewall)

En Azure:
1. Create > WAF Policy
2. Agregar reglas de OWASP
3. Asociar a Static Web App

## Monitoreo de Aplicación

### Analytics

En Supabase:
```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as user_signups,
  COUNT(DISTINCT user_id) as active_users
FROM users
GROUP BY date
ORDER BY date DESC;
```

### Dashboard de Producción

Crear en `/admin/dashboard.html` con:
- Usuarios activos
- Facturas procesadas
- Ingresos/gastos
- Errores en logs

## Rollback

### Revertir a Versión Anterior

```bash
# Azure
az staticwebapp publish \
  --name finanzaspro \
  --source-directory ./previous-version

# Netlify
# Ir a Deploys > Click en versión anterior > "Publish deploy"

# Vercel
vercel rollback
```

## Checklist de Despliegue

### Antes de Publicar
- ✅ Configurar Supabase
- ✅ Agregar URL a CORS
- ✅ Configurar Google OAuth
- ✅ Configurar Storage bucket
- ✅ Crear base de datos
- ✅ Testear localmente
- ✅ Ejecutar schema.sql
- ✅ Insertar planes

### Despliegue
- ✅ Elegir plataforma
- ✅ Conectar repositorio
- ✅ Configurar variables de entorno
- ✅ Configurar dominio
- ✅ Habilitar HTTPS
- ✅ Configurar CORS en Supabase
- ✅ Configurar OAuth

### Después del Despliegue
- ✅ Probar login
- ✅ Probar crear empresa
- ✅ Probar registrar ingreso
- ✅ Probar subir factura
- ✅ Verificar reportes
- ✅ Monitorear errores
- ✅ Configurar backup automático
- ✅ Habilitar WAF

## Soporte de Despliegue

- **Azure**: [Documentación](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- **Netlify**: [Documentación](https://docs.netlify.com/)
- **Vercel**: [Documentación](https://vercel.com/docs)
- **Firebase**: [Documentación](https://firebase.google.com/docs/hosting)

**¡Listo para producción! 🚀**
