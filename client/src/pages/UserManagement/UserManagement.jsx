import { useState, useEffect } from "react";
import { Users, Plus, Pencil } from "lucide-react";
import { styles } from "./UserManagement.styles";
import UserFormModal from "../../components/UserFormModal/UserFormModal";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [modalMode, setModalMode] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    const res = await fetch("http://localhost:5000/api/users");
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("http://localhost:5000/api/users");
      const data = await res.json();
      setUsers(data);
    })();
  }, []);
  const openCreate = () => {
    setEditingUser(null);
    setModalMode("create");
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingUser(null);
  };

  const handleSubmit = async (formData) => {
    const payload = {
      username: formData.name,
      email: formData.email,
      password: formData.password,
      roles: formData.roles,
      active: formData.active,
    };

    if (modalMode === "edit") {
      await fetch(`http://localhost:5000/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    await fetchUsers(); // refresh the table with real data from the DB
    closeModal();
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
            Manage users and their roles. You can assign multiple roles to each
            user and activate or disable accounts.
          </p>
        </div>
        <button onClick={openCreate} className={styles.createBtn}>
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headRow}>
              <th className={styles.th}>User Name</th>
              <th className={styles.th}>Roles</th>
              <th className={styles.th}>Created</th>
              <th className={styles.th}>Updated</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={styles.row}>
                <td className={styles.td}>
                  <div className={styles.userCell}>
                    <div className={`${styles.avatar} bg-slate-400`}>
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
                          r === "admin" ? styles.accessBadge : styles.roleBadge
                        }
                      >
                        {r === "admin" ? "Admin" : r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.td}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className={styles.td}>
                  {new Date(u.updated_at).toLocaleDateString()}
                </td>
                <td className={styles.td}>{u.email}</td>
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
                    onClick={() => openEdit({ ...u, name: u.username })}
                    className={styles.editBtn}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <UserFormModal
          mode={modalMode}
          initialData={editingUser}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}

export default UserManagement;
