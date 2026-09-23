import { useState } from "react";
import { X } from "lucide-react";
import { styles } from "./AddPlanModal.styles";
import { parseDisplayDate } from "../../utils/format";
import DateInput from "../../components/DateInput/DateInput";

function AddPlanModal({ onClose, onSave, plan }) {
  const isEdit = Boolean(plan);
  const [name, setName] = useState(plan?.name ?? "");
  const [startDate, setStartDate] = useState(
    plan ? parseDisplayDate(plan.startDate) : "",
  );
  const [endDate, setEndDate] = useState(
    plan ? parseDisplayDate(plan.endDate) : "",
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName || !startDate || !endDate) {
      setError("Please fill in all fields.");
      return;
    }
    // The Plan Name column shows "—" for a task with no plan - a plan
    // literally named "-"/"—" would be indistinguishable from that.
    if (/^[-—]+$/.test(trimmedName)) {
      setError(
        "Plan name can't be just a dash - that's reserved for tasks without a plan.",
      );
      return;
    }
    if (endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }

    try {
      await onSave({ name: trimmedName, startDate, endDate });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? "Edit Plan" : "Add Plan"}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>Plan Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter plan name"
              className={styles.input}
              autoFocus
            />
          </div>

          <DateInput label="Start Date" value={startDate} onChange={setStartDate} />

          <DateInput label="End Date" value={endDate} onChange={setEndDate} />

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPlanModal;
