import { useEffect, useState } from "react";
import {
    BookOpen,
    Users,
    GraduationCap,
    TrendingUp,
    CheckCircle,
    BarChart2,
    FileText,
    Eye
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function BarChart({ data }) {
    const max = Math.max(...data.map(d => d.enrollments), 1);
    return (
        <div className="an-bar-chart">
            {data.map((d, i) => (
                <div key={i} className="an-bar-col">
                    <div className="an-bar-wrap">
                        <div
                            className="an-bar-fill"
                            style={{ height: `${(d.enrollments / max) * 100}%` }}
                        />
                    </div>
                    <span>{d.month}</span>
                    <strong>{d.enrollments}</strong>
                </div>
            ))}
        </div>
    );
}

function Analytics() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await api.get("/analytics/overview");
                setData(res.data.analytics);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load analytics.");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <div className="an-loading">Loading analytics...</div>;
    if (error) return <div className="an-error">{error}</div>;

    const stats = [
        {
            label: "Total Courses",
            value: data.totalCourses,
            sub: `${data.publishedCourses} published · ${data.draftCourses} draft`,
            icon: BookOpen,
            color: "blue"
        },
        {
            label: "Total Enrollments",
            value: data.totalEnrollments,
            sub: "Across all courses",
            icon: TrendingUp,
            color: "green"
        },
        {
            label: "Total Students",
            value: data.totalStudents,
            sub: user?.role === "admin" ? `${data.activeUsers} active · ${data.inactiveUsers} inactive` : "Enrolled in your courses",
            icon: Users,
            color: "purple"
        },
        {
            label: "Completion Rate",
            value: `${data.completionRate}%`,
            sub: `${data.completedLessons} lessons completed`,
            icon: CheckCircle,
            color: "orange"
        },
        ...(user?.role === "admin" ? [{
            label: "Instructors",
            value: data.totalInstructors,
            sub: "Active instructors",
            icon: GraduationCap,
            color: "blue"
        }] : [])
    ];

    return (
        <div className="an-page">
            <div className="an-header">
                <div>
                    <h1>Analytics</h1>
                    <p>Track your LMS performance and growth.</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="an-stats-grid">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div className="an-stat-card" key={s.label}>
                            <div className={`an-stat-icon ${s.color}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <h2>{s.value}</h2>
                                <p>{s.label}</p>
                                <span>{s.sub}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="an-main-grid">
                {/* Monthly Enrollments Chart */}
                <div className="an-card">
                    <div className="an-card-head">
                        <div>
                            <h3>Monthly Enrollments</h3>
                            <p>Last 6 months enrollment trend</p>
                        </div>
                        <BarChart2 size={18} color="#6366f1" />
                    </div>
                    {data.monthlyEnrollments?.length > 0 ? (
                        <BarChart data={data.monthlyEnrollments} />
                    ) : (
                        <p className="an-empty">No enrollment data available.</p>
                    )}
                </div>

                {/* Course Status Breakdown */}
                <div className="an-card">
                    <div className="an-card-head">
                        <div>
                            <h3>Course Status</h3>
                            <p>Published vs Draft</p>
                        </div>
                        <Eye size={18} color="#6366f1" />
                    </div>
                    <div className="an-donut-wrap">
                        <div className="an-donut">
                            <svg viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0f1f6" strokeWidth="3.5" />
                                {data.totalCourses > 0 && (
                                    <circle
                                        cx="18" cy="18" r="15.9"
                                        fill="none"
                                        stroke="#6366f1"
                                        strokeWidth="3.5"
                                        strokeDasharray={`${(data.publishedCourses / data.totalCourses) * 100} 100`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 18 18)"
                                    />
                                )}
                            </svg>
                            <div className="an-donut-label">
                                <strong>{data.totalCourses > 0 ? Math.round((data.publishedCourses / data.totalCourses) * 100) : 0}%</strong>
                                <span>Published</span>
                            </div>
                        </div>
                        <div className="an-donut-legend">
                            <div><span className="dot dot-purple" />Published <strong>{data.publishedCourses}</strong></div>
                            <div><span className="dot dot-gray" />Draft <strong>{data.draftCourses}</strong></div>
                            <div><span className="dot dot-green" />Total <strong>{data.totalCourses}</strong></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Courses Table */}
            <div className="an-card an-table-card">
                <div className="an-card-head">
                    <div>
                        <h3>Top Performing Courses</h3>
                        <p>Ranked by enrollment count</p>
                    </div>
                    <FileText size={18} color="#6366f1" />
                </div>
                {data.coursePerformance?.length > 0 ? (
                    <div className="an-table-scroll">
                        <table className="an-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Course</th>
                                    <th>Category</th>
                                    <th>Lessons</th>
                                    <th>Enrollments</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.coursePerformance.map((c, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td><strong>{c.title}</strong></td>
                                        <td>{c.category || "—"}</td>
                                        <td>{c.lessons}</td>
                                        <td><span className="an-enroll-badge">{c.enrollments}</span></td>
                                        <td>
                                            <span className={c.published ? "an-status published" : "an-status draft"}>
                                                {c.published ? "Published" : "Draft"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="an-empty">No course data available.</p>
                )}
            </div>
        </div>
    );
}

export default Analytics;
