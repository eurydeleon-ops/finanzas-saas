# 📚 Referencia de API

## Autenticación

### Login con Email

```javascript
const result = await authService.loginWithEmail(email, password);

// Respuesta:
// {
//   success: true,
//   user: { id, email, user_metadata }
// }
```

### Registrar Nuevo Usuario

```javascript
const result = await authService.registerWithEmail(email, password, fullName);

// Respuesta: { success, user, error }
```

### Login con Google

```javascript
const result = await authService.loginWithGoogle();

// Redirige a Google, luego callback a /dashboard.html
```

### Logout

```javascript
const result = await authService.logout();
```

### Obtener Usuario Actual

```javascript
const { user, company, role } = authService.getCurrentUser();

// user: Datos de auth
// company: Empresa actual
// role: 'owner' | 'admin' | 'supervisor' | 'user'
```

## Empresa

### Crear Nueva Empresa

```javascript
const result = await authService.createCompany({
  name: 'Mi Empresa',
  email: 'contacto@empresa.com',
  phone: '+34123456789',
  address: 'Calle 1, 123'
});

// Automáticamente:
// - Crea suscripción (plan gratis)
// - Agrega usuario como owner
// - Crea categorías predefinidas
```

### Obtener Empresas del Usuario

```javascript
const { user, company, role } = authService.getCurrentUser();
// company = empresa actual
```

## Gastos

### Crear Gasto

```javascript
const result = await dbService.createExpense({
  company_id: 'xxx-xxx',
  created_by: userId,
  category_id: 'xxx-xxx',
  amount: 100.50,
  date: '2024-01-15',
  description: 'Almuerzo de negocios',
  currency: 'USD',
  payment_method: 'card'
});
```

### Obtener Gastos

```javascript
const expenses = await dbService.getExpenses({
  companyId: 'xxx-xxx',
  branchId: 'xxx-xxx', // opcional
  categoryId: 'xxx-xxx', // opcional
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

// Retorna array con:
// - id, amount, date, description
// - expense_categories { name, color, icon }
// - is_approved, approved_by
```

### Actualizar Gasto

```javascript
const result = await dbService.updateExpense(expenseId, {
  amount: 150.00,
  description: 'Nuevo descripción'
});
```

### Eliminar Gasto

```javascript
const result = await dbService.deleteExpense(expenseId);
```

## Ingresos

### Crear Ingreso

```javascript
const result = await dbService.createIncome({
  company_id: 'xxx-xxx',
  created_by: userId,
  category_id: 'xxx-xxx',
  amount: 5000.00,
  date: '2024-01-15',
  description: 'Venta de productos',
  is_recurring: true,
  recurring_frequency: 'monthly'
});
```

### Obtener Ingresos

```javascript
const incomes = await dbService.getIncomes({
  companyId: 'xxx-xxx',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

## Facturas

### Subir Factura

```javascript
const file = document.getElementById('invoice-upload').files[0];

const result = await dbService.uploadInvoice(
  file,      // File object
  companyId, // UUID
  branchId   // UUID (opcional)
);

