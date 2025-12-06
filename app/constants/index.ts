import { DrawerButton, FilterType } from "@/types";

export const UsersDrawerBtns: DrawerButton[] = [
  {
    id: "overview-section",
    title: "Overview",
    href: "",
    type: "section",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: "layout-dashboard",
    type: "button",
  },
  {
    id: "dare-management-section",
    title: "Dare Management",
    href: "",
    type: "section",
  },
  {
    id: "allDares",
    title: "Dares",
    href: "/dashboard/dares",
    icon: "user-cog",
    type: "button",
  },
  {
    id: "moderator-section",
    title: "Moderator",
    href: "",
    type: "section",
  },
  {
    id: "moderator-config",
    title: "Moderator Config",
    href: "/dashboard/moderator",
    icon: "settings",
    type: "button",
  },
];

export const DareStatusFilter: FilterType[] = [
  {
    id: "AllStatus",
    title: "All Status",
  },
  {
    id: "Unverified",
    title: "Unverified",
  },
  {
    id: "Censored",
    title: "Censored",
  },
  {
    id: "Open",
    title: "Open",
  },
  {
    id: "Accepted",
    title: "Accepted",
  },
  {
    id: "Completed",
    title: "Completed",
  },
  {
    id: "Failed",
    title: "Failed",
  },
  {
    id: "Expired",
    title: "Expired",
  },
];

export const DareStatus = {
  Unverified: "unverified",
  Censored: "censored",
  Open: "open",
  Accepted: "accepted",
  Completed: "completed",
  Failed: "failed",
};

/**
 * Delay in milliseconds to wait after operations before refreshing dare state
 * Allows backend and blockchain to fully process the operation
 */
export const DARE_REFRESH_DELAY_MS = 500;

/**
 * Submission status filter options
 */
export const SubmissionStatusFilter: FilterType[] = [
  {
    id: "all",
    title: "All",
  },
  {
    id: "PENDING",
    title: "Pending",
  },
  {
    id: "APPROVED",
    title: "Approved",
  },
  {
    id: "REJECTED",
    title: "Rejected",
  },
  {
    id: "WINNER",
    title: "Winner",
  },
];
