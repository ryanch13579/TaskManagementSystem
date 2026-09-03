import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import BrandLogo from "../../assets/BrandLogo.jsx";
import { styles } from "./Login.styles";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      login(data.user);

      if (data.user.roles.includes("user")) {
        navigate("/applications");
      } else if (data.user.roles.includes("admin")) {
        navigate("/users");
      }
    } catch {
      setError("Could not reach the server");
    }
  };

  return (
    <div className={styles.page}>
      <BrandLogo className={styles.logo} />
      <h1 className={styles.title}>TASK MANAGEMENT SYSTEM</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>LOG IN</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>USERNAME</label>
            <div className={styles.inputWrapper}>
              <User className={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={styles.input}
              />
            </div>
          </div>

          <div>
            <label className={styles.label}>PASSWORD</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={styles.passwordInput}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitButton}>
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
