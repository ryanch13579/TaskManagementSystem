import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { api } from "../../api/client";
import { formatDisplayDate, formatDisplayTime } from "../../utils/format";
import { styles, stateDot, stateTextColor } from "./TaskHistoryModal.styles";

// Shows every state change a task has gone through, latest first - opened by
// clicking anywhere on a Task Board card that isn't one of its buttons.
function TaskHistoryModal({ task, token, onClose }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/tasks/${task.id}/history`, token);
        setHistory(data);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [task.id, token]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>TASK HISTORY</p>
            <h2 className={styles.title}>{task.name}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {history && (
          <div className={styles.list}>
            {history.length === 0 ? (
              <p className={styles.empty}>No history yet.</p>
            ) : (
              <div className={styles.timeline}>
                <div className={styles.line} />
                {history.map((entry, i) => (
                  <div key={i} className={styles.row}>
                    <span className={stateDot(entry.state)} />
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskHistoryModal;
