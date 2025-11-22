"use client";

import React from "react";
import Sidebar from "./Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

const Drawer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" defaultChecked />
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
      <div className="drawer-side is-drawer-close:overflow-visible">
        <label
          htmlFor="my-drawer-2"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className="flex min-h-full flex-col is-drawer-close:w-24 is-drawer-open:w-72 is-drawer-close:items-center is-drawer-open:items-start is-drawer-close:p-4 is-drawer-open:p-4">
          <Sidebar />
        </div>
      </div>
    </div>
  );
};

export default Drawer;
