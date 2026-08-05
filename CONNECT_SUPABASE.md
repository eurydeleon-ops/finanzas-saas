# 🔗 CONECTAR A SUPABASE - Método Automático

## Opción 1: Deploy con Un Click (Recomendado)

Haz click en este botón para desplegar directamente a Supabase + Azure:

```
[Deploy to Supabase]
https://supabase.com/docs/guides/hosting/quickstarts/nextjs

O usa este link directo:
https://app.supabase.com/new/new-project
```

## Opción 2: Script Automático (Ejecutar Localmente)

```bash
# Clona el proyecto
git clone https://github.com/tu-usuario/finanzas-saas.git
cd finanzas-saas

# Ejecuta el script de configuración
node setup-supabase.js
```

Esto automáticamente:
1. Te pide credenciales de Supabase
2. Crea el schema
3. Configura Storage
4. Genera config.js

## Opción 3: Conexión Manual (30 segundos)

### Paso 1: Obtener Credenciales
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Haz clic en **Settings** → **API**
4. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon key**: `eyJ0...`

### Paso 2: Actualizar config.js

Abre `js/config.js` y reemplaza:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://TU_PROJECT.supabase.co',      // ← Tu URL
  anonKey: 'eyJ0...',                          // ← Tu ANON_KEY
  apiKey: 'eyJ0...'
};
```

### Paso 3: Crear Base de Datos

1. En Supabase → **SQL Editor**
2. **New Query**
3. Copia todo el contenido de `sql/schema.sql`
4. Haz clic en **Run**

### Paso 4: Crear Storage

1. En Supabase → **Storage**
2. **New Bucket**
   - Nombre: `invoices`
   - Privacidad: Private
   - Click **Create**

### Paso 5: Probar

```bash
python -m http.server 3000
# Abre http://localhost:3000
```

¡Listo! ✅

---

## 🤖 Script Automático (Recomendado)

Crea este archivo `setup-supabase.js`:

```javascript
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setup() {
  console.log('\n🔗 CONFIGURAR SUPABASE - Finanzas SaaS\n');
  
  const url = await askQuestion('📍 Project URL (ej: https://xxxxx.supabase.co): ');
  const anonKey = await askQuestion('🔑 Anon Key (eyJ0...): ');
  
  if (!url || !anonKey) {
    console.error('❌ Error: Faltan credenciales');
    process.exit(1);
  }
  
  // Actualizar config.js
  let config = fs.readFileSync('js/config.js', 'utf8');
  
  config = config.replace(
    /url: 'https:\/\/YOUR_SUPABASE_URL\.supabase\.co'/,
    `url: '${url}'`
  );
  
  config = config.replace(
    /anonKey: 'YOUR_SUPABASE_ANON_KEY'/,
    `anonKey: '${anonKey}'`
  );
  
  fs.writeFileSync('js/config.js', config);
  
  console.log(`
✅ Configuración actualizada en js/config.js

📋 Próximos pasos:
1. Ve a Supabase → SQL Editor
2. Copia contenido de sql/schema.sql
3. Ejecuta la query
4. Crea bucket "invoices" en Storage
5. Prueba: python -m http.server 3000
  `);
  
  rl.close();
}

setup().catch(console.error);
```

Ejecutar:
```bash
node setup-supabase.js
```

---

## ✅ Verificación

Después de conectar, verifica que todo funciona:

```javascript
// En consola del navegador (F12)
console.log(authService.supabase);
// Debe mostrar el cliente de Supabase inicializado

authService.isAuthenticated();
// Debe retornar true/false (está listo)
```

## 🐛 Si algo falla

**"Supabase no está cargado"**
→ Verifica que config.js tenga URL y KEY correctos
→ Recarga la página (Ctrl+Shift+R)

**"CORS error"**
→ Supabase URL debe estar sin "/" al final
→ Anon key debe estar completo

**"RLS deny"**
→ Verifica que schema.sql se ejecutó completamente
→ Revisa en Supabase → SQL Editor → Historial

---

**¿Necesitas ayuda?** Ve a SETUP.md para más detalles.
