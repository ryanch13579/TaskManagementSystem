import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationBlue from "../../assets/ApplicationBlue.svg";

import { ClipboardCheck, ListChecks, LayoutGrid, Pencil, Plus } from "lucide-react";
import { applications, addApplication } from "../../data/applications";
import { formatDisplayDate } from "../../utils/format";
import { styles } from "./Applications.styles.js";
import AddApplicationModal from "./AddApplicationModal";

function Applications() {
  const navigate = useNavigate();
  const [appList, setAppList] = useState(applications);
  const [showAddApplication, setShowAddApplication] = useState(false);

  const handleAddApplication = ({ name, acronym, description, startDate, endDate }) => {
    const newApp = {
      id: Math.max(0, ...applications.map((a) => a.id)) + 1,
      name,
      acronym,
      description,
      taskCount: 0,
      start: formatDisplayDate(startDate),
      end: formatDisplayDate(endDate),
    };
    addApplication(newApp);
    setAppList([...applications]);
    setShowAddApplication(false);
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <ClipboardCheck className="h-5 w-5 text-slate-900" />
          <h1 className={styles.pageTitle}>Applications</h1>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setShowAddApplication(true)}
        >
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      <div className={styles.appList}>
        {appList.map((app) => (
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
              <button
                className={styles.primaryBtn}
                onClick={() => navigate(`/applications/${app.id}/plans-tasks`)}
              >
                <ListChecks className="h-4 w-4" />
                Plans and Tasks
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => navigate(`/applications/${app.id}/task-board`)}
              >
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

      {showAddApplication && (
        <AddApplicationModal
          onClose={() => setShowAddApplication(false)}
          onSave={handleAddApplication}
        />
      )}
    </>
  );
}

export default Applications;
