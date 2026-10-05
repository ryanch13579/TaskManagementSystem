import { useEffect, useState } from "react";
import { applicationsApi, plansApi, tasksApi, eventStreams } from "../api";
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
      applicationsApi.get(appId, token),
      plansApi.list(appId, token),
      tasksApi.list(appId, token),
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

  useEventStream(eventStreams.workspace(appId), { changed: reload });

  // Saves a task. Anything in `changes` replaces the task's current value,
  // e.g. saveTask(task, { state: "Done" }) to move it on the board.
  const saveTask = async (task, changes) => {
    await tasksApi.update(
      task.id,
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
    await tasksApi.addNote(task.id, text, token);
    await reload();
  };

  return { app, plans, tasks, error, setError, reload, saveTask, addNote };
}
