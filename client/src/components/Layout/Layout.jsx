import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom";
import { Users, ChevronDown, Lock, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEventStream } from "../../hooks/useEventStream";
import { applicationsApi, eventStreams, setForcedLogoutHandler } from "../../api";
import { capitalize } from "../../utils/format";
import { isAdmin, hasNonAdminRole } from "../../utils/roles";
import ChangePasswordModal from "../ChangePasswordModal/ChangePasswordModal";
import ApplicationBlue from "../../assets/ApplicationBlue.svg";
import ApplicationBlack from "../../assets/ApplicationBlack.svg";
import BrandLogo from "../../assets/BrandLogo";
import TaskIcon from "../../assets/TaskIcon";
import PlanIcon from "../../assets/PlanIcon";
import { styles } from "./Layout.styles";

// The frame around every logged-in page: top bar with the user menu, sidebar
// navigation, and the current page (<Outlet />) on the right.
function Layout() {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const { appId } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const app = useExistingApp(appId, token);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const logoutDisabledAccount = () => {
    logout();
    navigate("/", { state: { message: "Your account has been disabled." } });
  };

  // Any API call that finds the account disabled logs out (see api/client.js).
  useEffect(() => {
    setForcedLogoutHandler(logoutDisabledAccount);
    return () => setForcedLogoutHandler(null);
  });

  // An admin changed this account: log out if disabled, else refresh roles/email.
  useEventStream(user ? eventStreams.user : null, {
    updated: (freshUser) => {
      if (!freshUser.active) {
        logoutDisabledAccount();
      } else {
        login({ ...user, ...freshUser }, token);
      }
    },
  });

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
          <button onClick={() => setMenuOpen(!menuOpen)} className={styles.userMenuButton}>
            <div className={styles.avatarSm}>{initials}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.username}</p>
              <p className={styles.userRoles}>{roleDisplay}</p>
            </div>
            <ChevronDown className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ""}`} />
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
              <button onClick={() => setShowPasswordModal(true)} className={styles.dropdownItem}>
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
              <NavLink to="/applications" end={!app} className={styles.appListHeader}>
                {({ isActive }) => (
                  <>
                    <img src={isActive ? ApplicationBlue : ApplicationBlack} alt="" className="h-5 w-5" />
                    Applications
                  </>
                )}
              </NavLink>

              {/* Sub-links for the application currently open */}
              {app && (
                <div className={styles.tree}>
                  <span className={styles.treeLine} />
                  <span className={styles.treeStubRow1} />
                  <span className={styles.treeStubRow2} />
                  <TreeLink to={`/applications/${app.acronym}/plans-tasks`} Icon={PlanIcon}>
                    Plans & Tasks
                  </TreeLink>
                  <TreeLink to={`/applications/${app.acronym}/task-board`} Icon={TaskIcon}>
                    Task Board
                  </TreeLink>
                </div>
              )}
            </div>
          )}

          {isAdmin(user) && (
            <nav className={styles.nav}>
              <NavLink
                to="/users"
                className={({ isActive }) => (isActive ? styles.navButtonActive : styles.navButtonInactive)}
              >
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
        <ChangePasswordModal userId={user.id} onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

function TreeLink({ to, Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.treeItem} ${isActive ? styles.treeItemActive : styles.treeItemInactive}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className={styles.treeAccent} />}
          <Icon className="h-5 w-5 shrink-0" />
          {children}
        </>
      )}
    </NavLink>
  );
}

// Returns the application in the URL if it really exists, otherwise null -
// so the sidebar doesn't link into a renamed or deleted application.
function useExistingApp(appId, token) {
  const [app, setApp] = useState(null);

  useEffect(() => {
    if (!appId || !token) return;
    let cancelled = false;
    applicationsApi
      .get(appId, token)
      .then((data) => !cancelled && setApp(data))
      .catch(() => !cancelled && setApp(null));
    return () => {
      cancelled = true;
    };
  }, [appId, token]);

  // Ignore a leftover result from a different application.
  return appId && app?.acronym.toLowerCase() === appId.toLowerCase() ? app : null;
}

export default Layout;
