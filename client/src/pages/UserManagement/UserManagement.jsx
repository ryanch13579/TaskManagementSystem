import { Users, Plus, Pencil } from "lucide-react";
import { styles } from "./UserManagement.styles";

// Placeholder data — swap for a real fetch to /api/users once that endpoint exists
const users = [
  {
    id: 1,
    name: "User 1",
    handle: "user1",
    roles: ["Project Manager", "Developer", "Reviewer"],
    created: "4/10/2025",
    email: "user1@gmail.com",
    active: true,
    color: "bg-blue-600",
  },
  {
    id: 2,
    name: "User 2",
    handle: "user2",
    roles: ["Project Lead", "Developer"],
    created: "4/10/2025",
    email: "user2@gmail.com",
    active: true,
    color: "bg-purple-400",
  },
  {
    id: 3,
    name: "User 3",
    handle: "user3",
    roles: ["Developer", "Reviewer"],
    created: "4/10/2025",
    email: "user3@gmail.com",
    active: true,
    color: "bg-cyan-400",
  },
  {
    id: 4,
    name: "User 4",
    handle: "user4",
    roles: ["Developer", "QA Engineer"],
    created: "4/10/2025",
    email: "user4@gmail.com",
    active: true,
    color: "bg-amber-400",
  },
  {
    id: 5,
    name: "User 5",
    handle: "user5",
    roles: ["DevOps Engineer", "Support"],
    created: "4/10/2025",
    email: "user5@gmail.com",
    active: false,
    color: "bg-red-300",
  },
  {
    id: 6,
    name: "User 6",
    handle: "user6",
    roles: ["Project Manager", "Developer", "Reviewer"],
    created: "4/10/2025",
    email: "user6@gmail.com",
    active: true,
    color: "bg-green-500",
  },
  {
    id: 7,
    name: "User 7",
    handle: "user7",
    roles: ["Developer"],
    created: "4/10/2025",
    email: "user7@gmail.com",
    active: true,
    color: "bg-indigo-400",
  },
  {
    id: 8,
    name: "User 8",
    handle: "user8",
    roles: ["QA Engineer", "Support"],
    created: "4/10/2025",
    email: "user8@gmail.com",
    active: false,
    color: "bg-purple-400",
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
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={styles.row}>
                <td className={styles.td}>
                  <div className={styles.userCell}>
                    <div className={`${styles.avatar} ${user.color}`}>
                      {user.handle.replace("user", "U")}
                    </div>
                    <div>
                      <p className={styles.userName}>{user.name}</p>
                      <p className={styles.userHandle}>{user.handle}</p>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.roleList}>
                    {user.roles.map((role) => (
                      <span key={role} className={styles.roleBadge}>
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.td}>{user.created}</td>
                <td className={styles.td}>{user.email}</td>
                <td className={styles.td}>
                  <span
                    className={
                      user.active ? styles.statusActive : styles.statusDisabled
                    }
                  >
                    <span
                      className={
                        user.active ? styles.dotActive : styles.dotDisabled
                      }
                    />
                    {user.active ? "Active" : "Disabled"}
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
