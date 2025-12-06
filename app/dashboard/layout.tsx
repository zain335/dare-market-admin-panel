"use client";

import SideNavDrawer from "@/components/side-nav-drawer";
import TopNavBar from "@/components/top-navbar";
import { UsersDrawerBtns } from "@/constants";
import withProtectedRoute from "@/context/WithProtectedRoute";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en">
      <div className="">
        <SideNavDrawer title={"Users"} drawerButtons={UsersDrawerBtns}>
          <TopNavBar className="w-top-bar-sm">{children}</TopNavBar>
        </SideNavDrawer>
      </div>
    </div>
  );
}

export default withProtectedRoute(DashboardLayout);
