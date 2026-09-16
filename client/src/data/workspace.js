// Mock Plans/Tasks data until the backend for this feature exists.
// Shared across applications for now - each app will get its own data
// once the API is wired up.
export const plans = [
  {
    id: 1,
    name: "Website Redesign",
    start: "12 May 2024",
    end: "30 May 2024",
    taskCount: 1,
  },
  {
    id: 2,
    name: "Mobile App Development",
    start: "01 Jun 2024",
    end: "30 Jun 2024",
    taskCount: 0,
  },
];

export const tasks = [
  { id: 1, name: "Design Homepage", owner: "John Doe", state: "Doing", planId: 1 },
  { id: 2, name: "Update Brand Guidelines", owner: "Alex Lee", state: "Open", planId: null },
];

export const planById = (id) => plans.find((plan) => plan.id === id);

export const tasksForPlan = (planId) =>
  planId === null
    ? tasks.filter((task) => task.planId === null)
    : tasks.filter((task) => task.planId === planId);
