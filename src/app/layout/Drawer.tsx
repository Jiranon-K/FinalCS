"use client";

import React, { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { useLocale } from "@/i18n/useLocale";
config.autoAddCss = false;

const Drawer = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useLocale();
  const pathname = usePathname();

  const isLoginPage = useMemo(() => {
    return pathname === '/login' || pathname === '/admin/login';
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer-2"
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        onChange={(e) => setIsOpen(e.target.checked)}
      />
      <div className="drawer-content flex flex-col items-center">
        {/* Page content */}
        <label
          htmlFor="my-drawer-2"
          className="btn btn-primary drawer-button lg:hidden fixed top-4 left-4 z-10"
        >
          <FontAwesomeIcon icon={faBars} />
        </label>
        {children}
      </div>
      <div className={`drawer-side ${!isOpen ? 'overflow-visible' : ''}`}>
        <label
          htmlFor="my-drawer-2"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className={`flex flex-col h-screen bg-base-100 ${isOpen ? 'w-72' : 'w-24'}`}>
          {/* Desktop collapse toggle button */}
          <div className={`p-4 ${!isOpen ? 'flex justify-center' : ''}`}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="btn btn-ghost btn-sm hidden lg:flex"
              aria-label={t.nav.collapse}
              title={t.nav.collapse}
            >
              <FontAwesomeIcon icon={isOpen ? faChevronLeft : faChevronRight} />
              {isOpen && <span className="ml-2">{t.nav.collapse}</span>}
            </button>
          </div>
          <div className="flex-1 flex flex-col">
            <Sidebar isOpen={isOpen} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;
