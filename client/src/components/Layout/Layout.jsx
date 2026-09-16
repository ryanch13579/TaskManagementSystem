import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ApplicationBlue from "../../assets/ApplicationBlue.svg";
import ApplicationBlack from "../../assets/ApplicationBlack.svg";
import {
  Users,
  ChevronDown,
  Lock,
  LogOut,
  ListChecks,
  LayoutGrid,
} from "lucide-react";
import ChangePasswordModal from "../ChangePasswordModal/ChangePasswordModal";
import BrandLogo from "../../assets/BrandLogo";
import { BASE_URL, setForcedLogoutHandler } from "../../api/client";
import { capitalize } from "../../utils/format";
import { isAdmin, hasNonAdminRole } from "../../utils/roles";
import { getApplicationById } from "../../data/applications";
import { styles } from "./Layout.styles";

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, token, login, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();
  const { appId } = useParams();
  const app = appId ? getApplicationById(appId) : null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Kicks the user out the moment their account is disabled: an admin
  // disabling the account pushes an SSE event here in real time, and as a
  // fallback, any API call this tab makes afterwards gets a 403 that also
  // forces the logout (see setForcedLogoutHandler in api/client.js).
  useEffect(() => {
    if (!user?.id || !token) return;

    const disable = () => {
      logout();
      navigate("/", { state: { message: "Your account has been disabled." } });
    };

    setForcedLogoutHandler(disable);

    const source = new EventSource(
      `${BASE_URL}/events?token=${encodeURIComponent(token)}`,
    );

    source.addEventListener("updated", (event) => {
      const freshUser = JSON.parse(event.data);
      if (!freshUser.active) {
        disable();
        return;
      }

      const changed =
        JSON.stringify(freshUser.roles) !== JSON.stringify(user.roles) ||
        freshUser.email !== user.email;

      if (changed) {
        login({ ...user, ...freshUser }, token);
      }
    });

    return () => {
      source.close();
      setForcedLogoutHandler(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  const navLinkClass = ({ isActive }) =>
    isActive ? styles.navButtonActive : styles.navButtonInactive;

  const treeLinkClass = ({ isActive }) =>
    `${styles.treeItem} ${isActive ? styles.treeItemActive : styles.treeItemInactive}`;

  const initials = user?.username?.slice(0, 2).toUpperCase();
  const roleDisplay = user?.roles?.map(capitalize).join(", ");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <BrandLogo className={styles.logo} />
          <span className={styles.headerTitle}>Task Management System</span>
        </div>

        <div className={styles.userMenuWrapper}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={styles.userMenuButton}
          >
            <div className={styles.avatarSm}>{initials}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.username}</p>
              <p className={styles.userRoles}>{roleDisplay}</p>
            </div>
            <ChevronDown className={styles.chevron} />
          </button>

          {menuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.avatarLg}>{initials}</div>
                <div>
                  <p className={styles.dropdownName}>{user?.username}</p>
                  <p className={styles.dropdownRole}>{roleDisplay}</p>
                </div>
              </div>
              <hr className={styles.divider} />

              <button
                onClick={() => setShowPasswordModal(true)}
                className={styles.dropdownItem}
              >
                <Lock className="h-4 w-4 text-slate-400" />
                Change Password
              </button>
              <hr className={styles.divider} />
              <button onClick={handleLogout} className={styles.dropdownItem}>
                <LogOut className="h-4 w-4 text-slate-400" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          {hasNonAdminRole(user) && (
            <div className={styles.appListSection}>
              <NavLink
                to="/applications"
                end={!app}
                className={styles.appListHeader}
              >
                {({ isActive }) => (
                  <>
                    <img
                      src={isActive ? ApplicationBlue : ApplicationBlack}
                      alt=""
                      className="h-5 w-5"
                    />
                    Applications
                  </>
                )}
              </NavLink>

              {app && (
                <div className={styles.tree}>
                  <span className={styles.treeLine} />
                  <NavLink
                    to={`/applications/${app.id}/plans-tasks`}
                    className={treeLinkClass}
                  >
                    {({ isActive }) => (
                      <>
                        {!isActive && <span className={styles.treeStub} />}
                        <ListChecks className="h-5 w-5 shrink-0" />
                        Plans & Tasks
                      </>
                    )}
                  </NavLink>
                  <NavLink
                    to={`/applications/${app.id}/task-board`}
                    className={treeLinkClass}
                  >
                    {({ isActive }) => (
                      <>
                        {!isActive && <span className={styles.treeStub} />}
                        <LayoutGrid className="h-5 w-5 shrink-0" />
                        Task Board
                      </>
                    )}
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {isAdmin(user) && (
            <nav className={styles.nav}>
              <NavLink to="/users" className={navLinkClass}>
                <Users className="h-5 w-5" />
                User Management
              </NavLink>
            </nav>
          )}
        </aside>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          userId={user.id}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}

export default Layout;
