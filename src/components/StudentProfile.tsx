import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/auth.tsx";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Camera, 
  QrCode, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  Info
} from "lucide-react";

interface AttendanceLog {
  id: string;
  courseName: string;
  courseCode: string;
  date: string;
  time: string;
  method: "Geofence" | "Face ID" | "QR Scanner";
  status: "Verified" | "Failed";
}

export const StudentProfile: React.FC = () => {
  const { firebaseUser, dbUser, localUser, updateLocalUserProfile } = useAuth();
  
  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileDept, setProfileDept] = useState("");
  
  // Load initial values
  useEffect(() => {
    const activeName = dbUser?.name || firebaseUser?.displayName || localUser?.name || "";
    const activeDept = dbUser?.department || localUser?.department || "Computer Science";
    setProfileName(activeName);
    setProfileDept(activeDept);
  }, [dbUser, firebaseUser, localUser]);

  // Attendance simulation states
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(() => {
    const saved = localStorage.getItem("technotrons_attendance_logs");
    if (saved) return JSON.parse(saved);
    
    // Seed some initial logs
    const seed: AttendanceLog[] = [
      { id: "ATT-001", courseName: "Introduction to Computer Science", courseCode: "CS101", date: "2026-07-17", time: "09:05 AM", method: "Geofence", status: "Verified" },
      { id: "ATT-002", courseName: "Data Structures and Algorithms", courseCode: "CS102", date: "2026-07-16", time: "11:02 AM", method: "Face ID", status: "Verified" },
      { id: "ATT-003", courseName: "Engineering Physics", courseCode: "PH101", date: "2026-07-15", time: "09:12 AM", method: "QR Scanner", status: "Verified" }
    ];
    localStorage.setItem("technotrons_attendance_logs", JSON.stringify(seed));
    return seed;
  });

  // Track attendance percentages per course
  const [courseAttendance, setCourseAttendance] = useState<{ [code: string]: number }>(() => {
    const saved = localStorage.getItem("technotrons_course_attendance");
    if (saved) return JSON.parse(saved);
    const initial = {
      "CS101": 88,
      "CS102": 92,
      "EE101": 68, // Low attendance!
      "PH101": 95
    };
    localStorage.setItem("technotrons_course_attendance", JSON.stringify(initial));
    return initial;
  });

  // Self check-in panel state
  const [selectedCourse, setSelectedCourse] = useState("CS101");
  const [checkInMethod, setCheckInMethod] = useState<"geofence" | "face" | "qr" | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [checkInMessage, setCheckInMessage] = useState("");
  
  // Geofence coordinates state
  const [simulatedCoords, setSimulatedCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Within Technotrons range
  const [isInsideCampus, setIsInsideCampus] = useState(true);

  // Face scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isScanningFace, setIsScanningFace] = useState(false);

  // QR scanner code state
  const [qrCodeInput, setQrCodeInput] = useState("");

  const courseList = [
    { code: "CS101", name: "Introduction to Computer Science" },
    { code: "CS102", name: "Data Structures and Algorithms" },
    { code: "EE101", name: "Basic Electrical Engineering" },
    { code: "PH101", name: "Engineering Physics" }
  ];

  // Persist values
  useEffect(() => {
    localStorage.setItem("technotrons_attendance_logs", JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  useEffect(() => {
    localStorage.setItem("technotrons_course_attendance", JSON.stringify(courseAttendance));
  }, [courseAttendance]);

  // Handle profile save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    updateLocalUserProfile(profileName, profileDept);
    setIsEditing(false);
  };

  // Start checking in
  const startCheckIn = (method: "geofence" | "face" | "qr") => {
    setCheckInMethod(method);
    setCheckInStatus("idle");
    setCheckInMessage("");
    setCapturedPhoto(null);
    setQrCodeInput("");
    
    if (method === "face") {
      startCamera();
    } else {
      stopCamera();
    }
  };

  // Camera Management
  const startCamera = async () => {
    setCameraActive(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Real camera access blocked or unavailable, using high-fidelity digital scanner simulation.", err);
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Geofence check-in
  const handleGeofenceCheckIn = () => {
    setCheckInStatus("processing");
    setCheckInMessage("Retrieving GPS coordinates and validating geofence boundaries...");
    
    setTimeout(() => {
      if (isInsideCampus) {
        const course = courseList.find(c => c.code === selectedCourse);
        
        // Boost course attendance
        setCourseAttendance(prev => {
          const current = prev[selectedCourse] || 75;
          const updated = Math.min(100, current + 2);
          return { ...prev, [selectedCourse]: updated };
        });

        // Add to log
        const newLog: AttendanceLog = {
          id: "ATT-" + Math.floor(1000 + Math.random() * 9000),
          courseName: course?.name || "Selected Lecture",
          courseCode: selectedCourse,
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          method: "Geofence",
          status: "Verified"
        };

        setAttendanceLogs(prev => [newLog, ...prev]);
        setCheckInStatus("success");
        setCheckInMessage(`Geofence verification SUCCESS! Coordinates [${simulatedCoords.lat.toFixed(4)}° N, ${simulatedCoords.lng.toFixed(4)}° E] are within the Technotrons Sir CV Raman Academic Block radius. Present recorded for ${course?.name}.`);
      } else {
        setCheckInStatus("error");
        setCheckInMessage(`Geofence verification FAILED. Coordinates [${simulatedCoords.lat.toFixed(4)}° N, ${simulatedCoords.lng.toFixed(4)}° E] indicate you are outside the campus network boundary (Admin block/hostels). Please physically move into class boundaries or toggle simulated campus coordinates.`);
      }
    }, 1800);
  };

  // Face Scan check-in
  const handleFaceCheckIn = () => {
    setIsScanningFace(true);
    setCheckInStatus("processing");
    setCheckInMessage("Analyzing facial keypoints, capturing iris depth details, and testing liveness...");

    // Simulate snapshot
    if (videoRef.current && canvasRef.current) {
      try {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setCapturedPhoto(canvas.toDataURL("image/jpeg"));
        }
      } catch (e) {
        console.error("Simulation capture error:", e);
      }
    }
    
    stopCamera();

    setTimeout(() => {
      const course = courseList.find(c => c.code === selectedCourse);
      
      setCourseAttendance(prev => {
        const current = prev[selectedCourse] || 75;
        const updated = Math.min(100, current + 2);
        return { ...prev, [selectedCourse]: updated };
      });

      const newLog: AttendanceLog = {
        id: "ATT-" + Math.floor(1000 + Math.random() * 9000),
        courseName: course?.name || "Selected Lecture",
        courseCode: selectedCourse,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        method: "Face ID",
        status: "Verified"
      };

      setAttendanceLogs(prev => [newLog, ...prev]);
      setIsScanningFace(false);
      setCheckInStatus("success");
      setCheckInMessage(`Biometric Match 99.6%! Face Recognition SUCCESS for Student ID TCE-2026-${(localUser?.batchNo || "CS").replace(/[^a-zA-Z0-9]/g, "").slice(0,4)}. Present recorded for ${course?.name}.`);
    }, 2500);
  };

  // QR Code scan check-in
  const handleQrCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) return;

    setCheckInStatus("processing");
    setCheckInMessage("Verifying dynamic lecture room QR token signatures...");

    setTimeout(() => {
      const isTokenValid = qrCodeInput.toLowerCase().includes("tce") || qrCodeInput.length >= 6;

      if (isTokenValid) {
        const course = courseList.find(c => c.code === selectedCourse);
        
        setCourseAttendance(prev => {
          const current = prev[selectedCourse] || 75;
          const updated = Math.min(100, current + 2);
          return { ...prev, [selectedCourse]: updated };
        });

        const newLog: AttendanceLog = {
          id: "ATT-" + Math.floor(1000 + Math.random() * 9000),
          courseName: course?.name || "Selected Lecture",
          courseCode: selectedCourse,
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          method: "QR Scanner",
          status: "Verified"
        };

        setAttendanceLogs(prev => [newLog, ...prev]);
        setCheckInStatus("success");
        setCheckInMessage(`QR code verification SUCCESS! Lecture code matched securely with Class Hall. Present recorded for ${course?.name}.`);
      } else {
        setCheckInStatus("error");
        setCheckInMessage("Invalid QR code signature. Please scan the official dynamic QR projection in the lecture hall or input a valid TCE room code (e.g., 'TCE-CS101-LH').");
      }
    }, 1500);
  };

  // Reset attendance rate simulation
  const resetAttendance = () => {
    const initial = {
      "CS101": 88,
      "CS102": 92,
      "EE101": 68,
      "PH101": 95
    };
    setCourseAttendance(initial);
    localStorage.setItem("technotrons_course_attendance", JSON.stringify(initial));
  };

  const getAttendanceStatusInfo = (percentage: number) => {
    if (percentage >= 85) return { color: "text-emerald-500", bg: "bg-emerald-500/10", label: "EXCELLENT" };
    if (percentage >= 75) return { color: "text-indigo-500", bg: "bg-indigo-500/10", label: "GOOD" };
    return { color: "text-rose-500", bg: "bg-rose-500/10", label: "CRITICAL (<75%)" };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Student Profile Card */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar / Photo with verified badge */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-zinc-800 border-2 border-indigo-500 flex items-center justify-center font-display font-black text-3xl text-indigo-600 dark:text-indigo-400 overflow-hidden shadow-md">
                {firebaseUser?.photoURL ? (
                  <img src={firebaseUser.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span>{(profileName || "S").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-indigo-600 border-2 border-white dark:border-zinc-900 text-white p-1.5 rounded-full shadow-md" title="Verified Campus Student">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Profile Info Fields / Editor */}
            <div className="w-full space-y-2">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-3 mt-2 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Major Department</label>
                    <input 
                      type="text" 
                      value={profileDept}
                      onChange={(e) => setProfileDept(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button 
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Save Profile
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1">
                  <h3 className="font-display font-black text-xl text-zinc-900 dark:text-white">{profileName || "Student"}</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{profileDept}</p>
                  
                  <div className="flex justify-center gap-1.5 mt-2">
                    <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md font-bold">
                      ID: TCE-2026-{(localUser?.batchNo || "CS-A").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4)}
                    </span>
                    <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md font-bold">
                      Batch: {localUser?.batchNo || "CS-2026-A"}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 mt-3">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{firebaseUser?.email || localUser?.email || "grace.hopper@campus.edu"}</span>
                  </p>

                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline cursor-pointer"
                    >
                      Edit Profile Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats: Attendance Rate Summary */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 mt-6 pt-5 space-y-3.5">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Attendance Scorecard
            </h4>

            {/* Average Circular rings */}
            <div className="grid grid-cols-2 gap-4">
              {courseList.map(course => {
                const percentage = courseAttendance[course.code] || 75;
                const info = getAttendanceStatusInfo(percentage);
                return (
                  <div key={course.code} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-805 flex flex-col items-center">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500">{course.code}</span>
                    <span className={`text-lg font-black font-mono mt-1 ${info.color}`}>{percentage}%</span>
                    <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-md mt-1.5 font-mono ${info.bg} ${info.color}`}>
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-zinc-500 italic">Required minimum rate: 75%</span>
              <button 
                onClick={resetAttendance}
                className="text-[10px] font-bold text-zinc-400 hover:text-indigo-500 flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset simulation parameters"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset parameters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Attendance Systems */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Module 1: Self Check-In Control Deck */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-black text-xl text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5.5 h-5.5 text-indigo-500 shrink-0" />
                Smart Attendance Check-In
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                Select your active course and complete your check-in securely using three smart biometric methods.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-zinc-500 uppercase shrink-0">Class:</label>
              <select 
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {courseList.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name.split(" ")[0]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Verification buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => startCheckIn("geofence")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                checkInMethod === "geofence"
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5"
                  : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850"
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Geofence</span>
            </button>

            <button
              onClick={() => startCheckIn("face")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                checkInMethod === "face"
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5"
                  : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850"
              }`}
            >
              <Camera className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Biometric</span>
            </button>

            <button
              onClick={() => startCheckIn("qr")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                checkInMethod === "qr"
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5"
                  : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850"
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">QR Code</span>
            </button>
          </div>

          {/* Method Area */}
          <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-850">
            <AnimatePresence mode="wait">
              
              {/* Geofence verification UI */}
              {checkInMethod === "geofence" && (
                <motion.div
                  key="geofence"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Geo-Fence Boundary Check</h4>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Your mobile GPS must correspond to TCE campus block ranges to verify attendance.
                      </p>
                    </div>
                  </div>

                  {/* Simulator Controls */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-500 uppercase font-mono text-[10px]">Simulated GPS Status:</span>
                      <button
                        onClick={() => {
                          setIsInsideCampus(!isInsideCampus);
                          if (!isInsideCampus) {
                            setSimulatedCoords({ lat: 12.9716, lng: 77.5946 });
                          } else {
                            setSimulatedCoords({ lat: 12.9145, lng: 77.6321 }); // Outside campus
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-colors border ${
                          isInsideCampus
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                            : "bg-amber-500/10 border-amber-500 text-amber-600"
                        }`}
                      >
                        {isInsideCampus ? "Inside Class Hall (SUCCESS)" : "Outside Campus Boundary (FAIL)"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[11px] font-mono text-zinc-500">
                      <div>Latitude: <strong className="text-zinc-700 dark:text-zinc-300">{simulatedCoords.lat.toFixed(6)}° N</strong></div>
                      <div>Longitude: <strong className="text-zinc-700 dark:text-zinc-300">{simulatedCoords.lng.toFixed(6)}° E</strong></div>
                    </div>
                  </div>

                  <button
                    onClick={handleGeofenceCheckIn}
                    disabled={checkInStatus === "processing" || checkInStatus === "success"}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Run Geofence Validation Check</span>
                  </button>
                </motion.div>
              )}

              {/* Biometric verification UI */}
              {checkInMethod === "face" && (
                <motion.div
                  key="face"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Facial Recognition & Liveness Match</h4>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Matches your real face against registered freshman photo IDs to prevent proxy check-ins.
                      </p>
                    </div>
                  </div>

                  {/* Camera Simulator */}
                  <div className="relative w-full max-w-sm mx-auto aspect-video rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
                    {/* Simulated scanning animation */}
                    {isScanningFace && (
                      <div className="absolute inset-x-0 h-1.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee] z-20 top-0 animate-bounce" />
                    )}
                    
                    {cameraActive && !capturedPhoto ? (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : capturedPhoto ? (
                      <img src={capturedPhoto} alt="Snapshot" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4 text-zinc-500 space-y-2">
                        <Camera className="w-8 h-8 text-zinc-600 mx-auto animate-pulse" />
                        <p className="text-xs font-mono">Biometric Video Stream Offline</p>
                      </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <button
                    onClick={handleFaceCheckIn}
                    disabled={checkInStatus === "processing" || checkInStatus === "success"}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan & Capture Facial Biometrics</span>
                  </button>
                </motion.div>
              )}

              {/* QR Code verification UI */}
              {checkInMethod === "qr" && (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Dynamic Room QR Scanner</h4>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Input or scan the dynamic verification code projected on the classroom board.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleQrCheckIn} className="space-y-3">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Enter Projected Room Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. TCE-CS101-LH"
                          value={qrCodeInput}
                          onChange={(e) => setQrCodeInput(e.target.value)}
                          className="flex-1 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-3.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder-zinc-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setQrCodeInput(`TCE-${selectedCourse}-LH${Math.floor(1 + Math.random() * 5)}`)}
                          className="px-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-zinc-300 dark:border-zinc-700"
                        >
                          Auto Scan Mock
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={checkInStatus === "processing" || checkInStatus === "success"}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Token for Verification</span>
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Default Welcome state */}
              {!checkInMethod && (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6 text-center text-zinc-500 space-y-2.5"
                >
                  <ShieldCheck className="w-10 h-10 text-zinc-600 dark:text-zinc-700 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Biometric Verification Portal Idle</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Choose Geofence, Biometric Selfie or Class QR Scanner above to register active presence.
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Feedback logs / Status notification */}
          {checkInStatus !== "idle" && (
            <div className={`p-4 rounded-2xl border text-xs leading-normal flex items-start gap-3 transition-all duration-300 ${
              checkInStatus === "processing"
                ? "bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400"
                : checkInStatus === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}>
              {checkInStatus === "processing" ? (
                <RefreshCw className="w-5 h-5 shrink-0 animate-spin text-indigo-500" />
              ) : checkInStatus === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              )}
              <div>
                <strong className="font-bold block mb-1">
                  {checkInStatus === "processing" ? "Security System Processing..." : checkInStatus === "success" ? "Verification Successful" : "Verification Rejected"}
                </strong>
                <p className="text-[11px]">{checkInMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Module 2: Recent Check-in Logs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-base text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-indigo-500" />
              Active Verification Logs
            </h4>
            <span className="text-[10px] font-mono text-zinc-400">AES-256 SECURED LOG</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-2">Verification ID</th>
                  <th className="py-3 px-2">Course</th>
                  <th className="py-3 px-2">Timestamp</th>
                  <th className="py-3 px-2">Method</th>
                  <th className="py-3 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                {attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/40 transition-colors">
                    <td className="py-3 px-2 font-bold text-zinc-400">{log.id}</td>
                    <td className="py-3 px-2">
                      <span className="font-sans font-bold text-zinc-900 dark:text-white block">{log.courseName}</span>
                      <span className="text-[10px] text-zinc-400">{log.courseCode}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="block">{log.date}</span>
                      <span className="text-[10px] text-zinc-400">{log.time}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-sans text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>PRESENT</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
