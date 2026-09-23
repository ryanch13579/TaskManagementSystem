import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { List, Pencil, Plus, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { useLiveUpdates } from "../../hooks/useLiveUpdates";
import { formatDisplayDate } from "../../utils/format";
import { checkGroup } from "../../utils/roles";
import { PERMISSION_DISABLED } from "../../styles/shared";
import { styles, taskStateBadge } from "./PlansAndTasks.styles";
import AddPlanModal from "./AddPlanModal";
import AddTaskModal from "./AddTaskModal";
import TaskIcon from "../../assets/TaskIcon";

const NO_PLAN = "no-plan";

function PlansAndTasks() {
  const { appId } = useParams();
  const { user, token } = useAuth();
  const canManagePlans = checkGroup(user, "Project Manager");
  const canManageTasks = checkGroup(user, "Project Lead");
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
        setSelectedPlanId(plansData[0]?.name ?? null);
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

  const handleAddPlan = async ({ name, startDate, endDate }) => {
    await api.post("/plans", { name, appId, startDate, endDate }, token);
    await fetchPlans();
    setSelectedPlanId(name);
    setShowAddPlan(false);
  };

  const handleEditPlan = async ({ name, startDate, endDate }) => {
    await api.put(
      `/plans/${appId}/${encodeURIComponent(editingPlan.name)}`,
      { name, startDate, endDate, updated_at: editingPlan.updatedAt },
      token,
    );
    await fetchPlans();
    setEditingPlan(null);
  };

  const handleAddTask = async ({ name, description, plan, dueDate, notes }) => {
    await api.post(
      "/tasks",
      { name, description, plan, appId, dueDate, notes },
      token,
    );
    await fetchTasks();
    setShowAddTask(false);
  };

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

  const visibleTasks =
    selectedPlanId === null
      ? taskList
      : selectedPlanId === NO_PLAN
        ? taskList.filter((task) => task.plan === null)
        : taskList.filter((task) => task.plan === selectedPlanId);

  return (
    <>
      {app && (
        <div className={styles.pageHeader}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowAcronym}>{app.acronym}</span>
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
              className={`${styles.addBtn} ${!canManagePlans ? PERMISSION_DISABLED : ""}`}
              disabled={!canManagePlans}
              title={!canManagePlans ? "Requires Project Manager" : undefined}
              onClick={() => setShowAddPlan(true)}
            >
              <Plus className="h-4 w-4" />
              Add Plan
            </button>
          </div>

          <div className={styles.columnBody}>
            {planList.map((plan) => (
              <div
                key={plan.name}
                onClick={() => setSelectedPlanId(plan.name)}
                className={`${styles.card} ${
                  selectedPlanId === plan.name ? styles.cardSelected : styles.cardDefault
                }`}
              >
                {selectedPlanId === plan.name && (
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
                    className={`${styles.editBtn} ${!canManagePlans ? PERMISSION_DISABLED : ""}`}
                    disabled={!canManagePlans}
                    title={!canManagePlans ? "Requires Project Manager" : undefined}
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
                      {taskList.filter((task) => task.plan === plan.name).length}
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
              className={`${styles.addBtn} ${!canManageTasks ? PERMISSION_DISABLED : ""}`}
              disabled={!canManageTasks}
              title={!canManageTasks ? "Requires Project Lead" : undefined}
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
                    <span className={styles.cardId}>{task.id}</span>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={`${styles.editBtn} ${!canManageTasks ? PERMISSION_DISABLED : ""}`}
                      disabled={!canManageTasks}
                      title={!canManageTasks ? "Requires Project Lead" : undefined}
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
                    <p className={styles.metaValue}>{task.plan ?? "—"}</p>
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
