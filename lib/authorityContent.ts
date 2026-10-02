// Only existing project text is used for guidance. No jurisdiction rules are supplied.
export type AuthorityContent = {
  ruleCard: { text: string; source: string };
  routingQuestion: string;
  routingOptions: readonly { id: string; label: string; result: string }[];
  fallbackRoutingResult: string;
  whatToBring: readonly string[];
};

export function routingResult(content: AuthorityContent, selectedId: string | null): string {
  return content.routingOptions.find((option) => option.id === selectedId)?.result ?? content.fallbackRoutingResult;
}

export const PROJECT_FOOTER = "Information only, not legal advice. For help call MOHRE 80084.";

// The disclaimer is copied verbatim from AGENTS.md rule 8. These authority names
// already exist in the repo; the worker chooses one, and no jurisdiction is inferred.
export const AUTHORITY_CONTENT: AuthorityContent = {
  ruleCard: {
    text: PROJECT_FOOTER,
    source: "Source: TrueTerms project rules, AGENTS.md, rule 8. No legal source supplied.",
  },
  routingQuestion: "Which authority do you want on your summary?",
  routingOptions: [
    { id: "mohre", label: "MOHRE", result: "MOHRE" },
    { id: "adgm", label: "ADGM", result: "ADGM" },
    { id: "not-sure", label: "Other free zone or not sure", result: "Other free zone or not sure" },
  ],
  fallbackRoutingResult: "Other free zone or not sure",
  whatToBring: ["Job offer image", "Contract image"],
};