// Automáticamente:
// - Procesa imagen
// - Sube a Storage
// - Crea registro en BD
// - Intenta OCR (cuando esté disponible)
```

### Obtener Facturas

```javascript
const invoices = await dbService.getInvoices({
  companyId: 'xxx-xxx',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

// Retorna:
// - id, file_path, invoice_date
// - vendor_name, invoice_amount
// - is_processed, ocr_data
```

## Categorías

### Obtener Categorías de Gastos

```javascript
const categories = await dbService.getExpenseCategories(companyId);

// Retorna array:
// { id, name, icon, color, is_active }
```

### Obtener Categorías de Ingresos

```javascript
const categories = await dbService.getIncomeCategories(companyId);
```

## Presupuestos

### Crear Presupuesto

```javascript
const result = await dbService.createBudget({
  company_id: 'xxx-xxx',
  category_id: 'xxx-xxx', // opcional
  name: 'Presupuesto Mensual',
  amount: 5000.00,
  period: 'monthly',
  start_date: '2024-01-01',
  alert_threshold_1: 80,
  alert_threshold_2: 90
});
```

### Obtener Presupuestos

```javascript
const budgets = await dbService.getBudgets(companyId);
```

## Usuarios

### Obtener Usuarios de Empresa

```javascript
const users = await dbService.getCompanyUsers(companyId);

// Retorna:
// { id, email, full_name, role, is_active }
```

### Invitar Usuario

```javascript
const result = await dbService.inviteUser(
  'nuevo@email.com',
  'supervisor',
  companyId,
  branchId // opcional
);

// Nota: Email de invitación no está implementado aún
```

## Sucursales

### Obtener Sucursales

```javascript
const branches = await dbService.getBranches(companyId);

// Retorna:
// { id, name, city, state, address, is_active }
```

## Suscripción

### Obtener Plan Actual

```javascript
const subscription = await dbService.getSubscription(companyId);

// Retorna:
// { 
//   plan: 'free' | 'basic' | 'professional' | 'enterprise',
//   status: 'active' | 'pending' | 'cancelled',
//   current_period_start, current_period_end
// }
```

### Verificar Límite de Plan

```javascript
const canUpload = await dbService.checkPlanLimit(companyId, 'invoices');

if (!canUpload) {
  showNotification('error', 'Límite de facturas alcanzado');
}
```

### Contar Facturas del Mes

```javascript
const count = await dbService.countInvoicesThisMonth(companyId);

console.log(`Facturas este mes: ${count}`);
```

## Reportes

### Generar Reporte Mensual

```javascript
const report = await dbService.getMonthlyReport(companyId, '2024-01');

// Retorna:
// {
//   month: '2024-01',
//   totalExpenses: 2500.00,
//   totalIncomes: 5000.00,
//   balance: 2500.00,
//   savingsRate: 50.0,
//   expenses: [...],
//   incomes: [...]
// }
```

### Descargar como JSON

```javascript
const report = await dbService.getMonthlyReport(companyId, '2024-01');
downloadJSON(report, 'reporte-2024-01.json');
```

## Auditoría

### Registrar Acción

```javascript
await dbService.logAudit(
  'CREATE',                // action
  'expenses',              // resource_type
  'expense-id-xxx',        // resource_id
  { amount: 100, date: '...' } // changes
);
```

## Utilidades

### Formatear Moneda

```javascript
formatCurrency(1000, 'USD');
// "$1,000.00"

formatCurrency(1000, 'MXN');
// "$1,000.00"
```

### Formatear Fecha

```javascript
formatDate('2024-01-15');
// "15 de enero de 2024"

formatDateShort('2024-01-15');
// "15/01/24"
```

### Descargar JSON

```javascript
downloadJSON(
  { data: 'content' },
  'archivo.json'
);
```

### Descargar CSV

```javascript
downloadCSV(
  [
    { name: 'Producto', amount: 100 },
    { name: 'Servicio', amount: 200 }
  ],
  'reporte.csv'
);
```

### Validar Email

```javascript
if (validateEmail('usuario@email.com')) {
  // Email válido
}
```

### Validar Contraseña

```javascript
if (validatePassword('MiPassword123')) {
  // Contraseña válida (8+ caracteres)
}
```

## Estados y Enums

### Roles de Usuario
```javascript
'owner'      // Propietario completo
'admin'      // Administrador
'supervisor' // Supervisor
'user'       // Usuario regular
```

### Planes
```javascript
'free'           // Gratis
'basic'          // Básico
'professional'   // Profesional
'enterprise'     // Empresarial
```

### Estados de Suscripción
```javascript
'pending'    // Pendiente de pago
'active'     // Activa
'cancelled'  // Cancelada
'expired'    // Vencida
```

### Métodos de Pago
```javascript
'cash'       // Efectivo
'card'       // Tarjeta
'transfer'   // Transferencia
'check'      // Cheque
'other'      // Otro
```

## Errores Comunes

### "User not authenticated"
```javascript
// Verificar que hay sesión
if (!authService.isAuthenticated()) {
  // Redirigir a login
}
```

### "Company not found"
```javascript
// Verificar que usuario tiene empresa
const { company } = authService.getCurrentUser();
if (!company) {
  // Usuario sin empresa aún
}
```

### "Permission denied"
```javascript
// Verificar permisos antes de acción
if (!requirePermission('manage_users')) {
  return; // Acción cancelada
}
```

## Rate Limiting

- 100 requests/minuto por usuario
- 1000 requests/minuto por empresa
- Upload máximo 10MB/archivo

## CORS

Métodos permitidos:
- GET
- POST
- PUT
- DELETE
- OPTIONS

Headers requeridos:
- `Content-Type: application/json`
- `Authorization: Bearer [token]`

---

**Última actualización:** 2024-01-15

Ver también: [README.md](./README.md) | [SETUP.md](./SETUP.md)
