import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  FileText,
  ClipboardCheck,
  Pencil,
  Plus,
  Info,
  FileX,
  ChevronRight,
} from "lucide-react";
import { getApplicationById } from "../../data/applications";
import { plans, tasks, tasksForPlan } from "../../data/workspace";
import { formatDisplayDate } from "../../utils/format";
import { styles, taskStateBadge } from "./PlansAndTasks.styles";
import AddPlanModal from "./AddPlanModal";

const NO_PLAN = "no-plan";

function PlansAndTasks() {
  const { appId } = useParams();
  const app = getApplicationById(appId);
  const [planList, setPlanList] = useState(plans);
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? null);
  const [showAddPlan, setShowAddPlan] = useState(false);

  const selectedPlan =
    selectedPlanId === NO_PLAN
      ? null
      : planList.find((plan) => plan.id === selectedPlanId);

  const handleAddPlan = ({ name, startDate, endDate }) => {
    const newPlan = {
      id: Math.max(0, ...planList.map((p) => p.id)) + 1,
      name,
      start: formatDisplayDate(startDate),
      end: formatDisplayDate(endDate),
      taskCount: 0,
    };
    setPlanList((prev) => [...prev, newPlan]);
    setSelectedPlanId(newPlan.id);
    setShowAddPlan(false);
  };

  const visibleTasks =
    selectedPlanId === null
      ? tasks
      : selectedPlanId === NO_PLAN
        ? tasksForPlan(null)
        : tasksForPlan(selectedPlanId);

  return (
    <>
      {app && (
        <p className="text-sm text-slate-400 mb-4">
          {app.name} <ChevronRight className="inline h-3 w-3" /> Plans & Tasks
        </p>
      )}

      <div className={styles.columns}>
        <section className={styles.columnPlans}>
          <div className={styles.columnHeader}>
            <div className={styles.columnHeaderLeft}>
              <FileText className="h-4 w-4 text-slate-900" />
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
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.cardIcon}>
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className={styles.cardName}>{plan.name}</p>
                  </div>
                  <button className={styles.editBtn}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
                <div className={styles.cardMeta}>
                  <div>
                    <p className={styles.metaLabel}>Start Date</p>
                    <p className={styles.metaValue}>{plan.start}</p>
                  </div>
                  <div>
                    <p className={styles.metaLabel}>End Date</p>
                    <p className={styles.metaValue}>{plan.end}</p>
                  </div>
                  <div>
                    <p className={styles.metaLabel}>Total Tasks</p>
                    <p className={styles.metaValue}>{plan.taskCount}</p>
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
              <div className={styles.noPlanLeft}>
                <div className={styles.noPlanIcon}>
                  <FileX className="h-4 w-4 text-slate-400" />
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
              <ClipboardCheck className="h-4 w-4 text-slate-900" />
              <h2 className={styles.columnTitle}>Tasks</h2>
            </div>
            <button className={styles.addBtn}>
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          </div>

          {selectedPlanId !== null && (
            <div className={styles.filterBanner}>
              <div className={styles.filterBannerLeft}>
                <Info className="h-4 w-4" />
                Showing tasks for:{" "}
                <strong>
                  {selectedPlanId === NO_PLAN ? "No Plan" : selectedPlan?.name}
                </strong>
              </div>
              <button
                className={styles.clearFilter}
                onClick={() => setSelectedPlanId(null)}
              >
                Clear filter
              </button>
            </div>
          )}

          <div className={styles.columnBody}>
            {visibleTasks.length === 0 && (
              <p className={styles.emptyState}>No tasks to show.</p>
            )}
            {visibleTasks.map((task) => (
              <div key={task.id} className={`${styles.card} ${styles.cardDefault} cursor-default`}>
                <div className={styles.cardTop}>
                  <div className={styles.cardTopLeft}>
                    <div className={styles.cardIcon}>
                      <ClipboardCheck className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className={styles.cardName}>{task.name}</p>
                  </div>
                  <button className={styles.editBtn}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
                <div className={styles.cardMeta}>
                  <div>
                    <p className={styles.metaLabel}>Task Owner</p>
                    <p className={styles.metaValue}>{task.owner}</p>
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
            <FileText className="h-3.5 w-3.5" />
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
    </>
  );
}

export default PlansAndTasks;
