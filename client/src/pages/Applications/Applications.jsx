import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationBlue from "../../assets/ApplicationBlue.svg";
import ApplicationBlack from "../../assets/ApplicationBlack.svg";
import TaskIcon from "../../assets/TaskIcon";

import { ListChecks, Pencil, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { useLiveUpdates } from "../../hooks/useLiveUpdates";
import { formatDisplayDate } from "../../utils/format";
import { styles } from "./Applications.styles.js";
import AddApplicationModal from "./AddApplicationModal";

function Applications() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [appList, setAppList] = useState([]);
  const [showAddApplication, setShowAddApplication] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [error, setError] = useState("");

  const fetchApplications = async () => {
    try {
      const apps = await api.get("/applications", token);
      // taskCount isn't a column on applications - it's derived by counting
      // that app's tasks, same as the "Total Tasks" count on plan cards.
      const withCounts = await Promise.all(
        apps.map(async (app) => {
          const tasks = await api.get(`/tasks?appId=${app.id}`, token);
          return { ...app, taskCount: tasks.length };
        }),
      );
      setAppList(withCounts);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      await fetchApplications();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Live updates: any application create/edit - by this tab or anyone
  // else's - pings this stream, and the page just re-fetches the list. Not
  // scoped to a single application id like the Plans & Tasks/Task Board
  // stream - this page lists every application, so it listens on its own
  // global channel.
  useLiveUpdates("/applications/events", token, fetchApplications);

  const handleAddApplication = async ({
    name,
    acronym,
    description,
    startDate,
    endDate,
  }) => {
    await api.post(
      "/applications",
      { name, acronym, description, startDate, endDate },
      token,
    );
    await fetchApplications();
    setShowAddApplication(false);
  };

  const handleEditApplication = async ({
    name,
    acronym,
    description,
    startDate,
    endDate,
  }) => {
    await api.put(
      `/applications/${editingApp.id}`,
      {
        name,
        acronym,
        description,
        startDate,
        endDate,
        updated_at: editingApp.updatedAt,
      },
      token,
    );
    await fetchApplications();
    setEditingApp(null);
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <img src={ApplicationBlack} alt="" className="h-5 w-5" />
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

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

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
                <p className={styles.metaValue}>
                  {formatDisplayDate(app.startDate)}
                </p>
              </div>
              <div>
                <p className={styles.metaLabel}>End Date</p>
                <p className={styles.metaValue}>
                  {formatDisplayDate(app.endDate)}
                </p>
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
                <TaskIcon className="h-4 w-4" />
                Task Board
              </button>
              <button
                className={styles.secondaryBtn}
                onClick={() => setEditingApp(app)}
              >
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

      {editingApp && (
        <AddApplicationModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onSave={handleEditApplication}
        />
      )}
    </>
  );
}

export default Applications;
