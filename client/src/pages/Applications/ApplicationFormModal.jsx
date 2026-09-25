import { useState } from "react";
import Modal, { ModalFooter } from "../../components/Modal/Modal";
import { formStyles } from "../../components/Modal/Modal.styles";
import DateInput from "../../components/DateInput/DateInput";
import { toInputDate } from "../../utils/format";

// Add a new application, or edit `app` if one is passed in.
// onSave(values) should throw to show an error in the form.
function ApplicationFormModal({ app, onClose, onSave }) {
  const [acronym, setAcronym] = useState(app?.acronym ?? "");
  const [description, setDescription] = useState(app?.description ?? "");
  const [startDate, setStartDate] = useState(toInputDate(app?.startDate));
  const [endDate, setEndDate] = useState(toInputDate(app?.endDate));
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
      await onSave({ acronym: acronym.trim(), description: description.trim(), startDate, endDate });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={app ? "Edit Application" : "Add Application"} onClose={onClose}>
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <div>
          <label className={formStyles.label}>Acronym</label>
          <input
            type="text"
            value={acronym}
            onChange={(e) => setAcronym(e.target.value)}
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
        <DateInput label="Start Date" value={startDate} onChange={setStartDate} />
        <DateInput label="End Date" value={endDate} onChange={setEndDate} />
        {error && <p className={formStyles.error}>{error}</p>}
        <ModalFooter onCancel={onClose} submitLabel={app ? "Save Changes" : "Create Application"} />
      </form>
    </Modal>
  );
}

export default ApplicationFormModal;
