import { useState } from "react";
import Modal, { ModalFooter } from "../../components/Modal/Modal";
import { formStyles } from "../../components/Modal/Modal.styles";
import DateInput from "../../components/DateInput/DateInput";
import { toInputDate } from "../../utils/format";
import { ALL_GROUPS, PERMITS } from "../../utils/roles";

// Add a new application, or edit `app` if one is passed in.
// onSave(values) should throw to show an error in the form.
function ApplicationFormModal({ app, onClose, onSave }) {
  const [acronym, setAcronym] = useState(app?.acronym ?? "");
  const [description, setDescription] = useState(app?.description ?? "");
  const [startDate, setStartDate] = useState(toInputDate(app?.startDate));
  const [endDate, setEndDate] = useState(toInputDate(app?.endDate));
  // { permitCreate: "Project Lead", ... } - "" means no group.
  const [permits, setPermits] = useState(() =>
    Object.fromEntries(
      PERMITS.map(({ field, defaultGroup }) => [field, app ? (app[field] ?? "") : defaultGroup]),
    ),
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
      await onSave({ acronym: acronym.trim(), description: description.trim(), startDate, endDate, ...permits });
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
        <fieldset className="space-y-3">
          <legend className={formStyles.label}>Permissions</legend>
          <p className={formStyles.hint}>Which group may do each of these to this application's tasks.</p>
          {PERMITS.map(({ field, label, hint }) => (
            <div key={field} className="grid grid-cols-[7rem_1fr] items-center gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className={formStyles.hint}>{hint}</p>
              </div>
              <select
                value={permits[field]}
                onChange={(e) => setPermits({ ...permits, [field]: e.target.value })}
                className={formStyles.input}
              >
                <option value="">No group</option>
                {ALL_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
                {/* A group no longer in ALL_GROUPS still shows as selected. */}
                {permits[field] && !ALL_GROUPS.includes(permits[field]) && (
                  <option value={permits[field]}>{permits[field]}</option>
                )}
              </select>
            </div>
          ))}
        </fieldset>
        {error && <p className={formStyles.error}>{error}</p>}
        <ModalFooter onCancel={onClose} submitLabel={app ? "Save Changes" : "Create Application"} />
      </form>
    </Modal>
  );
}

export default ApplicationFormModal;
