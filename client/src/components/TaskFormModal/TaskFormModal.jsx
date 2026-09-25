import { useState } from "react";
import Modal, { ModalFooter } from "../Modal/Modal";
import { formStyles } from "../Modal/Modal.styles";
import { stateBadge } from "../../styles/shared";

// Add a new task, or edit `task` if one is passed in. Used by both the
// Plans & Tasks page and the Task Board.
// onSave(values) should throw to show an error in the form.
function TaskFormModal({ task, plans, onClose, onSave }) {
  const [name, setName] = useState(task?.name ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [plan, setPlan] = useState(task?.plan ?? "");
  // Only an Open (unreleased) task may be without a plan.
  const canHaveNoPlan = !task || task.state === "Open";
  // Always starts empty: it's a new comment added to the task's history
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a task name.");
      return;
    }
    if (!plan && !canHaveNoPlan) {
      setError("A released task must have a plan.");
      return;
    }
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        plan: plan || null,
        notes: notes.trim(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={task ? "Edit Task" : "Add Task"} onClose={onClose}>
      <form onSubmit={handleSubmit} className={formStyles.form}>
        {task && (
          <div>
            <label className={formStyles.label}>Task ID</label>
            <input
              type="text"
              value={task.id}
              disabled
              className={`${formStyles.input} ${formStyles.readOnly}`}
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className={formStyles.label}>Task Name</label>
            {task && (
              <span className={`${stateBadge(task.state)} mb-1`}>
                {task.state}
              </span>
            )}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={formStyles.input}
            autoFocus
          />
        </div>

        <div>
          <label className={formStyles.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={formStyles.textarea}
          />
        </div>

        <div>
          <label className={formStyles.label}>Plan</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className={formStyles.input}
          >
            {canHaveNoPlan && <option value="">No Plan</option>}
            {plans.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={formStyles.label}>
            Additional Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={formStyles.textarea}
          />
        </div>

        {error && <p className={formStyles.error}>{error}</p>}
        <ModalFooter
          onCancel={onClose}
          submitLabel={task ? "Save Changes" : "Create Task"}
        />
      </form>
    </Modal>
  );
}

export default TaskFormModal;
