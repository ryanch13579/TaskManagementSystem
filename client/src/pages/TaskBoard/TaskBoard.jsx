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
import { checkGroup } from "../../utils/roles";
import { PERMISSION_DISABLED } from "../../styles/shared";
import { styles, stateRing, stateLabel, stateCountBadge } from "./TaskBoard.styles";
import AddTaskModal from "../PlansAndTasks/AddTaskModal";
import TaskHistoryModal from "./TaskHistoryModal";
import TaskIcon from "../../assets/TaskIcon";

const STATE_ORDER = ["Open", "To Do", "Doing", "Done", "Closed"];
// `group` mirrors TRANSITION_ROLES in server/controllers/taskController.js,
// which enforces the same thing server-side - keep them in sync.
const TRANSITIONS = {
  Open: [
    { label: "Release Task", to: "To Do", forward: true, Icon: Send, group: "Project Manager" },
  ],
  "To Do": [
    { label: "Start Task", to: "Doing", forward: true, Icon: Play, group: "Developer" },
  ],
  Doing: [
    { label: "Request Review", to: "Done", forward: true, Icon: Eye, group: "Developer" },
    { label: "Reject Task", to: "To Do", forward: false, Icon: X, group: "Developer" },
  ],
  Done: [
    { label: "Approve", to: "Closed", forward: true, Icon: Check, group: "Project Lead" },
    { label: "Reject", to: "Doing", forward: false, Icon: X, group: "Project Lead" },
  ],
};
const ALL_PLANS = "all";
const NO_PLAN = "none";

function TaskBoard() {
  const { appId } = useParams();
  const { user, token } = useAuth();
  const canManageTasks = checkGroup(user, "Project Lead");
  const [app, setApp] = useState(null);
  const [plans, setPlans] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [ownerNames, setOwnerNames] = useState({});
  const [planFilter, setPlanFilter] = useState(ALL_PLANS);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  // Tracked by id, not the task object, so it stays live if taskList
  // refreshes while the history modal is open.
  const [historyTaskId, setHistoryTaskId] = useState(null);
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

  useLiveUpdates(appId ? `/workspace/events?appId=${appId}` : null, token, () => {
    Promise.all([fetchPlans(), fetchTasks()]).catch((err) =>
      setError(err.message),
    );
  });

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

  const handleEditTask = async ({ name, description, plan, dueDate, notes }) => {
    await api.put(
      `/tasks/${editingTask.id}`,
      {
        name,
        description,
        plan,
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
          plan: task.plan,
          dueDate: task.dueDate,
          notes: "", // board actions don't collect a comment
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
        ? taskList.filter((task) => task.plan === null)
        : taskList.filter((task) => task.plan === planFilter);

  const historyTask = taskList.find((task) => task.id === historyTaskId);

  return (
    <div className={styles.pageWrap}>
      {app && (
        <div className={styles.pageHeaderRow}>
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowAcronym}>{app.acronym}</span>
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
                <option key={plan.name} value={plan.name}>
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
                  const ownerName =
                    task.ownerId != null ? ownerNames[task.ownerId] : null;
                  return (
                    // Clicking the card opens its history - nested buttons
                    // stopPropagation so they don't also trigger that.
                    <div
                      key={task.id}
                      className={`${styles.card} cursor-pointer`}
                      onClick={() => setHistoryTaskId(task.id)}
                    >
                      <div className={styles.cardTop}>
                        <div className={styles.cardTopLeft}>
                          <p className={styles.cardId}>{task.id}</p>
                          <p className={styles.cardName}>{task.name}</p>
                        </div>
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
                              className={`${styles.menuItem} ${!canManageTasks ? PERMISSION_DISABLED : ""}`}
                              disabled={!canManageTasks}
                              title={!canManageTasks ? "Requires Project Lead" : undefined}
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
                            task.plan ? styles.planTagActive : styles.planTagNone
                          }`}
                        >
                          {task.plan ?? "—"}
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
                          {TRANSITIONS[task.state].map((action) => {
                            const allowed = checkGroup(user, action.group);
                            return (
                              <button
                                key={action.label}
                                className={`${
                                  action.forward ? styles.forwardBtn : styles.backwardBtn
                                } ${!allowed ? PERMISSION_DISABLED : ""}`}
                                disabled={!allowed}
                                title={!allowed ? `Requires ${action.group}` : undefined}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveTask(task, action.to);
                                }}
                              >
                                <action.Icon className="h-3 w-3 shrink-0" />
                                {action.label}
                              </button>
                            );
                          })}
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
        <TaskHistoryModal task={historyTask} onClose={() => setHistoryTaskId(null)} />
      )}
    </div>
  );
}

export default TaskBoard;
