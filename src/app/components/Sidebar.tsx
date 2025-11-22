'use client';

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/i18n/useLocale";

const Sidebar = () => {
  const { t } = useLocale();

  return (
    <ul className="menu is-drawer-open:p-4 is-drawer-close:p-2 w-full grow text-base-content bg-base-100 rounded-box shadow-lg gap-y-5.5">
      <li className="text-xl font-bold p-4 is-drawer-close:hidden">
        <Link href="/">{t.nav.title}</Link>
      </li>
      <li className="is-drawer-close:tooltip is-drawer-close:tooltip-right is-drawer-close:flex is-drawer-close:justify-center" data-tip={t.nav.home}>
        <Link href="/" className="is-drawer-close:flex is-drawer-close:justify-center is-drawer-close:items-center is-drawer-close:px-0 is-drawer-close:w-full">
          <Image
            src="/menu-icon/house.png"
            alt="Home"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="is-drawer-close:hidden">{t.nav.home}</span>
        </Link>
      </li>
      <li className="is-drawer-close:tooltip is-drawer-close:tooltip-right is-drawer-close:flex is-drawer-close:justify-center" data-tip={t.nav.settings}>
        <Link href="/settings" className="is-drawer-close:flex is-drawer-close:justify-center is-drawer-close:items-center is-drawer-close:px-0 is-drawer-close:w-full">
          <Image
            src="/menu-icon/setting.png"
            alt="Settings"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="is-drawer-close:hidden">{t.nav.settings}</span>
        </Link>
      </li>
    </ul>
  );
};

export default Sidebar;
