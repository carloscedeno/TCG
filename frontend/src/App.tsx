import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import TournamentHub from './pages/TournamentHub';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import ImportCollection from './pages/ImportCollection';
import { AuthProvider } from './context/AuthContext';

function App() {
    return (
        <AuthProvider>
            <Router basename="/TCG">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/import" element={<ImportCollection />} />
                    <Route path="/tournaments" element={<TournamentHub />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
