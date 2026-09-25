import { List } from "lucide-react";

// Shared "plan" icon, reused everywhere that concept shows up.
function PlanIcon({ className = "h-5 w-5" }) {
  return <List className={className} aria-hidden="true" />;
}

export default PlanIcon;
