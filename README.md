# EduManage LMS – Learning Management System

A full-stack Learning Management System (LMS) built using the MERN Stack (MongoDB, Express.js, React.js, and Node.js). EduManage helps administrators manage courses, students, instructors, assignments, enrollments, and academic activities through a modern and responsive dashboard.

## 🌐 Live Demo

**Live Website:** https://edu-manage-lms.vercel.app/login

**Backend API:** https://edumanage-backend-zlph.onrender.com

## 📸 Project Overview

EduManage is designed to simplify educational management through a centralized platform with role-based authentication, course management, student tracking, and analytics.

## ✨ Features

- **Authentication:** User registration, login, JWT-based authentication, and protected routes.
- **Dashboard:** Overview of courses, students, instructors, enrollments, and activities.
- **Course Management:** Create, view, update, and delete courses.
- **Student Management:** Manage student information and enrollments.
- **Instructor Management:** Manage instructor records and related information.
- **Assignment Management:** Create assignments and manage student submissions.
- **Analytics:** View academic statistics and dashboard reports.
- **Notifications:** Display important system notifications.
- **Support:** Handle user support queries.
- **Settings:** Manage account settings and change passwords.
- **Responsive UI:** Designed for desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Vite | Frontend build tool |
| Node.js | Backend runtime |
| Express.js | REST API development |
| MongoDB Atlas | Cloud database |
| Mongoose | Database modeling |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Axios | API communication |
| CSS | Styling and responsive design |
| Git & GitHub | Version control |

## 🏗️ Project Structure

```text
EduManage-LMS/
│
├── Backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── vercel.json
│   └── package.json
│
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Kutubkhan0705/EduManage-LMS.git
cd EduManage-LMS
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file inside the Backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=http://localhost:5173
ADMIN_NAME=EduManage Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

Start the backend:

```bash
npm run dev
```

Backend runs at:

`http://localhost:5000`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the frontend folder:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at:

`http://localhost:5173`

## 🔐 Security

- Passwords are hashed using bcryptjs.
- JWT is used for authentication.
- Protected routes restrict unauthorized access.
- Environment variables store sensitive configuration.
- MongoDB credentials and API secrets should never be committed to GitHub.

## 🚀 Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Repository | GitHub |

## 🔮 Future Improvements

- Live video classes and lecture integration.
- Course progress tracking.
- Online quizzes and assessments.
- Certificates after course completion.
- Advanced reporting and analytics.
- Email notifications.

## 👨‍💻 Developer

**Kutubuddin Khan**

B.Tech – Information Technology

**GitHub:** https://github.com/Kutubkhan0705

## 📄 License

This project is developed for educational and learning purposes.
