import { Route, Routes, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewProblem from './pages/NewProblem';
import ProblemDetail from './pages/ProblemDetail';
import Library from './pages/Library';
import LessonDetail from './pages/LessonDetail';
import Resources from './pages/Resources';
import Passwords from './pages/Passwords';
import Phishing from './pages/Phishing';
import Files from './pages/Files';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="passwords" element={<Passwords />} />
        <Route path="phishing" element={<Phishing />} />
        <Route path="files" element={<Files />} />
        <Route path="reports" element={<Reports />} />
        <Route path="problems/new" element={<NewProblem />} />
        <Route path="problems/:id" element={<ProblemDetail />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:slug" element={<LessonDetail />} />
        <Route path="resources" element={<Resources />} />
        <Route
          path="*"
          element={
            <section className="page-section">
              <h1 className="page-title">Page not found</h1>
              <p className="page-lead">
                That page does not exist. <Link to="/">Return to the dashboard</Link>.
              </p>
            </section>
          }
        />
      </Route>
    </Routes>
  );
}
