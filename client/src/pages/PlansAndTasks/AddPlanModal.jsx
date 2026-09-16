import { useState } from "react";
import { X } from "lucide-react";
import { styles } from "./AddPlanModal.styles";

function AddPlanModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !startDate || !endDate) {
      setError("Please fill in all fields.");
      return;
    }
    if (endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }

    onSave({ name: name.trim(), startDate, endDate });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add Plan</h2>
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

          <div className={styles.row}>
            <div>
              <label className={styles.label}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.footer}>
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
