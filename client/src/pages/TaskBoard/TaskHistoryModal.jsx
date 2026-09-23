import { X } from "lucide-react";
import { formatDisplayDate, formatDisplayTime } from "../../utils/format";
import { styles, stateDot, stateTextColor } from "./TaskHistoryModal.styles";

// task.notes is the task's history trail, latest first.
function TaskHistoryModal({ task, onClose }) {
  const history = [...(task.notes ?? [])].reverse();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>TASK HISTORY · {task.id}</p>
            <h2 className={styles.title}>{task.name}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={styles.list}>
          {history.length === 0 ? (
            <p className={styles.empty}>No history yet.</p>
          ) : (
            <div className={styles.timeline}>
              <div className={styles.line} />
              {history.map((entry, i) => (
                <div key={i} className={styles.row}>
                  <span className={stateDot(entry.state)} />
                  <div className={styles.rowBody}>
                    <div className={styles.rowMain}>
                      <div>
                        <p className={stateTextColor(entry.state)}>
                          {entry.state}
                        </p>
                        <p className={styles.username}>{entry.changedBy}</p>
                      </div>
                      <div className={styles.dateTime}>
                        <span className={styles.date}>
                          {formatDisplayDate(entry.changedAt)}
                        </span>
                        <span className={styles.time}>
                          {formatDisplayTime(entry.changedAt)}
                        </span>
                      </div>
                    </div>
                    {entry.text && <p className={styles.noteText}>{entry.text}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskHistoryModal;
