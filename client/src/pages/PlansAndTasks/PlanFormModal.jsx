import { useState } from "react";
import Modal, { ModalFooter } from "../../components/Modal/Modal";
import { formStyles } from "../../components/Modal/Modal.styles";
import DateInput from "../../components/DateInput/DateInput";
import { toInputDate, toDMY } from "../../utils/format";

// Add a new plan, or edit `plan` if one is passed in. The plan's dates must
// fall within  app's start/end dates (the server checks this too).
// onSave(values) should throw to show an error in the form.
function PlanFormModal({ plan, app, onClose, onSave }) {
  const appStart = toInputDate(app?.startDate);
  const appEnd = toInputDate(app?.endDate);
  const [name, setName] = useState(plan?.name ?? "");
  const [startDate, setStartDate] = useState(toInputDate(plan?.startDate));
  const [endDate, setEndDate] = useState(toInputDate(plan?.endDate));
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !startDate || !endDate) {
      setError("Please fill in all fields.");
      return;
    }
    // "—" is what the task list shows for "no plan", so it can't be a name.
    if (/^[-—]+$/.test(trimmedName)) {
      // Checks if plan made of only dash
      setError(
        "Plan name can't be just a dash - that's reserved for tasks without a plan.",
      );
      return;
    }
    if (endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }
    if (app && (startDate < appStart || endDate > appEnd)) {
      setError(
        `Plan dates must be within the application's dates (${toDMY(appStart)} - ${toDMY(appEnd)}).`,
      );
      return;
    }
    try {
      await onSave({ name: trimmedName, startDate, endDate });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={plan ? "Edit Plan" : "Add Plan"} onClose={onClose}>
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <div>
          <label className={formStyles.label}>Plan Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter plan name"
            className={formStyles.input}
            autoFocus
          />
        </div>
        <DateInput
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
          min={appStart}
          max={appEnd}
        />
        <DateInput
          label="End Date"
          value={endDate}
          onChange={setEndDate}
          min={appStart}
          max={appEnd}
        />
        {error && <p className={formStyles.error}>{error}</p>}
        <ModalFooter onCancel={onClose} submitLabel="Save Changes" />
      </form>
    </Modal>
  );
}

export default PlanFormModal;
