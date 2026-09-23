import { useState } from "react";
import { X } from "lucide-react";
import { styles } from "./AddApplicationModal.styles";
import DateInput from "../../components/DateInput/DateInput";
import { parseDisplayDate } from "../../utils/format";

function AddApplicationModal({ onClose, onSave, app }) {
  const isEdit = Boolean(app);
  const [acronym, setAcronym] = useState(app?.acronym ?? "");
  const [description, setDescription] = useState(app?.description ?? "");
  const [startDate, setStartDate] = useState(
    app ? parseDisplayDate(app.startDate) : "",
  );
  const [endDate, setEndDate] = useState(
    app ? parseDisplayDate(app.endDate) : "",
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acronym.trim() || !startDate || !endDate) {
      setError("Please fill in all required fields.");
      return;
    }
    if (endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }

    try {
      await onSave({
        acronym: acronym.trim(),
        description: description.trim(),
        startDate,
        endDate,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEdit ? "Edit Application" : "Add Application"}
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.form}>
            <div>
              <label className={styles.label}>Acronym</label>
              <input
                type="text"
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
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

            <DateInput label="Start Date" value={startDate} onChange={setStartDate} />

            <DateInput label="End Date" value={endDate} onChange={setEndDate} />

            {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={`${styles.footer} px-6 pb-6`}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              {isEdit ? "Save Changes" : "Create Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddApplicationModal;
