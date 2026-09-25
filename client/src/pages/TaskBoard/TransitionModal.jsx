import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import { formStyles, styles as modalStyles } from "../../components/Modal/Modal.styles";

// Shown whenever a task is moved to another state on the Task Board. The
// note is optional and is saved to the task's history along with the move.
// Rejects are titled as a support ticket; other moves use the button's label.
// onConfirm(note) should throw to show an error in the form.
function TransitionModal({ action, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onConfirm(note.trim());
    } catch (err) {
      setError(err.message);
    }
  };

  const title = action.forward ? action.label : "Create support ticket form";

  return (
    <Modal title={title} onClose={onClose} width="max-w-lg">
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <div>
          <label className={formStyles.label}>Leave a note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Description"
            className={formStyles.textarea}
            autoFocus
          />
        </div>
        {error && <p className={formStyles.error}>{error}</p>}
        <div className={modalStyles.footer}>
          <button type="submit" className={modalStyles.submitBtn}>
            Confirm
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default TransitionModal;
