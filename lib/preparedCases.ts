import type { Extraction } from "./extraction";
import { SAMPLE_CONTRACT, SAMPLE_OFFER } from "./sampleExtractions";

export type PreparedCase = {
  id: string;
  name: string;
  description: string;
  offer: Extraction;
  contract: Extraction;
  offerImage: string;
  contractImage: string;
};

// Illustrative documents only. Quotes are the exact lines printed on these images.
export const PREPARED_CASES: readonly PreparedCase[] = [
  {
    id: "salary-role", name: "Salary and job title changed", description: "Two differences: job title and monthly salary.",
    offer: SAMPLE_OFFER, contract: SAMPLE_CONTRACT,
    offerImage: "/examples/salary-role-offer.png", contractImage: "/examples/salary-role-contract.png",
  },
  {
    id: "matching", name: "Terms match", description: "All listed terms match; unstated terms remain Not found.",
    offer: SAMPLE_OFFER,
    contract: { ...SAMPLE_OFFER, document_type: "contract", source_quotes: { ...SAMPLE_OFFER.source_quotes } },
    offerImage: "/examples/matching-offer.png", contractImage: "/examples/matching-contract.png",
  },
  {
    id: "hours-leave", name: "Hours and leave changed", description: "Two differences: weekly hours and annual leave.",
    offer: SAMPLE_OFFER,
    contract: {
      ...SAMPLE_OFFER, document_type: "contract", weekly_hours: 60, annual_leave_days: 20,
      source_quotes: { ...SAMPLE_OFFER.source_quotes, weekly_hours: "Weekly hours: 60", annual_leave_days: "Annual leave: 20 days" },
    },
    offerImage: "/examples/hours-leave-offer.png", contractImage: "/examples/hours-leave-contract.png",
  },
];
