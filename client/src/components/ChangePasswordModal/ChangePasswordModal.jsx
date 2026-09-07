import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { styles } from "./ChangePasswordModal.styles";

function ChangePasswordModal({ userId, onClose }) {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== retypePassword) {
      setError("New password and retyped password don't match");
      return;
    }

    try {
      await api.put(
        `/auth/change-password/${userId}`,
        { currentPassword, newPassword },
        token,
      );
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Change Password</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className={styles.form}>
            <div className={styles.successBanner}>
              Password changed successfully.
            </div>
            <div className={styles.footer}>
              <button onClick={onClose} className={styles.submitBtn}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label className={styles.label}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={styles.input}
                required
              />
            </div>

            <div>
              <label className={styles.label}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={styles.input}
                required
              />
            </div>

            <div>
              <label className={styles.label}>Retype New Password</label>
              <input
                type="password"
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                placeholder="Retype new password"
                className={styles.input}
                required
              />
            </div>

            <p className={styles.hint}>
              Use 8-10 characters with at least one letter, number, and special
              character.
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.footer}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn}>
                Change Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ChangePasswordModal;
