// Mock data until the Applications API exists server-side.
export const applications = [
  {
    id: 1,
    name: "Customer Support System",
    description: "A platform for recording customer enquiries and coordinating support responses.",
    acronym: "CSS",
    taskCount: 0,
    start: "Nov 01, 2026",
    end: "May 31, 2027",
  },
  {
    id: 2,
    name: "Inventory Management System",
    description: "An application for monitoring inventory levels, stock movement, and reordering.",
    acronym: "IMS",
    taskCount: 0,
    start: "Oct 01, 2026",
    end: "Mar 31, 2027",
  },
  {
    id: 3,
    name: "Task Management System",
    description: "A system for planning projects, assigning tasks, and tracking their progress.",
    acronym: "TMS",
    taskCount: 0,
    start: "Sep 01, 2026",
    end: "Dec 31, 2026",
  },
];

export const getApplicationById = (id) =>
  applications.find((app) => String(app.id) === String(id));

// Mutates the shared mock list in place so lookups elsewhere (the sidebar,
// Plans & Tasks, Task Board) see a newly created application immediately -
// there's no backend yet to be the single source of truth instead.
export const addApplication = (app) => {
  applications.push(app);
  return app;
};
