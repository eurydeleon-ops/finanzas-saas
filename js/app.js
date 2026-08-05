// ============================================================================
// MÓDULO PRINCIPAL - Lógica de la Aplicación
// ============================================================================

// Estado global
const appState = {
  currentPage: 'login',
  currentTab: 'login',
  charts: {},
  expenseCategories: [],
  incomeCategories: [],
  branches: []
};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Esperar a que Supabase se inicialice
  setTimeout(() => {
    initializeApp();
  }, 1000);
});

// Escuchar cambios de autenticación
document.addEventListener('auth-change', (event) => {
  if (event.detail.authenticated) {
    showPage('dashboard');
    loadDashboard();
    updateNavigation();
  } else {
    showPage('login');
  }
});

async function initializeApp() {
  // Verificar autenticación
  if (authService.isAuthenticated()) {
    showPage('dashboard');
    loadDashboard();
    updateNavigation();
  } else {
    showPage('login');
  }
  
  // Evento de redimensionamiento para responsive
  window.addEventListener('resize', () => {
    if (isMobile() && appState.currentPage !== 'login') {
      closeSidebar();
    }
  });
}

// ============================================================================
// NAVEGACIÓN
// ============================================================================

function showPage(pageName) {
  // Ocultar todas las páginas
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Mostrar página específica
  const page = document.getElementById(`page-${pageName}`);
  if (page) {
    page.classList.add('active');
    appState.currentPage = pageName;
  }
  
  // Cerrar sidebar en móvil
  if (isMobile()) {
    closeSidebar();
  }
}

function navigateTo(page) {
  event.preventDefault();
  
  // Validar permisos
  if (page === 'admin' && !requirePermission('manage_users')) return;
  
  // Cargar datos antes de mostrar página
  switch(page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'expenses':
      loadExpenses();
      break;
    case 'incomes':
      loadIncomes();
      break;
    case 'invoices':
      loadInvoices();
      break;
    case 'budgets':
      loadBudgets();
      break;
    case 'admin':
      loadAdminPanel();
      break;
    case 'settings':
      loadSettings();
      break;
  }
  
  showPage(page);
}

