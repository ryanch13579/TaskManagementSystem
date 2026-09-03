import {
  ClipboardCheck,
  Package,
  ListChecks,
  LayoutGrid,
  Pencil,
} from "lucide-react";
import { styles } from "./Applications.styles.js";

const applications = [
  {
    id: 1,
    name: "APP 1",
    start: "Jan 15, 2025",
    end: "Jun 30, 2025",
    hasTaskBoard: false,
  },
  {
    id: 2,
    name: "APP 2",
    start: "Feb 01, 2025",
    end: "Aug 15, 2025",
    hasTaskBoard: false,
  },
  {
    id: 3,
    name: "APP 3",
    start: "Mar 10, 2025",
    end: "Sep 30, 2025",
    hasTaskBoard: true,
  },
  {
    id: 4,
    name: "APP 4",
    start: "Apr 05, 2025",
    end: "Dec 20, 2025",
    hasTaskBoard: true,
  },
];

function Applications() {
  return (
    <>
      <div className={styles.pageHeader}>
        <ClipboardCheck className="h-5 w-5 text-slate-900" />
        <h1 className={styles.pageTitle}>Applications</h1>
      </div>

      <div className={styles.appList}>
        {applications.map((app) => (
          <div key={app.id} className={styles.appCard}>
            <div className={styles.appCardLeft}>
              <div className={styles.appIcon}>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <span className={styles.appName}>{app.name}</span>
              <div className={styles.dateLabel}>
                <p className={styles.dateHeading}>Start Date</p>
                <p>{app.start}</p>
              </div>
              <div className={styles.dateLabel}>
                <p className={styles.dateHeading}>End Date</p>
                <p>{app.end}</p>
              </div>
            </div>

            <div className={styles.appCardRight}>
              <button className={styles.primaryBtn}>
                <ListChecks className="h-4 w-4" />
                Plans and Task
              </button>
              {app.hasTaskBoard && (
                <button className={styles.primaryBtn}>
                  <LayoutGrid className="h-4 w-4" />
                  Task Board
                </button>
              )}
              {app.hasTaskBoard && (
                <button className={styles.secondaryBtn}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Applications;
