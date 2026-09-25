import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Pencil, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEventStream } from "../../hooks/useEventStream";
import { api } from "../../api/client";
import { formatDisplayDate } from "../../utils/format";
import { onlyFor } from "../../utils/roles";
import ApplicationBlue from "../../assets/ApplicationBlue.svg";
import ApplicationBlack from "../../assets/ApplicationBlack.svg";
import TaskIcon from "../../assets/TaskIcon";
import ApplicationFormModal from "./ApplicationFormModal";
import { styles } from "./Applications.styles.js";

function Applications() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [apps, setApps] = useState([]);
  const [error, setError] = useState("");
  // null = closed, "new" = adding, an app object = editing that app
  const [modalApp, setModalApp] = useState(null);

  const loadApps = () =>
    api
      .get("/applications", token)
      .then((data) => {
        setApps(data);
        setError("");
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    if (token) loadApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEventStream("/applications/events", { changed: loadApps });

  const handleSave = async (values) => {
    if (modalApp === "new") {
      await api.post("/applications", values, token);
    } else {
      await api.put(
        `/applications/${encodeURIComponent(modalApp.acronym)}`,
        { ...values, updated_at: modalApp.updatedAt },
        token,
      );
    }
    await loadApps();
    setModalApp(null);
  };

  const leadOnly = onlyFor(user, "Project Lead");

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <img src={ApplicationBlack} alt="" className="h-5 w-5" />
          <h1 className={styles.pageTitle}>Applications</h1>
        </div>
        <button className={styles.addBtn} {...leadOnly} onClick={() => setModalApp("new")}>
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.appList}>
        {apps.map((app) => (
          <div key={app.acronym} className={styles.appCard}>
            <div className={styles.appCardLeft}>
              <div className={styles.appIcon}>
                <img src={ApplicationBlue} alt="" className="h-5 w-5" />
              </div>
              <div className={styles.appInfo}>
                <p className={styles.appName}>{app.acronym}</p>
                <p className={styles.appDescription}>{app.description}</p>
              </div>
            </div>

            <div className={styles.appMeta}>
              <Meta label="Tasks" value={app.taskCount} />
              <Meta label="Start Date" value={formatDisplayDate(app.startDate)} />
              <Meta label="End Date" value={formatDisplayDate(app.endDate)} />
              <Meta label="Acronym" value={app.acronym} />
            </div>

            <div className={styles.appCardRight}>
              <button
                className={styles.primaryBtn}
                onClick={() => navigate(`/applications/${app.acronym}/plans-tasks`)}
              >
                <ListChecks className="h-4 w-4" />
                Plans and Tasks
              </button>
              <button
                className={styles.primaryBtn}
                onClick={() => navigate(`/applications/${app.acronym}/task-board`)}
              >
                <TaskIcon className="h-4 w-4" />
                Task Board
              </button>
              <button className={styles.secondaryBtn} {...leadOnly} onClick={() => setModalApp(app)}>
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalApp && (
        <ApplicationFormModal
          app={modalApp === "new" ? null : modalApp}
          onClose={() => setModalApp(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className={styles.metaLabel}>{label}</p>
      <p className={styles.metaValue}>{value}</p>
    </div>
  );
}

export default Applications;
