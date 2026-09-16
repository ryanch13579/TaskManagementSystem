import { useParams } from "react-router-dom";
import { User, ChevronRight } from "lucide-react";
import { getApplicationById } from "../../data/applications";
import { plans, tasks } from "../../data/workspace";
import { styles, stateDot } from "./TaskBoard.styles";

const STATE_ORDER = ["To Do", "Doing", "Open", "Done", "Closed"];

function TaskBoard() {
  const { appId } = useParams();
  const app = getApplicationById(appId);

  return (
    <>
      {app && (
        <p className="text-sm text-slate-400 mb-4">
          {app.name} <ChevronRight className="inline h-3 w-3" /> Task Board
        </p>
      )}

      <div className={styles.board}>
        {STATE_ORDER.map((state) => {
          const stateTasks = tasks.filter((task) => task.state === state);
          return (
            <div key={state} className={styles.column}>
              <div className={styles.columnHeader}>
                <div className={styles.columnHeaderLeft}>
                  <span className={stateDot(state)} />
                  <p className={styles.columnTitle}>{state}</p>
                </div>
                <span className={styles.columnCount}>{stateTasks.length}</span>
              </div>

              <div className={styles.columnBody}>
                {stateTasks.length === 0 && (
                  <p className={styles.emptyState}>No tasks</p>
                )}
                {stateTasks.map((task) => (
                  <div key={task.id} className={styles.card}>
                    <p className={styles.cardName}>{task.name}</p>
                    <div className={styles.cardMetaRow}>
                      <User className="h-3.5 w-3.5" />
                      {task.owner}
                    </div>
                    {task.planId !== null && (
                      <span className={styles.planTag}>
                        {plans.find((p) => p.id === task.planId)?.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default TaskBoard;
