import { useEffect, useState } from "react";
import api from "../services/api";
import { FileText, Clock, CheckCircle, Send, Award } from "lucide-react";

function getGrade(marks, totalMarks) {
    const pct = (marks / totalMarks) * 100;
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B";
    if (pct >= 60) return "C";
    if (pct >= 50) return "D";
    return "F";
}

function StudentAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [answer, setAnswer] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchAssignments = async () => {
        try {
            const res = await api.get("/assignments");
            setAssignments(res.data.assignments || []);
        } catch (error) {
            setMessage(error.response?.data?.message || "Unable to load assignments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAssignments(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer.trim()) { setMessage("Please write your answer first."); return; }
        try {
            setSubmitting(true);
            setMessage("");
            const res = await api.post(`/assignments/${selected._id}/submit`, { answer });
            setMessage(res.data.message || "Assignment submitted successfully!");
            setAnswer("");
            setSelected(null);
            await fetchAssignments();
        } catch (error) {
            setMessage(error.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="student-assignments-page">
            <div className="student-assignment-heading">
                <div>
                    <h1>My Assignments</h1>
                    <p>View assignments, submit your work and check your results.</p>
                </div>
                <FileText size={32} />
            </div>

            {message && <div className="student-assignment-message">{message}</div>}

            {loading ? (
                <p>Loading assignments...</p>
            ) : assignments.length === 0 ? (
                <div className="student-assignment-empty">
                    <FileText size={40} />
                    <h3>No assignments available</h3>
                    <p>Assignments from your enrolled courses will appear here.</p>
                </div>
            ) : (
                <div className="student-assignment-grid">
                    {assignments.map((item) => {
                        const submission = item.mySubmission;
                        const isGraded = submission?.status === "Graded";
                        const isSubmitted = Boolean(submission);
                        const grade = isGraded ? getGrade(submission.marksObtained, item.totalMarks) : null;

                        return (
                            <div className="student-assignment-card" key={item._id}>
                                <div className="student-assignment-card-top">
                                    <span className="student-assignment-tag">
                                        {item.course?.title || "Course"}
                                    </span>
                                    <FileText size={23} />
                                </div>

                                <h3>{item.title}</h3>
                                <p>{item.description}</p>

                                <div className="student-assignment-details">
                                    <span><Clock size={15} /> Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                                    <span>{item.totalMarks} Marks</span>
                                </div>

                                <div className={`sa-status-badge ${isGraded ? "graded" : isSubmitted ? "submitted" : "pending"}`}>
                                    <strong>
                                        {isGraded ? "Graded" : isSubmitted ? "Submitted — Awaiting Review" : "Not Submitted"}
                                    </strong>
                                    {submission?.submittedAt && (
                                        <p>Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                                    )}
                                </div>

                                {isGraded && (
                                    <div className="sa-result-card">
                                        <h3 className="sa-result-title">
                                            <Award size={20} /> Your Result
                                        </h3>
                                        <div className="sa-result-row">
                                            <div>
                                                <small>Marks Obtained</small>
                                                <h2>{submission.marksObtained} / {item.totalMarks}</h2>
                                            </div>
                                            <div>
                                                <small>Grade</small>
                                                <h2 className="sa-grade">{grade}</h2>
                                            </div>
                                        </div>
                                        <div className="sa-feedback">
                                            <strong>Instructor Feedback</strong>
                                            <p>{submission.feedback || "No feedback provided."}</p>
                                        </div>
                                    </div>
                                )}

                                {!isGraded && (
                                    <button
                                        className="student-assignment-submit-btn"
                                        onClick={() => { setSelected(item); setAnswer(submission?.answer || ""); setMessage(""); }}
                                    >
                                        {isSubmitted ? "Update Submission" : "Submit Assignment"}
                                        <Send size={16} />
                                    </button>
                                )}

                                {isGraded && (
                                    <div className="sa-graded-label">
                                        <CheckCircle size={18} /> Result published
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selected && (
                <div className="student-assignment-modal-overlay">
                    <div className="student-assignment-modal">
                        <h2>{selected.title}</h2>
                        <p>{selected.description}</p>
                        <div className="student-assignment-deadline">
                            <Clock size={16} />
                            Deadline: {new Date(selected.dueDate).toLocaleString()}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <label>Your Answer</label>
                            <textarea
                                rows="7"
                                placeholder="Write your assignment answer here..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                required
                            />
                            <div className="student-assignment-modal-actions">
                                <button type="button" className="student-assignment-cancel-btn" onClick={() => setSelected(null)}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting} className="student-assignment-submit-btn">
                                    {submitting ? "Submitting..." : "Submit Answer"}
                                    {!submitting && <CheckCircle size={16} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentAssignments;
