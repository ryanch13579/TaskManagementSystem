import { useState } from "react";
import { X } from "lucide-react";
import { styles } from "./AddApplicationModal.styles";

function AddApplicationModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !acronym.trim() || !startDate || !endDate) {
      setError("Please fill in all required fields.");
      return;
    }
    if (endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }

    onSave({
      name: name.trim(),
      acronym: acronym.trim(),
      description: description.trim(),
      startDate,
      endDate,
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add Application</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.form}>
            <div>
              <label className={styles.label}>Application Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                autoFocus
              />
            </div>

            <div>
              <label className={styles.label}>Acronym</label>
              <input
                type="text"
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
                className={styles.input}
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

            {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={`${styles.footer} px-6 pb-6`}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Create Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddApplicationModal;
