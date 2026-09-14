import ApplicationBlue from "../../assets/ApplicationBlue.svg";

import { ClipboardCheck, ListChecks, LayoutGrid, Pencil, Plus } from "lucide-react";
import { styles } from "./Applications.styles.js";

const applications = [
  {
    id: 1,
    name: "Customer Support System",
    description: "A platform for recording customer enquiries and coordinating support responses.",
    acronym: "CSS",
    taskCount: 0,
    start: "Nov 01, 2026",
    end: "May 31, 2027",
  },
  {
    id: 2,
    name: "Inventory Management System",
    description: "An application for monitoring inventory levels, stock movement, and reordering.",
    acronym: "IMS",
    taskCount: 0,
    start: "Oct 01, 2026",
    end: "Mar 31, 2027",
  },
  {
    id: 3,
    name: "Task Management System",
    description: "A system for planning projects, assigning tasks, and tracking their progress.",
    acronym: "TMS",
    taskCount: 0,
    start: "Sep 01, 2026",
    end: "Dec 31, 2026",
  },
];

function Applications() {
  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <ClipboardCheck className="h-5 w-5 text-slate-900" />
          <h1 className={styles.pageTitle}>Applications</h1>
        </div>
        <button className={styles.addBtn}>
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      <div className={styles.appList}>
        {applications.map((app) => (
          <div key={app.id} className={styles.appCard}>
            <div className={styles.appCardLeft}>
              <div className={styles.appIcon}>
                <img
                  src={ApplicationBlue}
                  alt=""
                  className="h-5 w-5 text-blue-600"
                />
              </div>
              <div className={styles.appInfo}>
                <p className={styles.appName}>{app.name}</p>
                <p className={styles.appDescription}>{app.description}</p>
              </div>
            </div>

            <div className={styles.appMeta}>
              <div>
                <p className={styles.metaLabel}>Acronym</p>
                <p className={styles.metaValue}>{app.acronym}</p>
              </div>
              <div>
                <p className={styles.metaLabel}>Tasks</p>
                <p className={styles.metaValue}>{app.taskCount}</p>
              </div>
              <div>
                <p className={styles.metaLabel}>Start Date</p>
                <p className={styles.metaValue}>{app.start}</p>
              </div>
              <div>
                <p className={styles.metaLabel}>End Date</p>
                <p className={styles.metaValue}>{app.end}</p>
              </div>
            </div>

            <div className={styles.appCardRight}>
              <button className={styles.primaryBtn}>
                <ListChecks className="h-4 w-4" />
                Plans and Tasks
              </button>
              <button className={styles.primaryBtn}>
                <LayoutGrid className="h-4 w-4" />
                Task Board
              </button>
              <button className={styles.secondaryBtn}>
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Applications;
