// ─────────────────────────────────────────────────────────────
// PrimeCare Hospital | GKM_8 Intelligence Platform
// api/client.js — All endpoint definitions
// UPDATED: Added nurse, pharmacy, and DB-backed workflow APIs
// ─────────────────────────────────────────────────────────────

import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Analytics ─────────────────────────────────────────────────
export const analyticsApi = {
  getSummary:     () => apiClient.get('/analytics/summary'),
  getDepartments: () => apiClient.get('/analytics/departments'),
  getDepartment:  (id) => apiClient.get(`/analytics/departments/${id}`),
  getKPIs:        () => apiClient.get('/analytics/kpis'),
  getForecast:    () => apiClient.get('/analytics/forecast'),
}

// ── Insights + AI chatbox ─────────────────────────────────────
export const insightsApi = {
  getAnomalies:       () => apiClient.get('/insights/anomalies'),
  getAIInsights:      () => apiClient.get('/insights/ai-insights'),
  getRecommendations: () => apiClient.get('/insights/recommendations'),
  getAIAgentAnalysis: () => apiClient.get('/insights/ai-insights'),
  askAI:              (question, role = 'admin') => apiClient.post('/insights/ask', { question, role }),
}

// ── Patients (mock data) ──────────────────────────────────────
export const patientApi = {
  getAll:              () => apiClient.get('/patients/'),
  getById:             (id) => apiClient.get(`/patients/${id}`),
  getPrescriptions:    (id) => apiClient.get(`/patients/${id}/prescriptions`),
  getLabReports:       (id) => apiClient.get(`/patients/${id}/lab-reports`),
  getVitals:           (id) => apiClient.get(`/patients/${id}/vitals`),
  getBill:             (id) => apiClient.get(`/patients/${id}/bill`),
  getDischargeList:    (id) => apiClient.get(`/patients/${id}/discharge-checklist`),
  getAIReport:         (id) => apiClient.get(`/patients/${id}/ai-report`),
  askQuestion:         (id, question) => apiClient.post(`/patients/${id}/ask`, { question }),
  askAI:               (id, question) => apiClient.post(`/patients/${id}/ask`, { question }),
  toggleDischargeTask: (id, taskIndex) => apiClient.patch(`/patients/${id}/discharge-checklist/${taskIndex}`),
}

// ── Staff ─────────────────────────────────────────────────────
export const staffApi = {
  getAll:           () => apiClient.get('/staff/'),
  getOnDuty:        () => apiClient.get('/staff/on-duty'),
  getDoctorsOnDuty: () => apiClient.get('/staff/doctors-on-duty'),
  getById:          (id) => apiClient.get(`/staff/${id}`),
  getPatients:      (id) => apiClient.get(`/staff/${id}/patients`),
  getByDepartment:  (id) => apiClient.get(`/staff/department/${id}`),
}

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  getAdmin:       () => apiClient.get('/dashboard/admin'),
  getDepartment:  (id) => apiClient.get(`/dashboard/department/${id}`),
  getDoctor:      (id) => apiClient.get(`/dashboard/doctor/${id}`),
  getPatient:     (id) => apiClient.get(`/dashboard/patient/${id}`),
  submitFeedback: (id, rating, comment) => apiClient.post(`/dashboard/patient/${id}/feedback`, { rating, comment }),
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (username, password) => apiClient.post('/auth/login', { username, password }),
}

// ── Workflow (DB-backed) ──────────────────────────────────────
export const workflowApi = {

  // Patient journey
  admitPatient:    (data) => apiClient.post('/workflow/admit', data),
  recordVitals:    (patientId, data) => apiClient.post(`/workflow/vitals/${patientId}`, data),
  diagnosePatient: (patientId, data) => apiClient.post(`/workflow/diagnose/${patientId}`, data),
  dischargePatient:(patientId, data) => apiClient.post(`/workflow/discharge/${patientId}`, data),

  // Nurse management
  assignNurse:     (data) => apiClient.post('/workflow/assign-nurse', data),
  getNurses:       () => apiClient.get('/workflow/nurses'),
  getNursePatients:(nurseId) => apiClient.get(`/workflow/nurses/${nurseId}/patients`),

  // Pharmacy
  getPharmacyQueue:   (status = null) => apiClient.get('/workflow/pharmacy/queue', { params: status ? { status } : {} }),
  dispenseMedication: (orderId, data = {}) => apiClient.patch(`/workflow/pharmacy/${orderId}/dispense`, data),

  // Patients
  getWorkflowPatients: (status = null) => apiClient.get('/workflow/patients', { params: status ? { status } : {} }),
  getPatientSummary:   (patientId) => apiClient.get(`/workflow/patient/${patientId}/summary`),
  getVitalsHistory:    (patientId) => apiClient.get(`/workflow/vitals/${patientId}`),

  // Billing
  getBillingSummary:  () => apiClient.get('/workflow/billing/summary'),
  getPatientBilling:  (patientId) => apiClient.get(`/workflow/billing/patient/${patientId}`),

  // Notifications
  getNotifications:        (role = null, unreadOnly = false) => apiClient.get('/workflow/notifications', { params: { ...(role ? { role } : {}), ...(unreadOnly ? { unread_only: true } : {}) } }),
  markNotificationRead:    (id) => apiClient.patch(`/workflow/notifications/${id}/read`),
}

export default apiClient
