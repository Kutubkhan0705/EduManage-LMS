
import { useEffect, useState } from "react";
import api from "../services/api";
import { Search, Plus, Users, UserCheck, UserX, X } from "lucide-react";

function Instructors() {
    const [instructors, setInstructors] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const fetchInstructors = async () => {
        try {
            setLoading(true);
            const res = await api.get("/instructors");
            setInstructors(res.data.instructors || []);
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Failed to load instructors"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstructors();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            await api.post("/instructors", formData);

            setMessage("Instructor created successfully!");
            setFormData({ name: "", email: "", password: "" });
            setShowModal(false);

            fetchInstructors();
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Unable to create instructor"
            );
        }
    };

    const handleStatus = async (id, currentStatus) => {
        try {
            await api.patch(`/instructors/${id}/status`, {
                isActive: !currentStatus,
            });

            fetchInstructors();
            setMessage("Instructor status updated successfully!");
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Unable to update status"
            );
        }
    };

    const filteredInstructors = instructors.filter((instructor) => {
        const value = search.toLowerCase();

        return (
            instructor.name?.toLowerCase().includes(value) ||
            instructor.email?.toLowerCase().includes(value)
        );
    });

    const activeCount = instructors.filter((i) => i.isActive).length;
    const inactiveCount = instructors.length - activeCount;

    return (
        <div className="instructors-page">
            <div className="instructors-header">
                <div>
                    <h1>Instructor Management</h1>
                    <p>Manage and monitor your platform instructors.</p>
                </div>

                <button
                    className="add-instructor-btn"
                    onClick={() => {
                        setMessage("");
                        setShowModal(true);
                    }}
                >
                    <Plus size={18} /> Add Instructor
                </button>
            </div>

            {message && (
                <div className="instructor-message">
                    {message}
                </div>
            )}

            <div className="instructor-stats">
                <div className="instructor-stat-card">
                    <Users size={25} />
                    <div>
                        <h2>{instructors.length}</h2>
                        <p>Total Instructors</p>
                    </div>
                </div>

                <div className="instructor-stat-card">
                    <UserCheck size={25} />
                    <div>
                        <h2>{activeCount}</h2>
                        <p>Active Instructors</p>
                    </div>
                </div>

                <div className="instructor-stat-card">
                    <UserX size={25} />
                    <div>
                        <h2>{inactiveCount}</h2>
                        <p>Inactive Instructors</p>
                    </div>
                </div>
            </div>

            <div className="instructor-table-container">
                <div className="instructor-table-header">
                    <h3>All Instructors</h3>

                    <div className="instructor-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search instructor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="instructor-loading">Loading instructors...</p>
                ) : (
                    <div className="instructor-table-scroll">
                        <table className="instructor-table">
                            <thead>
                                <tr>
                                    <th>Instructor</th>
                                    <th>Email</th>
                                    <th>Joining Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredInstructors.length > 0 ? (
                                    filteredInstructors.map((instructor) => (
                                        <tr key={instructor._id}>
                                            <td>
                                                <div className="instructor-name">
                                                    <div className="instructor-avatar">
                                                        {instructor.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {instructor.name}
                                                </div>
                                            </td>

                                            <td>{instructor.email}</td>

                                            <td>
                                                {instructor.createdAt
                                                    ? new Date(instructor.createdAt).toLocaleDateString()
                                                    : "N/A"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`instructor-status ${instructor.isActive ? "active" : "inactive"
                                                        }`}
                                                >
                                                    {instructor.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className={`instructor-action ${instructor.isActive ? "deactivate" : "activate"
                                                        }`}
                                                    onClick={() =>
                                                        handleStatus(instructor._id, instructor.isActive)
                                                    }
                                                >
                                                    {instructor.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="instructor-empty">
                                            No instructors found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="instructor-modal-overlay">
                    <div className="instructor-modal">
                        <div className="instructor-modal-header">
                            <h2>Add New Instructor</h2>
                            <button onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate}>
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter instructor name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={6}
                                required
                            />

                            <button type="submit" className="create-instructor-btn">
                                Create Instructor
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Instructors;
