import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api";
import Modal, { ModalFooter } from "../Modal/Modal";
import { styles, formStyles } from "../Modal/Modal.styles";

const FIELDS = [
  { key: "currentPassword", label: "Current Password", placeholder: "Enter current password" },
  { key: "newPassword", label: "New Password", placeholder: "Enter new password" },
  { key: "retypePassword", label: "Retype New Password", placeholder: "Retype new password" },
];

function ChangePasswordModal({ userId, onClose }) {
  const { token } = useAuth();
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", retypePassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (values.newPassword !== values.retypePassword) {
      setError("New password and retyped password don't match");
      return;
    }
    try {
      await authApi.changePassword(
        userId,
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        token,
      );
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title="Change Password" onClose={onClose} width="max-w-sm">
      {success ? (
        <div className={formStyles.form}>
          <div className={formStyles.success}>Password changed successfully.</div>
          <div className="flex justify-end">
            <button onClick={onClose} className={styles.submitBtn}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={formStyles.form}>
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={formStyles.label}>{label}</label>
              <input
                type="password"
                value={values[key]}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                placeholder={placeholder}
                className={formStyles.input}
                required
              />
            </div>
          ))}
          <p className={formStyles.hint}>
            Use 8-10 characters with at least one letter, number, and special character.
          </p>
          {error && <p className={formStyles.error}>{error}</p>}
          <ModalFooter onCancel={onClose} submitLabel="Change Password" />
        </form>
      )}
    </Modal>
  );
}

export default ChangePasswordModal;
