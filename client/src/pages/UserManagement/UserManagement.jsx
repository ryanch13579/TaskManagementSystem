import { useState, useEffect, useRef } from "react";
import { Users, Plus, Pencil, Check, X, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, BASE_URL } from "../../api/client";
import { capitalize, formatDate } from "../../utils/format";
import { isAdmin } from "../../utils/roles";
import { styles } from "./UserManagement.styles";

const AVAILABLE_ROLES = [
  "admin",
  "Project Lead",
  "Project Manager",
  "Developer",
];

// Mirrors PASSWORD_RULE in server/utils/users.js — this copy only gives
// instant client-side feedback; the server still enforces the rule.
const PASSWORD_PATTERN = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,10}$";
const PASSWORD_REGEX = new RegExp(PASSWORD_PATTERN);
const PASSWORD_HINT =
  "Password must be 8-10 characters with at least one letter, number, and special character";

function RoleSelect({ roles, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleRole = (role) => {
    onChange(
      roles.includes(role)
        ? roles.filter((r) => r !== role)
        : [...roles, role],
    );
  };

  return (
    <div ref={ref} className={styles.roleField}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={styles.roleTrigger}
      >
        <div className={styles.roleChips}>
          {roles.length === 0 ? (
            <span className={styles.placeholder}>Select roles</span>
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
          {AVAILABLE_ROLES.map((role) => (
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

// Renders one <tr> as an inline form — shared by the "create user" row and
// whichever row is currently being edited, so the two flows can't drift apart.
function EditableRow({ mode, user, users, onSave, onCancel }) {
  const isEdit = mode === "edit";
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState(user?.roles || []);
  const [active, setActive] = useState(user?.active ?? true);
  const [rowError, setRowError] = useState("");
  const [saving, setSaving] = useState(false);

  // `saving` state only takes effect next render, so a fast double-click can
  // fire onSave twice before the button visually disables. This ref blocks
  // the second call synchronously instead.
  const submittingRef = useRef(false);

  // Captured at mount; compared against the live `user` prop (updated over
  // SSE) to detect someone else saving this same row while it's open.
  const [initialUpdatedAt] = useState(user?.updated_at);
  const isStale = isEdit && user?.updated_at !== initialUpdatedAt;

  const validate = () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedUsername || !trimmedEmail) {
      return "Username and email are required";
    }

    const duplicate = (users || []).some(
      (u) =>
        u.id !== user?.id &&
        (u.username.toLowerCase() === trimmedUsername.toLowerCase() ||
          u.email.toLowerCase() === trimmedEmail.toLowerCase()),
    );
    if (duplicate) {
      return "Username or email is already in use by another user";
    }

    if (!isEdit || password) {
      if (!PASSWORD_REGEX.test(password)) {
        return PASSWORD_HINT;
      }
    }

    return "";
  };

  const handleSave = async () => {
    if (isStale || submittingRef.current) return;
    const validationError = validate();
    if (validationError) {
      setRowError(validationError);
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    const errorMessage = await onSave({
      username: username.trim(),
      email: email.trim(),
      password: password || undefined,
      roles,
      active,
      updated_at: isEdit ? user.updated_at : undefined,
    });
    submittingRef.current = false;
    setSaving(false);
    if (errorMessage) {
      setRowError(errorMessage);
    }
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
            required
          />
        </td>
        <td className={styles.td}>
          <RoleSelect roles={roles} onChange={setRoles} disabled={isStale} />
        </td>
        <td className={styles.td}>
          <span className={styles.metaLabel}>
            {isEdit ? "Saved on update" : "—"}
          </span>
        </td>
        <td className={styles.td}>
          <span className={styles.metaLabel}>
            {isEdit ? "Unchanged" : "On creation"}
          </span>
        </td>
        <td className={styles.td}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={styles.cellInput}
            disabled={isStale}
            required
          />
        </td>
        <td className={styles.td}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? "Optional new password" : "Password"}
            className={styles.cellInput}
            pattern={PASSWORD_PATTERN}
            disabled={isStale}
            required={!isEdit}
          />
          <p className={styles.hint}>
            8-10 characters: letter, number and special character.
          </p>
        </td>
        <td className={styles.td}>
          <span
            onClick={() => !isStale && setActive(!active)}
            className={
              active ? styles.statusToggleActive : styles.statusToggleDisabled
            }
          >
            <span className={active ? styles.dotActive : styles.dotDisabled} />
            {active ? "Active" : "Disabled"}
          </span>
        </td>
        <td className={styles.td}>
          <div className={styles.actionGroup}>
            <button
              onClick={handleSave}
              disabled={saving || isStale}
              className={styles.saveBtn}
            >
              <Check className="h-4 w-4" />
            </button>
            <button onClick={onCancel} className={styles.cancelIconBtn}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {isStale && (
        <RowErrorBanner message="This user was just updated by someone else. Cancel and re-open Edit to see their changes." />
      )}
      <RowErrorBanner message={rowError} />
    </>
  );
}

// Sits directly under an EditableRow so validation/save errors are anchored
// to the row that produced them, instead of a page-level banner.
function RowErrorBanner({ message }) {
  if (!message) return null;
  return (
    <tr>
      <td colSpan={8} className={styles.rowError}>
        {message}
      </td>
    </tr>
  );
}

function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setUsers(await api.get("/users", token));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchUsers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flags an open row as stale (see EditableRow's isStale) the moment
  // another admin saves it, rather than waiting for a rejected save.
  useEffect(() => {
    if (!token) return;
    const source = new EventSource(
      `${BASE_URL}/events?token=${encodeURIComponent(token)}`,
    );
    source.addEventListener("user-changed", (event) => {
      const account = JSON.parse(event.data);
      setUsers((prev) => prev.map((u) => (u.id === account.id ? account : u)));
    });
    return () => source.close();
  }, [token]);

  // Returns an error message on failure (so the row can show it inline)
  // instead of throwing, and returns nothing on success.
  const handleCreate = async (formData) => {
    try {
      await api.post("/users", formData, token);
      await fetchUsers();
      setIsCreating(false);
    } catch (err) {
      return err.message;
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await api.put(`/users/${id}`, formData, token);
      await fetchUsers();
      setEditingId(null);
    } catch (err) {
      // Someone else updated this account first — pull the current version
      // in so a retry (still open, edits kept) is checked against it.
      if (err.status === 409) {
        await fetchUsers();
      }
      return err.message;
    }
  };

  return (
    <>
      <div className={styles.pageHeaderRow}>
        <div>
          <div className={styles.pageHeader}>
            <Users className="h-5 w-5 text-slate-900" />
            <h1 className={styles.pageTitle}>User Management</h1>
          </div>
          <p className={styles.pageSubtitle}>
            Manage users and their roles. Users can have multiple roles and
            active or inactive accounts.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setIsCreating(true);
          }}
          className={styles.createBtn}
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headRow}>
              <th className={styles.th}>User Name</th>
              <th className={styles.th}>Roles</th>
              <th className={styles.th}>Updated On</th>
              <th className={styles.th}>Created On</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Password</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isCreating && (
              <EditableRow
                mode="create"
                users={users}
                onSave={handleCreate}
                onCancel={() => setIsCreating(false)}
              />
            )}
            {users.map((u) =>
              editingId === u.id ? (
                <EditableRow
                  key={u.id}
                  mode="edit"
                  user={u}
                  users={users}
                  onSave={(data) => handleUpdate(u.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <tr key={u.id} className={styles.row}>
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <div
                        className={`${styles.avatar} ${
                          isAdmin(u) ? "bg-indigo-600" : "bg-emerald-500"
                        }`}
                      >
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <p className={styles.userName}>{u.username}</p>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.roleList}>
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className={
                            r === "admin"
                              ? styles.accessBadge
                              : styles.roleBadge
                          }
                        >
                          {capitalize(r)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={styles.td}>{formatDate(u.updated_at)}</td>
                  <td className={styles.td}>{formatDate(u.created_at)}</td>
                  <td className={styles.td}>{u.email}</td>
                  <td className={styles.td}>
                    <span className={styles.passwordDots}>••••••••</span>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={
                        u.active ? styles.statusActive : styles.statusDisabled
                      }
                    >
                      <span
                        className={
                          u.active ? styles.dotActive : styles.dotDisabled
                        }
                      />
                      {u.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setEditingId(u.id);
                      }}
                      className={styles.editBtn}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default UserManagement;