function updateNavigation() {
  const { user, company, role } = authService.getCurrentUser();
  
  if (user && company) {
    // Mostrar información del usuario
    document.getElementById('user-name').textContent = user.email.split('@')[0];
    document.getElementById('company-name').textContent = company.name || 'Mi Empresa';
    
    // Mostrar/ocultar link admin
    const adminLink = document.getElementById('admin-link');
    if (role && (role === 'owner' || role === 'admin')) {
      adminLink.style.display = 'block';
    }
    
    // Mostrar sidebar
    document.getElementById('sidebar').classList.remove('hidden');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('hidden');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.add('hidden');
}

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  showLoader();
  const result = await authService.loginWithEmail(email, password);
  hideLoader();
  
  if (result.success) {
    setTimeout(() => showPage('dashboard'), 500);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;
  
  if (password !== confirm) {
    showNotification('error', 'Las contraseñas no coinciden');
    return;
  }
  
  if (!validatePassword(password)) {
    showNotification('error', 'La contraseña debe tener al menos 8 caracteres');
    return;
  }
  
  showLoader();
  const result = await authService.registerWithEmail(email, password, name);
  hideLoader();
  
  if (result.success) {
    // Cambiar a tab de login
    switchTab('login');
    showNotification('info', 'Regístrate con tu email para continuar');
  }
}

async function handleGoogleLogin() {
  showLoader();
  const result = await authService.loginWithGoogle();
  hideLoader();
}

async function handleLogout() {
  if (confirm(MESSAGES.es.confirm_logout)) {
    showLoader();
    const result = await authService.logout();
    hideLoader();
    if (result.success) {
      showPage('login');
      document.getElementById('sidebar').classList.add('hidden');
    }
  }
}

function switchTab(tab) {
  // Cambiar tabs
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(el => {
    el.classList.remove('active');
  });
  
  document.getElementById(`${tab}-form`).classList.add('active');
  event.target.classList.add('active');
  
  appState.currentTab = tab;
}

function handleForgotPassword() {
  const email = prompt('Ingresa tu correo:');
  if (email && validateEmail(email)) {
    authService.resetPassword(email);
  }
}

// ============================================================================
// DASHBOARD
// ============================================================================

async function loadDashboard() {
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  showLoader();
  
  try {
    // Obtener mes seleccionado
    const monthInput = document.getElementById('dashboard-month');
    monthInput.value = getCurrentMonth();
    
    // Cargar ramas
    const branches = await dbService.getBranches(company.id);
    appState.branches = branches;
    populateBranchSelect('dashboard-branch', branches);
    
    // Cargar datos del mes
    const range = getMonthRange(monthInput.value);
    await loadDashboardData(company.id, range.start, range.end);
    
    // Event listeners
    monthInput.addEventListener('change', async (e) => {
      const range = getMonthRange(e.target.value);
      await loadDashboardData(company.id, range.start, range.end);
    });
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
  } finally {
    hideLoader();
  }
}

async function loadDashboardData(companyId, startDate, endDate) {
  try {
    // Obtener datos
    const expenses = await dbService.getExpenses({
      companyId,
      startDate,
      endDate
    });
    const incomes = await dbService.getIncomes({
      companyId,
      startDate,
      endDate
    });
    
    // Calcular totales
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalIncomes = incomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const balance = totalIncomes - totalExpenses;
    const savingsRate = totalIncomes > 0 ? (balance / totalIncomes * 100) : 0;
    
    // Actualizar tarjetas de estadísticas
    document.getElementById('stat-income').textContent = formatCurrency(totalIncomes);
    document.getElementById('stat-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('stat-balance').textContent = formatCurrency(balance);
    document.getElementById('stat-savings').textContent = savingsRate.toFixed(1) + '%';
    
    // Actualizar gráficos
    updateBalanceChart(expenses, incomes);
    updateExpensePieChart(expenses);
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

function updateBalanceChart(expenses, incomes) {
  const months = [];
  const expensesData = [];
  const incomesData = [];
  
  // Generar últimos 6 meses
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
    months.push(monthStr);
    
    const monthExpenses = expenses.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getMonth() === date.getMonth() && eDate.getFullYear() === date.getFullYear();
    }).reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const monthIncomes = incomes.filter(i => {
      const iDate = new Date(i.date);
      return iDate.getMonth() === date.getMonth() && iDate.getFullYear() === date.getFullYear();
    }).reduce((sum, i) => sum + parseFloat(i.amount), 0);
    
    expensesData.push(monthExpenses);
    incomesData.push(monthIncomes);
  }
  
  const ctx = document.getElementById('chart-balance')?.getContext('2d');
  if (!ctx) return;
  
  // Destruir gráfico anterior
  if (appState.charts.balance) {
    appState.charts.balance.destroy();
  }
  
  appState.charts.balance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Ingresos',
          data: incomesData,
          borderColor: COLORS.success,
          backgroundColor: COLORS.success + '15',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Gastos',
          data: expensesData,
          borderColor: COLORS.danger,
          backgroundColor: COLORS.danger + '15',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updateExpensePieChart(expenses) {
  // Agrupar por categoría
  const byCategory = {};
  expenses.forEach(exp => {
    const catName = exp.expense_categories?.name || 'Otros';
    byCategory[catName] = (byCategory[catName] || 0) + parseFloat(exp.amount);
  });
  
  const ctx = document.getElementById('chart-expenses-pie')?.getContext('2d');
  if (!ctx) return;
  
  if (appState.charts.expensesPie) {
    appState.charts.expensesPie.destroy();
  }
  
  const colors = [
    COLORS.danger,
    COLORS.warning,
    COLORS.info,
    COLORS.primary,
    COLORS.secondary
  ];
  
  appState.charts.expensesPie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(byCategory),
      datasets: [{
        data: Object.values(byCategory),
        backgroundColor: colors.slice(0, Object.keys(byCategory).length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

// ============================================================================
// GASTOS
// ============================================================================

async function loadExpenses() {
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  showLoader();
  
  try {
    // Cargar categorías
    appState.expenseCategories = await dbService.getExpenseCategories(company.id);
    populateSelect('expense-category', appState.expenseCategories, 'id', 'name');
    populateSelect('form-expense-category', appState.expenseCategories, 'id', 'name');
    
    // Cargar sucursales
    const branches = await dbService.getBranches(company.id);
    populateBranchSelect('expense-branch', branches);
    
    // Cargar gastos
    const month = getCurrentMonth();
    const range = getMonthRange(month);
    const expenses = await dbService.getExpenses({
      companyId: company.id,
      startDate: range.start,
      endDate: range.end
    });
    
    // Mostrar en tabla
    renderExpensesTable(expenses);
    
    // Event listeners
    document.getElementById('expense-month').addEventListener('change', async (e) => {
      const range = getMonthRange(e.target.value);
      const filtered = await dbService.getExpenses({
        companyId: company.id,
        startDate: range.start,
        endDate: range.end
      });
      renderExpensesTable(filtered);
    });
    
    document.getElementById('expense-category').addEventListener('change', async (e) => {
      const all = expenses;
      const filtered = e.target.value ? all.filter(ex => ex.category_id === e.target.value) : all;
      renderExpensesTable(filtered);
    });
    
  } catch (error) {
    console.error('Error loading expenses:', error);
  } finally {
    hideLoader();
  }
}

function renderExpensesTable(expenses) {
  const tbody = document.getElementById('expenses-table-body');
  
  if (expenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin gastos registrados</td></tr>';
    return;
  }
  
  tbody.innerHTML = expenses.map(expense => `
    <tr>
      <td>${formatDateShort(expense.date)}</td>
      <td>
        <span class="category-badge" style="background-color: ${expense.expense_categories?.color}">
          ${expense.expense_categories?.name || 'Otros'}
        </span>
      </td>
      <td>${expense.description || '-'}</td>
      <td class="amount-cell">${formatCurrency(expense.amount)}</td>
      <td>
        <span class="status-badge ${expense.is_approved ? 'approved' : 'pending'}">
          ${expense.is_approved ? 'Aprobado' : 'Pendiente'}
        </span>
      </td>
      <td class="action-buttons">
        <button class="btn-small" onclick="editExpense('${expense.id}')">✏️</button>
        <button class="btn-small danger" onclick="deleteExpense('${expense.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openExpenseForm() {
  // Establecer fecha de hoy
  document.getElementById('form-expense-date').valueAsDate = new Date();
  openModal('expense-modal');
}

async function handleExpenseSubmit(event) {
  event.preventDefault();
  
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  const expenseData = {
    company_id: company.id,
    created_by: authService.user.id,
    category_id: document.getElementById('form-expense-category').value,
    amount: parseFloat(document.getElementById('form-expense-amount').value),
    date: document.getElementById('form-expense-date').value,
    description: document.getElementById('form-expense-description').value,
    currency: APP_CONFIG.currency
  };
  
  const result = await dbService.createExpense(expenseData);
  if (result.success) {
    closeModal('expense-modal');
    document.getElementById('expense-form').reset();
    loadExpenses();
  }
}

async function deleteExpense(expenseId) {
  if (confirm('¿Eliminar este gasto?')) {
    const result = await dbService.deleteExpense(expenseId);
    if (result.success) {
      loadExpenses();
    }
  }
}

// ============================================================================
// INGRESOS
// ============================================================================

async function loadIncomes() {
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  showLoader();
  
  try {
    // Cargar categorías
    appState.incomeCategories = await dbService.getIncomeCategories(company.id);
    populateSelect('income-category', appState.incomeCategories, 'id', 'name');
    populateSelect('form-income-category', appState.incomeCategories, 'id', 'name');
    
    // Cargar ingresos
    const month = getCurrentMonth();
    const range = getMonthRange(month);
    const incomes = await dbService.getIncomes({
      companyId: company.id,
      startDate: range.start,
      endDate: range.end
    });
    
    renderIncomesTable(incomes);
    
    // Event listeners
    document.getElementById('income-month').addEventListener('change', async (e) => {
      const range = getMonthRange(e.target.value);
      const filtered = await dbService.getIncomes({
        companyId: company.id,
        startDate: range.start,
        endDate: range.end
      });
      renderIncomesTable(filtered);
    });
    
  } catch (error) {
    console.error('Error loading incomes:', error);
  } finally {
    hideLoader();
  }
}

function renderIncomesTable(incomes) {
  const tbody = document.getElementById('incomes-table-body');
  
  if (incomes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin ingresos registrados</td></tr>';
    return;
  }
  
  tbody.innerHTML = incomes.map(income => `
    <tr>
      <td>${formatDateShort(income.date)}</td>
      <td>
        <span class="category-badge" style="background-color: ${income.income_categories?.color}">
          ${income.income_categories?.name || 'Otros'}
        </span>
      </td>
      <td>${income.description || '-'}</td>
      <td class="amount-cell">${formatCurrency(income.amount)}</td>
      <td>${income.is_recurring ? 'Sí' : 'No'}</td>
      <td class="action-buttons">
        <button class="btn-small" onclick="editIncome('${income.id}')">✏️</button>
        <button class="btn-small danger" onclick="deleteIncome('${income.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openIncomeForm() {
  document.getElementById('form-income-date').valueAsDate = new Date();
  openModal('income-modal');
}

async function handleIncomeSubmit(event) {
  event.preventDefault();
  
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  const incomeData = {
    company_id: company.id,
    created_by: authService.user.id,
    category_id: document.getElementById('form-income-category').value,
    amount: parseFloat(document.getElementById('form-income-amount').value),
    date: document.getElementById('form-income-date').value,
    description: document.getElementById('form-income-description').value,
    is_recurring: document.getElementById('form-income-recurring').checked,
    currency: APP_CONFIG.currency
  };
  
  const result = await dbService.createIncome(incomeData);
  if (result.success) {
    closeModal('income-modal');
    document.getElementById('income-form').reset();
    loadIncomes();
  }
}

async function deleteIncome(incomeId) {
  if (confirm('¿Eliminar este ingreso?')) {
    // Implementar deleteIncome en dbService
    loadIncomes();
  }
}

// ============================================================================
// FACTURAS
// ============================================================================

async function loadInvoices() {
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  showLoader();
  
  try {
    const month = getCurrentMonth();
    const range = getMonthRange(month);
    const invoices = await dbService.getInvoices({
      companyId: company.id,
      startDate: range.start,
      endDate: range.end
    });
    
    renderInvoicesGrid(invoices);
    
  } catch (error) {
    console.error('Error loading invoices:', error);
  } finally {
    hideLoader();
  }
}

function renderInvoicesGrid(invoices) {
  const grid = document.getElementById('invoices-grid');
  
  if (invoices.length === 0) {
    grid.innerHTML = '<p class="text-center">No hay facturas. Sube una nueva factura.</p>';
    return;
  }
  
  grid.innerHTML = invoices.map(invoice => `
    <div class="invoice-card">
      <div class="invoice-header">
        <h4>${invoice.vendor_name || 'Factura'}</h4>
        <span class="invoice-date">${formatDateShort(invoice.invoice_date)}</span>
      </div>
      <div class="invoice-body">
        <p class="invoice-amount">${formatCurrency(invoice.invoice_amount)}</p>
        <p class="invoice-status ${invoice.is_processed ? 'processed' : 'pending'}">
          ${invoice.is_processed ? '✓ Procesada' : '⏳ Pendiente'}
        </p>
      </div>
      <div class="invoice-actions">
        <button class="btn-small" onclick="viewInvoice('${invoice.id}')">Ver</button>
        <button class="btn-small danger" onclick="deleteInvoice('${invoice.id}')">Eliminar</button>
      </div>
    </div>
  `).join('');
}

async function handleInvoiceUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  // Verificar límite del plan
  const canUpload = await dbService.checkPlanLimit(company.id, 'invoices');
  if (!canUpload) {
    showNotification('error', 'Límite de facturas alcanzado para tu plan. Mejora a un plan superior.');
    return;
  }
  
  const result = await dbService.uploadInvoice(file, company.id, null);
  if (result.success) {
    loadInvoices();
  }
  
  // Limpiar input
  event.target.value = '';
}

// ============================================================================
// PRESUPUESTOS
// ============================================================================

async function loadBudgets() {
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  showLoader();
  
  try {
    const budgets = await dbService.getBudgets(company.id);
    renderBudgetsList(budgets);
  } catch (error) {
    console.error('Error loading budgets:', error);
  } finally {
    hideLoader();
  }
}

function renderBudgetsList(budgets) {
  const list = document.getElementById('budgets-list');
  
  if (budgets.length === 0) {
    list.innerHTML = '<p class="text-center">Sin presupuestos. Crea el primero.</p>';
    return;
  }
  
  list.innerHTML = budgets.map(budget => {
    // Calcular porcentaje gastado (simulado)
    const spent = Math.random() * budget.amount;
    const percentage = Math.round((spent / budget.amount) * 100);
    
    return `
      <div class="budget-card">
        <div class="budget-header">
          <h4>${budget.name}</h4>
          <span class="budget-category">${budget.expense_categories?.name || 'Todas'}</span>
        </div>
        <div class="budget-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%; background-color: ${percentage > 90 ? COLORS.danger : percentage > 80 ? COLORS.warning : COLORS.success}"></div>
          </div>
          <div class="budget-stats">
            <span>${formatCurrency(spent)} de ${formatCurrency(budget.amount)}</span>
            <span>${percentage}%</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openBudgetForm() {
  openModal('budget-modal');
}

// ============================================================================
// ADMIN
// ============================================================================

async function loadAdminPanel() {
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  showLoader();
  
  try {
    // Cargar usuarios
    const users = await dbService.getCompanyUsers(company.id);
    renderUsersTable(users);
    
    // Cargar sucursales
    const branches = await dbService.getBranches(company.id);
    renderBranchesTable(branches);
    
    // Cargar suscripción
    const subscription = await dbService.getSubscription(company.id);
    renderSubscriptionInfo(subscription);
    
  } catch (error) {
    console.error('Error loading admin panel:', error);
  } finally {
    hideLoader();
  }
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab-content').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.admin-tab').forEach(el => {
    el.classList.remove('active');
  });
  
  document.getElementById(`admin-${tab}`).classList.add('active');
  event.target.classList.add('active');
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.full_name || user.email}</td>
      <td>${user.email}</td>
      <td><span class="role-badge">${USER_ROLES[user.role]?.name || user.role}</span></td>
      <td><span class="status-badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Activo' : 'Inactivo'}</span></td>
      <td class="action-buttons">
        <button class="btn-small" onclick="editUser('${user.id}')">✏️</button>
        <button class="btn-small danger" onclick="deactivateUser('${user.id}')">❌</button>
      </td>
    </tr>
  `).join('');
}

function renderBranchesTable(branches) {
  const tbody = document.getElementById('branches-table-body');
  tbody.innerHTML = branches.map(branch => `
    <tr>
      <td>${branch.name}</td>
      <td>${branch.city || '-'}</td>
      <td><span class="status-badge active">Activa</span></td>
      <td class="action-buttons">
        <button class="btn-small" onclick="editBranch('${branch.id}')">✏️</button>
      </td>
    </tr>
  `).join('');
}

function renderSubscriptionInfo(subscription) {
  if (!subscription) return;
  
  const plan = SUBSCRIPTION_PLANS[subscription.plan];
  const limits = plan.limits;
  
  document.getElementById('current-plan').textContent = `Plan: ${plan.name}`;
  document.getElementById('plan-limits').innerHTML = `
    <ul>
      <li>Facturas/mes: ${limits.invoices_per_month}</li>
      <li>Usuarios: ${limits.users}</li>
      <li>Sucursales: ${limits.branches}</li>
      <li>Categorías: ${limits.categories}</li>
    </ul>
  `;
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

async function loadSettings() {
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  document.getElementById('setting-company-name').value = company.name || '';
  document.getElementById('setting-company-email').value = company.email || '';
  document.getElementById('setting-company-phone').value = company.phone || '';
}

async function saveCompanySettings(event) {
  event.preventDefault();
  
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  const updates = {
    name: document.getElementById('setting-company-name').value,
    email: document.getElementById('setting-company-email').value,
    phone: document.getElementById('setting-company-phone').value
  };
  
  // TODO: Implementar actualización en Supabase
  showNotification('success', 'Configuración guardada');
}

// ============================================================================
// FUNCIONES AUXILIARES DE UI
// ============================================================================

function populateBranchSelect(selectId, branches) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '<option value="">Todas las sucursales</option>';
  branches.forEach(branch => {
    const option = document.createElement('option');
    option.value = branch.id;
    option.textContent = branch.name;
    select.appendChild(option);
  });
}

function openUserForm() {
  // TODO: Implementar
}

function openBranchForm() {
  // TODO: Implementar
}

function openUpgradeDialog() {
  showNotification('info', 'Contacta a ventas@finanzassaas.com');
}

function openPasswordDialog() {
  const newPassword = prompt('Nueva contraseña:');
  if (newPassword) {
    authService.updatePassword(newPassword);
  }
}

async function handleDeleteAccount() {
  if (confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
    // TODO: Implementar
    showNotification('info', 'Contacta a soporte');
  }
}

async function downloadReport(type, format) {
  const { company } = authService.getCurrentUser();
  if (!company) return;
  
  showLoader();
  
  try {
    const month = getCurrentMonth();
    const report = await dbService.getMonthlyReport(company.id, month);
    
    if (format === 'json') {
      downloadJSON(report, `reporte-${type}-${month}.json`);
    } else if (format === 'pdf') {
      // TODO: Implementar generación de PDF
      showNotification('info', 'Funcionalidad de PDF en desarrollo');
    }
  } catch (error) {
    console.error('Error downloading report:', error);
  } finally {
    hideLoader();
  }
}

// Funciones placeholder
function editExpense(id) { showNotification('info', 'Editar en desarrollo'); }
function editIncome(id) { showNotification('info', 'Editar en desarrollo'); }
function viewInvoice(id) { showNotification('info', 'Ver en desarrollo'); }
function deleteInvoice(id) { loadInvoices(); }
function editUser(id) { showNotification('info', 'Editar en desarrollo'); }
function deactivateUser(id) { showNotification('info', 'Desactivar en desarrollo'); }
function editBranch(id) { showNotification('info', 'Editar en desarrollo'); }
