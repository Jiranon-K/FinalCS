'use client';

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/i18n/useLocale";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { t } = useLocale();

  return (
    <ul className={`menu w-full grow text-base-content bg-base-100 gap-y-4 ${isOpen ? 'p-4' : 'p-2'}`}>
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
      {/* <li className={`${!isOpen ? 'tooltip tooltip-right flex justify-center' : ''}`} data-tip={!isOpen ? t.nav.persons : undefined}>
        <Link href="/persons" className={`${!isOpen ? 'flex justify-center items-center px-0 w-full' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
          </svg>
          <span className={!isOpen ? 'hidden' : ''}>{t.nav.persons}</span>
        </Link>
      </li>
      <li className={`${!isOpen ? 'tooltip tooltip-right flex justify-center' : ''}`} data-tip={!isOpen ? t.nav.attendance : undefined}>
        <Link href="/attendance" className={`${!isOpen ? 'flex justify-center items-center px-0 w-full' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" />
          </svg>
          <span className={!isOpen ? 'hidden' : ''}>{t.nav.attendance}</span>
        </Link>
      </li> */}
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
  );
};

export default Sidebar;
