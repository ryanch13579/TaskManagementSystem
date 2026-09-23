import { useState } from "react";
import { X } from "lucide-react";
import { styles, stateBadge } from "./AddTaskModal.styles";
import DateInput from "../../components/DateInput/DateInput";
import { parseDisplayDate } from "../../utils/format";

function AddTaskModal({ onClose, onSave, plans, task }) {
  const isEdit = Boolean(task);
  const [name, setName] = useState(task?.name ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [plan, setPlan] = useState(task?.plan ?? "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? parseDisplayDate(task.dueDate) : "",
  );
  // Not seeded from task.notes - that's a history trail, not a single
  // editable value. This box is always a fresh comment for this save.
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a task name.");
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        plan: plan || null,
        dueDate,
        notes: notes.trim(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? "Edit Task" : "Add Task"}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isEdit && (
            <div>
              <label className={styles.label}>Task ID</label>
              <input
                type="text"
                value={task.id}
                readOnly
                disabled
                className={`${styles.input} ${styles.readOnlyInput}`}
              />
            </div>
          )}

          <div>
            <div className={styles.nameRow}>
              <label className={styles.nameLabel}>Task Name</label>
              {isEdit && (
                <span className={stateBadge(task.state)}>{task.state}</span>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              autoFocus
            />
          </div>

          <div>
            <label className={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
            />
          </div>

          <div>
            <label className={styles.label}>Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className={styles.input}
            >
              <option value="">No Plan</option>
              {plans.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <DateInput label="Due Date" value={dueDate} onChange={setDueDate} />

          <div>
            <label className={styles.label}>Additional Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.textarea}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              {isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;
