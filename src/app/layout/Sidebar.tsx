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
