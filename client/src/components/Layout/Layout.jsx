import { Outlet, NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutGrid,
  Users,
  ChevronDown,
  User as UserIcon,
  Lock,
  LogOut,
} from "lucide-react";
import BrandLogo from "../../assets/BrandLogo";
import { styles } from "./Layout.styles";

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    isActive ? styles.navButtonActive : styles.navButtonInactive;

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
            <div className={styles.avatarSm}>TE</div>
            <span className={styles.userName}>test</span>
            <ChevronDown className={styles.chevron} />
          </button>

          {menuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.avatarLg}>TE</div>
                <div>
                  <p className={styles.dropdownName}>test</p>
                  <p className={styles.dropdownRole}>Administrator</p>
                </div>
              </div>
              <hr className={styles.divider} />
              <button className={styles.dropdownItem}>
                <UserIcon className="h-4 w-4 text-slate-400" />
                My Profile
              </button>
              <button className={styles.dropdownItem}>
                <Lock className="h-4 w-4 text-slate-400" />
                Change Password
              </button>
              <hr className={styles.divider} />
              <button className={styles.dropdownItem}>
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
            <NavLink to="/applications" className={navLinkClass}>
              <LayoutGrid className="h-4 w-4" />
              Applications
            </NavLink>
            <NavLink to="/users" className={navLinkClass}>
              <Users className="h-4 w-4" />
              User Management
            </NavLink>
          </nav>
        </aside>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
