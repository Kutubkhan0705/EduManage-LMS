import { Search, Bell, Menu, ChevronDown, ClipboardList, HelpCircle, X, CheckCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const getTimeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return "Just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const ICONS = {
    ASSIGNMENT_SUBMITTED: ClipboardList,
    SUPPORT_QUERY: HelpCircle
};

function Navbar({ setMobileOpen }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const dropRef = useRef(null);

    const userName = user?.name || "User";
    const roleName = { admin: "Super Admin", instructor: "Instructor", student: "Student" }[user?.role] || "User";
    const initials = userName.split(" ").filter(Boolean).map(w => w[0]).join("").substring(0, 2).toUpperCase();

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications");
            setNotifications(res.data.notifications || []);
            setUnread(res.data.unreadCount || 0);
        } catch (_) {}
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleMarkAllRead = async () => {
        await api.patch("/notifications/mark-all-read");
        setNotifications(n => n.map(x => ({ ...x, isRead: true })));
        setUnread(0);
    };

    const handleClickNotif = async (notif) => {
        if (!notif.isRead) {
            await api.patch(`/notifications/${notif._id}/read`);
            setNotifications(n => n.map(x => x._id === notif._id ? { ...x, isRead: true } : x));
            setUnread(u => Math.max(0, u - 1));
        }
    };

    return (
        <header className="navbar">
            <div className="navbar-left">
                <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
                    <Menu size={22} />
                </button>
                <div>
                    <h2>EduManage</h2>
                    <p>Welcome back, {userName}!</p>
                </div>
            </div>

            <div className="navbar-right">
                <div className="search-box">
                    <Search size={16} />
                    <input placeholder="Search anything..." />
                    <span>⌘K</span>
                </div>

                {/* Notification Bell */}
                <div className="notif-wrap" ref={dropRef}>
                    <button
                        className="notification-button"
                        onClick={() => setOpen(o => !o)}
                        aria-label="Notifications"
                    >
                        <Bell size={19} />
                        {unread > 0 && (
                            <span className="notif-count">{unread > 9 ? "9+" : unread}</span>
                        )}
                    </button>

                    {open && (
                        <div className="notif-dropdown">
                            <div className="notif-header">
                                <div>
                                    <strong>Notifications</strong>
                                    {unread > 0 && <span className="notif-badge">{unread} new</span>}
                                </div>
                                {unread > 0 && (
                                    <button className="notif-mark-all" onClick={handleMarkAllRead}>
                                        <CheckCheck size={14} /> Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="notif-list">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty">
                                        <Bell size={28} />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map(n => {
                                        const Icon = ICONS[n.type] || Bell;
                                        return (
                                            <div
                                                key={n._id}
                                                className={`notif-item ${!n.isRead ? "unread" : ""}`}
                                                onClick={() => handleClickNotif(n)}
                                            >
                                                <div className={`notif-icon-wrap ${n.type === "SUPPORT_QUERY" ? "support" : "submit"}`}>
                                                    <Icon size={15} />
                                                </div>
                                                <div className="notif-body">
                                                    <strong>{n.title}</strong>
                                                    <p>{n.message}</p>
                                                    <span>{getTimeAgo(n.createdAt)}</span>
                                                </div>
                                                {!n.isRead && <div className="notif-dot" />}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile">
                    <div className="profile-avatar">{initials}</div>
                    <div className="profile-info">
                        <strong>{userName}</strong>
                        <span>{roleName}</span>
                    </div>
                    <ChevronDown size={15} />
                </div>
            </div>
        </header>
    );
}

export default Navbar;
