import { useState, useEffect } from "react";
import { Users, Plus, Pencil } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEventStream } from "../../hooks/useEventStream";
import { usersApi, eventStreams } from "../../api";
import { capitalize, formatDisplayDate } from "../../utils/format";
import { isAdmin } from "../../utils/roles";
import UserFormRow from "./UserFormRow";
import { styles } from "./UserManagement.styles";

const COLUMNS = ["User Name", "Roles", "Updated On", "Created On", "Email", "Password", "Status", "Actions"];

function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  // Only one form row open at a time: "new", a user id, or null.
  const [editing, setEditing] = useState(null);

  const loadUsers = () =>
    usersApi
      .list(token)
      .then((data) => {
        setUsers(data);
        setError("");
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Another admin saved a user - swap in the new version. An open edit row
  // for that user notices and locks itself (see UserFormRow).
  useEventStream(eventStreams.user, {
    "user-changed": (changed) =>
      setUsers((prev) => prev.map((u) => (u.id === changed.id ? changed : u))),
  });

  // Returns the error message instead of throwing, so the row can show it.
  const handleSave = async (values) => {
    try {
      if (editing === "new") {
        await usersApi.create(values, token);
      } else {
        await usersApi.update(editing, values, token);
      }
      await loadUsers();
      setEditing(null);
    } catch (err) {
      // 409 = someone else changed it first. Reload so a retry uses their version.
      if (err.status === 409) await loadUsers();
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
            Manage users and their roles. Users can have multiple roles and active or inactive
            accounts.
          </p>
        </div>
        <button onClick={() => setEditing("new")} className={styles.createBtn}>
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headRow}>
              {COLUMNS.map((name) => (
                <th key={name} className={styles.th}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editing === "new" && <UserFormRow onSave={handleSave} onCancel={() => setEditing(null)} />}

            {users.map((u) =>
              editing === u.id ? (
                <UserFormRow key={u.id} user={u} onSave={handleSave} onCancel={() => setEditing(null)} />
              ) : (
                <tr key={u.id} className={styles.row}>
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <div className={`${styles.avatar} ${isAdmin(u) ? "bg-indigo-600" : "bg-emerald-500"}`}>
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <p className={styles.userName}>{u.username}</p>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.roleList}>
                      {u.roles.map((r) => (
                        <span key={r} className={r === "admin" ? styles.accessBadge : styles.roleBadge}>
                          {capitalize(r)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={styles.td}>{formatDisplayDate(u.updated_at)}</td>
                  <td className={styles.td}>{formatDisplayDate(u.created_at)}</td>
                  <td className={styles.td}>{u.email}</td>
                  <td className={styles.td}>
                    <span className={styles.passwordDots}>••••••••</span>
                  </td>
                  <td className={styles.td}>
                    <span className={u.active ? styles.statusActive : styles.statusDisabled}>
                      <span className={u.active ? styles.dotActive : styles.dotDisabled} />
                      {u.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <button onClick={() => setEditing(u.id)} className={styles.editBtn}>
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
