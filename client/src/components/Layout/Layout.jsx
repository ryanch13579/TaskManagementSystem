import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ApplicationBlue from "../../assets/ApplicationBlue.svg";
import ApplicationBlack from "../../assets/ApplicationBlack.svg";
import { Users, ChevronDown, Lock, LogOut } from "lucide-react";
import ChangePasswordModal from "../ChangePasswordModal/ChangePasswordModal";
import BrandLogo from "../../assets/BrandLogo";
import { styles } from "./Layout.styles";

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, token, login, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (!user?.id || !token) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          logout();
          navigate("/", {
            state: { message: "Your account has been disabled." },
          });
          return;
        }
        if (!res.ok) return;

        const freshUser = await res.json();

        if (!freshUser.active) {
          logout();
          navigate("/", {
            state: { message: "Your account has been disabled." },
          });
          return;
        }

        const changed =
          JSON.stringify(freshUser.roles) !== JSON.stringify(user.roles) ||
          freshUser.active !== user.active ||
          freshUser.email !== user.email;

        if (changed) {
          login({ ...user, ...freshUser }, token);
        }
      } catch {
        // silently ignore
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 15000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  const navLinkClass = ({ isActive }) =>
    isActive ? styles.navButtonActive : styles.navButtonInactive;

  const initials = user?.email?.slice(0, 2).toUpperCase();
  const roleDisplay = user?.roles
    ?.map((r) => r.charAt(0).toUpperCase() + r.slice(1))
    .join(" / ");

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
            <span className={styles.userName}>{user?.email}</span>
            <ChevronDown className={styles.chevron} />
          </button>

          {menuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.avatarLg}>{initials}</div>
                <div>
                  <p className={styles.dropdownName}>{user?.email}</p>
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
          <nav className={styles.nav}>
            {user?.roles?.some((r) => r !== "admin") && (
              <NavLink to="/applications" className={navLinkClass}>
                {({ isActive }) => (
                  <>
                    <img
                      src={isActive ? ApplicationBlue : ApplicationBlack}
                      alt=""
                      className="h-4 w-4"
                    />
                    Applications
                  </>
                )}
              </NavLink>
            )}

            {user?.roles?.includes("admin") && (
              <NavLink to="/users" className={navLinkClass}>
                <Users className="h-4 w-4" />
                User Management
              </NavLink>
            )}
          </nav>
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
