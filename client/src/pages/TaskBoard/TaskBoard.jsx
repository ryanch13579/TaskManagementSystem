import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Filter,
  ChevronDown,
  MoreVertical,
  CalendarDays,
  Send,
  Play,
  Eye,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { useLiveUpdates } from "../../hooks/useLiveUpdates";
import { formatDisplayDate, getInitials } from "../../utils/format";
import { styles, stateRing, stateLabel, stateCountBadge } from "./TaskBoard.styles";
import AddTaskModal from "../PlansAndTasks/AddTaskModal";
import TaskHistoryModal from "./TaskHistoryModal";
import TaskIcon from "../../assets/TaskIcon";

const STATE_ORDER = ["Open", "To Do", "Doing", "Done", "Closed"];
// Positive actions (forward) advance the task to the next state, negative
// ones send it back to the previous state.
const TRANSITIONS = {
  Open: [{ label: "Release Task", to: "To Do", forward: true, Icon: Send }],
  "To Do": [{ label: "Start Task", to: "Doing", forward: true, Icon: Play }],
  Doing: [
    { label: "Request Review", to: "Done", forward: true, Icon: Eye },
    { label: "Reject Task", to: "To Do", forward: false, Icon: X },
  ],
  Done: [
    { label: "Approve", to: "Closed", forward: true, Icon: Check },
    { label: "Reject", to: "Doing", forward: false, Icon: X },
  ],
};
const ALL_PLANS = "all";
const NO_PLAN = "none";

