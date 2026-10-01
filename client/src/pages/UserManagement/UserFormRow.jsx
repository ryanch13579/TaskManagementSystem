import { useState, useEffect, useRef } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { capitalize } from "../../utils/format";
import { styles } from "./UserManagement.styles";
import { ALL_GROUPS } from "../../utils/roles";

// A table row that works as a form, for creating a user (no `user` prop) or
// editing one. Validation happens on the server - its error message is
// shown under the row.
//
// onSave(values) resolves to an error message, or nothing on success.
function UserFormRow({ user, onSave, onCancel }) {
  const isEdit = Boolean(user);
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState(user?.roles ?? []);
  const [active, setActive] = useState(user?.active ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // `user` is kept live over SSE. If its updated_at changes while this row
  // is open, another admin saved it first - lock the row.
  const [openedAt] = useState(user?.updated_at);
  const isStale = isEdit && user.updated_at !== openedAt;

  const handleSave = async () => {
    if (saving || isStale) return;
    setSaving(true);
    const errorMessage = await onSave({
      username: username.trim(),
      email: email.trim(),
      password: password || undefined,
      roles,
      active,
      updated_at: user?.updated_at,
    });
    setSaving(false);
    setError(errorMessage ?? "");
  };

  return (
    <>
      <tr className={styles.editRow}>
        <td className={styles.td}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className={styles.cellInput}
            disabled={isStale}
          />
        </td>
        <td className={styles.td}>
          <RoleSelect roles={roles} onChange={setRoles} disabled={isStale} />
        </td>
        <td className={styles.td}>
          <span className={styles.metaLabel}>{isEdit ? "Saved on update" : "—"}</span>
        </td>
        <td className={styles.td}>
          <span className={styles.metaLabel}>{isEdit ? "Unchanged" : "On creation"}</span>
        </td>
        <td className={styles.td}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={styles.cellInput}
            disabled={isStale}
          />
        </td>
        <td className={styles.td}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? "Optional new password" : "Password"}
            className={styles.cellInput}
            disabled={isStale}
          />
          <p className={styles.hint}>8-10 characters: letter, number and special character.</p>
        </td>
        <td className={styles.td}>
          <span
            onClick={() => !isStale && setActive(!active)}
            className={active ? styles.statusToggleActive : styles.statusToggleDisabled}
          >
            <span className={active ? styles.dotActive : styles.dotDisabled} />
            {active ? "Active" : "Disabled"}
          </span>
        </td>
        <td className={styles.td}>
          <div className={styles.actionGroup}>
            <button onClick={handleSave} disabled={saving || isStale} className={styles.saveBtn}>
              <Check className="h-4 w-4" />
            </button>
            <button onClick={onCancel} className={styles.cancelIconBtn}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {isStale && (
        <RowMessage text="This user was just updated by someone else. Cancel and re-open Edit to see their changes." />
      )}
      {error && <RowMessage text={error} />}
    </>
  );
}

// A full-width red message row under the form row.
function RowMessage({ text }) {
  return (
    <tr>
      <td colSpan={8} className={styles.rowError}>
        {text}
      </td>
    </tr>
  );
}

// Dropdown of checkboxes for picking any number of roles.
function RoleSelect({ roles, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking anywhere outside the dropdown.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleRole = (role) =>
    onChange(roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={styles.roleTrigger}
      >
        <div className={styles.roleChips}>
          {roles.length === 0 ? (
            <span className="text-slate-400">Select roles</span>
          ) : (
            roles.map((role) => (
              <span key={role} className={styles.chip}>
                {capitalize(role)}
              </span>
            ))
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className={styles.dropdownPanel}>
          {ALL_GROUPS.map((role) => (
            <label key={role} className={styles.roleOption}>
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={() => toggleRole(role)}
                className={styles.checkbox}
              />
              {capitalize(role)}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserFormRow;
