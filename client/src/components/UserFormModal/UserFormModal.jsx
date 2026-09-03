import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { styles } from "./UserFormModal.styles";

const AVAILABLE_ROLES = [
  "admin",
  "Project Lead",
  "Project Manager",
  "Developer",
];

function UserFormModal({ mode, initialData, onClose, onSubmit }) {
  const isEdit = mode === "edit";
  const [fullName, setFullName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState(initialData?.roles || []);
  const [active, setActive] = useState(initialData?.active ?? true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleRole = (role) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const removeRole = (role) => {
    setRoles((prev) => prev.filter((r) => r !== role));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: fullName,
      email,
      password: password || undefined,
      roles,
      active,
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEdit ? "Edit User" : "Create User"}
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              className={styles.input}
              required
            />
          </div>

          <div>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className={styles.input}
              required
            />
          </div>

          <div>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={styles.input}
              required={!isEdit}
            />
            {isEdit && (
              <p className={styles.hint}>
                Leave blank to keep current password
              </p>
            )}
          </div>

          <div ref={dropdownRef} className={styles.roleField}>
            <label className={styles.label}>Roles</label>

            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={styles.roleTrigger}
            >
              <div className={styles.roleChips}>
                {roles.length === 0 ? (
                  <span className={styles.placeholder}>Select roles</span>
                ) : (
                  roles.map((role) => (
                    <span key={role} className={styles.chip}>
                      {role}
                      <X
                        className="h-3 w-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRole(role);
                        }}
                      />
                    </span>
                  ))
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <div className={styles.dropdownPanel}>
                {AVAILABLE_ROLES.map((role) => (
                  <label key={role} className={styles.roleOption}>
                    <input
                      type="checkbox"
                      checked={roles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className={styles.checkbox}
                    />
                    {role === "admin" ? "Admin" : role}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={styles.label}>Status</label>
            <div className={styles.statusRow}>
              <button
                type="button"
                onClick={() => setActive(true)}
                className={
                  active ? styles.statusActiveSelected : styles.statusOption
                }
              >
                <span className={styles.dotActive} />
                Active
              </button>
              <button
                type="button"
                onClick={() => setActive(false)}
                className={
                  !active ? styles.statusDisabledSelected : styles.statusOption
                }
              >
                <span className={styles.dotDisabled} />
                Disabled
              </button>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              {isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;