function TaskBoard() {
  const { appId } = useParams();
  const { token } = useAuth();
  const [app, setApp] = useState(null);
  const [plans, setPlans] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [ownerNames, setOwnerNames] = useState({});
  const [planFilter, setPlanFilter] = useState(ALL_PLANS);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [historyTask, setHistoryTask] = useState(null);
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    const data = await api.get(`/plans?appId=${appId}`, token);
    setPlans(data);
    return data;
  };

  const fetchTasks = async () => {
    const data = await api.get(`/tasks?appId=${appId}`, token);
    setTaskList(data);
    return data;
  };

  useEffect(() => {
    if (!appId || !token) return;
    (async () => {
      try {
        const [appData] = await Promise.all([
          api.get(`/applications/${appId}`, token),
          fetchPlans(),
          fetchTasks(),
        ]);
        setApp(appData);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, token]);

  // Live updates: any plan or task create/edit/state-change/delete on this
  // application - by this tab or anyone else's - pings this stream, and the
  // board just re-fetches both. Kept as a plain "something changed" signal
  // rather than pushing the changed row itself so there's only one place
  // (fetchPlans/fetchTasks) that turns API rows into board state.
  useLiveUpdates(appId ? `/workspace/events?appId=${appId}` : null, token, () => {
    Promise.all([fetchPlans(), fetchTasks()]).catch((err) =>
      setError(err.message),
    );
  });

  // Same lazy owner-name resolution as Plans & Tasks - task cards only carry
  // ownerId (a users.user_id FK).
  useEffect(() => {
    const missing = [
      ...new Set(
        taskList
          .map((t) => t.ownerId)
          .filter((id) => id != null && !(id in ownerNames)),
      ),
    ];
    if (missing.length === 0) return;

    (async () => {
      const entries = await Promise.all(
        missing.map(async (id) => {
          try {
            const owner = await api.get(`/users/${id}`, token);
            return [id, owner.username];
          } catch {
            return [id, `User #${id}`];
          }
        }),
      );
      setOwnerNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskList]);

  const handleEditTask = async ({ name, description, planId, dueDate, notes }) => {
    await api.put(
      `/tasks/${editingTask.id}`,
      {
        name,
        description,
        planId,
        dueDate,
        notes,
        state: editingTask.state,
        ownerId: editingTask.ownerId,
        updated_at: editingTask.updatedAt,
      },
      token,
    );
    await fetchTasks();
    setEditingTask(null);
  };

  const handleMoveTask = async (task, state) => {
    try {
      await api.put(
        `/tasks/${task.id}`,
        {
          name: task.name,
          description: task.description,
          planId: task.planId,
          dueDate: task.dueDate,
          notes: task.notes,
          state,
          ownerId: task.ownerId,
          updated_at: task.updatedAt,
        },
        token,
      );
      await fetchTasks();
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredTasks =
    planFilter === ALL_PLANS
      ? taskList
      : planFilter === NO_PLAN
        ? taskList.filter((task) => task.planId === null)
        : taskList.filter((task) => task.planId === Number(planFilter));

  return (
    <div className={styles.pageWrap}>
      {app && (
        <div className={styles.pageHeaderRow}>
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowAcronym}>{app.acronym}</span>
              <span className={styles.eyebrowName}> - {app.name}</span>
            </p>
            <div className={styles.titleRow}>
              <TaskIcon className="h-5 w-5 text-blue-600" />
              <h1 className={styles.title}>Task Board</h1>
            </div>
          </div>

          <div className={styles.filterWrap}>
            <Filter className={styles.filterIcon} />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value={ALL_PLANS}>All Plans</option>
              <option value={NO_PLAN}>No Plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <ChevronDown className={styles.filterChevron} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mb-4 shrink-0">{error}</p>}

      <div className={styles.board}>
        {STATE_ORDER.map((state) => {
          const stateTasks = filteredTasks.filter((task) => task.state === state);
          return (
            <div key={state} className={styles.column}>
              <div className={styles.columnHeader}>
                <div className={styles.columnHeaderLeft}>
                  <span className={stateRing(state)} />
                  <p className={stateLabel(state)}>{state.toUpperCase()}</p>
                </div>
                <span className={stateCountBadge(state)}>{stateTasks.length}</span>
              </div>

              <div className={styles.columnBody}>
                {stateTasks.length === 0 && (
                  <p className={styles.emptyState}>No tasks</p>
                )}
                {stateTasks.map((task) => {
                  const plan = plans.find((p) => p.id === task.planId);
                  const ownerName =
                    task.ownerId != null ? ownerNames[task.ownerId] : null;
                  return (
                    // The whole card opens the task's history on click - every
                    // interactive element nested inside it (menu button, menu
                    // items, state-change buttons) stops the click from
                    // bubbling up here, so clicking them does its own thing
                    // instead of also opening the history modal.
                    <div
                      key={task.id}
                      className={`${styles.card} cursor-pointer`}
                      onClick={() => setHistoryTask(task)}
                    >
                      <div className={styles.cardTop}>
                        <p className={styles.cardName}>{task.name}</p>
                        <button
                          className={styles.menuBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === task.id ? null : task.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuId === task.id && (
                          <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                            <button
                              className={styles.menuItem}
                              onClick={() => {
                                setEditingTask(task);
                                setOpenMenuId(null);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={styles.tagsRow}>
                        {ownerName ? (
                          <span className={styles.avatar}>{getInitials(ownerName)}</span>
                        ) : (
                          <span />
                        )}
                        <span
                          className={`${styles.planTag} ${
                            plan ? styles.planTagActive : styles.planTagNone
                          }`}
                        >
                          {plan ? plan.name : "—"}
                        </span>
                      </div>

                      {task.description && (
                        <p className={styles.description}>{task.description}</p>
                      )}

                      {task.dueDate && (
                        <div className={styles.dueDateRow}>
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDisplayDate(task.dueDate)}
                        </div>
                      )}

                      {TRANSITIONS[task.state] && (
                        <div className={styles.actionsRow}>
                          {TRANSITIONS[task.state].map((action) => (
                            <button
                              key={action.label}
                              className={
                                action.forward
                                  ? styles.forwardBtn
                                  : styles.backwardBtn
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveTask(task, action.to);
                              }}
                            >
                              <action.Icon className="h-3 w-3 shrink-0" />
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {editingTask && (
        <AddTaskModal
          task={editingTask}
          plans={plans}
          onClose={() => setEditingTask(null)}
          onSave={handleEditTask}
        />
      )}

      {historyTask && (
        <TaskHistoryModal
          task={historyTask}
          token={token}
          onClose={() => setHistoryTask(null)}
        />
      )}
    </div>
  );
}

export default TaskBoard;
