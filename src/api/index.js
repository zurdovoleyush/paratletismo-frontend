import api from './api';

const downloadFile = (url) => api.get(url, { responseType: 'blob' }).then((res) => {
  const blobUrl = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  const disp = res.headers['content-disposition'] || '';
  const match = disp.match(/filename="?([^";]+)"?/i);
  a.href = blobUrl;
  a.download = match ? match[1] : 'documento.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
});

export const readBlobError = async (err) => {
  try {
    if (err.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      const parsed = JSON.parse(text);
      return parsed.error || parsed.detail || text;
    }
  } catch (e) {}
  return err.response?.data?.error || err.message || 'Error de conexion';
};

export const authApi = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/update/', data),
  changePassword: (data) => api.put('/auth/profile/change-password/', data),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
};

export const configApi = {
  getDisciplines: () => api.get('/config/disciplines/'),
  getDiscipline: (id) => api.get(`/config/disciplines/${id}/`),
  createDiscipline: (data) => api.post('/config/disciplines/', data),
  updateDiscipline: (id, data) => api.put(`/config/disciplines/${id}/`, data),
  deleteDiscipline: (id) => api.delete(`/config/disciplines/${id}/`),
  getSexes: () => api.get('/config/sexes/'),
  getSex: (id) => api.get(`/config/sexes/${id}/`),
  createSex: (data) => api.post('/config/sexes/', data),
  updateSex: (id, data) => api.put(`/config/sexes/${id}/`, data),
  deleteSex: (id) => api.delete(`/config/sexes/${id}/`),
  getCategories: () => api.get('/config/categories/'),
  getCategory: (id) => api.get(`/config/categories/${id}/`),
  createCategory: (data) => api.post('/config/categories/', data),
  updateCategory: (id, data) => api.put(`/config/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/config/categories/${id}/`),
  getClassifications: (params) => api.get('/config/classifications/', { params }),
  getClassification: (id) => api.get(`/config/classifications/${id}/`),
  createClassification: (data) => api.post('/config/classifications/', data),
  updateClassification: (id, data) => api.put(`/config/classifications/${id}/`, data),
  deleteClassification: (id) => api.delete(`/config/classifications/${id}/`),
  getEventTypes: () => api.get('/config/event-types/'),
  getEventType: (id) => api.get(`/config/event-types/${id}/`),
  createEventType: (data) => api.post('/config/event-types/', data),
  updateEventType: (id, data) => api.put(`/config/event-types/${id}/`, data),
  deleteEventType: (id) => api.delete(`/config/event-types/${id}/`),
};

export const tournamentApi = {
  getTournaments: (params) => api.get('/tournaments/tournaments/', { params }),
  getTournament: (id) => api.get(`/tournaments/tournaments/${id}/`),
  createTournament: (data) => api.post('/tournaments/tournaments/', data),
  updateTournament: (id, data) => api.put(`/tournaments/tournaments/${id}/`, data),
  deleteTournament: (id) => api.delete(`/tournaments/tournaments/${id}/`),
  updateStatus: (id, status) => api.patch(`/tournaments/tournaments/${id}/status/`, { status }),
  enableTournamentPayment: (id, data) => api.patch(`/tournaments/tournaments/${id}/payment/`, data),
  getTournamentEvents: (id) => api.get(`/tournaments/tournaments/${id}/events/`),
  createTournamentEvents: (id, data) => api.post(`/tournaments/tournaments/${id}/events/`, data),
  finalizeTournamentEvents: (id) => api.post(`/tournaments/tournaments/${id}/finalize-events/`),
  getTournamentStartList: (id) => downloadFile(`/tournaments/tournaments/${id}/start-list/`),
  getTournamentEvent: (id) => api.get(`/tournaments/tournament-events/${id}/`),
  updateTournamentEvent: (id, data) => api.patch(`/tournaments/tournament-events/${id}/`, data),
  deleteTournamentEvent: (id) => api.delete(`/tournaments/tournament-events/${id}/`),
  bulkScheduleEvents: (id, data) => api.post(`/tournaments/tournaments/${id}/schedule/`, data),
  scheduleEvent: (id, data) => api.patch(`/tournaments/tournament-events/${id}/schedule/`, data),
  getInstitutions: () => api.get('/tournaments/institutions/'),
  getAvailableInstitutions: () => api.get('/tournaments/institutions/available/'),
  setCoachInstitution: (data) => api.patch('/tournaments/coaches/my/institution/', data),
  createInstitution: (data) => api.post('/tournaments/institutions/', data),
  updateInstitution: (id, data) => api.put(`/tournaments/institutions/${id}/`, data),
  getManageInstitutions: (showInactive) => api.get('/tournaments/manage/institutions/', { params: showInactive ? { show_all: 'true' } : {} }),
  toggleOrganize: (id, data) => api.patch(`/tournaments/manage/institutions/${id}/toggle-organize/`, data),
  getOrganizationPayments: (params) => api.get('/tournaments/manage/organization-payments/', { params }),
  createOrganizationPayment: (data) => api.post('/tournaments/manage/organization-payments/', data),
  getMyInstitution: () => api.get('/tournaments/institutions/my/'),
  getInstitutionAthletes: (id) => api.get(`/tournaments/institutions/${id}/athletes/`),
  getInstitutionCoaches: (id) => api.get(`/tournaments/institutions/${id}/coaches/`),
  getInstitutionTournaments: (id) => api.get(`/tournaments/institutions/${id}/tournaments/`),
  getAthletes: (params) => api.get('/tournaments/athletes/', { params }),
  getAthlete: (id) => api.get(`/tournaments/athletes/${id}/`),
  createAthlete: (data) => api.post('/tournaments/athletes/', data),
  updateAthlete: (id, data) => api.put(`/tournaments/athletes/${id}/`, data),
  deleteAthlete: (id) => api.delete(`/tournaments/athletes/${id}/`),
  getCoaches: (params) => api.get('/tournaments/coaches/', { params }),
  getCoach: (id) => api.get(`/tournaments/coaches/${id}/`),
  createCoach: (data) => api.post('/tournaments/coaches/', data),
  updateCoach: (id, data) => api.put(`/tournaments/coaches/${id}/`, data),
  deleteCoach: (id) => api.delete(`/tournaments/coaches/${id}/`),
  getMyAthletes: () => api.get('/tournaments/athletes/my/'),
  getMyAthleteProfile: () => api.get('/tournaments/athletes/profile/me/'),
  updateMyAthleteProfile: (data) => api.put('/tournaments/athletes/profile/me/', data),
};

