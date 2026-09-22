import { LayoutGrid } from "lucide-react";

// The Task Board / "task" concept's icon - reused everywhere that concept
// shows up (sidebar nav, the Task Board page title, Plans & Tasks' task
// column/cards/footer, Applications' "Task Board" button). Grouped here with
// the other shared brand assets (BrandLogo, ApplicationBlue/Black) so every
// one of those spots imports the same glyph from one place instead of each
// importing lucide-react's LayoutGrid icon on its own. Just a thin wrapper,
// not a custom SVG like its neighbors here - LayoutGrid is a single-color
// stroke icon that already recolors per call site via `className`, so unlike
// Application's two-tone icon it doesn't need separate active/inactive files.
function TaskIcon({ className = "h-5 w-5" }) {
  return <LayoutGrid className={className} aria-hidden="true" />;
}

export default TaskIcon;
