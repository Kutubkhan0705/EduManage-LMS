function CourseCard({ title, category, instructor, students, color }) {
    return (
        <div className="course-card">
            <div className={`course-banner ${color}`}>
                <span>{category}</span>
                <h3>{title}</h3>
            </div>
            <div className="course-details">
                <div className="course-instructor">
                    <div className="instructor-avatar">
                        {instructor.charAt(0)}
                    </div>
                    <span>{instructor}</span>
                </div>
                <div className="course-meta">
                    <span>👥 {students} Students</span>
                </div>
            </div>
        </div>
    );
}

export default CourseCard;
