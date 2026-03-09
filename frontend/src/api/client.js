// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// API Client — all endpoint definitions
// ─────────────────────────────────────────────────────────────

import axios from 'axios'

// ── Base instance ─────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Analytics endpoints ───────────────────────────────────────
export const analyticsApi = {
  getSummary: () => apiClient.get('/analytics/summary'),
  getDepartments: () => apiClient.get('/analytics/departments'),
  getDepartment: (id) => apiClient.get(`/analytics/departments/${id}`),
  getKPIs: () => apiClient.get('/analytics/kpis'),
  getForecast: () => apiClient.get('/analytics/forecast'),
}

// ── Insights endpoints ────────────────────────────────────────
export const insightsApi = {
  getAnomalies: () => apiClient.get('/insights/anomalies'),
  getAIInsights: () => apiClient.get('/insights/ai-insights'),
  getRecommendations: () => apiClient.get('/insights/recommendations'),
}

// ── Patient endpoints ─────────────────────────────────────────
export const patientApi = {
  getAll: () => apiClient.get('/patients/'),
  getById: (id) => apiClient.get(`/patients/${id}`),
  getPrescriptions: (id) => apiClient.get(`/patients/${id}/prescriptions`),
  getLabReports: (id) => apiClient.get(`/patients/${id}/lab-reports`),
  getVitals: (id) => apiClient.get(`/patients/${id}/vitals`),
  getBill: (id) => apiClient.get(`/patients/${id}/bill`),
  getDischargeList: (id) => apiClient.get(`/patients/${id}/discharge-checklist`),
  askAI: (id, question) => apiClient.post(`/patients/${id}/ask`, { question }),
}

// ── Staff endpoints ───────────────────────────────────────────
export const staffApi = {
  getAll: () => apiClient.get('/staff/'),
  getOnDuty: () => apiClient.get('/staff/on-duty'),
  getDoctorsOnDuty: () => apiClient.get('/staff/doctors-on-duty'),
  getById: (id) => apiClient.get(`/staff/${id}`),
  getPatients: (id) => apiClient.get(`/staff/${id}/patients`),
  getByDepartment: (id) => apiClient.get(`/staff/department/${id}`),
}

export default apiClient