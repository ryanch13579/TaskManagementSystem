import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useEventStream } from "./useEventStream";

// Everything the Plans & Tasks and Task Board pages need for one application.
// It all reloads automatically when anyone changes the plans, the tasks or
// the application itself (e.g. its permissions).
export function useWorkspace(appId) {
  const { token } = useAuth();
  const [app, setApp] = useState(null);
  const [plans, setPlans] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  const reload = () =>
    Promise.all([
      api.get(`/applications/${encodeURIComponent(appId)}`, token),
      api.get(`/plans?appId=${encodeURIComponent(appId)}`, token),
      api.get(`/tasks?appId=${encodeURIComponent(appId)}`, token),
    ])
      .then(([appData, planData, taskData]) => {
        setApp(appData);
        setPlans(planData);
        setTasks(taskData);
        setError("");
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    if (!token) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, token]);

  useEventStream(`/workspace/events?appId=${encodeURIComponent(appId)}`, { changed: reload });

  // Saves a task. Anything in `changes` replaces the task's current value,
  // e.g. saveTask(task, { state: "Done" }) to move it on the board.
  const saveTask = async (task, changes) => {
    await api.put(
      `/tasks/${encodeURIComponent(task.id)}`,
      {
        name: task.name,
        description: task.description,
        plan: task.plan,
        state: task.state,
        ownerId: task.ownerId,
        notes: "",
        updated_at: task.updatedAt,
        ...changes,
      },
      token,
    );
    await reload();
  };

  // Adds a note to a task's history at its current state.
  const addNote = async (task, text) => {
    await api.post(`/tasks/${encodeURIComponent(task.id)}/notes`, { text }, token);
    await reload();
  };

  return { app, plans, tasks, error, setError, reload, saveTask, addNote };
}
