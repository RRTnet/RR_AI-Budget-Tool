import { API_BASE } from '../constants/api';

async function apiCall(path, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch (networkError) {
    throw new Error(`Network error: Unable to connect to server. ${networkError.message}`);
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = Array.isArray(errorData.detail)
          ? errorData.detail.map((d) => d.msg || d).join(', ')
          : String(errorData.detail);
      }
    } catch (_) {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

// Auth
export function loginApi(email, password) {
  return apiCall('/auth/login', 'POST', { email, password });
}

export function registerApi(data) {
  return apiCall('/auth/register', 'POST', data);
}

export function getMeApi(token) {
  return apiCall('/auth/me', 'GET', null, token);
}

export function updateReminderSettingsApi(token, data) {
  return apiCall('/auth/reminder-settings', 'PATCH', data, token);
}

// Income
export function getIncomeApi(token) {
  return apiCall('/income', 'GET', null, token);
}

export function addIncomeApi(token, data) {
  return apiCall('/income', 'POST', data, token);
}

export function deleteIncomeApi(token, id) {
  return apiCall(`/income/${id}`, 'DELETE', null, token);
}

// Expenses
export function getExpensesApi(token) {
  return apiCall('/expenses', 'GET', null, token);
}

export function addExpenseApi(token, data) {
  return apiCall('/expenses', 'POST', data, token);
}

export function deleteExpenseApi(token, id) {
  return apiCall(`/expenses/${id}`, 'DELETE', null, token);
}

// Goals
export function getGoalsApi(token) {
  return apiCall('/goals', 'GET', null, token);
}

export function addGoalApi(token, data) {
  return apiCall('/goals', 'POST', data, token);
}

export function updateGoalApi(token, id, data) {
  return apiCall(`/goals/${id}`, 'PATCH', data, token);
}

export function deleteGoalApi(token, id) {
  return apiCall(`/goals/${id}`, 'DELETE', null, token);
}

// Summary
export function getSummaryApi(token, month, year) {
  return apiCall(`/summary?month=${month}&year=${year}`, 'GET', null, token);
}

// Budgets
export function getBudgetsApi(token) {
  return apiCall('/budgets', 'GET', null, token);
}

export function createBudgetApi(token, data) {
  return apiCall('/budgets', 'POST', data, token);
}

export function updateBudgetApi(token, id, data) {
  return apiCall(`/budgets/${id}`, 'PUT', data, token);
}

export function deleteBudgetApi(token, id) {
  return apiCall(`/budgets/${id}`, 'DELETE', null, token);
}

export { apiCall };
