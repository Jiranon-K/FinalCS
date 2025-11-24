'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "@/i18n/useLocale";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
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
    return user?.name || user?.username || 'Unknown User';
  };

  const getRoleDisplay = () => {
    if (!user) return '';
    
    const roleMap: Record<string, string> = {
      'admin': 'ผู้ดูแลระบบ',
      'teacher': 'อาจารย์',
      'student': 'นักเรียน',
    };
    
    return roleMap[user.role] || user.role;
  };

  return (
    <div className="flex flex-col h-full justify-between">

      <div>
      <ul className={`menu w-full text-base-content bg-base-100 gap-y-4 ${isOpen ? 'p-4' : 'p-2'}`}>
        <li className={`text-xl font-bold p-4 ${!isOpen ? 'hidden' : ''}`}>
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/menu-icon/face-recognition.png"
              alt="Face Recognition"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            {t.nav.title}
          </Link>
        </li>
        <li className={`${!isOpen ? 'tooltip tooltip-right flex justify-center' : ''}`} data-tip={!isOpen ? t.nav.home : undefined}>
          <Link href="/" className={`${!isOpen ? 'flex justify-center items-center px-0 w-full' : ''}`}>
            <Image
              src="/menu-icon/house.png"
              alt="Home"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className={!isOpen ? 'hidden' : ''}>{t.nav.home}</span>
          </Link>
        </li>
        <li className={`${!isOpen ? 'tooltip tooltip-right flex justify-center' : ''}`} data-tip={!isOpen ? t.nav.camera : undefined}>
          <Link href="/camera" className={`${!isOpen ? 'flex justify-center items-center px-0 w-full' : ''}`}>
            <Image
              src="/menu-icon/face-recognition.png"
              alt="Camera"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className={!isOpen ? 'hidden' : ''}>{t.nav.camera}</span>
          </Link>
        </li>
        <li className={`${!isOpen ? 'tooltip tooltip-right flex justify-center' : ''}`} data-tip={!isOpen ? t.nav.register : undefined}>
          <Link href="/register" className={`${!isOpen ? 'flex justify-center items-center px-0 w-full' : ''}`}>
            <Image
              src="/menu-icon/document.png"
              alt="Register"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className={!isOpen ? 'hidden' : ''}>{t.nav.register}</span>
          </Link>
        </li>
        <li className={`${!isOpen ? 'tooltip tooltip-right flex justify-center' : ''}`} data-tip={!isOpen ? t.nav.settings : undefined}>
          <Link href="/settings" className={`${!isOpen ? 'flex justify-center items-center px-0 w-full' : ''}`}>
            <Image
              src="/menu-icon/setting.png"
              alt="Settings"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className={!isOpen ? 'hidden' : ''}>{t.nav.settings}</span>
          </Link>
        </li>
      </ul>
      </div>

      {/* User Profile Section at Bottom */}
      <div className={`mt-auto bg-base-200 border-t border-base-300 ${isOpen ? 'p-4' : 'p-2'}`}>
        {user ? (
          isOpen ? (
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content w-12 rounded-full">
                  <span className="text-lg font-semibold">{getInitials()}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {getDisplayName()}
                </div>
                <div className="text-xs text-base-content/70 truncate">
                  {getRoleDisplay()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-md btn-square hover:text-red-500 hover:bg-transparent"
                aria-label="Logout"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content w-10 rounded-full">
                  <span className="text-sm font-semibold">{getInitials()}</span>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
