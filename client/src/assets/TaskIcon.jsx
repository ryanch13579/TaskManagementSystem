import { LayoutGrid } from "lucide-react";

// Shared "task" icon, reused everywhere that concept shows up.
function TaskIcon({ className = "h-5 w-5" }) {
  return <LayoutGrid className={className} aria-hidden="true" />;
}

export default TaskIcon;