export const competitionApi = {
  getRegistrations: (params) => api.get('/competitions/registrations/', { params }),
  createRegistration: (data) => api.post('/competitions/registrations/', data),
  updateRegistration: (id, data) => api.patch(`/competitions/registrations/${id}/`, data),
  deleteRegistration: (id) => api.delete(`/competitions/registrations/${id}/`),
  approveRegistration: (id) => api.patch(`/competitions/registrations/${id}/approve/`),
  rejectRegistration: (id, data) => api.patch(`/competitions/registrations/${id}/reject/`, data),
  getMyRegistrations: () => api.get('/competitions/registrations/my/'),
  getAthleteRegistrationOptions: (athleteId) => api.get(`/competitions/athlete/${athleteId}/registration-options/`),
  getAthleteEvents: (eventPk) => api.get(`/competitions/events/${eventPk}/athlete-events/`),
  createAthleteEvent: (eventPk, data) => api.post(`/competitions/events/${eventPk}/athlete-events/`, data),
  getJudgeAssignments: (eventPk) => api.get(`/competitions/events/${eventPk}/judges/`),
  createJudgeAssignment: (eventPk, data) => api.post(`/competitions/events/${eventPk}/judges/`, data),
  deleteJudgeAssignment: (assignmentId) => api.delete(`/competitions/judges/${assignmentId}/`),
  getMyJudgeAssignments: () => api.get('/competitions/judges/my/'),
  registerAthleteToEvent: (eventPk, data) => api.post(`/competitions/events/${eventPk}/register-athlete/`, data),
  deleteAthleteEvent: (eventPk, athleteEventId) => api.delete(`/competitions/events/${eventPk}/athlete-events/${athleteEventId}/`),
  confirmRegistrationEvents: (registrationId) => api.patch(`/competitions/registrations/${registrationId}/confirm-events/`),
  getLaneAssignments: (eventPk) => api.get(`/competitions/events/${eventPk}/assign-lanes/`),
  assignLanes: (eventPk, data) => api.post(`/competitions/events/${eventPk}/assign-lanes/`, data),
  createBulkResults: (eventPk, data) => api.post(`/competitions/events/${eventPk}/bulk-results/`, data),
  getResults: (params) => api.get('/competitions/results/', { params }),
  createResult: (data) => api.post('/competitions/results/', data),
  getFinalResults: (params) => api.get('/competitions/final-results/', { params }),
  getMyResults: () => api.get('/competitions/final-results/my/'),
  createFinalResult: (data) => api.post('/competitions/final-results/', data),
  calculateFinalResults: (data) => api.post('/competitions/calculate-final-results/', data),
  getEventResultsPublic: (eventPk) => api.get(`/competitions/events/${eventPk}/final-results/public/`),
  getTournamentPublicResults: (tournamentPk) => api.get(`/competitions/tournaments/${tournamentPk}/results/public/`),
  getAthletePublicHistory: (athleteId) => api.get(`/competitions/athletes/${athleteId}/history/`),
  getRecords: (params) => api.get('/competitions/records/', { params }),
  getAthleteBestMarks: (athleteId) => api.get(`/competitions/athletes/${athleteId}/best-marks/`),
  getEventStartList: (eventPk) => downloadFile(`/competitions/events/${eventPk}/start-list/`),
  getEventFinalList: (eventPk) => downloadFile(`/competitions/events/${eventPk}/final-list/`),
};

export const usersApi = {
  getUsers: (params) => api.get('/auth/users/', { params }),
  createUser: (data) => api.post('/auth/users/create/', data),
  getUser: (id) => api.get(`/auth/users/${id}/`),
  updateUser: (id, data) => api.put(`/auth/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}/`),
  toggleActive: (id) => api.patch(`/auth/users/${id}/toggle-active/`),
};
