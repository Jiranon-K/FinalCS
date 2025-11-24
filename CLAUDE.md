# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Person Tracking & Facial Recognition System** built with Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, and DaisyUI. The application focuses on tracking people in classroom environments using facial recognition technology powered by face-api.js.

**Tech Stack:**
- Frontend: Next.js 16, React 19, TypeScript, TailwindCSS v4, DaisyUI
- Backend: Next.js API Routes
- Database: MongoDB with Mongoose ODM
- Storage: Cloudflare R2 (S3-compatible)
- Face Recognition: face-api.js
- Dependencies: AWS SDK (S3 client), uuid, canvas, mongoose

## Development Commands

```bash
# Development
npm run dev          # Start development server at http://localhost:3000

# Build & Production
npm run build        # Create production build
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint checks
```

## Environment Variables

Required environment variables in `.env.local`:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://user:password@host:port/database?authSource=admin

# Cloudflare R2 Storage Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your_public_domain.com
```

**Security Note:** Never commit `.env.local` to version control.

## Architecture

### State Management Pattern

This project uses **React Context API** for global state management with three main contexts:

1. **ThemeContext** ([src/contexts/ThemeContext.tsx](src/contexts/ThemeContext.tsx))
   - Manages DaisyUI theme selection (35 total themes)
   - 21 light themes: light, cupcake, bumblebee, emerald, corporate, retro, valentine, garden, lofi, pastel, fantasy, wireframe, cmyk, autumn, acid, lemonade, winter, nord, sunset, caramellatte, silk
   - 14 dark themes: dark, synthwave, cyberpunk, halloween, forest, aqua, black, luxury, dracula, business, night, coffee, dim, abyss
   - Persists theme to localStorage
   - Updates `data-theme` attribute on `<html>` element
   - Provides `isMounted` flag to prevent hydration mismatches

2. **LocaleContext** ([src/i18n/LocaleContext.tsx](src/i18n/LocaleContext.tsx))
   - Handles bilingual support (Thai/English)
   - Default locale: Thai (`th`)
   - Provides type-safe translations via the `t` object
   - Persists locale to localStorage
   - Translation files: [src/i18n/locales/th.json](src/i18n/locales/th.json) and [src/i18n/locales/en.json](src/i18n/locales/en.json)

3. **ToastContext** ([src/contexts/ToastContext.tsx](src/contexts/ToastContext.tsx))
   - Toast notification system with auto-dismiss
   - Supports types: success, error, warning, info
   - Default duration: 3000ms
   - Methods: `showToast()`, `hideToast()`, `clearAllToasts()`

### Context Provider Hierarchy

The root layout wraps the app in this specific order (from outer to inner):

```tsx
<ThemeProvider>
  <LocaleProvider>
    <ToastProvider>
      <Drawer>{children}</Drawer>
      <ToastContainer />
    </ToastProvider>
  </LocaleProvider>
