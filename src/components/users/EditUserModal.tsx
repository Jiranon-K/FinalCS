"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";
import { User } from "@/types/user";
import {
  CloseIcon,
  UserIcon,
  TeacherIcon,
  ShieldIcon,
  CameraIcon,
  UserPlaceholderIcon,
} from "@/components/common/Icons";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

type UserRole = "student" | "teacher" | "admin";

export default function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [studentId, setStudentId] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails(user._id);
    }
  }, [isOpen, user]);

  const fetchUserDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`);
      const json = await res.json();
      if (json.success) {
        const u = json.data;
        let userEmail = u.email || "";
        if (!userEmail && u.username && u.username.includes("@")) {
          userEmail = u.username;
        }

        setEmail(userEmail);
        setFullName(u.fullName || "");
        setRole(u.role);
        setStudentId(u.studentId || "");
        setImagePreview(u.imageUrl || null);
        setIsImageRemoved(false);
      } else {
        showToast({ message: "Failed to fetch user details", type: "error" });
      }
    } catch (err) {
      console.error(err);
      showToast({ message: "Failed to fetch user details", type: "error" });
    }
  };

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setPassword("");
    setRole("student");
    setStudentId("");
    setImagePreview(null);
    setImageFile(null);
    setIsImageRemoved(false);
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

    if (password && password.length < 6) {
      newErrors.password = t.users.passwordTooShort;
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
    setIsImageRemoved(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setIsImageRemoved(true);
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
    if (!user) return;

    if (!validateForm()) return;

    try {
      setSaving(true);

      let imageData: string | undefined;
      if (imageFile) {
        imageData = await convertFileToBase64(imageFile);
      }

      const updateData: {
        fullName: string;
        role: UserRole;
        password?: string;
        studentId?: string;
        imageData?: string;
        removeImage?: boolean;
        email?: string;
      } = {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        removeImage: isImageRemoved && !imageData,
      };

      if (password) {
        updateData.password = password;
      }

      if (role === "student") {
        updateData.studentId = studentId.trim();
      }

      if (imageData) {
        updateData.imageData = imageData;
      }

      const response = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        showToast({
          message: t.users.updateSuccess || "User updated successfully",
          type: "success",
        });
        resetForm();
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t.users.updateError || "Failed to update user",
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
        <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {t.users.edit || "Edit User"}
          </h3>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={handleClose}
            disabled={saving}
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
          </div>

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
            </div>
          )}

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

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm font-medium">
                {t.users.email}
              </span>
            </label>
            <input
              type="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
              placeholder="example@email.com"
            />
          </div>

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

      <form method="dialog" className="modal-backdrop bg-black/50">
        <button onClick={handleClose} disabled={saving}>
          close
        </button>
      </form>
    </dialog>
  );
}
