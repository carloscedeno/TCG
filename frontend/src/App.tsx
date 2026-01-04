import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AuthProvider } from './context/AuthContext';

function App() {
    return (
        <AuthProvider>
            <Router basename="/TCG">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
