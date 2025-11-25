# GEMINI.md

This file provides context and guidance for Gemini when working with this repository.

## Project Overview

**Project Name:** `face-recognition`
**Description:** A Person Tracking & Facial Recognition System designed for classroom environments. It uses facial recognition to track students and teachers, manages attendance, and handles user profiles with a robust role-based authentication system.

**Core Technology Stack:**
- **Framework:** Next.js 16.0.3 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19.2.0
- **Styling:** TailwindCSS v4, DaisyUI
- **Database:** MongoDB (via Mongoose ODM)
- **Storage:** Cloudflare R2 (S3-compatible) for face images
- **AI/ML:** `face-api.js` for client-side face detection and recognition

## Development Guide

### Building and Running
- **Development Server:** `bun dev` (Runs on `http://localhost:3000`)
- **Production Build:** `bun build`
- **Start Production:** `bun start`
- **Linting:** `bun lint`

### Key Directories
- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components, organized by feature (e.g., `camera`, `register`, `users`).
- `src/lib`: Backend utilities (database connection `mongoose.ts`, storage `r2.ts`).
- `src/models`: Mongoose data models (`Student`, `Teacher`, `User`).
- `src/contexts`: React Context providers (`AuthContext`, `ThemeContext`, `LocaleContext`).
- `public/model`: Pre-trained models for `face-api.js`.

## Architecture & Patterns

### 1. Authentication & Users
- **Roles:** `admin`, `teacher`, `student`.
- **Auth Mechanism:** JWT-based authentication (via cookies).
- **User Management:** Separate API endpoints for `Users` (auth accounts), `Students` (profiles), and `Teachers` (profiles).
- **Face Registration:** Users (students/teachers) register their face by uploading an image. `face-api.js` generates a 128-float descriptor which is stored in MongoDB.

### 2. Face Recognition Flow
1.  **Client-Side:** `face-api.js` runs in the browser to detect faces in the camera feed or uploaded images.
2.  **Descriptor Generation:** A 128-dimensional vector (descriptor) is generated for each face.
3.  **Matching:**
    - **Registration:** The descriptor is sent to the backend (`/api/students` or `/api/teachers`) and stored.
    - **Recognition:** The client fetches all known descriptors (`/api/faces`) and performs Euclidean distance matching locally.

### 3. State Management
- Uses **React Context** for global state:
    - `AuthContext`: User session and login state.
    - `ThemeContext`: DaisyUI theme switching (persisted to `localStorage`).
    - `LocaleContext`: i18n support (Thai/English).
    - `ToastContext`: Application notifications.

### 4. Database & Storage
- **MongoDB:** Stores relational data (Users, Students, Teachers) and face descriptors (as arrays of numbers).
- **Cloudflare R2:** Stores the actual face images. File paths are stored in MongoDB.

## Coding Conventions
- **Types:** Strict TypeScript usage. Types are defined in `src/types/` and Mongoose models in `src/models/`.
- **Components:** Functional components with hooks. Use `'use client'` for interactive components.
- **Styling:** Utility-first CSS with Tailwind v4. Use DaisyUI components for rapid UI development.
- **I18n:** All text should be internationalized using `useLocale()` hook and keys in `src/i18n/locales/`.

## Common Tasks
- **Adding a API Route:** Create `src/app/api/[resource]/route.ts`. Ensure `connectDB()` is called.
- **Adding a Page:** Create `src/app/[page]/page.tsx`. update `Sidebar.tsx` for navigation.
- **Database Changes:** Update Mongoose schemas in `src/models` and corresponding TypeScript interfaces.
