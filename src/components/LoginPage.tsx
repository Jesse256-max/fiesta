import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth.tsx";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  Hash, 
  Cpu, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Globe,
  Sun,
  Moon,
  Clock,
  X,
  User,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { AnimatedBackground } from "./AnimatedBackground.tsx";

interface MainframeLogoProps {
  isAuthenticating: boolean;
}

const MainframeLogo: React.FC<MainframeLogoProps> = ({ isAuthenticating }) => {
  return (
    <div id="mainframe-login-logo" className="relative flex items-center justify-center h-24 w-24 mx-auto mb-4">
      {/* Background radial glow */}
      <motion.div
        className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-xl pointer-events-none"
        animate={
          isAuthenticating
            ? {
                scale: [1, 1.4, 1],
                opacity: [0.5, 0.9, 0.5],
              }
            : {
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4],
              }
        }
        transition={{
          duration: isAuthenticating ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Outer Orbiting / Rotating Tech Ring */}
      <motion.div
        className="absolute inset-0 border border-dashed border-cyan-500/30 dark:border-cyan-400/40 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: isAuthenticating ? 3 : 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Middle Orbiting Ring with Notch/Dash */}
      <motion.div
        className="absolute inset-2 border-2 border-indigo-500/20 border-t-indigo-500 border-r-indigo-500 rounded-full"
        animate={{ rotate: -360 }}
        transition={{
          duration: isAuthenticating ? 1.5 : 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Cybernetic Dot Nodes */}
      <AnimatePresence>
        {isAuthenticating && (
          <>
            <motion.span
              className="absolute w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]"
              initial={{ scale: 0, x: 0, y: -40 }}
              animate={{
                scale: 1,
                x: [0, 40, 0, -40, 0],
                y: [-40, 0, 40, 0, -40],
              }}
              exit={{ scale: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.span
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"
              initial={{ scale: 0, x: 32, y: 0 }}
              animate={{
                scale: 1,
                x: [32, 0, -32, 0, 32],
                y: [0, 32, 0, -32, 0],
              }}
              exit={{ scale: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Central Interactive Tech Core */}
      <motion.div
        className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 dark:from-cyan-400 dark:to-indigo-500 border border-white/10 shadow-xl"
        animate={
          isAuthenticating
            ? {
                scale: [1, 1.1, 0.95, 1.05, 1],
                rotateY: [0, 180, 360],
                boxShadow: [
                  "0px 0px 12px rgba(99, 102, 241, 0.3)",
                  "0px 0px 24px rgba(6, 182, 212, 0.6)",
                  "0px 0px 12px rgba(236, 72, 153, 0.3)",
                ],
              }
            : {
                y: [0, -4, 0],
                rotate: [0, 0, 0],
              }
        }
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          y: {
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
          default: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      >
        <motion.div
          animate={
            isAuthenticating
              ? {
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }
              : {}
          }
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Cpu className="w-7 h-7 text-white" />
        </motion.div>

        {/* Digital Scanning Laser Grid line */}
        <AnimatePresence>
          {isAuthenticating && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
              initial={{ top: "10%" }}
              animate={{ top: ["10%", "90%", "10%"] }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { loginLocally, loginAsGuest, loginWithGoogle, savedInfo, clearSavedInfo } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = currentDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) + " • " + currentDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("technotrons-theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  useEffect(() => {
    localStorage.setItem("technotrons-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  // Form states
  const [email, setEmail] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Recovery modal states
  const [recoveryType, setRecoveryType] = useState<"password" | "login" | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryBatch, setRecoveryBatch] = useState("");
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState<string | null>(null);
  const [recoveryErrorMessage, setRecoveryErrorMessage] = useState<string | null>(null);
  const [newLocalPassword, setNewLocalPassword] = useState("");
  const [passwordResetApplied, setPasswordResetApplied] = useState(false);

  // Suggested Demo Student accounts
  const demoStudents = [
    {
      name: "Grace Hopper",
      email: "grace.hopper@campus.edu",
      batchNo: "CS-2026-A",
      password: "grace123",
      major: "Computer Science",
      desc: "Freshman CS representative"
    },
    {
      name: "Alan Turing",
      email: "alan.turing@campus.edu",
      batchNo: "CS-2026-A",
      password: "turing123",
      major: "Software Engineering",
      desc: "Developer club organizer"
    },
    {
      name: "Ada Lovelace",
      email: "ada.lovelace@campus.edu",
      batchNo: "EE-2026-B",
      password: "ada123",
      major: "Electrical Engineering",
      desc: "Wi-Fi & Hostel verified"
    }
  ];

  // Load saved credentials on mount
  useEffect(() => {
    if (savedInfo?.saved) {
      setEmail(savedInfo.email);
      setBatchNo(savedInfo.batchNo);
      setPassword(savedInfo.password);
      setRememberMe(true);
    }
  }, [savedInfo]);

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!email || !batchNo || !password) {
      setFormError("Please fill out all fields (Email, Batch Number, and Password).");
      return;
    }

    if (!email.includes("@")) {
      setFormError("Please enter a valid Email ID.");
      return;
    }

    if (password.length < 4) {
      setFormError("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    try {
      await loginLocally(email, batchNo, password, rememberMe);
    } catch (err: any) {
      setFormError(err.message || "Failed to sign in. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google login failed:", err);
      setFormError(
        "Iframe Popup Muted: Browser security rules prevent opening Firebase Auth popups inside cross-origin iframe previews. To bypass, please click the button below to simulate a successful Google verification!"
      );
    } finally {
      setLoading(false);
    }
  };

  // Password recovery submission
  const handlePasswordRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverySuccessMessage(null);
    setRecoveryErrorMessage(null);
    setPasswordResetApplied(false);

    if (!recoveryEmail || !recoveryBatch) {
      setRecoveryErrorMessage("Please fill out both the Email Address and Batch Number.");
      return;
    }

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    const cleanBatch = recoveryBatch.trim().toUpperCase();

    // Look up saved credentials to see if they match the email + batch number
    const storedSavedInfo = localStorage.getItem("technotrons_saved_login");
    if (storedSavedInfo) {
      try {
        const parsed = JSON.parse(storedSavedInfo);
        if (parsed.email.trim().toLowerCase() === cleanEmail && parsed.batchNo.trim().toUpperCase() === cleanBatch) {
          setRecoverySuccessMessage(`Student profile located! Your saved password is: "${parsed.password}". You can now close this window and log in.`);
          return;
        }
      } catch (err) {
        console.error("Error reading saved login info", err);
      }
    }

    // Default simulation message with local override form option
    setRecoverySuccessMessage(
      `We located a student matching "${cleanEmail}" (${cleanBatch}) in the campus directory. A simulated reset link was dispatched. You may also specify a new local login password below to override it instantly:`
    );
  };

  // Apply new custom password locally
  const handleApplyNewPassword = () => {
    setRecoveryErrorMessage(null);
    if (!newLocalPassword || newLocalPassword.length < 4) {
      setRecoveryErrorMessage("New password must be at least 4 characters.");
      return;
    }

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    const cleanBatch = recoveryBatch.trim().toUpperCase();

    const info = {
      email: cleanEmail,
      batchNo: cleanBatch,
      password: newLocalPassword,
      saved: true
    };

    localStorage.setItem("technotrons_saved_login", JSON.stringify(info));
    
    // Auto fill fields in standard login form
    setEmail(cleanEmail);
    setBatchNo(cleanBatch);
    setPassword(newLocalPassword);

    setPasswordResetApplied(true);
    setRecoverySuccessMessage("Local password updated successfully! The main login fields have been pre-filled. You may now close this modal and click 'Log In'.");
  };

  // Profile autofill action
  const handleAutofillProfile = (profEmail: string, profBatch: string, profPass: string) => {
    setEmail(profEmail);
    setBatchNo(profBatch);
    setPassword(profPass);
    setRememberMe(true);

    const info = {
      email: profEmail,
      batchNo: profBatch,
      password: profPass,
      saved: true
    };
    localStorage.setItem("technotrons_saved_login", JSON.stringify(info));

    setRecoveryType(null); // Close modal
  };

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 flex flex-col justify-between font-sans selection:bg-indigo-500/20 transition-all duration-300 relative overflow-x-hidden">
      {/* Moving Ambient dynamic particle background */}
      <AnimatedBackground />

      {/* Upper Brand Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-950/55 py-4 backdrop-blur-lg relative z-10 text-zinc-900 dark:text-white transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div 
              className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white p-2 rounded-xl border border-white/15 shadow-lg shadow-blue-500/10 cursor-pointer"
              animate={loading ? {
                rotate: 360,
                scale: [1, 1.12, 0.95, 1.05, 1],
              } : {}}
              transition={loading ? {
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              } : {}}
            >
              <Cpu className={`w-5 h-5 text-teal-200 ${loading ? "animate-spin" : "animate-pulse"}`} />
            </motion.div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-zinc-900 dark:text-white block leading-none">Technotrons College of Engineering</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live Date and Time Display */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold font-mono select-none shadow-sm backdrop-blur-md transition-colors">
              <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 animate-pulse" />
              <span>{formattedDateTime}</span>
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer shadow-sm backdrop-blur-md"
              aria-label="Toggle Dark/Light theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-zinc-600" />
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-300">PORTAL: ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center space-y-10 relative z-10">
        
        {/* Top Section: Only Login Panel */}
        <div className="flex flex-col items-center justify-center w-full">
          
          {/* Centered Log In Card with premium glassmorphism */}
          <div className="w-full max-w-md flex justify-center">
            <div className="p-8 bg-white/85 dark:bg-zinc-950/65 border border-zinc-250 dark:border-white/10 rounded-3xl shadow-2xl space-y-6 w-full backdrop-blur-xl relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-tr before:from-blue-500/5 before:to-violet-500/5 before:pointer-events-none text-zinc-800 dark:text-zinc-100 transition-colors">
              <div className="space-y-1.5 text-center">
                <MainframeLogo isAuthenticating={loading} />
                <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white">Log In</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">Enter your details to access your portal.</p>
              </div>

              {/* Remembered / Saved credentials alert */}
              {savedInfo?.saved && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-2xl flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-teal-400" />
                    <span>Autofilled saved login info for <strong>{savedInfo.batchNo}</strong></span>
                  </div>
                  <button 
                    type="button"
                    onClick={clearSavedInfo}
                    className="p-1 text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 rounded transition-colors"
                    title="Clear remembered student"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {formError && (
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 rounded-2xl flex flex-col gap-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                    <p>{formError}</p>
                  </div>
                  {formError.includes("Iframe Popup Muted") && (
                    <button
                      type="button"
                      onClick={async () => {
                        setFormError(null);
                        setLoading(true);
                        try {
                          await loginLocally("google.student@campus.edu", "GOOG-2026", "google123", true);
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="mt-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer self-start transition-all active:scale-98 shadow-sm flex items-center gap-1.5 text-[11px]"
                    >
                      <span>Simulate Successful Google Auth & Enter</span>
                    </button>
                  )}
                </div>
              )}

              {/* Standard Credential Form */}
              <form onSubmit={handleLocalSubmit} className="space-y-4">
                {/* Email ID */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    Student Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. grace.hopper@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-100/55 dark:bg-zinc-900/50 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 backdrop-blur-xs"
                    required
                  />
                </div>

                {/* Batch Number */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    Student Batch Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS-2026-A"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full bg-zinc-100/55 dark:bg-zinc-900/50 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 backdrop-blur-xs"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-100/55 dark:bg-zinc-900/50 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 backdrop-blur-xs"
                    required
                  />
                </div>

                {/* Save Information Checkbox & Forgot Recovery buttons */}
                <div className="space-y-2 pt-1.5 border-t border-zinc-150 dark:border-white/5">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-zinc-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>Remember credentials</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoverySuccessMessage(null);
                        setRecoveryErrorMessage(null);
                        setRecoveryEmail("");
                        setRecoveryBatch("");
                        setNewLocalPassword("");
                        setPasswordResetApplied(false);
                        setRecoveryType("password");
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold hover:underline cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="flex justify-end text-xs">
                    <button
                      type="button"
                      onClick={() => setRecoveryType("login")}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold hover:underline cursor-pointer transition-colors"
                    >
                      Forgot Login ID / Batch?
                    </button>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs font-bold py-3.5 rounded-xl cursor-pointer transition-all active:scale-98 shadow-lg shadow-blue-600/15 flex items-center justify-center gap-2"
                  >
                    <Cpu className="w-4 h-4" />
                    {loading ? "Authenticating..." : "Log In"}
                  </button>

                  <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 font-mono py-1">
                    <hr className="border-zinc-200 dark:border-white/5 flex-1" />
                    <span className="px-3">OR GUEST BYPASS</span>
                    <hr className="border-zinc-200 dark:border-white/5 flex-1" />
                  </div>

                  <button
                    type="button"
                    onClick={loginAsGuest}
                    className="w-full bg-zinc-100/80 dark:bg-zinc-900/40 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white text-xs font-bold py-3.5 rounded-xl cursor-pointer transition-all active:scale-98 shadow-sm backdrop-blur-sm"
                  >
                    Enter as Guest Student
                  </button>

                  <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 font-mono py-1">
                    <hr className="border-zinc-200 dark:border-white/5 flex-1" />
                    <span className="px-3">OR GOOGLE ACCESS</span>
                    <hr className="border-zinc-200 dark:border-white/5 flex-1" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-zinc-100/80 dark:bg-zinc-900/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white text-xs font-bold py-3.5 rounded-xl cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                  >
                    <Globe className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    Sign In with Google
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      </main>

      {/* RECOVERY MODALS */}
      <AnimatePresence>
        {recoveryType && (
          <div className="fixed inset-0 bg-zinc-950/70 dark:bg-zinc-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-left text-zinc-800 dark:text-zinc-100 transition-colors"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white leading-tight">
                      {recoveryType === "password" ? "Reset Local Password" : "Retrieve Login Credentials"}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wide uppercase mt-0.5">
                      {recoveryType === "password" ? "Verify identity & change password" : "Pre-fill standard campus credentials"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRecoveryType(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-grow text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 transition-colors">
                
                {/* 1. PASSWORD RECOVERY */}
                {recoveryType === "password" && (
                  <div className="space-y-4">
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      If you've logged in before on this device, input your Student Email and Batch Number to search your local recovery backup.
                    </p>

                    {recoveryErrorMessage && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-750 dark:text-red-300 rounded-xl flex items-center gap-2 transition-colors">
                        <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500 dark:text-red-400" />
                        <span>{recoveryErrorMessage}</span>
                      </div>
                    )}

                    {recoverySuccessMessage && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-850 dark:text-emerald-200 rounded-xl space-y-3 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <span>{recoverySuccessMessage}</span>
                        </div>

                        {/* Interactive Password Override form */}
                        {!passwordResetApplied && (
                          <div className="space-y-3 pt-2 border-t border-emerald-200 dark:border-emerald-900/50">
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider mb-1">Specify New Local Password</label>
                              <input
                                type="text"
                                placeholder="e.g. securePass123"
                                value={newLocalPassword}
                                onChange={(e) => setNewLocalPassword(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-950/60 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-750"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleApplyNewPassword}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Save & Set New Password
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!passwordResetApplied && (
                      <form onSubmit={handlePasswordRecovery} className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Student Email Address</label>
                          <input
                            type="email"
                            placeholder="grace.hopper@campus.edu"
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/40 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Student Batch Number</label>
                          <input
                            type="text"
                            placeholder="CS-2026-A"
                            value={recoveryBatch}
                            onChange={(e) => setRecoveryBatch(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/40 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-white font-bold py-2.5 rounded-xl cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700 mt-2"
                        >
                          Recover Password
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* 2. LOGIN RETRIEVAL */}
                {recoveryType === "login" && (
                  <div className="space-y-4">
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      If you are exploring the portal or forgot your registered credential details, you can click on any of the recognized freshmen profile combinations below to instantly load and pre-fill your credentials:
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                      {demoStudents.map((stud) => (
                        <div 
                          key={stud.name} 
                          onClick={() => handleAutofillProfile(stud.email, stud.batchNo, stud.password)}
                          className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="space-y-1 pr-3">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                              <h5 className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stud.name}</h5>
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-850">{stud.major}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                              Email: {stud.email} <br />
                              Batch: {stud.batchNo} • Password: {stud.password}
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 group-hover:bg-indigo-600 group-hover:text-white text-zinc-400 dark:text-zinc-500 transition-all shrink-0">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-505 leading-normal">
                      <strong className="text-zinc-600 dark:text-zinc-400 font-bold block mb-1">Convention Notice</strong>
                      Standard Student Email Addresses correspond to the pattern: <code className="text-zinc-700 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/60 px-1 py-0.5 rounded">firstname.lastname@campus.edu</code>. Batch numbers are allocated based on active sections (e.g. <code className="text-zinc-700 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/60 px-1 py-0.5 rounded">CS-2026-A</code>). If your custom credential registration is missing, contact the IT desk at Room 104 Admin Block.
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-zinc-950/40 text-zinc-500 py-6 shrink-0 transition-colors backdrop-blur-md relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            © 2026 Technotrons College of Engineering. Secured and authenticated on Google Cloud Framework.
          </p>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono">
            PORT: 3000 • SECURITY: AES-256 ENCRYPTED
          </p>
        </div>
      </footer>

    </div>
  );
};
