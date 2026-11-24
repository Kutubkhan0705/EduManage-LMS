import {
    LayoutDashboard, BookOpen, Users, GraduationCap,
    ClipboardList, BarChart3, Settings, LogOut,
    FileText, X, HelpCircle, Send, CheckCircle, Clock
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const menuItems = [
    { name: "Dashboard",      icon: LayoutDashboard, roles: ["admin", "instructor", "student"] },
    { name: "Courses",        icon: BookOpen,         roles: ["admin", "instructor", "student"] },
    { name: "Students",       icon: Users,            roles: ["admin"] },
    { name: "Instructors",    icon: GraduationCap,    roles: ["admin"] },
    { name: "Assignments",    icon: ClipboardList,    roles: ["admin", "instructor"] },
    { name: "Analytics",      icon: BarChart3,        roles: ["admin", "instructor"] },
    { name: "Settings",       icon: Settings,         roles: ["admin", "instructor", "student"] },
    { name: "My Assignments", icon: FileText,         roles: ["student"] }
];

function SupportModal({ onClose, user }) {
    const isStudent = user?.role === "student";

    // Student: submit query
    const [form, setForm] = useState({ subject: "", message: "" });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [err, setErr] = useState("");

    // Admin/Instructor: view queries
    const [queries, setQueries] = useState(null);
    const [loadingQ, setLoadingQ] = useState(false);
    const [resolvingId, setResolvingId] = useState(null);

    const fetchQueries = async () => {
        setLoadingQ(true);
        try {
            const res = await api.get("/support");
            setQueries(res.data.queries || []);
        } catch (e) {
            setErr(e.response?.data?.message || "Failed to load queries.");
        } finally {
            setLoadingQ(false);
        }
    };

    // Auto-load for admin/instructor
    useState(() => {
        if (!isStudent) fetchQueries();
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.message.trim()) {
            setErr("Please fill all fields.");
            return;
        }
        setSending(true);
        setErr("");
        try {
            await api.post("/support", form);
            setSent(true);
        } catch (e) {
            setErr(e.response?.data?.message || "Failed to send query.");
        } finally {
            setSending(false);
        }
    };

    const handleResolve = async (id) => {
        setResolvingId(id);
        try {
            await api.patch(`/support/${id}/resolve`);
            setQueries(q => q.map(x => x._id === id ? { ...x, status: "resolved" } : x));
        } catch (_) {}
        setResolvingId(null);
    };

    return (
        <div className="support-modal-overlay" onClick={onClose}>
            <div className="support-modal" onClick={e => e.stopPropagation()}>
                <div className="support-modal-head">
                    <div>
                        <h3>{isStudent ? "Get Support" : "Support Queries"}</h3>
                        <p>{isStudent ? "Send a query to your instructor or admin." : "Student queries from the platform."}</p>
                    </div>
                    <button className="support-modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                {/* STUDENT VIEW */}
                {isStudent && (
                    sent ? (
                        <div className="support-sent">
                            <CheckCircle size={40} color="#22c55e" />
                            <h4>Query Sent!</h4>
                            <p>Your query has been sent to the instructors and admin. They will get back to you soon.</p>
                            <button onClick={onClose}>Close</button>
                        </div>
                    ) : (
                        <form className="support-form" onSubmit={handleSubmit}>
                            {err && <div className="support-err">{err}</div>}
                            <label>Subject</label>
                            <input
                                type="text"
                                placeholder="e.g. Issue with assignment submission"
                                value={form.subject}
                                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                            />
                            <label>Your Message</label>
                            <textarea
                                rows="5"
                                placeholder="Describe your issue or question in detail..."
                                value={form.message}
                                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                            />
                            <button type="submit" className="support-submit-btn" disabled={sending}>
                                <Send size={15} />
                                {sending ? "Sending..." : "Send Query"}
                            </button>
                        </form>
                    )
                )}

                {/* ADMIN / INSTRUCTOR VIEW */}
                {!isStudent && (
                    <div className="support-queries-list">
                        {err && <div className="support-err">{err}</div>}
                        {loadingQ ? (
                            <p className="support-loading">Loading queries...</p>
                        ) : queries?.length === 0 ? (
                            <div className="support-empty">
                                <HelpCircle size={32} />
                                <p>No support queries yet.</p>
                            </div>
                        ) : (
                            queries?.map(q => (
                                <div key={q._id} className={`support-query-card ${q.status}`}>
                                    <div className="support-query-top">
                                        <div className="support-query-avatar">
                                            {q.student?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="support-query-meta">
                                            <strong>{q.student?.name}</strong>
                                            <span>{q.student?.email}</span>
                                        </div>
                                        <span className={`support-status ${q.status}`}>
                                            {q.status === "resolved" ? <CheckCircle size={12} /> : <Clock size={12} />}
                                            {q.status}
                                        </span>
                                    </div>
                                    <h4>{q.subject}</h4>
                                    <p>{q.message}</p>
                                    <div className="support-query-footer">
                                        <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                                        {q.status === "open" && (
                                            <button
                                                className="support-resolve-btn"
                                                onClick={() => handleResolve(q._id)}
                                                disabled={resolvingId === q._id}
                                            >
                                                {resolvingId === q._id ? "Resolving..." : "Mark Resolved"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Sidebar({ active, setActive, mobileOpen, setMobileOpen, onLogout }) {
    const { user } = useAuth();
    const [showSupport, setShowSupport] = useState(false);

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <>
            {mobileOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
            )}

            <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <h2>EduManage</h2>
                        <span>Learning Platform</span>
                    </div>
                    <button className="mobile-close" onClick={() => setMobileOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="menu-label">MENU</div>

                <nav className="sidebar-menu">
                    {filteredMenu.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.name}
                                className={`menu-item ${active === item.name ? "active" : ""}`}
                                onClick={() => { setActive(item.name); setMobileOpen(false); }}
                            >
                                <Icon size={18} />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">
                    <div className="support-card">
                        <div className="support-icon"><HelpCircle size={14} /></div>
                        <h4>{user?.role === "student" ? "Need Help?" : "Support Queries"}</h4>
                        <p>
                            {user?.role === "student"
                                ? "Send a query to your instructor or admin."
                                : "View and manage student support queries."}
                        </p>
                        <button onClick={() => setShowSupport(true)}>
                            {user?.role === "student" ? "Get Support" : "View Queries"}
                        </button>
                    </div>

                    <button className="logout-button" onClick={onLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {showSupport && (
                <SupportModal onClose={() => setShowSupport(false)} user={user} />
            )}
        </>
    );
}

export default Sidebar;
