import { useState } from "react";
import { useParams } from "react-router-dom";
import { Pencil, Plus, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../hooks/useWorkspace";
import { api } from "../../api/client";
import { formatDisplayDate } from "../../utils/format";
import { onlyFor } from "../../utils/roles";
import { stateBadge } from "../../styles/shared";
import PlanIcon from "../../assets/PlanIcon";
import TaskIcon from "../../assets/TaskIcon";
import TaskFormModal from "../../components/TaskFormModal/TaskFormModal";
import PlanFormModal from "./PlanFormModal";
import { styles } from "./PlansAndTasks.styles";

// Value of selectedPlan when "Tasks Without a Plan" is picked.
const NO_PLAN = Symbol("no plan");

// Left: the application's plans. Right: the tasks in the selected plan.
function PlansAndTasks() {
  const { appId } = useParams();
  const { user, token } = useAuth();
  const { app, plans, tasks, error, reload, saveTask } = useWorkspace(appId);

  // Until the user picks one, the first plan is selected.
  const [pickedPlan, setPickedPlan] = useState(null);
  const selectedPlan = pickedPlan ?? plans[0]?.name ?? null;

  // For both: null = closed, "new" = adding, an object = editing it
  const [planModal, setPlanModal] = useState(null);
  const [taskModal, setTaskModal] = useState(null);

  const handleSavePlan = async (values) => {
    if (planModal === "new") {
      await api.post("/plans", { ...values, appId }, token);
      setPickedPlan(values.name);
    } else {
      await api.put(
        `/plans/${encodeURIComponent(appId)}/${encodeURIComponent(planModal.name)}`,
        { ...values, updated_at: planModal.updatedAt },
        token,
      );
    }
    await reload();
    setPlanModal(null);
  };

  const handleSaveTask = async (values) => {
    if (taskModal === "new") {
      await api.post("/tasks", { ...values, appId }, token);
      await reload();
    } else {
      await saveTask(taskModal, values);
    }
    setTaskModal(null);
  };

  const visibleTasks =
    selectedPlan === null ? tasks
    : selectedPlan === NO_PLAN ? tasks.filter((task) => task.plan === null)
    : tasks.filter((task) => task.plan === selectedPlan);

  const managerOnly = onlyFor(user, "Project Manager");
  const leadOnly = onlyFor(user, "Project Lead");

  return (
    <>
      {app && (
        <div className={styles.pageHeader}>
          <p className={styles.eyebrow}>{app.acronym}</p>
          <div className={styles.titleRow}>
            <PlanIcon className="h-5 w-5 text-blue-600" />
            <h1 className={styles.title}>Plans & Tasks</h1>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.columns}>
        {/* ---------- Plans ---------- */}
        <section className={styles.columnPlans}>
          <div className={styles.columnHeader}>
            <div className={styles.columnHeaderLeft}>
              <PlanIcon className="h-4 w-4 text-slate-900" />
              <h2 className={styles.columnTitle}>Plans</h2>
            </div>
            <button className={styles.addBtn} {...managerOnly} onClick={() => setPlanModal("new")}>
              <Plus className="h-4 w-4" />
              Add Plan
            </button>
          </div>

          <div className={styles.columnBody}>
            {plans.map((plan) => {
              const selected = selectedPlan === plan.name;
              return (
                <div
                  key={plan.name}
                  onClick={() => setPickedPlan(plan.name)}
                  className={`${styles.card} ${selected ? styles.cardSelected : styles.cardDefault}`}
                >
                  {selected && <span className={styles.cardAccent} />}
                  <div className={styles.cardTop}>
                    <div className={styles.cardTopLeft}>
                      <div className={styles.cardIcon}>
                        <PlanIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className={styles.cardName}>{plan.name}</p>
                    </div>
                    <button
                      className={styles.editBtn}
                      {...managerOnly}
                      onClick={(e) => {
                        e.stopPropagation(); // don't also select the plan
                        setPlanModal(plan);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                  <div className={styles.cardMeta}>
                    <Meta label="Start Date" value={formatDisplayDate(plan.startDate)} />
                    <Meta label="End Date" value={formatDisplayDate(plan.endDate)} />
                    <Meta
                      label="Total Tasks"
                      value={tasks.filter((task) => task.plan === plan.name).length}
                    />
                  </div>
                </div>
              );
            })}

            <div
              onClick={() => setPickedPlan(NO_PLAN)}
              className={`${styles.noPlanCard} ${selectedPlan === NO_PLAN ? styles.cardSelected : ""}`}
            >
              {selectedPlan === NO_PLAN && <span className={styles.cardAccent} />}
              <div className={styles.cardTopLeft}>
                <div className={styles.cardIcon}>
                  <PlanIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className={styles.noPlanTitle}>Tasks Without a Plan</p>
                  <p className={styles.noPlanSubtitle}>View tasks that are not assigned to any plan</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </div>
        </section>

        {/* ---------- Tasks ---------- */}
        <section className={styles.column}>
          <div className={styles.columnHeader}>
            <div className={styles.columnHeaderLeft}>
              <TaskIcon className="h-4 w-4 text-slate-900" />
              <h2 className={styles.columnTitle}>Tasks</h2>
            </div>
            <button className={styles.addBtn} {...leadOnly} onClick={() => setTaskModal("new")}>
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          </div>

          <div className={styles.columnBody}>
            {visibleTasks.length === 0 && <p className={styles.emptyState}>No tasks to show.</p>}
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
                  <button className={styles.editBtn} {...leadOnly} onClick={() => setTaskModal(task)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
                <div className={styles.cardMeta}>
                  <Meta label="Task Owner" value={task.ownerName ?? "Unassigned"} />
                  <div>
                    <p className={styles.metaLabel}>Task State</p>
                    <span className={stateBadge(task.state)}>{task.state}</span>
                  </div>
                  <Meta label="Plan Name" value={task.plan ?? "—"} />
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

      {planModal && (
        <PlanFormModal
          plan={planModal === "new" ? null : planModal}
          app={app}
          onClose={() => setPlanModal(null)}
          onSave={handleSavePlan}
        />
      )}

      {taskModal && (
        <TaskFormModal
          task={taskModal === "new" ? null : taskModal}
          plans={plans}
          onClose={() => setTaskModal(null)}
          onSave={handleSaveTask}
        />
      )}
    </>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className={styles.metaLabel}>{label}</p>
      <p className={styles.metaValue}>{value}</p>
    </div>
  );
}

export default PlansAndTasks;
