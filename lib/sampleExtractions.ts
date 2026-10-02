import { getStrings } from "./strings";
import type { Extraction } from "./extraction";

const { sampleEmployer, sampleLocation } = getStrings("English");

const common = {
  employer_name: sampleEmployer,
  allowances_aed: null,
  work_location: sampleLocation,
  weekly_hours: 48,
  annual_leave_days: 30,
  contract_duration: null,
  passport_clause: null,
  source_quotes: {},
} as const;

export const SAMPLE_OFFER: Extraction = {
  ...common,
  document_type: "offer",
  job_title: "Electrician",
  monthly_salary_aed: 2000,
  source_quotes: {
    employer_name: `Employer name: ${sampleEmployer}`,
    job_title: "Job title: Electrician",
    monthly_salary_aed: "Monthly salary: AED 2000",
    weekly_hours: "Weekly hours: 48",
    annual_leave_days: "Annual leave: 30 days",
    work_location: `Work location: ${sampleLocation}`,
  },
};

export const SAMPLE_CONTRACT: Extraction = {
  ...common,
  document_type: "contract",
  job_title: "General Helper",
  monthly_salary_aed: 1200,
  source_quotes: {
    employer_name: `Employer name: ${sampleEmployer}`,
    job_title: "Job title: General Helper",
    monthly_salary_aed: "Monthly salary: AED 1200",
    weekly_hours: "Weekly hours: 48",
    annual_leave_days: "Annual leave: 30 days",
    work_location: `Work location: ${sampleLocation}`,
  },
};
