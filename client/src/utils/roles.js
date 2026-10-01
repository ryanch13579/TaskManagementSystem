// Client-side copy of the server's group checks. These only decide what the
// UI shows - the server enforces the real rules.
export const checkGroup = (user, groupName) => !!user?.roles?.includes(groupName);

// Every group a user can be put in.
export const ALL_GROUPS = ["admin", "Project Lead", "Project Manager", "Developer"];

// The per-application permissions. Each application names one group (or
// none) for each of these; `field` is the property on an application from
// the API. The server enforces them - see taskController.js.
// `defaultGroup` is what a new application starts with - keep in sync with
// the column defaults in database/setup.sql.
export const PERMITS = [
  { field: "permitCreate", label: "Create", hint: "Create and edit tasks", defaultGroup: "Project Lead" },
  { field: "permitOpen", label: "Open", hint: "Release tasks", defaultGroup: "Project Manager" },
  { field: "permitToDoList", label: "To Do", hint: "Start tasks", defaultGroup: "Developer" },
  { field: "permitDoing", label: "Doing", hint: "Request review or give back tasks", defaultGroup: "Developer" },
  { field: "permitDone", label: "Done", hint: "Approve or reject tasks", defaultGroup: "Project Lead" },
];

export const isAdmin = (user) => checkGroup(user, "admin");

export const hasNonAdminRole = (user) => !!user?.roles?.some((r) => r !== "admin");

// Spread onto a button only `groupName` members may use. Everyone else sees
// it greyed out (see LOCKABLE in styles/shared.js) with a tooltip saying why.
// A null groupName (an application permit with no group) locks it for everyone.
export const onlyFor = (user, groupName) =>
  checkGroup(user, groupName)
    ? {}
    : { disabled: true, title: groupName ? `Requires ${groupName}` : "No group is permitted" };
