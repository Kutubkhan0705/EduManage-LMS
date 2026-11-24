
import { useEffect, useState } from "react";
import api from "../services/api";
import {
    Search,
    Users,
    BookOpen,
    UserCheck,
    UserX,
    RefreshCw
} from "lucide-react";

export default function Students() {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    const fetchStudents = async (searchValue = search) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/students", {
                params: { search: searchValue }
            });

            setStudents(response.data.students || []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to load students."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents("");
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchStudents(search);
    };

    const handleStatusChange = async (student) => {
        const newStatus = !student.isActive;

        const confirmed = window.confirm(
            `Are you sure you want to ${newStatus ? "activate" : "deactivate"
            } ${student.name}?`
        );

        if (!confirmed) return;

        try {
            setUpdatingId(student._id);
            setError("");

            await api.patch(`/students/${student._id}/status`, {
                isActive: newStatus
            });

            setStudents((prev) =>
                prev.map((item) =>
                    item._id === student._id
                        ? { ...item, isActive: newStatus }
                        : item
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to update student."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.isActive).length;
    const inactiveStudents = students.filter((s) => !s.isActive).length;
    const totalEnrollments = students.reduce(
        (total, student) => total + (student.enrolledCourses || 0),
        0
    );

    return (
        <div className="students-page">
            <div className="students-heading">
                <div>
                    <h1>Student Management</h1>
                    <p>Manage registered students and their accounts.</p>
                </div>

                <button
                    className="student-refresh-btn"
                    onClick={() => fetchStudents()}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            <div className="student-stats">
                <div className="student-stat-card">
                    <Users />
                    <div>
                        <h2>{totalStudents}</h2>
                        <p>Total Students</p>
                    </div>
                </div>

                <div className="student-stat-card">
                    <UserCheck />
                    <div>
                        <h2>{activeStudents}</h2>
                        <p>Active Students</p>
                    </div>
                </div>

                <div className="student-stat-card">
                    <UserX />
                    <div>
                        <h2>{inactiveStudents}</h2>
                        <p>Inactive Students</p>
                    </div>
                </div>

                <div className="student-stat-card">
                    <BookOpen />
                    <div>
                        <h2>{totalEnrollments}</h2>
                        <p>Total Enrollments</p>
                    </div>
                </div>
            </div>

            <form className="student-search" onSubmit={handleSearch}>
                <Search size={19} />
                <input
                    type="text"
                    placeholder="Search by student name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>

            {error && <div className="student-error">{error}</div>}

            <div className="student-table-container">
                <div className="student-table-heading">
                    <h2>All Students</h2>
                    <span>{students.length} students found</span>
                </div>

                {loading ? (
                    <div className="student-empty">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="student-empty">
                        <Users size={40} />
                        <h3>No students found</h3>
                        <p>Try another name or email address.</p>
                    </div>
                ) : (
                    <div className="student-table-scroll">
                        <table className="student-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Email</th>
                                    <th>Enrolled Courses</th>
                                    <th>Joined Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {students.map((student) => (
                                    <tr key={student._id}>
                                        <td>
                                            <div className="student-name-cell">
                                                <div className="student-avatar">
                                                    {student.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <strong>{student.name}</strong>
                                            </div>
                                        </td>

                                        <td>{student.email}</td>

                                        <td>{student.enrolledCourses || 0}</td>

                                        <td>
                                            {new Date(student.createdAt).toLocaleDateString()}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    student.isActive
                                                        ? "student-active"
                                                        : "student-inactive"
                                                }
                                            >
                                                {student.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                className={
                                                    student.isActive
                                                        ? "student-deactivate-btn"
                                                        : "student-activate-btn"
                                                }
                                                onClick={() => handleStatusChange(student)}
                                                disabled={updatingId === student._id}
                                            >
                                                {updatingId === student._id
                                                    ? "Updating..."
                                                    : student.isActive
                                                        ? "Deactivate"
                                                        : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
