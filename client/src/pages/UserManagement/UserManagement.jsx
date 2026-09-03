import { Users, Plus, Pencil } from "lucide-react";
import { styles } from "./UserManagement.styles";

const users = [
  {
    id: 1,
    name: "Admin 1",
    handle: "admin1",
    roles: ["admin"],
    created: "4/10/2025",
    updated_at: "4/10/2025",
    email: "admin1@gmail.com",
    active: true,
    color: "bg-blue-600",
  },
  {
    id: 2,
    name: "Admin 2",
    handle: "admin2",
    roles: ["admin", "Project Lead"],
    created: "4/10/2025",
    updated_at: "4/15/2025",
    email: "admin2@gmail.com",
    active: true,
    color: "bg-purple-400",
  },
  {
    id: 3,
    name: "User 1",
    handle: "user1",
    roles: ["Developer"],
    created: "4/10/2025",
    updated_at: "4/10/2025",
    email: "user1@gmail.com",
    active: true,
    color: "bg-cyan-400",
  },
  {
    id: 4,
    name: "User 2",
    handle: "user2",
    roles: ["Project Manager", "Developer"],
    created: "4/10/2025",
    updated_at: "4/20/2025",
    email: "user2@gmail.com",
    active: true,
    color: "bg-amber-400",
  },
];

function UserManagement() {
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
        <button className={styles.createBtn}>
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
              <th className={styles.th}>Created On</th>
              <th className={styles.th}>Updated On</th>

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
                    <div className={`${styles.avatar} ${u.color}`}>
                      {u.handle.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className={styles.userName}>{u.name}</p>
                    </div>
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
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.td}>{u.created}</td>
                <td className={styles.td}>{u.updated_at}</td>
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
                  <button className={styles.editBtn}>
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default UserManagement;
