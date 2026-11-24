import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import {
    Plus, Search, BookOpen, Edit, Trash2,
    X, Save, Eye, EyeOff, Users, CheckCircle
} from "lucide-react";

const DEFAULT_CATEGORIES = [
    "Web Development", "Programming", "Data Science",
    "Artificial Intelligence", "Database", "Design", "Business"
];

const loadCategories = () => {
    try {
        const stored = localStorage.getItem("course_categories");
        return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    } catch {
        return DEFAULT_CATEGORIES;
    }
};

const saveCategories = (cats) => {
    localStorage.setItem("course_categories", JSON.stringify(cats));
};

const initialForm = {
    title: "",
    description: "",
    category: "Web Development",
    level: "Beginner",
    thumbnail: "",
    isPublished: false,
    lessons: []
};

export default function Courses() {

    const { user } = useAuth();
    const navigate = useNavigate();
    const userRole = user?.role;
    const [courses, setCourses] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState(loadCategories);
    const [newCatInput, setNewCatInput] = useState("");
    const [showNewCat, setShowNewCat] = useState(false);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get("/courses");
            setCourses(response.data.courses || []);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load courses.");
        } finally {
            setLoading(false);
        }
    };
    // Check whether current student is already enrolled
    const isCourseEnrolled = (course) => {
        const currentUserId = user?._id || user?.id;

        if (!currentUserId) return false;

        return course.enrolledStudents?.some((student) => {
            const studentId =
                typeof student === "object" && student !== null
                    ? student._id
                    : student;

            return String(studentId) === String(currentUserId);
        }) || false;
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const openAddForm = () => {
        setForm(initialForm);
        setEditingId(null);
        setShowForm(true);
        setError("");
    };

    const openEditForm = (course) => {
        setForm({
            title: course.title || "",
            description: course.description || "",
            category: course.category || "Web Development",
            level: course.level || "Beginner",
            thumbnail: course.thumbnail || "",
            isPublished: course.isPublished || false,
            lessons: course.lessons || []
        });
        setEditingId(course._id);
        setShowForm(true);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            if (editingId) {
                await api.put(`/courses/${editingId}`, form);
            } else {
                await api.post("/courses", form);
            }

            setShowForm(false);
            setForm(initialForm);
            setEditingId(null);
            await fetchCourses();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save course.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this course?"
        );

        if (!confirmDelete) return;

        try {
            await api.delete(`/courses/${id}`);
            setCourses((prev) => prev.filter((course) => course._id !== id));
        } catch (err) {
            setError(err.response?.data?.message || "Unable to delete course.");
        }
    };

    const togglePublish = async (course) => {
        try {
            await api.put(`/courses/${course._id}`, {
                isPublished: !course.isPublished
            });
            await fetchCourses();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to update course.");
        }
    };


    const filteredCourses = courses.filter((course) => {
        const searchText = search.trim().toLowerCase();

        const title = String(course.title || "").toLowerCase();
        const description = String(course.description || "").toLowerCase();
        const courseCategory = String(course.category || "").toLowerCase();

        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText) ||
            courseCategory.includes(searchText);

        const matchesCategory =
            category === "All" || course.category === category;

        return matchesSearch && matchesCategory;
    });

    const filterCategories = ["All", ...new Set(courses.map((c) => c.category))];

    const handleCategoryChange = (e) => {
        const val = e.target.value;
        if (val === "__add_new__") {
            setShowNewCat(true);
            setNewCatInput("");
        } else {
            setForm((prev) => ({ ...prev, category: val }));
            setShowNewCat(false);
        }
    };

    const confirmNewCategory = () => {
        const trimmed = newCatInput.trim();
        if (!trimmed) return;
        if (!categories.includes(trimmed)) {
            const updated = [...categories, trimmed];
            setCategories(updated);
            saveCategories(updated);
        }
        setForm((prev) => ({ ...prev, category: trimmed }));
        setShowNewCat(false);
        setNewCatInput("");
    };

    return (
        <div className="courses-page">
            <div className="courses-heading">
                <div>
                    <h1>Course Management</h1>
                    <p>Create, manage and publish your learning courses.</p>
                </div>

                <button className="course-add-btn" onClick={openAddForm}>
                    <Plus size={18} /> Add New Course
                </button>
            </div>

            <div className="course-stats">
                <div className="course-stat">
                    <BookOpen />
                    <div>
                        <h2>{courses.length}</h2>
                        <p>Total Courses</p>
                    </div>
                </div>

                <div className="course-stat">
                    <Eye />
                    <div>
                        <h2>{courses.filter((c) => c.isPublished).length}</h2>
                        <p>Published</p>
                    </div>
                </div>

                <div className="course-stat">
                    <EyeOff />
                    <div>
                        <h2>{courses.filter((c) => !c.isPublished).length}</h2>
                        <p>Drafts</p>
                    </div>
                </div>

                <div className="course-stat">
                    <Users />
                    <div>
                        <h2>
                            {courses.reduce(
                                (total, course) =>
                                    total + (course.enrolledStudents?.length || 0),
                                0
                            )}
                        </h2>
                        <p>Total Enrollments</p>
                    </div>
                </div>
            </div>

            <div className="course-toolbar">
                <div className="course-search">
                    <Search size={18} />
                    <input
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    {filterCategories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>

            {error && <div className="course-error">{error}</div>}

            {loading ? (
                <p className="course-message">Loading courses...</p>
            ) : filteredCourses.length === 0 ? (
                <div className="course-empty">
                    <BookOpen size={42} />
                    <h3>No courses found</h3>
                    <p>Add your first course to get started.</p>
                    <button className="course-add-btn" onClick={openAddForm}>
                        <Plus size={17} /> Create Course
                    </button>
                </div>
            ) : (
                <div className="course-grid">
                    {filteredCourses.map((course) => (
                        <div className="managed-course-card" key={course._id}>
                            <img
                                src={course.thumbnail || "https://placehold.co/600x400?text=EduManage"}
                                alt={course.title}
                                onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/600x400?text=Course";
                                }}
                            />

                            <div className="managed-course-content">
                                <div className="managed-course-meta">
                                    <span>{course.category}</span>
                                    <span className={course.isPublished ? "published" : "draft"}>
                                        {course.isPublished ? "Published" : "Draft"}
                                    </span>
                                </div>

                                <h3>{course.title}</h3>
                                <p>{course.description}</p>

                                <div className="managed-course-info">
                                    <span>{course.level}</span>
                                    <span>{course.lessons?.length || 0} Lessons</span>
                                    <span>{course.enrolledStudents?.length || 0} Students</span>
                                </div>

                                <div className="managed-course-actions">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/courses/${course._id}`)}
                                    >
                                        <BookOpen size={16} /> View Course
                                    </button>

                                    {userRole === "student" ? (
                                        isCourseEnrolled(course) ? (
                                            <button
                                                type="button"
                                                className="enrolled-course-btn"
                                                disabled
                                            >
                                                <CheckCircle size={16} />
                                                Already Enrolled
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.post(`/courses/${course._id}/enroll`);

                                                        alert("Successfully enrolled in course!");

                                                        await fetchCourses();

                                                    } catch (err) {
                                                        alert(
                                                            err.response?.data?.message ||
                                                            "Unable to enroll in course."
                                                        );
                                                    }
                                                }}
                                            >
                                                Enroll Now
                                            </button>
                                        )
                                    ) : (
                                        <>
                                            <button onClick={() => openEditForm(course)}>
                                                <Edit size={16} /> Edit
                                            </button>

                                            <button onClick={() => togglePublish(course)}>
                                                {course.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                                                {course.isPublished ? "Unpublish" : "Publish"}
                                            </button>

                                            <button
                                                className="delete-course-btn"
                                                onClick={() => handleDelete(course._id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}

                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="course-modal-overlay">
                    <div className="course-modal">
                        <div className="course-modal-heading">
                            <div>
                                <h2>{editingId ? "Edit Course" : "Create New Course"}</h2>
                                <p>Enter the course information below.</p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() => setShowForm(false)}
                            >
                                <X />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label>Course Title *</label>
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. Complete MERN Stack Development"
                                required
                            />

                            <label>Description *</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Write course description..."
                                rows="4"
                                required
                            />

                            <div className="course-form-row">
                                <div>
                                    <label>Category *</label>
                                    <select
                                        name="category"
                                        value={showNewCat ? "__add_new__" : form.category}
                                        onChange={handleCategoryChange}
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="__add_new__">+ Add New Category</option>
                                    </select>
                                    {showNewCat && (
                                        <div className="new-cat-row">
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="e.g. Mathematics"
                                                value={newCatInput}
                                                onChange={(e) => setNewCatInput(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), confirmNewCategory())}
                                            />
                                            <button type="button" className="new-cat-add-btn" onClick={confirmNewCategory}>
                                                Add
                                            </button>
                                            <button type="button" className="new-cat-cancel-btn" onClick={() => { setShowNewCat(false); setNewCatInput(""); }}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label>Difficulty Level</label>
                                    <select
                                        name="level"
                                        value={form.level}
                                        onChange={handleChange}
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <label>Thumbnail Image URL</label>
                            <input
                                name="thumbnail"
                                value={form.thumbnail}
                                onChange={handleChange}
                                placeholder="https://example.com/course-image.jpg"
                            />

                            <label className="publish-checkbox">
                                <input
                                    type="checkbox"
                                    name="isPublished"
                                    checked={form.isPublished}
                                    onChange={handleChange}
                                />
                                Publish this course immediately
                            </label>

                            <div className="course-modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="course-add-btn"
                                    disabled={saving}
                                >
                                    <Save size={17} />
                                    {saving ? "Saving..." : editingId ? "Update Course" : "Save Course"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
