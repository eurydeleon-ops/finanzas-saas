# 🚀 CONEXIÓN AUTOMÁTICA A SUPABASE

## ¿Cómo funciona?

Cuando abres la app (`index.html`):

1. ✅ Se carga el archivo `config.js` (credenciales por defecto)
2. ✅ Se carga el archivo `setup.js` (detecta si falta configuración)
3. ✅ Si **NO está configurado**, aparece un **modal automático**
4. ✅ Ingresas tus credenciales de Supabase en el modal
5. ✅ Presionas "Conectar Supabase"
6. ✅ **Las credenciales se guardan en localStorage** (solo para esta sesión)
7. ✅ Se reinicializa Supabase
8. ✅ Ya puedes usar la app

---

## Flujo Visual

```
┌─────────────────────────────────────┐
│ Abres http://localhost:3000/        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Se carga index.html                 │
│ ├─ config.js                        │
│ ├─ setup.js                         │
│ └─ utils.js                         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ setup.js detecta si está configurado│
└─────────────────────────────────────┘
              ↓
        ¿Configurado?
       /               \
      SÍ               NO
      │                 │
      ↓                 ↓
   Continúa      Modal aparece
                 (pid pides URL y Key)
                      ↓
                 Guardas en localStorage
                      ↓
                 Reinicializa Supabase
                      ↓
                 ✅ Listo para usar
```

---

## Paso 1: Obtener Credenciales de Supabase

### A. Crear proyecto (si no lo tienes)
1. Ve a https://supabase.com
2. Login o Sign Up
3. Click en "New Project"
4. Rellena: Nombre, Contraseña, Región (elije América Latina)
5. Espera 1-2 minutos a que se cree

### B. Obtener URL y Key
1. En tu proyecto, ve a **Settings** (abajo a la izquierda)
2. Selecciona **API**
3. Bajo "Project URL", copia: `https://xxxxx.supabase.co`
4. Bajo "Project API keys" → "anon public", copia la key (comienza con `eyJ0...`)

---

## Paso 2: Abrir la App

Desde línea de comandos:

```bash
cd /home/claude/finanzas-saas
python -m http.server 3000
```

O usando Node.js:

```bash
npx http-server -p 3000
```

Luego abre: **http://localhost:3000**

---

## Paso 3: Llenar el Modal

Cuando aparezca el modal:

```
🔗 Conectar a Supabase

┌──────────────────────────────┐
│ Project URL                  │
│ https://xxxxx.supabase.co    │ ← Pega tu URL aquí
└──────────────────────────────┘

┌──────────────────────────────┐
│ Anon Public Key              │
│ eyJ0tp9...                   │ ← Pega tu KEY aquí
└──────────────────────────────┘

      [Conectar Supabase]
```

Presiona **Enter** o click en el botón.

---

## Paso 4: Verificar Conexión

Después de conectar:

1. Verás: **"✅ Supabase conectado correctamente"**
2. El modal desaparece
3. Aparece la página de Login

---

## Siguiente: Crear Base de Datos

Ahora necesitas ejecutar el schema SQL en Supabase:

### En Supabase:
1. Ve a **SQL Editor**
2. Click en **New Query**
3. Copia TODO el contenido de `database/schema.sql`
4. Pega en el editor
5. Click en **Run** (triángulo verde)
6. Espera 30 segundos

### Crear Bucket Storage:
1. Ve a **Storage**
2. Click en **New Bucket**
3. Nombre: `invoices`
4. Privacidad: **Private**
5. Click en **Create**

**¡Listo!** Ahora la app está completamente funcional.

---

## Si algo falla

### Error: "Supabase no está inicializado"
**Solución:**
- Recarga la página (Ctrl+Shift+R)
- Verifica que copiaste la URL y KEY correctas (sin espacios extras)

### Error: "CORS error"
**Solución:**
- La URL no debe terminar en `/`
- El KEY debe estar completo (mínimo 100 caracteres)

### Error: "RLS deny" en la app
**Solución:**
- Verifica que ejecutaste el schema SQL completo en Supabase
- Revisa en SQL Editor → Historial que no haya errores

### Las credenciales no se guardan después de recargar
**Solución:**
- Setup.js las guarda en localStorage automáticamente
- Pero si borras el localStorage, necesitarás volver a ingresarlas
- Alternativa: Edita `js/config.js` manualmente

---

## Editar config.js manualmente (alternativo)

Si prefieres no usar el modal, puedes editar directamente:

```javascript
// js/config.js

const SUPABASE_CONFIG = {
  url: 'https://TU_PROJECT.supabase.co',  // ← Tu URL aquí
  anonKey: 'eyJ0...',                     // ← Tu Key aquí
  apiKey: 'eyJ0...'
};
```

Luego recarga la página.

---

## 📱 PWA - Instalar como App

Después de conectar:

### En móvil (Android/iOS):
1. Abre la app en el navegador
2. Toca el menú (⋮) → "Instalar app" o "Add to Home Screen"
3. ¡Ya está instalada como app nativa!

### En desktop (Chrome):
1. Toca el ícono de instalación (arriba a la derecha)
2. Confirma
3. Se abre como ventana independiente

---

## ✅ Resumen

| Paso | Acción |
|------|--------|
| 1 | Ir a Supabase.com, crear proyecto |
| 2 | Copiar URL y Key de Settings → API |
| 3 | Abrir app en localhost:3000 |
| 4 | Llenar modal con URL y Key |
| 5 | Ejecutar schema.sql en SQL Editor |
| 6 | Crear bucket "invoices" en Storage |
| 7 | ¡Listo! |

**Tiempo total: 5-10 minutos**

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa el **Developer Console** (F12 → Console)
2. Busca mensajes de error
3. Verifica logs de Supabase (en tu dashboard)
4. Consulta `SETUP.md` para detalles avanzados

---

**¿Preguntas?** Consulta:
- `README.md` - Guía general
- `SETUP.md` - Configuración detallada  
- `API.md` - Referencia de métodos

