
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    BookOpen,
    PlayCircle,
    ArrowLeft,
    Clock,
    User,
    Plus,
    Edit,
    Trash2,
    X,
    Save
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialLessonForm = {
    title: "",
    description: "",
    videoUrl: "",
    duration: 0
};

export default function CourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showLessonForm, setShowLessonForm] = useState(false);
    const [lessonForm, setLessonForm] = useState(initialLessonForm);
    const [editingLessonId, setEditingLessonId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(`/courses/${id}`);
            setCourse(response.data.course);
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to load course."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const currentUserId = user?._id || user?.id;

    const isEnrolled = course?.enrolledStudents?.some((student) => {
        const sid = typeof student === "object" && student !== null ? student._id : student;
        return String(sid) === String(currentUserId);
    });

    // Admin always instructor, instructor matches by id OR if they created the course
    const isInstructor =
        user?.role === "admin" ||
        (
            user?.role === "instructor" &&
            course?.instructor &&
            String(course.instructor?._id || course.instructor) === String(currentUserId)
        );

    const canViewLessons = isEnrolled || isInstructor;

    const handleLessonChange = (e) => {
        const { name, value } = e.target;

        setLessonForm((prev) => ({
            ...prev,
            [name]: name === "duration" ? value : value
        }));
    };
    const getEmbedUrl = (url) => {
        try {
            const parsedUrl = new URL(url);

            if (parsedUrl.hostname.includes("youtu.be")) {
                return `https://www.youtube.com/embed/${parsedUrl.pathname.slice(1)}`;
            }

            if (parsedUrl.hostname.includes("youtube.com")) {
                const videoId = parsedUrl.searchParams.get("v");

                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }

                if (parsedUrl.pathname.startsWith("/embed/")) {
                    return url;
                }
            }

            return null;
        } catch {
            return null;
        }
    };

    const openAddLesson = () => {
        setLessonForm(initialLessonForm);
        setEditingLessonId(null);
        setShowLessonForm(true);
        setError("");
    };

    const openEditLesson = (lesson) => {
        setLessonForm({
            title: lesson.title || "",
            description: lesson.description || "",
            videoUrl: lesson.videoUrl || "",
            duration: lesson.duration || 0
        });

        setEditingLessonId(lesson._id);
        setShowLessonForm(true);
        setError("");
    };

    const handleLessonSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");

            const updatedLessons = [...(course.lessons || [])];

            if (editingLessonId) {
                const lessonIndex = updatedLessons.findIndex(
                    (lesson) => lesson._id === editingLessonId
                );

                if (lessonIndex === -1) {
                    throw new Error("Lesson not found.");
                }

                updatedLessons[lessonIndex] = {
                    ...updatedLessons[lessonIndex],
                    ...lessonForm,
                    duration: Number(lessonForm.duration)
                };
            } else {
                updatedLessons.push({
                    ...lessonForm,
                    duration: Number(lessonForm.duration)
                });
            }

            const response = await api.put(`/courses/${id}`, {
                lessons: updatedLessons
            });

            setCourse(response.data.course);
            setShowLessonForm(false);
            setLessonForm(initialLessonForm);
            setEditingLessonId(null);

        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to save lesson."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this lesson?"
        );

        if (!confirmDelete) return;

        try {
            setError("");

            const updatedLessons = course.lessons.filter(
                (lesson) => lesson._id !== lessonId
            );

            const response = await api.put(`/courses/${id}`, {
                lessons: updatedLessons
            });

            setCourse(response.data.course);

        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to delete lesson."
            );
        }
    };

    if (loading) {
        return <p className="course-message">Loading course...</p>;
    }

    if (error && !course) {
        return (
            <div className="course-empty">
                <p>{error}</p>
                <button onClick={() => navigate("/dashboard")}>
                    Go Back
                </button>
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="courses-page">

            <button
                className="course-add-btn"
                onClick={() => navigate("/dashboard")}
            >
                <ArrowLeft size={17} /> Back
            </button>

            <div className="course-details-header">
                <img
                    src={
                        course.thumbnail ||
                        "https://placehold.co/800x400?text=EduManage"
                    }
                    alt={course.title}
                />

                <div>
                    <span>{course.category}</span>
                    <h1>{course.title}</h1>
                    <p>{course.description}</p>

                    <p>
                        <User size={16} /> Instructor:{" "}
                        {course.instructor?.name || "Instructor"}
                    </p>

                    <p>
                        <BookOpen size={16} />{" "}
                        {course.lessons?.length || 0} Lessons
                    </p>
                </div>
            </div>

            <div className="course-lessons-section">

                <div className="section-heading">
                    <div>
                        <h2>Course Lessons</h2>
                        <p>
                            {course.lessons?.length || 0} lessons available
                        </p>
                    </div>

                    {isInstructor && (
                        <button
                            className="course-add-btn"
                            onClick={openAddLesson}
                        >
                            <Plus size={17} /> Add Lesson
                        </button>
                    )}
                </div>

                {error && (
                    <div className="course-error">{error}</div>
                )}

                {!canViewLessons ? (
                    <p>Please enroll in this course to access its lessons.</p>
                ) : course.lessons?.length ? (
                    course.lessons.map((lesson, index) => (
                        <div
                            className="course-lesson-card"
                            key={lesson._id || index}
                        >
                            <div>
                                <h3>
                                    {index + 1}. {lesson.title}
                                </h3>

                                <p>{lesson.description}</p>

                                <span>
                                    <Clock size={14} />{" "}
                                    {lesson.duration} minutes
                                </span>
                            </div>

                            <div className="course-lesson-actions">
                                {lesson.videoUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLesson(lesson)}
                                    >
                                        <PlayCircle size={18} />
                                        Watch Lesson
                                    </button>
                                )}

                                {isInstructor && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => openEditLesson(lesson)}
                                        >
                                            <Edit size={16} /> Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="delete-course-btn"
                                            onClick={() =>
                                                handleDeleteLesson(lesson._id)
                                            }
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No lessons have been added to this course yet.</p>
                )}
                {selectedLesson && (
                    <div className="course-video-player">
                        <div className="section-heading">
                            <h2>{selectedLesson.title}</h2>

                            <button
                                onClick={() => setSelectedLesson(null)}
                            >
                                <X size={20} /> Close Video
                            </button>
                        </div>

                        {getEmbedUrl(selectedLesson.videoUrl) ? (
                            <iframe
                                src={getEmbedUrl(selectedLesson.videoUrl)}
                                title={selectedLesson.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <p>
                                This video URL cannot be embedded. Please use a YouTube video link.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {showLessonForm && (
                <div className="course-modal-overlay">
                    <div className="course-modal">

                        <div className="course-modal-heading">
                            <div>
                                <h2>
                                    {editingLessonId
                                        ? "Edit Lesson"
                                        : "Add New Lesson"}
                                </h2>
                                <p>Enter the lesson information below.</p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() => setShowLessonForm(false)}
                            >
                                <X />
                            </button>
                        </div>

                        <form onSubmit={handleLessonSubmit}>
                            <label>Lesson Title *</label>
                            <input
                                name="title"
                                value={lessonForm.title}
                                onChange={handleLessonChange}
                                placeholder="e.g. Introduction to MERN Stack"
                                required
                            />

                            <label>Lesson Description</label>
                            <textarea
                                name="description"
                                value={lessonForm.description}
                                onChange={handleLessonChange}
                                placeholder="Enter lesson description..."
                                rows="4"
                            />

                            <label>Video URL</label>
                            <input
                                type="url"
                                name="videoUrl"
                                value={lessonForm.videoUrl}
                                onChange={handleLessonChange}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />

                            <label>Duration (minutes)</label>
                            <input
                                type="number"
                                name="duration"
                                min="0"
                                value={lessonForm.duration}
                                onChange={handleLessonChange}
                            />

                            <div className="course-modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowLessonForm(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="course-add-btn"
                                    disabled={saving}
                                >
                                    <Save size={17} />
                                    {saving
                                        ? "Saving..."
                                        : editingLessonId
                                            ? "Update Lesson"
                                            : "Save Lesson"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
