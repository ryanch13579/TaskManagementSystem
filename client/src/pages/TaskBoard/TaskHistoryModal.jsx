import { Fragment, useState } from "react";
import { X } from "lucide-react";
import { formatDisplayDate, formatDisplayTime } from "../../utils/format";
import { styles, stateDot, stateText } from "./TaskHistoryModal.styles";

// Timeline of everything that happened to a task (task.notes), newest first.
// A save that moved the task shows "From → To";
// Anything else (an edit or a note) shows just the state the task was in at the time.
// Clicking outside the box closes it.
function TaskHistoryModal({ task, onClose, onAddNote }) {
  // Entries saved before `from` was recorded get it from the entry before them,
  // so every state change shows as "From → To".
  const history = (task.notes ?? [])
    .map((entry, i, all) => {
      const prev = all[i - 1];
      const from =
        entry.from ?? (prev && prev.state !== entry.state ? prev.state : null);
      return { ...entry, from };
    })
    // Older plain edits saved an empty entry that repeats the state - skip
    // those, but always keep the first (creation) entry.
    .filter((entry, i) => i === 0 || entry.from || entry.text)
    .reverse();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddNote = async () => {
    setSaving(true);
    try {
      await onAddNote(note.trim());
      setNote("");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>TASK HISTORY</p>
            <h2 className={styles.title}>{task.name}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={styles.noteRow}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className={styles.noteInput}
          />
          <button
            onClick={handleAddNote}
            disabled={!note.trim() || saving}
            className={styles.addNoteBtn}
          >
            Add Note
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.list}>
          {history.length === 0 ? (
            <p className={styles.empty}>No history yet.</p>
          ) : (
            <div className={styles.timeline}>
              <div className={styles.line} />
              {/* Every row's cells sit in one shared grid so the columns line
                  up and the gaps between them are equal. */}
              {history.map((entry, i) => (
                <Fragment key={i}>
                  <div className={styles.stateCell}>
                    <span className={stateDot(entry.state)} />
                    <p className={stateText(entry.state)}>
                      {entry.from
                        ? `${entry.from} → ${entry.state}`
                        : entry.state}
                    </p>
                  </div>
                  <p className={styles.username}>{entry.changedBy}</p>
                  <p className={styles.date}>{formatDisplayDate(entry.changedAt)}</p>
                  <p className={styles.time}>{formatDisplayTime(entry.changedAt)}</p>
                  {entry.text && (
                    <p className={styles.noteText}>{entry.text}</p>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskHistoryModal;
