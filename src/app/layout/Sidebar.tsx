'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { useLocale } from "@/i18n/useLocale";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import ProfileImage from "@/components/shared/ProfileImage";

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  alt: string;
  visible: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getInitials = () => {
    if (user?.name) {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return nameParts[0][0] + nameParts[nameParts.length - 1][0];
      }
      return nameParts[0][0];
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const getDisplayName = () => {
    return user?.fullName || user?.name || user?.username || 'Unknown User';
  };

  const getRoleDisplay = () => {
    if (!user) return '';
    const roleMap: Record<string, string> = {
      'admin': t.register.roleAdmin,
      'teacher': t.register.roleTeacher,
      'student': t.register.roleStudent,
    };
    return roleMap[user.role] || user.role;
  };

  const menuGroups: MenuGroup[] = useMemo(() => {
    const isAdmin = user?.role === 'admin';
    const isTeacher = user?.role === 'teacher';
    const isStudent = user?.role === 'student';
    const hasRegistered = user?.hasProfileRegistered;

    return [
      {
        id: 'main',
        label: t.nav.home,
        items: [
          {
            path: '/',
            label: t.nav.home,
            icon: '/menu-icon/house.png',
            alt: 'Home',
            visible: !user || !isStudent || hasRegistered || false,
          },
        ],
      },
      {
        id: 'face-management',
        label: 'Face Management',
        items: [
          {
            path: '/camera',
            label: t.nav.camera,
            icon: '/menu-icon/camera.png',
            alt: 'Camera',
            visible: !user || !isStudent,
          },
          {
            path: '/register',
            label: t.nav.register,
            icon: '/menu-icon/document.png',
            alt: 'Register',
            visible: isAdmin || (isStudent && !hasRegistered) || false,
          },
          {
            path: '/profile',
            label: t.nav.profile,
            icon: '/menu-icon/profile.png',
            alt: 'Profile',
            visible: isStudent && hasRegistered || false,
          },
          {
            path: '/face-requests',
            label: t.nav.faceRequests,
            icon: '/menu-icon/folder-approve.png',
            alt: 'Face Requests',
            visible: isAdmin || false,
          },
        ],
      },
      {
        id: 'education',
        label: 'Education',
        items: [
          {
            path: '/schedule',
            label: t.nav.schedule,
            icon: '/menu-icon/book.png',
            alt: 'Schedule',
            visible: true,
          },
          {
            path: '/attendance',
            label: t.nav.attendanceManagement,
            icon: '/menu-icon/document.png',
            alt: 'Attendance',
            visible: true,
          },
          {
            path: '/all-students',
            label: t.students.title,
            icon: '/menu-icon/profile.png',
            alt: 'All Students',
            visible: isAdmin || isTeacher || false,
          },
        ],
      },
      {
        id: 'system',
        label: 'System',
        items: [
          {
            path: '/users',
            label: t.nav.users,
            icon: '/menu-icon/user-manage.png',
            alt: 'Users',
            visible: isAdmin || false,
          },
          {
            path: '/settings',
            label: t.nav.settings,
            icon: '/menu-icon/setting.png',
            alt: 'Settings',
            visible: true,
          },
        ],
      },
    ];
  }, [user, t]);

  const filteredGroups = useMemo(() => {
    return menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.visible),
      }))
      .filter(group => group.items.length > 0);
  }, [menuGroups]);

  const renderMenuItem = (item: MenuItem, showLabel: boolean) => {
    const active = isActive(item.path);
    
    return (
      <li key={item.path}>
        <Link
          href={item.path}
          className={`
            group flex items-center gap-3 rounded-lg transition-all duration-200 ease-out
            ${showLabel ? 'py-3 px-4' : 'py-3 px-3 justify-center'}
            ${active 
              ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold' 
              : 'border-l-4 border-transparent hover:bg-base-200'
            }
          `}
          {...(!showLabel && { 'data-tip': item.label })}
        >
          <Image
            src={item.icon}
            alt={item.alt}
            width={24}
            height={24}
            className={`w-6 h-6 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}
          />
          {showLabel && (
            <span className="text-sm">{item.label}</span>
          )}
        </Link>
      </li>
    );
  };

  const renderGroup = (group: MenuGroup, showLabels: boolean) => {
    if (group.id === 'main') {
      return (
        <div key={group.id}>
          {group.items.map(item => renderMenuItem(item, showLabels))}
        </div>
      );
    }

    const isCollapsed = collapsedGroups[group.id];

    if (!showLabels) {
      return (
        <div key={group.id} className="space-y-1">
          {group.items.map(item => (
            <div key={item.path} className="tooltip tooltip-right z-50" data-tip={item.label}>
              {renderMenuItem(item, false)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div key={group.id} className="space-y-1">
        <button
          onClick={() => toggleGroup(group.id)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-base-content/50 hover:text-base-content transition-colors duration-200"
        >
          <span>{group.label}</span>
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
          />
        </button>
        <div
          className={`space-y-1 overflow-hidden transition-all duration-300 ease-out ${
            isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
          }`}
        >
          {group.items.map(item => renderMenuItem(item, true))}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full justify-between bg-base-100 ${isOpen ? 'overflow-hidden' : 'overflow-visible'}`}>
      <div className={`flex-1 ${isOpen ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}>
        {isOpen && (
          <div className="p-4 border-b border-base-200">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/menu-icon/logo.png"
                alt="Face Recognition"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-bold text-base-content">{t.nav.title}</span>
            </Link>
          </div>
        )}

        <nav className={`${isOpen ? 'p-3 overflow-x-hidden' : 'p-2 overflow-visible'} space-y-4`}>
          {filteredGroups.map(group => renderGroup(group, isOpen))}
        </nav>
      </div>

      <div className={`border-t border-base-200 bg-base-100/80 backdrop-blur-sm ${isOpen ? 'p-4' : 'p-2'}`}>
        {user ? (
          isOpen ? (
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="w-11 rounded-full ring-2 ring-primary/20 overflow-hidden">
                  <ProfileImage
                    imageUrl={user.imageUrl}
                    role={user.role as 'student' | 'teacher' | 'admin'}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate text-base-content">
                  {getDisplayName()}
                </div>
                <div className="text-xs text-base-content/60 truncate">
                  {getRoleDisplay()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-error hover:bg-error/10 transition-colors duration-200"
                aria-label="Logout"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="avatar placeholder">
                <div className="w-10 rounded-full ring-2 ring-primary/20 overflow-hidden">
                  <ProfileImage
                    imageUrl={user.imageUrl}
                    role={user.role as 'student' | 'teacher' | 'admin'}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-error hover:bg-error/10 transition-colors duration-200"
                aria-label="Logout"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="w-3 h-3" />
              </button>
            </div>
          )
        ) : (
          <div className="flex justify-center py-2">
            <span className="loading loading-spinner loading-sm text-primary"></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
