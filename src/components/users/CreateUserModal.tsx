"use client";

import { useState, useRef } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";
import {
  CloseIcon,
  UserIcon,
  TeacherIcon,
  ShieldIcon,
  CameraIcon,
  UserPlaceholderIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@/components/common/Icons";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type UserRole = "student" | "teacher" | "admin";

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

  // Form state
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [studentId, setStudentId] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    setRole("student");
    setStudentId("");
    setImagePreview(null);
    setImageFile(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = t.users.usernameRequired;
    }

    if (!email.trim()) {
      newErrors.email = t.users.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t.users.emailInvalid;
    }

    if (role !== "student") {
      if (!password) {
        newErrors.password = t.users.passwordRequired;
      } else if (password.length < 6) {
        newErrors.password = t.users.passwordTooShort;
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = t.users.passwordMismatch;
      }
    }

    if (role === "student" && !studentId.trim()) {
      newErrors.studentId = t.users.studentIdRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast({ message: t.users.invalidImageType, type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast({ message: t.users.imageTooLarge, type: "error" });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      let imageData: string | undefined;
      if (imageFile) {
        imageData = await convertFileToBase64(imageFile);
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email.trim(),
          password: role === "student" ? studentId.trim() : password,
          role,
          fullName: fullName.trim(),
          studentId: role === "student" ? studentId.trim() : undefined,
          imageData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.users.createSuccess, type: "success" });
        resetForm();
        onSuccess();
        onClose();
      } else {
        if (result.error?.includes("already exists")) {
          setErrors({ email: t.users.emailExists });
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      showToast({
        message: error instanceof Error ? error.message : t.users.createError,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const roleConfig = {
    student: {
      icon: <UserIcon />,
      activeColor: "bg-info text-info-content border-info",
    },
    teacher: {
      icon: <TeacherIcon />,
      activeColor: "bg-success text-success-content border-success",
    },
    admin: {
      icon: <ShieldIcon />,
      activeColor: "bg-error text-error-content border-error",
    },
  };

  const roleLabels = {
    student: t.users.roleStudent,
    teacher: t.users.roleTeacher,
    admin: t.users.roleAdmin,
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between">
          <h3 className="font-semibold text-lg">{t.users.createUser}</h3>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={handleClose}
            disabled={saving}
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Profile Image - Centered */}
          <div className="flex flex-col items-center">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center overflow-hidden ring-4 ring-base-100 shadow-lg">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-base-content/20">
                    <UserPlaceholderIcon />
                  </div>
                )}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <CameraIcon />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
                disabled={saving}
              />
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="btn btn-ghost btn-xs mt-2 text-error"
                disabled={saving}
              >
                {t.users.removeProfileImage}
              </button>
            )}
            <p className="text-xs text-base-content/50 mt-6">
              {t.users.defaultImageInfo}
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-3 gap-2">
            {(["student", "teacher", "admin"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  role === r
                    ? roleConfig[r].activeColor + " shadow-md"
                    : "border-base-200 hover:border-base-300"
                }`}
                onClick={() => setRole(r)}
              >
                {roleConfig[r].icon}
                <span className="text-xs font-medium">{roleLabels[r]}</span>
              </button>
            ))}
          </div>

          {/* Student ID - Only for students */}
          {role === "student" && (
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-sm font-medium">
                  {t.users.studentId}
                </span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${errors.studentId ? "input-error" : ""}`}
                placeholder={t.users.studentIdPlaceholder || "Enter Student ID"}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                maxLength={20}
                disabled={saving}
              />
              {errors.studentId && (
                <p className="text-xs text-error mt-1">{errors.studentId}</p>
              )}
              <label className="label py-0">
                <span className="label-text-alt text-xs text-base-content/60">
                  {t.users.studentIdWillBePassword}
                </span>
              </label>
            </div>
          )}

          {/* Full Name */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm font-medium">
                {t.register.name}
              </span>
            </label>
            <input
              type="text"
              className={`input input-bordered w-full ${errors.fullName ? "input-error" : ""}`}
              placeholder={t.register.namePlaceholder}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              disabled={saving}
            />
            {errors.fullName && (
              <p className="text-xs text-error mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm font-medium">
                {t.users.email}
              </span>
            </label>
            <input
              type="email"
              className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
              placeholder={t.users.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
            {errors.email && (
              <p className="text-xs text-error mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password Fields - Hide for students */}
          {role !== "student" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-sm font-medium">
                    {t.users.password}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`input input-bordered w-full pr-10 ${errors.password ? "input-error" : ""}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error mt-1">{errors.password}</p>
                )}
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-sm font-medium">
                    {t.users.confirmPassword}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`input input-bordered w-full pr-10 ${errors.confirmPassword ? "input-error" : ""}`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-error mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn btn-ghost flex-1"
              onClick={handleClose}
              disabled={saving}
            >
              {t.users.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t.users.saving}
                </>
              ) : (
                t.users.save
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop bg-black/50">
        <button onClick={handleClose} disabled={saving}>
          close
        </button>
      </form>
    </dialog>
  );
}
