import { useState } from "react";
import { User, Lock, Bell, Save, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell }
];

function Settings() {
    const { user } = useAuth();
    const [tab, setTab] = useState("profile");

    // Profile
    const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" });
    const [profileMsg, setProfileMsg] = useState({ text: "", ok: true });
    const [profileLoading, setProfileLoading] = useState(false);

    // Password
    const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
    const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false });
    const [pwMsg, setPwMsg] = useState({ text: "", ok: true });
    const [pwLoading, setPwLoading] = useState(false);

    // Notifications (local only — extend with backend if needed)
    const [notifs, setNotifs] = useState({
        emailEnrollment: true,
        emailAssignment: true,
        emailGrade: true,
        pushAll: false
    });
    const [notifSaved, setNotifSaved] = useState(false);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (!profile.name.trim() || !profile.email.trim()) {
            setProfileMsg({ text: "Name and email are required.", ok: false });
            return;
        }
        try {
            setProfileLoading(true);
            await api.put("/auth/profile", { name: profile.name, email: profile.email });
            setProfileMsg({ text: "Profile updated successfully.", ok: true });
        } catch (err) {
            setProfileMsg({ text: err.response?.data?.message || "Failed to update profile.", ok: false });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        if (!passwords.current || !passwords.newPass || !passwords.confirm) {
            setPwMsg({ text: "All fields are required.", ok: false });
            return;
        }
        if (passwords.newPass !== passwords.confirm) {
            setPwMsg({ text: "New passwords do not match.", ok: false });
            return;
        }
        if (passwords.newPass.length < 6) {
            setPwMsg({ text: "Password must be at least 6 characters.", ok: false });
            return;
        }
        try {
            setPwLoading(true);
            await api.put("/auth/change-password", {
                currentPassword: passwords.current,
                newPassword: passwords.newPass
            });
            setPwMsg({ text: "Password changed successfully.", ok: true });
            setPasswords({ current: "", newPass: "", confirm: "" });
        } catch (err) {
            setPwMsg({ text: err.response?.data?.message || "Failed to change password.", ok: false });
        } finally {
            setPwLoading(false);
        }
    };

    const handleNotifSave = (e) => {
        e.preventDefault();
        setNotifSaved(true);
        setTimeout(() => setNotifSaved(false), 2500);
    };

    const togglePw = (field) => setShowPw(p => ({ ...p, [field]: !p[field] }));

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account preferences.</p>
            </div>

            <div className="settings-layout">
                {/* Sidebar Tabs */}
                <nav className="settings-tabs">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.id}
                                className={`settings-tab ${tab === t.id ? "active" : ""}`}
                                onClick={() => setTab(t.id)}
                            >
                                <Icon size={16} />
                                {t.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Content */}
                <div className="settings-content">

                    {/* Profile Tab */}
                    {tab === "profile" && (
                        <div className="settings-card">
                            <h2>Profile Information</h2>
                            <p>Update your name and email address.</p>

                            <div className="settings-avatar-row">
                                <div className="settings-avatar">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <strong>{user?.name}</strong>
                                    <span>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</span>
                                </div>
                            </div>

                            {profileMsg.text && (
                                <div className={`settings-msg ${profileMsg.ok ? "ok" : "err"}`}>
                                    {profileMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleProfileSave} className="settings-form">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Your full name"
                                />
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                                    placeholder="your@email.com"
                                />
                                <label>Role</label>
                                <input type="text" value={user?.role} disabled className="settings-disabled" />

                                <button type="submit" className="settings-save-btn" disabled={profileLoading}>
                                    <Save size={15} />
                                    {profileLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Password Tab */}
                    {tab === "password" && (
                        <div className="settings-card">
                            <h2>Change Password</h2>
                            <p>Keep your account secure with a strong password.</p>

                            {pwMsg.text && (
                                <div className={`settings-msg ${pwMsg.ok ? "ok" : "err"}`}>
                                    {pwMsg.text}
                                </div>
                            )}

                            <form onSubmit={handlePasswordSave} className="settings-form">
                                {[
                                    { key: "current", label: "Current Password" },
                                    { key: "newPass", label: "New Password" },
                                    { key: "confirm", label: "Confirm New Password" }
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label>{label}</label>
                                        <div className="settings-pw-input">
                                            <input
                                                type={showPw[key] ? "text" : "password"}
                                                value={passwords[key]}
                                                onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                                                placeholder={label}
                                            />
                                            <button type="button" onClick={() => togglePw(key)}>
                                                {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button type="submit" className="settings-save-btn" disabled={pwLoading}>
                                    <Lock size={15} />
                                    {pwLoading ? "Updating..." : "Update Password"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {tab === "notifications" && (
                        <div className="settings-card">
                            <h2>Notification Preferences</h2>
                            <p>Choose what notifications you want to receive.</p>

                            {notifSaved && (
                                <div className="settings-msg ok">Preferences saved successfully.</div>
                            )}

                            <form onSubmit={handleNotifSave} className="settings-form">
                                <p className="settings-section-label">Email Notifications</p>

                                {[
                                    { key: "emailEnrollment", label: "New course enrollment" },
                                    { key: "emailAssignment", label: "Assignment created or updated" },
                                    { key: "emailGrade", label: "Assignment graded" }
                                ].map(({ key, label }) => (
                                    <label key={key} className="settings-toggle-row">
                                        <span>{label}</span>
                                        <div
                                            className={`settings-toggle ${notifs[key] ? "on" : ""}`}
                                            onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                                        >
                                            <div className="settings-toggle-knob" />
                                        </div>
                                    </label>
                                ))}

                                <p className="settings-section-label" style={{ marginTop: 20 }}>Push Notifications</p>

                                <label className="settings-toggle-row">
                                    <span>Enable all push notifications</span>
                                    <div
                                        className={`settings-toggle ${notifs.pushAll ? "on" : ""}`}
                                        onClick={() => setNotifs(n => ({ ...n, pushAll: !n.pushAll }))}
                                    >
                                        <div className="settings-toggle-knob" />
                                    </div>
                                </label>

                                <button type="submit" className="settings-save-btn">
                                    <Save size={15} />
                                    Save Preferences
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Settings;
