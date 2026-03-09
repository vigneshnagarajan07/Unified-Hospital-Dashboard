import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const api = {
  getAggregation: () => client.get('/m1/data'),
  getKPIs: () => client.get('/m2/kpis'),
  getAnomalies: () => client.get('/m3/anomalies'),
  getInsights: () => client.get('/m4/insights'),
  getRecommendations: () => client.get('/m5/recommendations'),
  getRoleView: (roleEndpoint) => client.get(`/m6/${roleEndpoint}`),
  getForecast: () => client.get('/m7/forecast'),
  sendChat: (message) => client.post('/chat', { message })
};

export default client;
