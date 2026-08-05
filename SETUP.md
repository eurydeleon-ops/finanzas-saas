# 🔧 Guía Completa de Configuración

## Paso 1: Crear Cuenta Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Click en "Start your project"
3. Registrarse con GitHub o email
4. Crear nueva organización
5. Crear nuevo proyecto

## Paso 2: Configurar PostgreSQL

### Cargar Schema

1. En Supabase Dashboard → SQL Editor
2. New Query
3. Copiar contenido de `sql/schema.sql`
4. Click "Run"
5. Esperar a que se ejecute

**Verificar tablas creadas:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Paso 3: Configurar Storage

1. Storage → New Bucket
2. Nombre: `invoices`
3. Privacidad: Private (pero permitir lectura)
4. Click Create

**Política de Acceso:**
```sql
-- Permitir lectura pública de facturas
CREATE POLICY "Public Read" ON storage.objects
  FOR SELECT USING (bucket_id = 'invoices');

-- Permitir upload si perteneces a la empresa
CREATE POLICY "User Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices' AND 
    auth.uid() IS NOT NULL
  );
```

## Paso 4: Obtener Credenciales

1. Settings → API
2. Copiar:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon key**: `eyJ0...`
   - **service_role key**: `eyJ0...`

3. Guardar en lugar seguro

## Paso 5: Configurar Aplicación

**Editar `js/config.js`:**

```javascript
const SUPABASE_CONFIG = {
  url: 'https://xxxxx.supabase.co',
  anonKey: 'eyJ0...',
  apiKey: 'eyJ0...'
};
```

## Paso 6: Google OAuth (Opcional)

1. Google Cloud Console
2. Crear nuevo proyecto
3. Habilitar Google+ API
4. OAuth consent screen
   - Tipo: External
   - Nombre app: Finanzas SaaS
   - Email: tu@email.com
5. Credenciales → OAuth 2.0 Client IDs
6. Crear → Web application
7. URIs autorizados:
   - `http://localhost:3000`
   - `https://tu-app.azurestaticapps.net`
8. Copiar Client ID

**En Supabase:**
1. Authentication → Providers
2. Google
3. Habilitar
4. Pegar Client ID
5. Guardar

**En `js/config.js`:**
```javascript
const GOOGLE_CONFIG = {
  clientId: 'xxxxx.apps.googleusercontent.com'
};
```

## Paso 7: Probar Localmente

```bash
# Python 3
python -m http.server 3000

# Node.js
npx http-server -p 3000

# Live Server (VS Code)
# Click "Go Live"
```

Abrir: `http://localhost:3000`

## Verificación

- [ ] Página de login carga
- [ ] Puedo registrarme
- [ ] Puedo crear empresa
- [ ] Aparecen categorías
- [ ] Puedo crear gasto
- [ ] Service Worker se registra
- [ ] Funciona offline (F12 → Network → Offline)

## Configuración Seguridad

### Enable RLS

```sql
-- En SQL Editor, ejecutar para cada tabla:
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- etc...
```

### Configurar Cookies Seguras

En Supabase → Project Settings → Auth

- Enable "Use strong security headers": ON
- Email confirmations: ON
- Email rate limit: 60/hour

## Base de Datos

### Resetear BD

```sql
-- ⚠️ PELIGRO: Elimina todo
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Luego volver a cargar schema.sql

### Backup

```bash
# Usar herramienta de backup de Supabase
# Settings → Backups → Manual Backup
```

## Variables de Entorno

Crear `.env` (no subir a Git):

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ0...
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

## Monitoreo

### Ver Logs
- Authentication → Logs
- Storage → Logs
- API → Logs

### Métricas
- Dashboard → Overview
- Ver uso de BD
- Ver requests

### Alertas
Settings → Alerts
- Establecer límites de uso
- Email de notificación

## Problemas Comunes

**"Invalid API key"**
- Verificar que sea ANON_KEY, no service_role
- Copiar sin espacios

**"CORS error"**
- Supabase URL debe estar en config.js
- Verificar HTTPS en producción

**"RLS denies"**
- Verificar políticas en SQL
- Verificar que usuario esté autenticado
- Ver logs de Supabase

**"Storage upload fails"**
- Verificar bucket existe
- Verificar políticas de acceso
- Verificar tamaño de archivo

## Soporte

- Docs: docs.supabase.com
- Discord: discord.supabase.com
- Issues: github.com/supabase/supabase
