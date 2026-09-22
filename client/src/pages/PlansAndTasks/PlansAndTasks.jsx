import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { List, Pencil, Plus, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { useLiveUpdates } from "../../hooks/useLiveUpdates";
import { formatDisplayDate } from "../../utils/format";
import { styles, taskStateBadge } from "./PlansAndTasks.styles";
import AddPlanModal from "./AddPlanModal";
import AddTaskModal from "./AddTaskModal";
import TaskIcon from "../../assets/TaskIcon";

const NO_PLAN = "no-plan";

function PlansAndTasks() {
  const { appId } = useParams();
  const { token } = useAuth();
  const [app, setApp] = useState(null);
  const [planList, setPlanList] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [ownerNames, setOwnerNames] = useState({});
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    const data = await api.get(`/plans?appId=${appId}`, token);
    setPlanList(data);
    return data;
  };

  const fetchTasks = async () => {
    const data = await api.get(`/tasks?appId=${appId}`, token);
    setTaskList(data);
    return data;
  };

  // Initial load for this application: also picks the first plan as the
  // default selection, same as the old mock-data behavior. Later
  // add/edit actions call fetchPlans/fetchTasks directly instead, so they
  // don't reset whatever the user currently has selected.
  useEffect(() => {
    if (!appId || !token) return;
    (async () => {
      try {
        const [appData, plansData] = await Promise.all([
          api.get(`/applications/${appId}`, token),
          fetchPlans(),
          fetchTasks(),
        ]);
        setApp(appData);
        setSelectedPlanId(plansData[0]?.id ?? null);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, token]);

  // Live updates: any plan or task create/edit/state-change/delete on this
  // application - by this tab, the Task Board, or anyone else's - pings this
  // stream, and this page just re-fetches both lists. Doesn't touch
  // selectedPlanId, same as the add/edit handlers below, so a live update
  // never yanks the user back to a different plan than the one they're
  // looking at.
  useLiveUpdates(appId ? `/workspace/events?appId=${appId}` : null, token, () => {
    Promise.all([fetchPlans(), fetchTasks()]).catch((err) =>
      setError(err.message),
    );
  });

  // Task cards only carry ownerId (a users.user_id FK) - resolve any ids
  // that show up to a display name as they're seen, and cache them.
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

  const handleAddPlan = async ({ name, startDate, endDate }) => {
    const { id } = await api.post(
      "/plans",
      { name, appId, startDate, endDate },
      token,
    );
    await fetchPlans();
    setSelectedPlanId(id);
    setShowAddPlan(false);
  };

  const handleEditPlan = async ({ name, startDate, endDate }) => {
    await api.put(
      `/plans/${editingPlan.id}`,
      { name, startDate, endDate, updated_at: editingPlan.updatedAt },
      token,
    );
    await fetchPlans();
    setEditingPlan(null);
  };

  const handleAddTask = async ({ name, description, planId, dueDate, notes }) => {
    await api.post(
      "/tasks",
      { name, description, planId, appId, dueDate, notes },
      token,
    );
    await fetchTasks();
    setShowAddTask(false);
  };

  const handleEditTask = async ({ name, description, planId, dueDate, notes }) => {
    // state/ownerId aren't editable from this modal - pass the task's
    // current values through unchanged so the update doesn't reset them.
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

  const visibleTasks =
    selectedPlanId === null
      ? taskList
      : selectedPlanId === NO_PLAN
        ? taskList.filter((task) => task.planId === null)
        : taskList.filter((task) => task.planId === selectedPlanId);

  return (
    <>
      {app && (
        <div className={styles.pageHeader}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowAcronym}>{app.acronym}</span>
            <span className={styles.eyebrowName}> - {app.name}</span>
          </p>
          <div className={styles.titleRow}>
            <List className="h-5 w-5 text-blue-600" />
            <h1 className={styles.title}>Plans & Tasks</h1>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className={styles.columns}>
        <section className={styles.columnPlans}>
          <div className={styles.columnHeader}>
            <div className={styles.columnHeaderLeft}>
              <List className="h-4 w-4 text-slate-900" />
              <h2 className={styles.columnTitle}>Plans</h2>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => setShowAddPlan(true)}
            >
              <Plus className="h-4 w-4" />
              Add Plan
            </button>
          </div>

          <div className={styles.columnBody}>
            {planList.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`${styles.card} ${
                  selectedPlanId === plan.id ? styles.cardSelected : styles.cardDefault
                }`}
              >
                {selectedPlanId === plan.id && (
                  <span className={styles.cardAccent} />
                )}
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.cardIcon}>
                      <List className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className={styles.cardName}>{plan.name}</p>
                  </div>
                  <button
                    className={styles.editBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPlan(plan);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
                <div className={styles.cardMeta}>
                  <div>
                    <p className={styles.metaLabel}>Start Date</p>
                    <p className={styles.metaValue}>
                      {formatDisplayDate(plan.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className={styles.metaLabel}>End Date</p>
                    <p className={styles.metaValue}>
                      {formatDisplayDate(plan.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className={styles.metaLabel}>Total Tasks</p>
                    <p className={styles.metaValue}>
                      {taskList.filter((task) => task.planId === plan.id).length}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div
              onClick={() => setSelectedPlanId(NO_PLAN)}
              className={`${styles.noPlanCard} ${
                selectedPlanId === NO_PLAN ? styles.noPlanCardSelected : ""
              }`}
            >
              {selectedPlanId === NO_PLAN && (
                <span className={styles.cardAccent} />
              )}
              <div className={styles.noPlanLeft}>
                <div className={styles.noPlanIcon}>
                  <List className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className={styles.noPlanTitle}>Tasks Without a Plan</p>
                  <p className={styles.noPlanSubtitle}>
                    View tasks that are not assigned to any plan
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </div>
        </section>

        <section className={styles.column}>
          <div className={styles.columnHeader}>
            <div className={styles.columnHeaderLeft}>
              <TaskIcon className="h-4 w-4 text-slate-900" />
              <h2 className={styles.columnTitle}>Tasks</h2>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => setShowAddTask(true)}
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          </div>

          <div className={styles.columnBody}>
            {visibleTasks.length === 0 && (
              <p className={styles.emptyState}>No tasks to show.</p>
            )}
            {visibleTasks.map((task) => (
              <div key={task.id} className={`${styles.card} ${styles.cardDefault} cursor-default`}>
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.cardIcon}>
                      <TaskIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className={styles.cardName}>{task.name}</p>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => setEditingTask(task)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <div>
                    <p className={styles.metaLabel}>Task Owner</p>
                    <p className={styles.metaValue}>
                      {task.ownerId == null
                        ? "Unassigned"
                        : (ownerNames[task.ownerId] ?? "…")}
                    </p>
                  </div>
                  <div>
                    <p className={styles.metaLabel}>Task State</p>
                    <span className={taskStateBadge(task.state)}>{task.state}</span>
                  </div>
                  <div>
                    <p className={styles.metaLabel}>Plan Name</p>
                    <p className={styles.metaValue}>
                      {planList.find((p) => p.id === task.planId)?.name ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <TaskIcon className="h-3.5 w-3.5" />
            {visibleTasks.length} task{visibleTasks.length === 1 ? "" : "s"}
          </div>
        </section>
      </div>

      {showAddPlan && (
        <AddPlanModal
          onClose={() => setShowAddPlan(false)}
          onSave={handleAddPlan}
        />
      )}

      {editingPlan && (
        <AddPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={handleEditPlan}
        />
      )}

      {showAddTask && (
        <AddTaskModal
          plans={planList}
          onClose={() => setShowAddTask(false)}
          onSave={handleAddTask}
        />
      )}

      {editingTask && (
        <AddTaskModal
          task={editingTask}
          plans={planList}
          onClose={() => setEditingTask(null)}
          onSave={handleEditTask}
        />
      )}
    </>
  );
}

export default PlansAndTasks;
