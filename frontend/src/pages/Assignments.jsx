
import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    ClipboardList,
    CalendarDays,
    Pencil,
    Trash2,
    X,
    Eye
} from "lucide-react";
import api from "../services/api";

function Assignments() {
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [showSubmissions, setShowSubmissions] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [gradingId, setGradingId] = useState(null);

    const emptyForm = {
        title: "",
        description: "",
        courseId: "",
        dueDate: "",
        totalMarks: 100,
        isPublished: true,
    };

    const [formData, setFormData] = useState(emptyForm);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [assignmentRes, courseRes] = await Promise.all([
                api.get("/assignments"),
                api.get("/courses"),
            ]);

            setAssignments(assignmentRes.data.assignments || []);
            setCourses(courseRes.data.courses || []);
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Unable to load assignments or courses"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setMessage("");
        setShowModal(true);
    };

    const openEditModal = (assignment) => {
        setEditingId(assignment._id);

        setFormData({
            title: assignment.title || "",
            description: assignment.description || "",
            courseId: assignment.course?._id || "",
            dueDate: assignment.dueDate
                ? new Date(assignment.dueDate).toISOString().slice(0, 16)
                : "",
            totalMarks: assignment.totalMarks || 100,
            isPublished: assignment.isPublished,
        });

        setMessage("");
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const payload = {
                ...formData,
                totalMarks: Number(formData.totalMarks),
            };

            if (editingId) {
                // Course change is not supported by the current backend update API.
                delete payload.courseId;

                await api.put(`/assignments/${editingId}`, payload);
                setMessage("Assignment updated successfully!");
            } else {
                await api.post("/assignments", payload);
                setMessage("Assignment created successfully!");
            }

            setShowModal(false);
            setFormData(emptyForm);
            setEditingId(null);
            await fetchData();
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Unable to save assignment"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this assignment?"
        );

        if (!confirmed) return;

        try {
            await api.delete(`/assignments/${id}`);
            setMessage("Assignment deleted successfully!");
            await fetchData();
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Unable to delete assignment"
            );
        }
    };

    const handlePublish = async (assignment) => {
        try {
            await api.put(`/assignments/${assignment._id}`, {
                isPublished: !assignment.isPublished,
            });

            setMessage("Assignment status updated!");
            await fetchData();
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Unable to update status"
            );
        }
    };

    const openSubmissions = async (assignment) => {
        setSelectedAssignment(assignment);
        setShowSubmissions(true);
        setLoadingSubmissions(true);
        setSubmissions([]);

        try {
            const response = await api.get(
                `/assignments/${assignment._id}/submissions`
            );

            setSubmissions(response.data.submissions || []);
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to load student submissions"
            );
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleGrade = async (e, submissionId) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const marksObtained = Number(formData.get("marksObtained"));
        const feedback = formData.get("feedback");

        if (
            marksObtained < 0 ||
            marksObtained > selectedAssignment.totalMarks
        ) {
            alert(`Marks must be between 0 and ${selectedAssignment.totalMarks}`);
            return;
        }

        try {
            setGradingId(submissionId);

            await api.patch(
                `/assignments/submissions/${submissionId}/grade`,
                {
                    marksObtained,
                    feedback
                }
            );

            alert("Assignment graded successfully!");

            await openSubmissions(selectedAssignment);
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to grade submission"
            );
        } finally {
            setGradingId(null);
        }
    };

    const filteredAssignments = assignments.filter((assignment) => {
        const value = search.toLowerCase();

        return (
            assignment.title?.toLowerCase().includes(value) ||
            assignment.course?.title?.toLowerCase().includes(value)
        );
    });

    const publishedCount = assignments.filter(
        (assignment) => assignment.isPublished
    ).length;

    const draftCount = assignments.length - publishedCount;

    return (
        <div className="assignments-page">
            <div className="assignments-header">
                <div>
                    <h1>Assignments</h1>
                    <p>Create and manage course assignments.</p>
                </div>

                <button className="add-assignment-btn" onClick={openCreateModal}>
                    <Plus size={18} />
                    Create Assignment
                </button>
            </div>

            {message && (
                <div className="assignment-message">
                    {message}
                </div>
            )}

            <div className="assignment-stats">
                <div className="assignment-stat-card">
                    <ClipboardList size={25} />
                    <div>
                        <h2>{assignments.length}</h2>
                        <p>Total Assignments</p>
                    </div>
                </div>

                <div className="assignment-stat-card">
                    <CalendarDays size={25} />
                    <div>
                        <h2>{publishedCount}</h2>
                        <p>Published</p>
                    </div>
                </div>

                <div className="assignment-stat-card">
                    <ClipboardList size={25} />
                    <div>
                        <h2>{draftCount}</h2>
                        <p>Unpublished</p>
                    </div>
                </div>
            </div>

            <div className="assignment-list-container">
                <div className="assignment-list-header">
                    <h3>All Assignments</h3>

                    <div className="assignment-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search assignments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="assignment-empty">Loading assignments...</p>
                ) : filteredAssignments.length === 0 ? (
                    <p className="assignment-empty">
                        No assignments found. Create your first assignment.
                    </p>
                ) : (
                    <div className="assignment-table-scroll">
                        <table className="assignment-table">
                            <thead>
                                <tr>
                                    <th>Assignment</th>
                                    <th>Course</th>
                                    <th>Due Date</th>
                                    <th>Marks</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAssignments.map((assignment) => (
                                    <tr key={assignment._id}>
                                        <td>
                                            <strong>{assignment.title}</strong>
                                            <p className="assignment-description">
                                                {assignment.description}
                                            </p>
                                        </td>

                                        <td>{assignment.course?.title || "Course unavailable"}</td>

                                        <td>
                                            {new Date(assignment.dueDate).toLocaleDateString()}
                                        </td>

                                        <td>{assignment.totalMarks}</td>

                                        <td>
                                            <span
                                                className={`assignment-status ${assignment.isPublished ? "published" : "draft"
                                                    }`}
                                            >
                                                {assignment.isPublished ? "Published" : "Unpublished"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="assignment-actions">
                                                <button
                                                    title="Edit assignment"
                                                    onClick={() => openEditModal(assignment)}
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    title="Publish or unpublish"
                                                    onClick={() => handlePublish(assignment)}
                                                >
                                                    {assignment.isPublished ? "Unpublish" : "Publish"}
                                                </button>
                                                <button
                                                    title="View student submissions"
                                                    onClick={() => openSubmissions(assignment)}
                                                >
                                                    <Eye size={16} />
                                                    View Submissions
                                                </button>

                                                <button
                                                    title="Delete assignment"
                                                    className="delete-assignment-btn"
                                                    onClick={() => handleDelete(assignment._id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="assignment-modal-overlay">
                    <div className="assignment-modal">
                        <div className="assignment-modal-header">
                            <h2>
                                {editingId ? "Edit Assignment" : "Create Assignment"}
                            </h2>

                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label>Assignment Title</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Enter assignment title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />

                            <label>Description</label>
                            <textarea
                                name="description"
                                placeholder="Enter assignment instructions"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                required
                            />

                            <label>Course</label>
                            <select
                                name="courseId"
                                value={formData.courseId}
                                onChange={handleChange}
                                required
                                disabled={Boolean(editingId)}
                            >
                                <option value="">Select Course</option>

                                {courses.map((course) => (
                                    <option key={course._id} value={course._id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>

                            <label>Due Date</label>
                            <input
                                type="datetime-local"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                min={new Date().toISOString().slice(0, 16)}
                                required
                            />

                            <label>Total Marks</label>
                            <input
                                type="number"
                                name="totalMarks"
                                min="1"
                                value={formData.totalMarks}
                                onChange={handleChange}
                                required
                            />

                            <label className="assignment-publish-label">
                                <input
                                    type="checkbox"
                                    name="isPublished"
                                    checked={formData.isPublished}
                                    onChange={handleChange}
                                />
                                Publish assignment immediately
                            </label>

                            <button
                                type="submit"
                                className="save-assignment-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Assignment"
                                        : "Create Assignment"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {showSubmissions && selectedAssignment && (
                <div className="assignment-modal-overlay">
                    <div className="assignment-modal sub-modal">
                        <div className="assignment-modal-header">
                            <div>
                                <h2>Student Submissions</h2>
                                <p className="sub-modal-subtitle">
                                    {selectedAssignment.title} &nbsp;·&nbsp; {selectedAssignment.totalMarks} marks
                                </p>
                            </div>
                            <button onClick={() => setShowSubmissions(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {loadingSubmissions ? (
                            <p className="assignment-empty">Loading submissions...</p>
                        ) : submissions.length === 0 ? (
                            <p className="assignment-empty">No students have submitted this assignment yet.</p>
                        ) : (
                            <div className="sub-list">
                                {submissions.map((submission) => (
                                    <div key={submission._id} className={`sub-card ${submission.status === "Graded" ? "sub-graded" : ""}`}>
                                        <div className="sub-student-row">
                                            <div className="sub-avatar">
                                                {(submission.student?.name || "S")[0].toUpperCase()}
                                            </div>
                                            <div className="sub-student-info">
                                                <strong>{submission.student?.name || "Student"}</strong>
                                                <span>{submission.student?.email || ""}</span>
                                            </div>
                                            <div className="sub-meta">
                                                <span className={`sub-status-badge ${submission.status === "Graded" ? "graded" : "submitted"}`}>
                                                    {submission.status}
                                                </span>
                                                {submission.status === "Graded" && (
                                                    <span className="sub-marks-badge">
                                                        {submission.marksObtained} / {selectedAssignment.totalMarks}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sub-time">
                                            Submitted: {submission.submittedAt
                                                ? new Date(submission.submittedAt).toLocaleString()
                                                : "—"}
                                        </div>

                                        <div className="sub-answer-label">Student Answer</div>
                                        <div className="sub-answer-box">{submission.answer}</div>

                                        {submission.status === "Graded" && submission.feedback && (
                                            <div className="sub-prev-feedback">
                                                <strong>Previous Feedback:</strong> {submission.feedback}
                                            </div>
                                        )}

                                        <form className="sub-grade-form" onSubmit={(e) => handleGrade(e, submission._id)}>
                                            <div className="sub-grade-row">
                                                <div>
                                                    <label>Marks (0 – {selectedAssignment.totalMarks})</label>
                                                    <input
                                                        type="number"
                                                        name="marksObtained"
                                                        min="0"
                                                        max={selectedAssignment.totalMarks}
                                                        defaultValue={submission.marksObtained ?? ""}
                                                        required
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="sub-grade-btn"
                                                    disabled={gradingId === submission._id}
                                                >
                                                    {gradingId === submission._id ? "Saving..." : submission.status === "Graded" ? "Update Grade" : "Grade"}
                                                </button>
                                            </div>
                                            <textarea
                                                name="feedback"
                                                rows="2"
                                                defaultValue={submission.feedback || ""}
                                                placeholder="Feedback for student (optional)"
                                            />
                                        </form>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Assignments;