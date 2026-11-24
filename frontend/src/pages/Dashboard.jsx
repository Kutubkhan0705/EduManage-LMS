
import { useEffect, useState } from "react";

import {
    Users,
    BookOpen,
    GraduationCap,
    ClipboardList,
    Clock,
    CheckCircle
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import StatCard from "../components/StatCard";
import EnrollmentChart from "../components/EnrollmentChart";
import CourseCard from "../components/CourseCard";

// Convert date into relative time
const getTimeAgo = (date) => {
    const seconds = Math.floor(
        (new Date() - new Date(date)) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
        return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    return new Date(date).toLocaleDateString();
};

// Activity action labels
const getActivityAction = (action) => {
    const actions = {
        REGISTERED: "registered on EduManage",
        COURSE_CREATED: "created a new course",
        COURSE_ENROLLED: "enrolled in a course",
        ASSIGNMENT_CREATED: "created an assignment",
        ASSIGNMENT_SUBMITTED: "submitted an assignment",
        ASSIGNMENT_GRADED: "graded an assignment"
    };

    return actions[action] || "performed an activity";
};

function Dashboard() {
    const { user } = useAuth();

    const role = user?.role;

    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [popularCourses, setPopularCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);

    // Recent Activities State
    const [activities, setActivities] = useState([]);
    const [activityLoading, setActivityLoading] = useState(true);

    // Fetch Dashboard Statistics
    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/dashboard");

                setStats(response.data.stats || {});
            } catch (err) {
                console.error("Dashboard API Error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load dashboard statistics."
                );
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardStats();
        }
    }, [user]);

    // Fetch Popular Courses
    useEffect(() => {
        const fetchPopularCourses = async () => {
            try {
                setCoursesLoading(true);

                const response = await api.get(
                    "/dashboard/popular-courses"
                );

                setPopularCourses(response.data.courses || []);
            } catch (err) {
                console.error("Popular Courses Error:", err);
            } finally {
                setCoursesLoading(false);
            }
        };

        if (user?.role === "admin") {
            fetchPopularCourses();
        } else {
            setCoursesLoading(false);
        }
    }, [user]);

    // Fetch Recent Activities
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setActivityLoading(true);

                const response = await api.get("/activities");

                setActivities(response.data.activities || []);
            } catch (err) {
                console.error("Recent Activities Error:", err);
            } finally {
                setActivityLoading(false);
            }
        };

        if (user?.role === "admin") {
            fetchActivities();
        } else {
            setActivityLoading(false);
        }
    }, [user]);

    const getValue = (value) => {
        if (loading) return "...";
        return value ?? 0;
    };

    return (
        <div className="dashboard-content">

            {/* Dashboard Welcome */}
            <div className="dashboard-heading">
                <div>
                    <h1>
                        Welcome, {user?.name || "User"}!
                    </h1>

                    <p>
                        {role === "admin" &&
                            "Here's what's happening with your learning platform."}

                        {role === "instructor" &&
                            "Manage your courses, assignments and students."}

                        {role === "student" &&
                            "Track your learning progress and assignments."}
                    </p>
                </div>
            </div>

            {/* API Error */}
            {error && (
                <div className="performance-card">
                    <p>{error}</p>

                    <button
                        className="primary-button"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* ADMIN DASHBOARD */}
            {role === "admin" && (
                <>
                    <div className="dashboard-heading">
                        <h2>Admin Overview</h2>

                        <button className="primary-button">
                            + Add New Course
                        </button>
                    </div>

                    {/* Admin Statistics */}
                    <div className="stats-grid">

                        <StatCard title="Total Students" value={getValue(stats.totalStudents)} icon={Users} color="purple" />
                        <StatCard title="Total Courses" value={getValue(stats.totalCourses)} icon={BookOpen} color="blue" />
                        <StatCard title="Instructors" value={getValue(stats.totalInstructors)} icon={GraduationCap} color="orange" />
                        <StatCard title="Total Enrollments" value={getValue(stats.totalEnrollments)} icon={ClipboardList} color="green" />

                    </div>

                    {/* Analytics */}
                    <div className="analytics-grid">

                        <EnrollmentChart />

                        <div className="performance-card">
                            <div className="section-heading">
                                <div>
                                    <h3>Platform Overview</h3>
                                    <p>Current platform statistics</p>
                                </div>
                            </div>

                            {[
                                ["Total Students", stats.totalStudents],
                                ["Total Courses", stats.totalCourses],
                                ["Total Instructors", stats.totalInstructors],
                                ["Total Enrollments", stats.totalEnrollments]
                            ].map(([title, value]) => (
                                <div className="overview-item" key={title}>
                                    <div className="overview-info">
                                        <span>{title}</span>
                                        <strong>{getValue(value)}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Popular Courses */}
                    <div className="lower-grid">

                        <div className="courses-section">
                            <div className="section-heading">
                                <div>
                                    <h3>Popular Courses</h3>
                                    <p>Top courses based on student enrollment</p>
                                </div>
                            </div>

                            <div className="courses-grid">

                                {coursesLoading ? (
                                    <p>Loading popular courses...</p>
                                ) : popularCourses.length > 0 ? (

                                    popularCourses.map((course, index) => (
                                        <CourseCard
                                            key={course._id}
                                            title={course.title}
                                            category={course.category}
                                            instructor={course.instructor || "Not assigned"}
                                            students={course.students}
                                            color={index === 0 ? "course-purple" : index === 1 ? "course-blue" : "course-orange"}
                                        />
                                    ))

                                ) : (
                                    <p>No published courses available yet.</p>
                                )}

                            </div>
                        </div>

                        {/* Dynamic Recent Activity */}
                        <div className="activity-card">
                            <div className="section-heading">
                                <div>
                                    <h3>Recent Activity</h3>
                                    <p>Latest platform updates</p>
                                </div>
                            </div>

                            <div className="activity-scroll">
                                {activityLoading ? (
                                    <p className="activity-loading">Loading activities...</p>
                                ) : activities.length > 0 ? (
                                    activities.slice(0, 8).map((activity) => {
                                        const userName = activity.user?.name || "Unknown User";
                                        return (
                                            <div className="activity-item" key={activity._id}>
                                                <div className="activity-avatar">
                                                    {userName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="activity-info">
                                                    <strong>{userName}</strong>
                                                    <p>{getActivityAction(activity.action)}</p>
                                                    <span>{getTimeAgo(activity.createdAt)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="activity-loading">No recent activities found.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </>
            )}

            {/* INSTRUCTOR DASHBOARD */}
            {role === "instructor" && (
                <>
                    <div className="dashboard-heading">
                        <div>
                            <h2>Instructor Overview</h2>
                            <p>Manage your courses, assignments and students.</p>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <StatCard title="My Courses" value={getValue(stats.myCourses)} icon={BookOpen} color="blue" />
                        <StatCard title="My Students" value={getValue(stats.myStudents)} icon={Users} color="purple" />
                        <StatCard title="Assignments" value={getValue(stats.totalAssignments)} icon={ClipboardList} color="orange" />
                        <StatCard title="Pending Reviews" value={getValue(stats.pendingReviews)} icon={Clock} color="green" />
                    </div>

                    <div className="instructor-info-grid">
                        <div className="performance-card">
                            <div className="section-heading">
                                <div><h3>Quick Actions</h3><p>Manage your platform</p></div>
                            </div>
                            <div className="instructor-actions-list">
                                <div className="instructor-action-item">
                                    <div className="ia-icon blue"><BookOpen size={18} /></div>
                                    <div>
                                        <strong>Courses</strong>
                                        <p>Create and manage your courses, add lessons and publish them for students.</p>
                                    </div>
                                </div>
                                <div className="instructor-action-item">
                                    <div className="ia-icon orange"><ClipboardList size={18} /></div>
                                    <div>
                                        <strong>Assignments</strong>
                                        <p>Create assignments for your courses and review student submissions.</p>
                                    </div>
                                </div>
                                <div className="instructor-action-item">
                                    <div className="ia-icon green"><CheckCircle size={18} /></div>
                                    <div>
                                        <strong>Pending Reviews</strong>
                                        <p>You have <strong>{getValue(stats.pendingReviews)}</strong> submission{stats.pendingReviews !== 1 ? "s" : ""} waiting for grading.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="performance-card">
                            <div className="section-heading">
                                <div><h3>Platform Stats</h3><p>Your teaching overview</p></div>
                            </div>
                            {[
                                ["My Courses", stats.myCourses],
                                ["My Students", stats.myStudents],
                                ["Total Assignments", stats.totalAssignments],
                                ["Pending Reviews", stats.pendingReviews]
                            ].map(([title, value]) => (
                                <div className="overview-item" key={title}>
                                    <div className="overview-info">
                                        <span>{title}</span>
                                        <strong>{getValue(value)}</strong>
                                    </div>
                                    <div className="overview-bar">
                                        <div style={{ width: value ? "60%" : "0%" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* STUDENT DASHBOARD */}
            {role === "student" && (
                <>
                    <h2>My Learning Overview</h2>

                    <div className="stats-grid">

                        <StatCard title="Enrolled Courses" value={getValue(stats.enrolledCourses)} icon={BookOpen} color="blue" />
                        <StatCard title="Pending Assignments" value={getValue(stats.pendingAssignments)} icon={Clock} color="orange" />
                        <StatCard title="Completed Assignments" value={getValue(stats.completedAssignments)} icon={CheckCircle} color="green" />
                        <StatCard title="Average Marks" value={getValue(stats.averageMarks)} icon={GraduationCap} color="purple" />

                    </div>

                    <div className="performance-card">
                        <h3>Welcome to EduManage!</h3>
                        <p>
                            Explore available courses and enroll to start learning.
                        </p>
                        <p>
                            Visit My Assignments to view your assignments
                            and check your results.
                        </p>
                    </div>
                </>
            )}

            <footer className="dashboard-footer">
                © 2026 EduManage LMS. All rights reserved.
            </footer>

        </div>
    );
}

export default Dashboard;