</ThemeProvider>
```

This ordering is important because inner contexts may depend on outer ones.

### Custom Hooks Pattern

Access contexts via custom hooks located in [src/hooks/](src/hooks/):
- `useTheme()` - Access theme state and setter
- `useLocale()` - Access locale and translations
- `useToast()` - Access toast notification functions

### Layout Structure

The application uses a **drawer/sidebar pattern**:
- **Drawer** ([src/app/components/Drawer.tsx](src/app/components/Drawer.tsx)): Responsive container
  - Desktop (lg+): Sidebar always visible
  - Mobile: Toggle button with overlay
  - Uses DaisyUI drawer component
- **Sidebar** ([src/app/components/Sidebar.tsx](src/app/components/Sidebar.tsx)): Navigation menu
  - Adaptive width: 24 units when collapsed, 72 units when open

### Internationalization (i18n)

- Locale files define nested translation objects
- Access translations via `t.section.key` (e.g., `t.settings.title`)
- When adding new UI text:
  1. Add keys to both [src/i18n/locales/en.json](src/i18n/locales/en.json) and [src/i18n/locales/th.json](src/i18n/locales/th.json)
  2. Use `useLocale()` hook and access via `t` object
  3. Maintain parallel structure in both files

## TypeScript Configuration

- Path alias: `@/*` maps to `./src/*`
- Strict mode enabled
- Target: ES2017
- Use path aliases for imports: `import { Component } from '@/components/Component'`

## Styling

- **TailwindCSS v4** with **DaisyUI** component library
- Font: Noto Sans Thai (supports Thai and Latin scripts)
- Theme switching via `data-theme` attribute on `<html>` element
- DaisyUI provides pre-built components (btn, drawer, card, etc.)

### Backend Infrastructure

This project uses a **serverless backend architecture** with Next.js API Routes:

1. **Mongoose ODM Integration** ([src/lib/mongoose.ts](src/lib/mongoose.ts))
   - Connection pooling with singleton pattern
   - Global connection caching in development mode
   - Database collections: `students`, `teachers`
   - Functions: `connectDB()`, `checkConnection()`
   - Models located in [src/models/](src/models/): `Student`, `Teacher`

2. **Cloudflare R2 Storage** ([src/lib/r2-upload.ts](src/lib/r2-upload.ts))
   - S3-compatible object storage for face images
   - Functions: `uploadFaceImage()`, `uploadBase64Image()`
   - Images stored at: `{bucket}/{type}s/{personId}-{uuid}.{ext}`
   - Returns: `{ imageUrl, imageKey }`

### Data Models

**Mongoose Models** located in [src/models/](src/models/):

1. **Student Model** ([src/models/Student.ts](src/models/Student.ts))
   - Schema with automatic validation and timestamps
   - Core fields: `id` (UUID, unique), `name`, `imageUrl`, `imageKey`, `faceDescriptor`
   - Optional: `studentId` (unique, sparse), `email`, `phone`, `department`, `grade`, `class`
   - Face descriptor validation: must be exactly 128 numbers
   - Indexes: `id`, `studentId`, `name`, `email`, `department`
   - Auto-updates `updatedAt` on save/update

2. **Teacher Model** ([src/models/Teacher.ts](src/models/Teacher.ts))
   - Similar to Student but with `teacherId` instead of student-specific fields
   - Core fields: `id` (UUID, unique), `name`, `imageUrl`, `imageKey`, `faceDescriptor`
   - Optional: `teacherId` (unique, sparse), `email`, `phone`, `department`
   - Same validation and indexing strategy as Student

**TypeScript Types** located in [src/types/](src/types/):
- Interface definitions for API contracts and data shapes
- `Student`, `Teacher`, `PersonForRecognition`, etc.
- Used alongside Mongoose models for type safety

### API Routes

All API routes follow RESTful conventions and return JSON with `{ success, data?, error? }` format.

1. **Students API** ([src/app/api/students/route.ts](src/app/api/students/route.ts))
   - `POST /api/students` - Create new student with face descriptor
     - Required: `name`, `faceDescriptor` (128 floats), `imageData` (base64)
     - Uploads image to R2, stores metadata via Mongoose
     - Uses `Student.create()` method
   - `GET /api/students?search=&limit=50&skip=0` - List/search students
     - Supports pagination and text search (name, studentId, email)
     - Uses `Student.find().lean()` for performance

2. **Students by ID** ([src/app/api/students/[id]/route.ts](src/app/api/students/[id]/route.ts))
   - `GET /api/students/[id]` - Get single student
   - `PUT /api/students/[id]` - Update student metadata (not face descriptor)
   - `DELETE /api/students/[id]` - Delete student

3. **Teachers API** ([src/app/api/teachers/route.ts](src/app/api/teachers/route.ts) & [id]/route.ts)
   - Same CRUD operations as Students API
   - Endpoints: `/api/teachers`, `/api/teachers/[id]`

4. **Faces API** ([src/app/api/faces/route.ts](src/app/api/faces/route.ts))
   - `GET /api/faces` - Returns all persons (students + teachers) with face descriptors
   - Used for face recognition matching
   - Returns `PersonForRecognition[]` array

### App Routes

1. **Home** (`/`) - Dashboard/landing page
2. **Camera** ([/camera](src/app/camera/page.tsx)) - Live face recognition view
3. **Register** ([/register](src/app/register/page.tsx)) - Person enrollment with face capture
4. **Settings** ([/settings](src/app/settings/page.tsx)) - Theme and language preferences

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API Routes
│   │   ├── students/      # Student CRUD endpoints
│   │   ├── teachers/      # Teacher CRUD endpoints
│   │   └── faces/         # Face recognition data endpoint
│   ├── components/        # Route-specific components (Drawer, Sidebar)
│   ├── camera/           # Camera/recognition page
│   ├── register/         # Person registration page
│   ├── settings/         # Settings page route
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Home page
├── components/           # Reusable UI components
│   ├── camera/           # Camera-related components
│   ├── register/         # Registration form components
│   ├── settings/         # Settings-related components
│   ├── toast/            # Toast notification components
│   └── ui/               # Generic UI components
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
├── i18n/                 # Internationalization
│   └── locales/          # Translation JSON files
├── lib/                  # Backend utilities
│   ├── mongoose.ts       # Mongoose connection
│   ├── r2.ts             # R2 storage client
│   └── r2-upload.ts      # Image upload utilities
├── models/               # Mongoose models
│   ├── Student.ts        # Student schema and model
│   ├── Teacher.ts        # Teacher schema and model
│   └── index.ts          # Model exports
└── types/                # TypeScript type definitions
    ├── student.ts
    ├── teacher.ts
    ├── person.ts
    ├── face.ts
    └── attendance.ts
```

## Key Implementation Patterns

### Client Components
Most components use `'use client'` directive because they:
- Access browser APIs (localStorage, document)
- Use React hooks (useState, useEffect, useContext)
- Handle user interactions

### Hydration Safety
When using localStorage or browser APIs:
1. Check `typeof window !== 'undefined'` before access
2. Use `useEffect` for client-side-only initialization
3. Use `isMounted` flag from ThemeContext when needed to prevent hydration mismatches

### FontAwesome Configuration
FontAwesome is configured to prevent duplicate CSS injection:
```tsx
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
```

### Face Recognition with face-api.js

The application uses **face-api.js** for facial recognition:

1. **Face Descriptors**
   - 128-dimensional float array representing facial features
   - Generated during person registration
   - Stored in MongoDB alongside person metadata
   - Required field: must be exactly 128 numbers

2. **Recognition Flow**
   - Load face-api.js models (typically in browser)
   - Detect face in image/video frame
   - Extract 128-dimensional descriptor
   - Compare against stored descriptors using Euclidean distance
   - Match if distance < threshold (typically 0.6)

3. **Integration Points**
   - Registration: Generate descriptor from uploaded/captured image
   - Recognition: Compare live camera feed against `/api/faces` data
   - Storage: Save descriptor as `number[]` in MongoDB

### Mongoose Usage Patterns

This project uses **Mongoose** for MongoDB object modeling:

1. **Connection Management**
   ```typescript
   import { connectDB } from '@/lib/mongoose';

   // Always call at the start of API routes
   await connectDB();
   ```

2. **Creating Documents**
   ```typescript
   import { Student } from '@/models';

   const student = await Student.create({
     id: uuidv4(),
     name: 'John Doe',
     faceDescriptor: [...],
     imageUrl: 'https://...',
     imageKey: 'students/...'
   });
   ```

3. **Querying Documents**
   ```typescript
   // Find one
   const student = await Student.findOne({ id }).lean();

   // Find many with filters
   const students = await Student.find({ department: 'CS' })
     .sort({ createdAt: -1 })
     .limit(10)
     .lean();

   // Count
   const total = await Student.countDocuments({ department: 'CS' });
   ```

4. **Updating Documents**
   ```typescript
   const updated = await Student.findOneAndUpdate(
     { id },
     { $set: { name: 'New Name' } },
     { new: true }  // Return updated document
   ).lean();
   ```

5. **Deleting Documents**
   ```typescript
   const result = await Student.deleteOne({ id });
   if (result.deletedCount === 0) {
     // Not found
   }
   ```

6. **Performance Tips**
   - Use `.lean()` for read-only queries (returns plain objects, faster)
   - Avoid `.lean()` when you need document methods or virtuals
   - Indexes are defined in schema for `id`, `studentId`, `name`, etc.
   - Use projection strings for selecting fields: `Student.find({}, 'id name')`

## Adding New Features

### Adding a New Page
1. Create route in `src/app/[route-name]/page.tsx`
2. Add navigation link in [src/app/components/Sidebar.tsx](src/app/components/Sidebar.tsx)
3. Add translation keys for the page in both locale files

### Adding a New Context
1. Create context in `src/contexts/[Name]Context.tsx`
2. Add provider to [src/app/layout.tsx](src/app/layout.tsx) in the correct hierarchy
3. Create custom hook in `src/hooks/use[Name].ts`
4. Export types in `src/types/` if needed

### Adding Translations
1. Add keys to [src/i18n/locales/en.json](src/i18n/locales/en.json)
2. Add corresponding keys to [src/i18n/locales/th.json](src/i18n/locales/th.json)
3. Maintain consistent structure across both files
4. Access via `t.section.key` pattern

### Adding a New API Endpoint
1. Create route file in `src/app/api/[resource]/route.ts`
2. Export HTTP method handlers: `GET`, `POST`, `PUT`, `DELETE`
3. Call `connectDB()` from `@/lib/mongoose` at the start of each handler
4. Use Mongoose models for database operations
5. Use `uploadBase64Image()` or `uploadFaceImage()` for R2 uploads
6. Return consistent JSON format: `{ success: boolean, data?: any, error?: string }`
7. Handle errors with appropriate HTTP status codes
8. Add TypeScript types in `src/types/` and Mongoose models in `src/models/` if needed

Example structure:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Student } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const students = await Student.find().lean();
    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error message' },
      { status: 500 }
    );
  }
}
```

## Working with Person Data

### Creating New Persons (Students/Teachers)

When adding a new person to the system:

1. **Client-side**: Capture or upload image, detect face, generate descriptor using face-api.js
2. **Required data**:
   - `name` (string)
   - `faceDescriptor` (number[128])
   - `imageData` (base64 string with data URI prefix)
3. **POST request**: Send to `/api/students` or `/api/teachers`
4. **Backend process**:
   - Validates face descriptor (must be 128 floats)
   - Uploads image to R2 storage
   - Generates unique UUID for person
   - Stores metadata + descriptor in MongoDB
   - Returns created person object

### MongoDB Collections

- **students**: Student records with face descriptors
- **teachers**: Teacher records with face descriptors
- Both collections share similar schema with `faceDescriptor` field
- Use MongoDB projection to exclude `_id` when not needed
- Face descriptor field indexed for faster queries

### Image Storage Strategy

- Images stored in Cloudflare R2 (S3-compatible)
- Path pattern: `students/{personId}-{uuid}.{ext}` or `teachers/{personId}-{uuid}.{ext}`
- Each person has `imageUrl` (public URL) and `imageKey` (storage key)
- Base64 images converted to Buffer before upload
- Supported formats: jpg, jpeg, png, webp

## Important Notes

- The project defaults to Thai language (`th`) as the primary locale
- Theme persistence uses localStorage and DOM attributes
- All context providers implement localStorage persistence for user preferences
- The drawer is open by default on desktop (`defaultChecked` on drawer toggle)
- Face descriptors must be exactly 128 floats (face-api.js standard)
- All API routes use Next.js App Router conventions (not Pages Router)
- **Mongoose** is used for database operations with automatic schema validation
- Connection uses singleton pattern to prevent connection exhaustion in serverless environment
- Always call `connectDB()` at the start of API route handlers
- Use `.lean()` for read-only queries to improve performance
