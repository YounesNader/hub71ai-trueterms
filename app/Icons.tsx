import type { ComparisonField } from "../lib/extraction";
export type IconName = ComparisonField | "different" | "same" | "missing" | "back" | "document";
const paths: Record<IconName, string> = {
 employer_name: "M4 21V7l8-4 8 4v14M8 21v-4h8v4M8 9h1m6 0h1M8 13h1m6 0h1",
 job_title: "M9 7V4h6v3M3 7h18v13H3zM3 12c5 3 13 3 18 0M10 13h4",
 monthly_salary_aed: "M3 6h18v12H3zM3 10h2m14 4h2M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
 allowances_aed: "M4 8h16v12H4zM4 12h16M12 8v12M12 8C3 8 5 1 9 4l3 4c9 0 7-7 3-4z",
 work_location: "M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 1 1 14 0zM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
 weekly_hours: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 3",
 annual_leave_days: "M4 5h16v16H4zM8 3v4m8-4v4M4 10h16M8 14h2m4 0h2m-8 4h2",
 contract_duration: "M7 3h10M7 21h10M8 3v5l4 4-4 4v5m8-18v5l-4 4 4 4v5",
 passport_clause: "M5 3h14v18H5zM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 17h8M12 7v6M9 10h6",
 different: "M12 2 22 12 12 22 2 12zM12 7v6m0 3v1",
 same: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M7 12l3 3 7-7",
 missing: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v1",
 back: "M19 12H5m6-6-6 6 6 6",
 document: "M5 2h10l4 4v16H5zM15 2v5h4M8 11h8M8 15h8M8 19h5",
};
export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
 return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
