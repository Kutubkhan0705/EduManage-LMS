
import { GraduationCap, BookOpen, Users } from "lucide-react";

function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="auth-layout">
            <section className="auth-left">
                <div className="auth-brand">
                    <GraduationCap size={30} />
                    <h2>EduManage</h2>
                </div>

                <div className="auth-hero">
                    <span className="auth-tag">LEARN • GROW • SUCCEED</span>
                    <h1>Build your future with smarter learning.</h1>
                    <p>
                        One platform to manage courses, students, assessments
                        and academic progress.
                    </p>

                    <div className="auth-features">
                        <div><BookOpen size={20} /> Interactive Courses</div>
                        <div><Users size={20} /> Expert Instructors</div>
                        <div><GraduationCap size={20} /> Track Your Progress</div>
                    </div>
                </div>

                <span className="auth-copyright">
                    © 2026 EduManage LMS
                </span>
            </section>

            <section className="auth-right">
                <div className="auth-form-container">
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                    {children}
                </div>
            </section>
        </div>
    );
}

export default AuthLayout;
