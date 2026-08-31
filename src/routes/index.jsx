import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import TournamentsList from '../pages/TournamentsList';
import TournamentDetail from '../pages/TournamentDetail';
import TournamentEvents from '../pages/TournamentEvents';
import TournamentDetailDashboard from '../pages/TournamentDetailDashboard';
import JudgeAssignments from '../pages/JudgeAssignments';
import AthletesList from '../pages/AthletesList';
import CoachProfile from '../pages/CoachProfile';
import CoachesList from '../pages/CoachesList';
import InstitutionProfile from '../pages/InstitutionProfile';
import RegistrationsList from '../pages/RegistrationsList';
import ConfigPage from '../pages/ConfigPage';
import UsersManagement from '../pages/UsersManagement';
import CreateTournament from '../pages/CreateTournament';
import EventsPage from '../pages/EventsPage';
import ResultsPage from '../pages/ResultsPage';
import Profile from '../pages/Profile';
import PublicTournaments from '../pages/PublicTournaments';
import PublicResults from '../pages/PublicResults';
import PublicAthleteProfile from '../pages/PublicAthleteProfile';
import Records from '../pages/Records';
import Unauthorized from '../pages/Unauthorized';
import AthleteRegistration from '../pages/AthleteRegistration';
import LaneAssignment from '../pages/LaneAssignment';
import OrganizersManagement from '../pages/OrganizersManagement';
import TournamentPayments from '../pages/TournamentPayments';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/tournaments',
    element: <PublicTournaments />,
  },
  {
    path: '/results/:status',
    element: <PublicResults />,
  },
  {
    path: '/atleta/:id',
    element: <PublicAthleteProfile />,
  },
  {
    path: '/records',
    element: <Records />,
  },
  {
    path: '/tournaments/:id',
    element: <TournamentDetail />,
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'users', element: <ProtectedRoute allowedRoles={['superadmin']} />, children: [{ index: true, element: <UsersManagement /> }] },
          { path: 'config/:type', element: <ProtectedRoute allowedRoles={['superadmin']} />, children: [{ index: true, element: <ConfigPage /> }] },
          { path: 'tournaments', element: <TournamentsList /> },
          { path: 'tournaments/new', element: <CreateTournament /> },
          { path: 'tournaments/:id', element: <TournamentDetailDashboard /> },
          { path: 'tournaments/:id/events', element: <TournamentEvents /> },
          { path: 'tournaments/:id/judges', element: <JudgeAssignments /> },
          { path: 'events/:id/lanes', element: <LaneAssignment /> },
          { path: 'athletes', element: <AthletesList /> },
          { path: 'athletes/:id/register', element: <AthleteRegistration /> },
          { path: 'coaches', element: <CoachesList /> },
          { path: 'coach/profile', element: <CoachProfile /> },
          { path: 'institution', element: <InstitutionProfile /> },
          { path: 'registrations', element: <RegistrationsList /> },
          { path: 'events', element: <EventsPage /> },
          { path: 'results', element: <ResultsPage /> },
          { path: 'profile', element: <Profile /> },
          { path: 'judges', element: <EventsPage /> },
          { path: 'classifications', element: <RegistrationsList /> },
          { path: 'organizers', element: <ProtectedRoute allowedRoles={['superadmin']} />, children: [{ index: true, element: <OrganizersManagement /> }] },
          { path: 'tournament-payments', element: <ProtectedRoute allowedRoles={['superadmin']} />, children: [{ index: true, element: <TournamentPayments /> }] },
        ],
      },
    ],
  },
]);

export default router;
