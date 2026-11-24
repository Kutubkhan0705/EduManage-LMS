import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Students from "./pages/Students";
import Instructors from "./pages/Instructors";
import Assignments from "./pages/Assignments";
import StudentAssignments from "./pages/StudentAssignments";
import CourseDetails from "./pages/CourseDetails";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import { useState } from "react";


function DashboardLayout() {
    const { user, logout } = useAuth();
    const [active, setActive] = useState("Dashboard");
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        window.location.href = "/login";
    };

    const renderPage = () => {
        switch (active) {
            case "Dashboard":
                return <Dashboard />;

            case "Analytics":
                return ["admin", "instructor"].includes(user?.role)
                    ? <Analytics />
                    : <Dashboard />;

            case "Settings":
                return <Settings />;

            case "Courses":
                return <Courses />;

            case "Students":
                return user?.role === "admin"
                    ? <Students />
                    : <Dashboard />;

            case "Instructors":
                return user?.role === "admin"
                    ? <Instructors />
                    : <Dashboard />;

            case "Assignments":
                return ["admin", "instructor"].includes(user?.role)
                    ? <Assignments />
                    : <Dashboard />;

            case "My Assignments":
                return user?.role === "student"
                    ? <StudentAssignments />
                    : <Dashboard />;

            default:
                return (
                    <div className="placeholder-page">
                        <h2>{active}</h2>
                        <p>Welcome, {user?.name}. This module is coming soon.</p>
                    </div>
                );
        }
    };

    return (
        <div className="app-layout">
            <Sidebar
                active={active}
                setActive={setActive}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                onLogout={handleLogout}
            />
            <main className="main-content">
                <Navbar setMobileOpen={setMobileOpen} />
                {renderPage()}
            </main>
        </div>
    );
}

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-screen">Loading EduManage...</div>;
    }

    return (
        <Routes>
            <Route
                path="/"
                element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
            />
            <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
                path="/register"
                element={user ? <Navigate to="/dashboard" replace /> : <Register />}
            />
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />} />
                <Route path="/courses/:id" element={<CourseDetails />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
