// The production content must be supplied verbatim by the project owner.
// Types only: no legal or routing wording is invented here.
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
