# API Documentation

This document outlines the available API endpoints in the Face Recognition project.

## Authentication

### Login
*   **URL:** `/api/auth/login`
*   **Method:** `POST`
*   **Description:** Authenticates a user and sets a JWT token cookie.
*   **Request Body:**
    *   `username` (string, required)
    *   `password` (string, required)
    *   `role` (string, required) - 'student', 'teacher', or 'admin'

### Logout
*   **URL:** `/api/auth/logout`
*   **Method:** `POST`
*   **Description:** Clears the authentication cookie.

### Session
*   **URL:** `/api/auth/session`
*   **Method:** `GET`
*   **Description:** Retrieves the current authenticated user's session information, including profile details if linked.
*   **Authentication:** Required

---

## Users

### Create User
*   **URL:** `/api/users`
*   **Method:** `POST`
*   **Description:** Creates a new user account.
*   **Request Body:**
    *   `username` (string, required)
    *   `password` (string, required) - Defaults to `studentId` for students if not provided.
    *   `role` (string, required) - 'student', 'teacher', or 'admin'
    *   `fullName` (string, optional)
    *   `studentId` (string, optional) - Required if role is 'student'
    *   `imageData` (string, optional) - Base64 encoded image

### List Users
*   **URL:** `/api/users`
*   **Method:** `GET`
*   **Description:** Retrieves a paginated list of users.
*   **Query Parameters:**
    *   `search` (string) - Search by username
    *   `role` (string) - Filter by role
    *   `limit` (number) - Defaults to 50
    *   `skip` (number) - Defaults to 0

### Get User
*   **URL:** `/api/users/[id]`
*   **Method:** `GET`
*   **Description:** Retrieves a specific user by ID or Username.
*   **Parameters:** `id` (User ID or Username)

### Update User
*   **URL:** `/api/users/[id]`
*   **Method:** `PUT`
*   **Description:** Updates a specific user.
*   **Parameters:** `id` (User ID or Username)
*   **Request Body:**
    *   `password` (string, optional)
    *   `role` (string, optional)
    *   `profileId` (string, optional)
    *   `imageData` (string, optional)

### Delete User
*   **URL:** `/api/users/[id]`
*   **Method:** `DELETE`
*   **Description:** Deletes a user and their associated data (Student profile, Face Requests, R2 Image).
*   **Parameters:** `id` (User ID or Username)

### Change Password
*   **URL:** `/api/users/[id]/password`
*   **Method:** `PUT`
*   **Description:** Changes the password for a specific user. Users can only change their own password.
*   **Parameters:** `id` (Username)
*   **Request Body:**
    *   `currentPassword` (string, required)
    *   `newPassword` (string, required)
*   **Authentication:** Required

---

## Teachers

### Create Teacher
*   **URL:** `/api/teachers`
*   **Method:** `POST`
*   **Description:** Creates a new teacher profile.
*   **Request Body:**
    *   `name` (string, required)
    *   `teacherId` (string, optional)
    *   `email` (string, optional)
    *   `phone` (string, optional)
    *   `department` (string, optional)
    *   `faceDescriptor` (array[128], optional)
    *   `imageData` (string, optional)

### List Teachers
*   **URL:** `/api/teachers`
*   **Method:** `GET`
*   **Description:** Retrieves a paginated list of teachers.
*   **Query Parameters:**
    *   `search` (string) - Search by name, teacherId, or email
    *   `limit` (number) - Defaults to 50
    *   `skip` (number) - Defaults to 0

### Get Teacher
*   **URL:** `/api/teachers/[id]`
*   **Method:** `GET`
*   **Description:** Retrieves a specific teacher by internal ID (UUID).
*   **Parameters:** `id`

### Update Teacher
*   **URL:** `/api/teachers/[id]`
*   **Method:** `PUT`
*   **Description:** Updates a teacher profile.
*   **Parameters:** `id`
*   **Request Body:** (Partial updates supported)
    *   `name`, `teacherId`, `email`, `phone`, `department`

### Delete Teacher
*   **URL:** `/api/teachers/[id]`
*   **Method:** `DELETE`
*   **Description:** Deletes a teacher profile.
*   **Parameters:** `id`

---

## Students

### Create Student (Face Registration)
*   **URL:** `/api/students`
*   **Method:** `POST`
*   **Description:** Registers a student profile and links it to the authenticated user. Primarily used for Face Registration.
*   **Authentication:** Required (Student role only)
*   **Request Body:**
    *   `name` (string, required)
    *   `faceDescriptor` (array[128], required)
    *   `studentId` (string, optional) - Must match authenticated user account if set
    *   `imageData` (string, optional)
    *   `email`, `phone`, `department`, `grade`, `class` (optional)

### List Students
*   **URL:** `/api/students`
*   **Method:** `GET`
*   **Description:** Retrieves a paginated list of students.
*   **Query Parameters:**
    *   `search` (string) - Search by name, studentId, or email
    *   `limit` (number) - Defaults to 50
    *   `skip` (number) - Defaults to 0

### Get Student
*   **URL:** `/api/students/[id]`
*   **Method:** `GET`
*   **Description:** Retrieves a specific student by internal ID (UUID).
*   **Parameters:** `id`

### Update Student
*   **URL:** `/api/students/[id]`
*   **Method:** `PUT`
*   **Description:** Updates a student profile.
*   **Parameters:** `id`
*   **Request Body:** (Partial updates supported)
    *   `name`, `studentId`, `email`, `phone`, `department`, `grade`, `class`

### Delete Student
*   **URL:** `/api/students/[id]`
*   **Method:** `DELETE`
*   **Description:** Deletes a student profile.
*   **Parameters:** `id`

---

## Face Recognition & Updates

### List Recognition Faces
*   **URL:** `/api/faces`
*   **Method:** `GET`
*   **Description:** Returns a list of all students and teachers who have registered face descriptors. Used for initializing the face matcher on the client.
*   **Response:** Array of `{ id, name, role, imageUrl, faceDescriptor }`

### Create Face Update Request
*   **URL:** `/api/face-update-requests`
*   **Method:** `POST`
*   **Description:** Submits a request to update a student's face data (image and descriptor).
*   **Authentication:** Required (Student role only)
*   **Request Body:**
    *   `faceDescriptor` (array[128], required)
    *   `imageData` (string, required)

### List Face Update Requests
*   **URL:** `/api/face-update-requests`
*   **Method:** `GET`
*   **Description:** Lists face update requests. Admins see all; Students see only their own.
*   **Authentication:** Required
*   **Query Parameters:**
    *   `status` (string) - Filter by status (e.g., 'pending')

### Process Face Update Request
*   **URL:** `/api/face-update-requests/[id]`
*   **Method:** `PUT`
*   **Description:** Approve or Reject a face update request.
*   **Authentication:** Required (Admin role only)
*   **Parameters:** `id` (Request ID)
*   **Request Body:**
    *   `action` (string, required) - 'approve' or 'reject'
    *   `rejectionReason` (string) - Required if action is 'reject'

### Cancel Face Update Request
*   **URL:** `/api/face-update-requests/[id]`
*   **Method:** `DELETE`
*   **Description:** Cancels a pending face update request.
*   **Authentication:** Required (Admin or Owner)
*   **Parameters:** `id` (Request ID)
