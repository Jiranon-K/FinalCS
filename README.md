# Attendance Management Web Application with Face Recognition

> A Case Study of the Artificial Intelligence Course — Rajamangala University of Technology Phra Nakhon

## 📖 Description

A real-time attendance management system for educational institutions that leverages **Face Recognition** technology to automatically record student attendance. The system reduces administrative workload for instructors and improves the accuracy of attendance data.

**Target Users:** Administrators, Teachers, and Students at Rajamangala University of Technology Phra Nakhon.

---

## 🖼️ Screenshots / Demo

![alt text](image.png)

---

## ✨ Key Features

### 👥 Role-Based Access Control (3 Roles)

- **Admin** — Manage all users, approve/reject face update requests, view system-wide dashboard
- **Teacher** — Create and manage courses, open/close attendance sessions, manually adjust attendance status, download reports
- **Student** — Check in via face recognition, view personal attendance history, manage profile and face data

### 🤖 Face Recognition

- Real-time check-in via webcam — no additional software required
- Supports multiple face descriptors per student for improved accuracy (multi-angle capture)
- Displays a **Confidence Score** for each face recognition result
- Falls back to **Manual check-in** when needed

### 📚 Course & Schedule Management

- Create, edit, and delete courses with weekly schedules (Day of Week, Start/End Time, Room)
- Configure a **Grace Period** (late-arrival buffer) per course
- Enroll students into courses

### 📋 Attendance Session Management

- Open an attendance session per class period and close it when finished
- Records status: **Present / Absent** with the exact check-in timestamp
- View real-time session statistics: present count, absent count, and attendance rate

### 📊 Dashboard & Reports

- Role-specific dashboards with data visualizations powered by **Recharts**
- Download attendance reports as **Excel (.xlsx)** files
- View historical attendance records per course

### 🌐 Internationalization (i18n)

- Supports 2 languages: **Thai 🇹🇭** and **English 🇺🇸**

### 🔐 Security

- Authentication via **JWT (JSON Web Token)**
- Passwords hashed with **bcrypt**
- Profile and face images stored securely on **AWS S3**
- Face Update Request workflow requiring admin approval before any face data changes

---

## 🛠️ Tech Stack

| Category             | Technology                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Framework**        | [Next.js 15](https://nextjs.org/) (App Router)                                           |
| **Language**         | TypeScript                                                                               |
| **UI**               | React 19, Tailwind CSS v4, DaisyUI                                                       |
| **Face Recognition** | [@vladmandic/face-api](https://github.com/vladmandic/face-api), TensorFlow.js, MediaPipe |
| **Database**         | MongoDB + Mongoose                                                                       |
| **Storage**          | AWS S3                                                                                   |
| **Auth**             | JWT + bcrypt                                                                             |
| **Charts**           | Recharts                                                                                 |
| **Export**           | XLSX (Excel)                                                                             |
| **Package Manager**  | Bun / npm                                                                                |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ or [Bun](https://bun.sh/) v1+
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- AWS S3 Bucket (for image storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd FinalCS
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Setup Environment Variables**

   Create a `.env.local` file based on `.env` and fill in the following values:

   ```env
   MONGODB_URI=mongodb://localhost:27017/attendance
   JWT_SECRET=your-secret-key
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=your-region
   AWS_S3_BUCKET_NAME=your-bucket-name
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
FinalCS/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # REST API Routes
│   │   │   ├── attendance/   # Attendance session & record APIs
│   │   │   ├── auth/         # Login / Register / Logout
│   │   │   ├── courses/      # Course management APIs
│   │   │   ├── faces/        # Face descriptor APIs
│   │   │   ├── students/     # Student management APIs
│   │   │   └── users/        # User management APIs
│   │   ├── camera/           # Face scan / check-in page
│   │   ├── attendance/       # Attendance history page
│   │   ├── schedule/         # Schedule management page
│   │   ├── admin/            # Admin panel
│   │   ├── profile/          # User profile page
│   │   └── settings/         # Settings page
│   ├── components/           # Reusable UI components
│   ├── contexts/             # React Context (Auth, etc.)
│   ├── hooks/                # Custom React Hooks
│   ├── i18n/                 # Internationalization (TH / EN)
│   ├── lib/                  # DB connection, S3 client, etc.
│   ├── models/               # Mongoose data models
│   │   ├── User.ts
│   │   ├── Student.ts
│   │   ├── Teacher.ts
│   │   ├── Course.ts
│   │   ├── AttendanceSession.ts
│   │   ├── AttendanceRecord.ts
│   │   └── FaceUpdateRequest.ts
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── public/                   # Static assets & face-api models
└── face-api.min.js           # Face recognition library
```

---

## 📜 License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute this project as long as you include the original copyright notice.

```
MIT License

Copyright (c) 2025 Rajamangala University of Technology Phra Nakhon — AI Course Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">
  Made with ❤️ as a Final Project — Artificial Intelligence Course<br/>
  Rajamangala University of Technology Phra Nakhon
</div>
