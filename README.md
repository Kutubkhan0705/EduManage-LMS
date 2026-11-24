# EduManage – Learning Management System

A full-stack Learning Management System (LMS) built using the MERN stack. EduManage helps manage courses, students, instructors, enrollments, and assignments through a centralized dashboard.

## Features

- User Authentication (Register & Login)
- Role-based access: Admin, Instructor, and Student
- Course Management (Create, Read, Update, Delete)
- Student Management
- Instructor Management
- Course Enrollment
- Assignment Management
- Student Assignment Submissions
- Dashboard and Analytics
- Profile and Password Settings
- Responsive User Interface

## Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS
- Axios
- Recharts
- Lucide React

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs

## Project Structure

```text
Learning-Management-System/
│
├── Backend/
│   ├── routes/
│   ├── scripts/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
└── README.md
```

## Installation and Setup

### 1. Clone Repository

```bash
git clone https://github.com/Kutubkhan0705/EduManage-LMS.git
cd Learning-Management-System
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
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local frontend URL shown in the terminal.

## Environment Variables

Configure your MongoDB connection string and JWT secret in the backend `.env` file. Never upload actual secrets to GitHub.

## Future Improvements

- Online course video integration
- Advanced reporting
- Email notifications
- More learning management features

## Author

Developed as a MERN Stack Full Stack Development Project.
