import { useState } from "react";
import { useParams } from "react-router-dom";
import { Filter, ChevronDown, MoreVertical, Send, Play, Eye, Check, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../hooks/useWorkspace";
import { getInitials } from "../../utils/format";
import { onlyFor } from "../../utils/roles";
import TaskIcon from "../../assets/TaskIcon";
import TaskFormModal from "../../components/TaskFormModal/TaskFormModal";
import TaskHistoryModal from "./TaskHistoryModal";
import TransitionModal from "./TransitionModal";
import { styles, stateRing, stateLabel, stateCountBadge } from "./TaskBoard.styles";

const COLUMNS = ["Open", "To Do", "Doing", "Done", "Closed"];

// The buttons shown on a card in each column. Pressing one opens a popup
// for an optional note, saved with the move. Keep in sync with TRANSITIONS
// in server/controllers/taskController.js, which enforces the same rules.
const ACTIONS = {
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

// Who may press a column's buttons is set per application: the group in
// this permit (see PERMITS in utils/roles.js).
const PERMIT_FOR_STATE = {
  Open: "permitOpen",
  "To Do": "permitToDoList",
  Doing: "permitDoing",
  Done: "permitDone",
};

// The actions shown on a task's card. "Release Task" is hidden on a task
// with no plan - a task can be created without a plan but not released
// without one.
const actionsFor = (task) =>
  (ACTIONS[task.state] ?? []).filter(
    (action) => !(task.state === "Open" && action.to === "To Do" && !task.plan)
  );

const ALL_PLANS = "all";
const NO_PLAN = "none";

function TaskBoard() {
  const { appId } = useParams();
  const { user } = useAuth();
  const { app, plans, tasks, error, saveTask, addNote } = useWorkspace(appId);
  const [planFilter, setPlanFilter] = useState(ALL_PLANS);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  // Stored as an id (not the task) so the modal shows fresh data after a reload.
  const [historyTaskId, setHistoryTaskId] = useState(null);
  // { task, action } while the move popup is open.
  const [moving, setMoving] = useState(null);

  const handleMoveConfirm = async (notes) => {
    await saveTask(moving.task, { state: moving.action.to, notes });
    setMoving(null);
  };

  const handleEditSave = async (values) => {
    await saveTask(editingTask, values);
    setEditingTask(null);
  };

  const filteredTasks =
    planFilter === ALL_PLANS ? tasks
    : planFilter === NO_PLAN ? tasks.filter((task) => task.plan === null)
    : tasks.filter((task) => task.plan === planFilter);

  const historyTask = tasks.find((task) => task.id === historyTaskId);

  return (
    <div className={styles.pageWrap}>
      {app && (
        <div className={styles.pageHeaderRow}>
          <div>
            <p className={styles.eyebrow}>{app.acronym}</p>
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

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.board}>
        {COLUMNS.map((state) => {
          const columnTasks = filteredTasks.filter((task) => task.state === state);
          return (
            <div key={state} className={styles.column}>
              <div className={styles.columnHeader}>
                <div className={styles.columnHeaderLeft}>
                  <span className={stateRing(state)} />
                  <p className={stateLabel(state)}>{state.toUpperCase()}</p>
                </div>
                <span className={stateCountBadge(state)}>{columnTasks.length}</span>
              </div>

              <div className={styles.columnBody}>
                {columnTasks.length === 0 && <p className={styles.emptyState}>No tasks</p>}
                {columnTasks.map((task) => (
                  // Clicking a card opens its history. Buttons inside call
                  // stopPropagation so they don't open it too.
                  <div key={task.id} className={styles.card} onClick={() => setHistoryTaskId(task.id)}>
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
                            className={styles.menuItem}
                            {...onlyFor(user, app?.permitCreate)}
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
                      {task.ownerName ? (
                        <span className={styles.avatar} title={task.ownerName}>
                          {getInitials(task.ownerName)}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className={`${styles.planTag} ${task.plan ? styles.planTagActive : styles.planTagNone}`}>
                        {task.plan ?? "—"}
                      </span>
                    </div>

                    {task.description && <p className={styles.description}>{task.description}</p>}

                    {actionsFor(task).length > 0 && (
                      <div className={styles.actionsRow}>
                        {actionsFor(task).map((action) => (
                          <button
                            key={action.label}
                            className={`${action.forward ? styles.forwardBtn : styles.backwardBtn} ${
                              actionsFor(task).length > 1 ? styles.sharedBtn : styles.soloBtn
                            }`}
                            title={action.label}
                            {...onlyFor(user, app?.[PERMIT_FOR_STATE[task.state]])}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMoving({ task, action });
                            }}
                          >
                            <action.Icon className="h-2.5 w-2.5 shrink-0" />
                            <span className={styles.actionLabel}>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editingTask && (
        <TaskFormModal
          task={editingTask}
          plans={plans}
          onClose={() => setEditingTask(null)}
          onSave={handleEditSave}
        />
      )}

      {moving && (
        <TransitionModal
          action={moving.action}
          onClose={() => setMoving(null)}
          onConfirm={handleMoveConfirm}
        />
      )}

      {historyTask && (
        <TaskHistoryModal
          task={historyTask}
          onClose={() => setHistoryTaskId(null)}
          onAddNote={(text) => addNote(historyTask, text)}
        />
      )}
    </div>
  );
}

export default TaskBoard;
