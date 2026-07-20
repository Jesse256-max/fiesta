import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./lib/auth.tsx";
import { motion, AnimatePresence } from "motion/react";
import { EventCard } from "./components/EventCard.tsx";
import { ClubList } from "./components/ClubList.tsx";
import { FacultyList } from "./components/FacultyList.tsx";
import { Checklist } from "./components/Checklist.tsx";
import { Timetable } from "./components/Timetable.tsx";
import { CampusMap } from "./components/CampusMap.tsx";
import { AiRecommendations } from "./components/AiRecommendations.tsx";
import { FeedbackForm } from "./components/FeedbackForm.tsx";
import { SettingsPanel } from "./components/SettingsPanel.tsx";
import { NotificationManager } from "./components/NotificationManager.tsx";
import { LoginPage } from "./components/LoginPage.tsx";
import { SupportPanel } from "./components/SupportPanel.tsx";
import { AiCreativeHub } from "./components/AiCreativeHub.tsx";
import { AnimatedBackground } from "./components/AnimatedBackground.tsx";
import { ChatBot } from "./components/ChatBot.tsx";
import { StudentProfile } from "./components/StudentProfile.tsx";
import { CampusAdministration } from "./components/CampusAdministration.tsx";
import { CampusNewsList } from "./components/CampusNewsList.tsx";
import { User, Building2, Newspaper } from "lucide-react";
import { CampusEvent, Club, FacultyMember, ChecklistItem, TimetableCourse, DashboardWidget } from "./types.ts";

const containerVariants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      staggerChildren: 0.08,
      duration: 0.25,
      ease: "easeInOut"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15 
    } 
  }
};

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 120, 
      damping: 18,
      staggerChildren: 0.05
    } 
  },
  exit: { 
    opacity: 0, 
    y: -15, 
    transition: { 
      duration: 0.15,
      ease: "easeInOut"
    } 
  }
};

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 1, title: "Submit Original Certificates", description: "Submit standard qualifications to Academic Block", category: "Academic", isRequired: true, stepOrder: 1, completed: false },
  { id: 2, title: "Collect Campus ID Card", description: "Obtain student ID card from Admin Office, Room 102", category: "Admin", isRequired: true, stepOrder: 2, completed: false },
  { id: 3, title: "Hostel Room Allocation", description: "Collect your room keys from Warden Office", category: "Hostel", isRequired: false, stepOrder: 3, completed: false },
  { id: 4, title: "Activate Campus Email & Wi-Fi", description: "Register MAC address at IT Helpdesk", category: "IT", isRequired: true, stepOrder: 4, completed: false },
  { id: 5, title: "Library Card Registration", description: "Activate access at the Central Library desk", category: "Library", isRequired: false, stepOrder: 5, completed: false }
];

const DEFAULT_TIMETABLE: TimetableCourse[] = [
  { id: 1, courseCode: "CS101", courseName: "Introduction to Computer Science", facultyId: 1, dayOfWeek: "Monday", startTime: "09:00", endTime: "10:30", location: "Lecture Hall A", cohort: "CS-A", isSubscribed: true },
  { id: 2, courseCode: "CS101", courseName: "Introduction to Computer Science", facultyId: 1, dayOfWeek: "Wednesday", startTime: "09:00", endTime: "10:30", location: "Lecture Hall A", cohort: "CS-A", isSubscribed: true },
  { id: 3, courseCode: "CS102", courseName: "Data Structures and Algorithms", facultyId: 2, dayOfWeek: "Tuesday", startTime: "11:00", endTime: "12:30", location: "Lecture Hall B", cohort: "CS-A", isSubscribed: true },
  { id: 4, courseCode: "CS102", courseName: "Data Structures and Algorithms", facultyId: 2, dayOfWeek: "Thursday", startTime: "11:00", endTime: "12:30", location: "Lecture Hall B", cohort: "CS-A", isSubscribed: true },
  { id: 5, courseCode: "EE101", courseName: "Basic Electrical Engineering", facultyId: 3, dayOfWeek: "Monday", startTime: "14:00", endTime: "15:30", location: "Seminar Room 1", cohort: "CS-A", isSubscribed: false },
  { id: 6, courseCode: "EE101", courseName: "Basic Electrical Engineering", facultyId: 3, dayOfWeek: "Wednesday", startTime: "14:00", endTime: "15:30", location: "Seminar Room 1", cohort: "CS-A", isSubscribed: false },
  { id: 7, courseCode: "PH101", courseName: "Engineering Physics", facultyId: 4, dayOfWeek: "Tuesday", startTime: "09:00", endTime: "10:30", location: "Physics Lab", cohort: "CS-A", isSubscribed: false },
  { id: 8, courseCode: "PH101", courseName: "Engineering Physics", facultyId: 4, dayOfWeek: "Friday", startTime: "09:00", endTime: "10:30", location: "Physics Lab", cohort: "CS-A", isSubscribed: false }
];

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "news-ticker", title: "Latest News Ticker", description: "Horizontal campus announcement alerts", enabled: true },
  { id: "welcome-banner", title: "Welcome & Checklist Progress", description: "Checklist progress metrics and welcome banner", enabled: true },
  { id: "quick-links", title: "Quick Links Panel", description: "Direct portal links to library, wifi and transport", enabled: true },
  { id: "featured-event", title: "Featured Event Poster", description: "Nano Banana Welcome mixer and high-priority mixer highlights", enabled: true },
  { id: "campus-news", title: "Campus News & Announcements", description: "Recent university announcements and highlights", enabled: true },
  { id: "faculty-spotlight", title: "Faculty Spotlight", description: "Academic leaders and professor profile shortcuts", enabled: true },
  { id: "ai-recommendations", title: "AI Recommendations", description: "Tailored club and study suggestions via active preferences", enabled: true },
  { id: "upcoming-events", title: "Upcoming Campus Events", description: "Freshman orientation sessions and interactive schedules", enabled: true },
  { id: "student-clubs", title: "Student Clubs Hub", description: "Active developer societies and university organizations", enabled: true },
  { id: "feedback-board", title: "Student Feedback Forum", description: "Submit thoughts directly to TCE academic deans", enabled: true },
];

import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  CheckSquare,
  Users,
  LogOut,
  LogIn,
  Info,
  Phone,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  Star,
  MapPin,
  Menu,
  X,
  Map,
  Cpu,
  Sun,
  Moon,
  Settings,
  Wifi,
  Home,
  Bus,
  ExternalLink,
  Check,
  Search,
  Trash2,
  Building,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const NewsTicker: React.FC = () => {
  const newsAlerts = [
    "📢 Welcome freshmen! Orientation events and icebreaker socials are happening across campus now.",
    "🥛 Banana Milkshake party starts tonight at 7:00 PM in the Sports Arena - don't miss out!",
    "📶 High-speed Campus Wi-Fi 6E is now available; register your MAC address in the Checklist tab.",
    "🔑 Hostel key pick-up is active at the Admin Block (Ground Floor) until 6:00 PM daily.",
    "🧠 Get intelligent answers, walking paths, and office hours dynamically from the Gemini AI Chatbot!"
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % newsAlerts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      variants={itemVariants}
      className="col-span-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden"
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Campus Alerts Ticker</span>
      </div>
      <div className="flex-1 overflow-hidden text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 text-center sm:text-left">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="truncate leading-relaxed"
          >
            {newsAlerts[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex gap-1.5 shrink-0 self-center">
        {newsAlerts.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === index ? 'bg-indigo-500 w-3.5' : 'bg-zinc-200 dark:bg-zinc-800'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
};

interface QuickLinksProps {
  setActiveTab: (tab: any) => void;
  onChecklistUpdate: () => void;
  checklistItems: ChecklistItem[];
}

const QuickLinks: React.FC<QuickLinksProps> = ({ setActiveTab, onChecklistUpdate, checklistItems }) => {
  const { token, firebaseUser, localUser, loginWithGoogle } = useAuth();
  const [activeModal, setActiveModal] = useState<"calendar" | "wifi" | "hostel" | "library" | "shuttle" | null>(null);

  // States for Wi-Fi Registry
  const [wifiDeviceType, setWifiDeviceType] = useState("Laptop");
  const [wifiDeviceName, setWifiDeviceName] = useState("");
  const [wifiMac, setWifiMac] = useState("");
  const [registeredWifi, setRegisteredWifi] = useState<{ id: string; name: string; type: string; mac: string; date: string }[]>(() => {
    const saved = localStorage.getItem("technotrons_registered_wifi");
    return saved ? JSON.parse(saved) : [];
  });

  // States for Hostel booking
  const [hostelBlock, setHostelBlock] = useState("Block A (Male, CS & IT)");
  const [hostelRoomType, setHostelRoomType] = useState("Double Sharing");
  const [hostelAc, setHostelAc] = useState("Non-AC");
  const [hostelMeal, setHostelMeal] = useState("Regular Indian/Continental");
  const [hostelRoommate, setHostelRoommate] = useState("");
  const [hostelBooking, setHostelBooking] = useState<{ block: string; roomType: string; ac: string; meal: string; roomNo: string; date: string } | null>(() => {
    const saved = localStorage.getItem("technotrons_hostel_booking");
    return saved ? JSON.parse(saved) : null;
  });

  // States for Library Access
  const [libraryRegistered, setLibraryRegistered] = useState<boolean>(() => {
    const saved = localStorage.getItem("technotrons_library_registered");
    return saved === "true";
  });
  const [libraryBarcode, setLibraryBarcode] = useState<string>(() => {
    const saved = localStorage.getItem("technotrons_library_barcode");
    if (saved) return saved;
    const generated = "TCE-LIB-" + Math.floor(100000 + Math.random() * 900000);
    localStorage.setItem("technotrons_library_barcode", generated);
    return generated;
  });
  const [librarySearch, setLibrarySearch] = useState("");
  const [borrowedBooks, setBorrowedBooks] = useState<{ id: number; title: string; author: string; returnDate: string }[]>(() => {
    const saved = localStorage.getItem("technotrons_library_borrowed");
    return saved ? JSON.parse(saved) : [];
  });

  // Library catalog mockup
  const libraryCatalog = [
    { id: 1, title: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest, Stein", category: "Computer Science" },
    { id: 2, title: "Data Structures & Algorithm Analysis in C++", author: "Mark Allen Weiss", category: "Computer Science" },
    { id: 3, title: "University Physics", author: "Sears and Zemansky", category: "Physics" },
    { id: 4, title: "Calculus: Early Transcendentals", author: "James Stewart", category: "Mathematics" },
    { id: 5, title: "Basic Electrical Engineering", author: "D. P. Kothari", category: "Electrical" },
    { id: 6, title: "The Clean Coder", author: "Robert C. Martin", category: "Software Engineering" },
  ];

  // States for Shuttle tracking
  const [shuttles, setShuttles] = useState([
    { id: "A", name: "Route Blue (Academic Block Loop)", eta: 3, status: "Active", capacity: "80%" },
    { id: "B", name: "Route Gold (Hostel-Library Shuttle)", eta: 6, status: "Active", capacity: "35%" },
    { id: "C", name: "Route Green (Sports Complex Express)", eta: 11, status: "Active", capacity: "15%" },
  ]);

  // Shuttle ETA countdown effect
  useEffect(() => {
    if (activeModal !== "shuttle") return;
    const timer = setInterval(() => {
      setShuttles(prev => prev.map(sh => {
        let nextEta = sh.eta - 1;
        if (nextEta < 1) nextEta = Math.floor(8 + Math.random() * 10);
        return { ...sh, eta: nextEta };
      }));
    }, 15000);
    return () => clearInterval(timer);
  }, [activeModal]);

  // Helper to mark checklist item as completed
  const completeChecklistItem = async (itemId: number) => {
    try {
      if (token) {
        const response = await fetch(`/api/checklist/${itemId}/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: true }),
        });
        if (!response.ok) {
          throw new Error("Failed to update item on server");
        }
      } else {
        const stored = localStorage.getItem("technotrons_local_checklist");
        if (stored) {
          const list = JSON.parse(stored) as ChecklistItem[];
          const updated = list.map(i => i.id === itemId ? { ...i, completed: true } : i);
          localStorage.setItem("technotrons_local_checklist", JSON.stringify(updated));
        }
      }
      onChecklistUpdate();
    } catch (err) {
      console.error("Error marking checklist item completed:", err);
    }
  };

  // MAC formatting helper
  const handleMacChange = (val: string) => {
    const cleaned = val.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    const formatted = cleaned.match(/.{1,2}/g)?.join(":") || cleaned;
    setWifiMac(formatted.slice(0, 17));
  };

  // Register Wi-Fi handler
  const handleWifiRegister = () => {
    if (!wifiDeviceName.trim()) {
      alert("Please enter a device name.");
      return;
    }
    const macRegex = /^([0-9A-FA-F]{2}[:-]){5}([0-9A-FA-F]{2})$/;
    if (!macRegex.test(wifiMac)) {
      alert("Please enter a valid MAC address (e.g., AA:BB:CC:DD:EE:FF).");
      return;
    }

    const newDevice = {
      id: "DEV-" + Math.floor(1000 + Math.random() * 9000),
      name: wifiDeviceName,
      type: wifiDeviceType,
      mac: wifiMac,
      date: new Date().toLocaleDateString(),
    };

    const updatedDevices = [...registeredWifi, newDevice];
    setRegisteredWifi(updatedDevices);
    localStorage.setItem("technotrons_registered_wifi", JSON.stringify(updatedDevices));
    setWifiDeviceName("");
    setWifiMac("");

    // Complete checklist milestone 4 (Wi-Fi Activation)
    completeChecklistItem(4);
  };

  // Remove registered Wi-Fi device
  const handleWifiRemove = (id: string) => {
    const updated = registeredWifi.filter(d => d.id !== id);
    setRegisteredWifi(updated);
    localStorage.setItem("technotrons_registered_wifi", JSON.stringify(updated));
  };

  // Submit Hostel Booking
  const handleHostelSubmit = () => {
    const assignedRoom = hostelBlock.charAt(6) + "-" + Math.floor(100 + Math.random() * 400);
    const booking = {
      block: hostelBlock,
      roomType: hostelRoomType,
      ac: hostelAc,
      meal: hostelMeal,
      roomNo: assignedRoom,
      date: new Date().toLocaleDateString(),
    };
    setHostelBooking(booking);
    localStorage.setItem("technotrons_hostel_booking", JSON.stringify(booking));

    // Complete checklist milestone 3 (Hostel Room Allocation)
    completeChecklistItem(3);
  };

  // Register Library Account
  const handleLibraryRegister = () => {
    setLibraryRegistered(true);
    localStorage.setItem("technotrons_library_registered", "true");
    // Complete checklist milestone 5 (Library Card Registration)
    completeChecklistItem(5);
  };

  // Borrow Book Handler
  const handleBorrowBook = (book: typeof libraryCatalog[0]) => {
    if (!libraryRegistered) {
      alert("Please activate your library card registration first!");
      return;
    }
    if (borrowedBooks.find(b => b.id === book.id)) {
      alert("You have already borrowed this book!");
      return;
    }

    const returnD = new Date();
    returnD.setDate(returnD.getDate() + 14);

    const newBorrow = {
      id: book.id,
      title: book.title,
      author: book.author,
      returnDate: returnD.toLocaleDateString(),
    };

    const updated = [...borrowedBooks, newBorrow];
    setBorrowedBooks(updated);
    localStorage.setItem("technotrons_library_borrowed", JSON.stringify(updated));
  };

  // Return Book Handler
  const handleReturnBook = (id: number) => {
    const updated = borrowedBooks.filter(b => b.id !== id);
    setBorrowedBooks(updated);
    localStorage.setItem("technotrons_library_borrowed", JSON.stringify(updated));
  };

  // Academic Calendar state
  const [calendarTab, setCalendarTab] = useState<"semesters" | "exams" | "holidays">("semesters");

  const calendarEvents = {
    semesters: [
      { date: "Aug 03, 2026", title: "Commencement of Fall Semester 2026", desc: "First-day induction and introductory classes for all branches" },
      { date: "Oct 12, 2026", title: "Mid-Term Review & Feedback", desc: "Course progressions evaluations and syllabus auditing" },
      { date: "Dec 14, 2026", title: "End-Term Semester Exams Begin", desc: "Academic assessments scheduled across all designated blocks" },
      { date: "Jan 11, 2027", title: "Commencement of Spring Semester 2027", desc: "Resumption of theoretical and practical campus courses" },
    ],
    exams: [
      { date: "Oct 12-16, 2026", title: "Mid-Term Examination Week", desc: "Sessional assessments for core major programs" },
      { date: "Dec 07-11, 2026", title: "Practical & Laboratory Exams", desc: "Demonstrations, viva voce, and laboratory testing" },
      { date: "Dec 14-23, 2026", title: "End-Term Theory Exams", desc: "Final written examinations at exam centers" },
    ],
    holidays: [
      { date: "Sep 07, 2026", title: "Labor Day Holiday", desc: "No academic lectures scheduled; campus facilities open" },
      { date: "Nov 11, 2026", title: "Veterans Day Recess", desc: "Full administrative and instructional recess" },
      { date: "Nov 23-27, 2026", title: "Thanksgiving & Autumn recess", desc: "One-week recess for students and academic faculty staff" },
    ]
  };

  const links = [
    { key: "calendar", title: "Academic Calendar 2026", desc: "Key academic terms & exam timetables", icon: Calendar, color: "text-indigo-500 bg-indigo-500/10" },
    { key: "wifi", title: "Campus Wi-Fi Registry", desc: "Register MAC address for gigabit internet", icon: Wifi, color: "text-emerald-500 bg-emerald-500/10" },
    { key: "hostel", title: "Hostel Allocation Form", desc: "Select rooms, roommates & amenities", icon: Home, color: "text-pink-500 bg-pink-500/10" },
    { key: "library", title: "Digital Library Access", desc: "Log in to academic journals and books", icon: BookOpen, color: "text-cyan-500 bg-cyan-500/10" },
    { key: "shuttle", title: "Shuttle Bus Schedule", desc: "Real-time bus tracking and schedules", icon: Bus, color: "text-amber-500 bg-amber-500/10" },
  ];

  const registrationIds = [3, 4, 5];
  const pendingCount = checklistItems.filter(item => registrationIds.includes(item.id) && !item.completed).length;

  return (
    <>
      <motion.div
        variants={itemVariants}
        className="col-span-12 md:col-span-5 lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4"
      >
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-base text-zinc-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Quick Links Portal
            </h4>
            <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono border transition-all duration-300 ${
              pendingCount > 0
                ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
            }`}>
              {pendingCount > 0 ? `${pendingCount} PENDING` : "ALL COMPLETED"}
            </div>
          </div>
          <div className="space-y-2.5">
            {links.map((link) => {
              const Icon = link.icon;
              
              const getLinkStatus = (key: string) => {
                if (key === "wifi") {
                  const item = checklistItems.find(i => i.id === 4);
                  return item?.completed ? "Completed" : "Pending";
                }
                if (key === "hostel") {
                  const item = checklistItems.find(i => i.id === 3);
                  return item?.completed ? "Completed" : "Pending";
                }
                if (key === "library") {
                  const item = checklistItems.find(i => i.id === 5);
                  return item?.completed ? "Completed" : "Pending";
                }
                return null;
              };

              const status = getLinkStatus(link.key);

              return (
                <button
                  key={link.key}
                  onClick={() => {
                    if (!firebaseUser && !localUser) {
                      alert("Please sign in first to access Quick Links tools!");
                      loginWithGoogle();
                      return;
                    }
                    setActiveModal(link.key as any);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-105 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition-all cursor-pointer group"
                >
                  <div className={`w-8 h-8 rounded-lg ${link.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1 min-w-0 truncate">
                        <span className="truncate">{link.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </p>
                      {status && (
                        <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-md shrink-0 border ${
                          status === "Completed"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-800/40"
                        }`}>
                          {status}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate leading-normal">{link.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center font-mono uppercase tracking-widest pt-2 border-t border-zinc-100 dark:border-zinc-800">
          TCE Single Sign-On Active
        </div>
      </motion.div>

      {/* --- QUICK LINK MODALS --- */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center">
                    {activeModal === "calendar" && <Calendar className="w-5 h-5" />}
                    {activeModal === "wifi" && <Wifi className="w-5 h-5" />}
                    {activeModal === "hostel" && <Home className="w-5 h-5" />}
                    {activeModal === "library" && <BookOpen className="w-5 h-5" />}
                    {activeModal === "shuttle" && <Bus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white leading-tight">
                      {activeModal === "calendar" && "Academic Calendar 2026"}
                      {activeModal === "wifi" && "Campus Wi-Fi Registry"}
                      {activeModal === "hostel" && "Hostel Allocation Form"}
                      {activeModal === "library" && "Digital Library Access"}
                      {activeModal === "shuttle" && "Shuttle Bus Tracking Console"}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wide uppercase mt-0.5">
                      {activeModal === "calendar" && "Official schedules and holidays"}
                      {activeModal === "wifi" && "Register device hardware addresses"}
                      {activeModal === "hostel" && "Room booking & roommate configurations"}
                      {activeModal === "library" && "Central research catalog & registration"}
                      {activeModal === "shuttle" && "Real-time updates & routes telemetry"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-grow">

                {/* 1. CALENDAR MODAL */}
                {activeModal === "calendar" && (
                  <div className="space-y-5">
                    {/* Tabs */}
                    <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80">
                      {(["semesters", "exams", "holidays"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setCalendarTab(tab)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                            calendarTab === tab
                              ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400 border border-zinc-200/20 dark:border-zinc-800/20"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Timeline */}
                    <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 pl-6 space-y-5">
                      {calendarEvents[calendarTab].map((ev, index) => (
                        <div key={index} className="relative">
                          {/* Dot */}
                          <span className="absolute -left-10 top-1.5 flex h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10 dark:ring-indigo-500/20" />
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{ev.date}</span>
                            <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white leading-normal">{ev.title}</h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{ev.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. WIFI REGISTRY MODAL */}
                {activeModal === "wifi" && (
                  <div className="space-y-6">
                    {/* Register Form */}
                    <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 bg-zinc-50/50 dark:bg-zinc-950/20">
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-emerald-500" />
                        Register New Device
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Device Type</label>
                          <select
                            value={wifiDeviceType}
                            onChange={(e) => setWifiDeviceType(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option>Laptop</option>
                            <option>Smartphone</option>
                            <option>Tablet</option>
                            <option>Smart Watch</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Device Name</label>
                          <input
                            type="text"
                            placeholder="e.g. My Macbook Air"
                            value={wifiDeviceName}
                            onChange={(e) => setWifiDeviceName(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Hardware MAC Address</label>
                          <input
                            type="text"
                            placeholder="AA:BB:CC:DD:EE:FF"
                            value={wifiMac}
                            onChange={(e) => handleMacChange(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleWifiRegister}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-emerald-700 shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Authorize & Register Device
                      </button>
                    </div>

                    {/* Registered Devices List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Authorized Devices ({registeredWifi.length})</h4>
                      {registeredWifi.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center space-y-2">
                          <AlertCircle className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">No authorized devices detected on Campus Network.</p>
                          <p className="text-[10px] text-zinc-400 font-mono">Checklist Step "Activate Campus Email & Wi-Fi" remains incomplete.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {registeredWifi.map((dev) => (
                            <div key={dev.id} className="flex items-center justify-between p-3.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                                  {dev.type.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{dev.name}</h5>
                                    <span className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">{dev.type}</span>
                                  </div>
                                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">MAC: {dev.mac} • Reg: {dev.date}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleWifiRemove(dev.id)}
                                className="text-zinc-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                                title="Revoke Device Access"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. HOSTEL ALLOCATION MODAL */}
                {activeModal === "hostel" && (
                  <div className="space-y-6">
                    {hostelBooking ? (
                      /* Successful Booking Voucher */
                      <div className="p-6 border border-indigo-200/50 dark:border-indigo-500/20 bg-indigo-500/5 rounded-2xl space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner border border-emerald-500/20">
                          <CheckCircle2 className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="font-display font-black text-lg text-zinc-900 dark:text-white leading-tight">Hostel Allocated Successfully!</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">Your room registration is completed and approved. Pick up room keys from the Warden's Office.</p>
                        </div>
                        <div className="max-w-md mx-auto grid grid-cols-2 gap-3.5 border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 rounded-xl text-left shadow-sm">
                          <div>
                            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Assigned Room</span>
                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">{hostelBooking.roomNo}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Hostel Block</span>
                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{hostelBooking.block.split(" ")[1]}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Room Configuration</span>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{hostelBooking.roomType} ({hostelBooking.ac})</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Meal Plan Option</span>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block">{hostelBooking.meal}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setHostelBooking(null);
                            localStorage.removeItem("technotrons_hostel_booking");
                          }}
                          className="text-xs font-bold text-red-500 hover:text-red-400 hover:underline cursor-pointer"
                        >
                          Cancel Booking & Book New Room
                        </button>
                      </div>
                    ) : (
                      /* Booking Form */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Hostel Block</label>
                            <select
                              value={hostelBlock}
                              onChange={(e) => setHostelBlock(e.target.value)}
                              className="w-full bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option>Block A (Male, CS & IT)</option>
                              <option>Block B (Male, EE & ME)</option>
                              <option>Block C (Female, All branches)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Room Occupancy</label>
                            <select
                              value={hostelRoomType}
                              onChange={(e) => setHostelRoomType(e.target.value)}
                              className="w-full bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option>Single Occupancy</option>
                              <option>Double Sharing</option>
                              <option>Quad Sharing</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">AC / Ventilation Mode</label>
                            <select
                              value={hostelAc}
                              onChange={(e) => setHostelAc(e.target.value)}
                              className="w-full bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option>Non-AC</option>
                              <option>AC (Comfort Pack)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Meal/Catering Choice</label>
                            <select
                              value={hostelMeal}
                              onChange={(e) => setHostelMeal(e.target.value)}
                              className="w-full bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                            >
                              <option>Regular Indian/Continental</option>
                              <option>Vegetarian Premium</option>
                              <option>Elite/Healthy Gym Mess</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Roommate Preference (Optional)</label>
                            <input
                              type="text"
                              placeholder="Enter friend's full name or registration number"
                              value={hostelRoommate}
                              onChange={(e) => setHostelRoommate(e.target.value)}
                              className="w-full bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleHostelSubmit}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-all border border-indigo-700 shadow-md cursor-pointer text-center flex items-center justify-center gap-2"
                        >
                          <Building className="w-4.5 h-4.5" />
                          Confirm Hostel Room Booking
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. DIGITAL LIBRARY ACCESS MODAL */}
                {activeModal === "library" && (
                  <div className="space-y-6">
                    {/* Active Account Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide">Library Card Status</span>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${libraryRegistered ? "bg-emerald-500" : "bg-red-500"}`} />
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{libraryRegistered ? "Active Registration" : "Not Registered"}</span>
                        </div>
                        {libraryRegistered && <p className="text-[10px] font-mono text-indigo-500 font-bold mt-1">ID: {libraryBarcode}</p>}
                      </div>
                      {!libraryRegistered && (
                        <button
                          onClick={handleLibraryRegister}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all border border-indigo-700 shadow-md cursor-pointer shrink-0"
                        >
                          Activate Library Card & Account
                        </button>
                      )}
                    </div>

                    {/* Book catalog search */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Academic Catalogue</h4>
                        <div className="relative w-48 sm:w-64 shrink-0">
                          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Filter catalog..."
                            value={librarySearch}
                            onChange={(e) => setLibrarySearch(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto">
                        {libraryCatalog
                          .filter(b => b.title.toLowerCase().includes(librarySearch.toLowerCase()) || b.author.toLowerCase().includes(librarySearch.toLowerCase()))
                          .map((b) => {
                            const isBorrowed = borrowedBooks.some(bb => bb.id === b.id);
                            return (
                              <div key={b.id} className="flex items-center justify-between p-3 border border-zinc-150 dark:border-zinc-855 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                                <div className="min-w-0 flex-1 pr-3">
                                  <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{b.title}</h5>
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{b.author}</p>
                                  <span className="text-[8px] font-mono bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{b.category}</span>
                                </div>
                                <button
                                  onClick={() => handleBorrowBook(b)}
                                  disabled={!libraryRegistered || isBorrowed}
                                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                                    isBorrowed
                                      ? "bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400 cursor-not-allowed"
                                      : !libraryRegistered
                                      ? "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-500"
                                      : "bg-indigo-600 hover:bg-indigo-500 border-indigo-700 text-white"
                                  }`}
                                >
                                  {isBorrowed ? "Borrowed" : "Borrow E-Book"}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Borrowed items shelf */}
                    {libraryRegistered && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">My Borrowed E-Books ({borrowedBooks.length})</h4>
                        {borrowedBooks.length === 0 ? (
                          <p className="text-[11px] text-zinc-400 text-center py-4 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">No books borrowed currently.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {borrowedBooks.map((bb) => (
                              <div key={bb.id} className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-2">
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{bb.title}</h5>
                                  <p className="text-[9px] text-zinc-400 truncate mt-0.5">Due by: {bb.returnDate}</p>
                                </div>
                                <button
                                  onClick={() => handleReturnBook(bb.id)}
                                  className="self-end text-[9px] font-bold text-red-500 hover:text-red-400 cursor-pointer"
                                >
                                  Return Book
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. SHUTTLE BUS TRACKING MODAL */}
                {activeModal === "shuttle" && (
                  <div className="space-y-6">
                    {/* Live Tracker Animation */}
                    <div className="relative border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-6 rounded-2xl overflow-hidden shadow-inner h-[150px] flex flex-col justify-between">
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[9px] uppercase font-bold rounded-full">
                          <span className="animate-ping h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block mr-1" />
                          Live Tracking Active
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">TCE Commuter Services</span>
                      </div>

                      {/* Visual Shuttle Track line */}
                      <div className="relative h-1 w-full bg-zinc-800 rounded-full my-4 flex justify-between items-center z-10">
                        <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full border border-zinc-950" title="Main Gate" />
                        <div className="absolute top-1/2 left-[45%] -translate-y-1/2 w-3 h-3 bg-pink-500 rounded-full border border-zinc-950" title="Hostel Blocks" />
                        <div className="absolute top-1/2 left-[80%] -translate-y-1/2 w-3 h-3 bg-cyan-500 rounded-full border border-zinc-950" title="Academic Block" />
                        
                        {/* Interactive Shuttle icon animation */}
                        <div className="absolute top-1/2 -translate-y-1/2 animate-pulse flex flex-col items-center gap-1 bg-indigo-600 text-white p-1 rounded-md shadow-lg border border-indigo-400/20" style={{ left: "30%" }}>
                          <Bus className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono relative z-10">
                        <span>Main Gate</span>
                        <span>Hostel blocks</span>
                        <span>Academic block</span>
                      </div>
                    </div>

                    {/* Shuttle Timetable & ETAs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Active Shuttle ETAs</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {shuttles.map((sh) => (
                          <div key={sh.id} className="flex items-center justify-between p-3.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                <Bus className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{sh.name}</h5>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Status: <span className="text-emerald-500 font-bold">{sh.status}</span> • Capacity: {sh.capacity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">{sh.eta} mins</span>
                              <span className="block text-[8px] font-mono text-zinc-400 uppercase">Estimated arrival</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end shrink-0 bg-zinc-50/50 dark:bg-zinc-950/40">
                <button
                  onClick={() => setActiveModal(null)}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const FreshersPortalMain: React.FC = () => {
  const { firebaseUser, dbUser, token, loading, loginWithGoogle, logout, localUser } = useAuth();
  
  const safeLoginWithGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google login failed inside main:", err);
      if (err?.code === "auth/popup-closed-by-user" || err?.message?.includes("popup-closed-by-user")) {
        alert("The Google Sign-In popup was closed or blocked. Because this preview runs within an iframe, popups are often blocked by browsers. Please allow popups, or open the app in a new tab to complete Google Sign-In.");
      } else {
        alert(err?.message || "Google Sign-In failed. Please try again.");
      }
    }
  };

  const [activeTab, setActiveTab] = useState<"dashboard" | "events" | "timetable" | "checklist" | "faculty" | "clubs" | "map" | "settings" | "support" | "creative" | "profile" | "administration" | "news">("dashboard");
  const [tabHistory, setTabHistory] = useState<string[]>(["dashboard"]);

  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem("technotrons_dashboard_widgets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DashboardWidget[];
        const merged = DEFAULT_WIDGETS.map(def => {
          const match = parsed.find(p => p.id === def.id);
          return match ? { ...def, enabled: match.enabled } : def;
        });
        return merged;
      } catch (e) {
        console.error("Error parsing dashboard widgets", e);
      }
    }
    return DEFAULT_WIDGETS;
  });

  const handleWidgetsChange = (newWidgets: DashboardWidget[]) => {
    setDashboardWidgets(newWidgets);
    localStorage.setItem("technotrons_dashboard_widgets", JSON.stringify(newWidgets));
  };

  useEffect(() => {
    setTabHistory(prev => {
      if (prev[prev.length - 1] === activeTab) return prev;
      if (prev.length > 1 && prev[prev.length - 2] === activeTab) {
        return prev.slice(0, -1);
      }
      return [...prev, activeTab];
    });
  }, [activeTab]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

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

  const getGreeting = () => {
    const hour = currentDate.getHours();
    const name = dbUser?.name || firebaseUser?.displayName || localUser?.name || "Student";
    const firstName = name.split(" ")[0];
    
    let greetingWord = "Good Morning";
    if (hour >= 12 && hour < 17) {
      greetingWord = "Good Afternoon";
    } else if (hour >= 17 && hour < 22) {
      greetingWord = "Good Evening";
    } else if (hour >= 22 && hour < 5) {
      greetingWord = "Good Night";
    }
    
    return `${greetingWord}, ${firstName}!`;
  };

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

  // States for API data
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableCourse[]>([]);

  // Loading states
  const [loadingData, setLoadingData] = useState(true);

  // Fetch all database resources
  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      // Headers with optional authorization
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Parallelize fetches for maximum performance (lag-free)
      const [resEvents, resClubs, resFaculty] = await Promise.all([
        fetch("/api/events", { headers }),
        fetch("/api/clubs", { headers }),
        fetch("/api/faculty")
      ]);

      if (resEvents.ok) setEvents(await resEvents.json());
      if (resClubs.ok) setClubs(await resClubs.json());
      if (resFaculty.ok) setFaculty(await resFaculty.json());

      // Authenticated-only fetches
      if (token) {
        const [resChecklist, resTimetable] = await Promise.all([
          fetch("/api/checklist", { headers }),
          fetch("/api/timetable", { headers })
        ]);

        if (resChecklist.ok) setChecklist(await resChecklist.json());
        if (resTimetable.ok) setTimetable(await resTimetable.json());
      } else if (localUser) {
        // Load checklist from localStorage or seed
        const storedChecklist = localStorage.getItem("technotrons_local_checklist");
        if (storedChecklist) {
          setChecklist(JSON.parse(storedChecklist));
        } else {
          localStorage.setItem("technotrons_local_checklist", JSON.stringify(DEFAULT_CHECKLIST));
          setChecklist(DEFAULT_CHECKLIST);
        }

        // Load timetable from localStorage or seed
        const storedTimetable = localStorage.getItem("technotrons_local_timetable");
        if (storedTimetable) {
          setTimetable(JSON.parse(storedTimetable));
        } else {
          localStorage.setItem("technotrons_local_timetable", JSON.stringify(DEFAULT_TIMETABLE));
          setTimetable(DEFAULT_TIMETABLE);
        }
      }
    } catch (err) {
      console.error("Error fetching portal data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Re-fetch data when token (auth state) or localUser state changes
  useEffect(() => {
    fetchAllData();
  }, [token, localUser]);

  const welcomePartyEvent = events.find(e => e.title.toLowerCase().includes("banana"));

  // Calculate orientation checklist percentage
  const completedChecklistCount = checklist.filter(i => i.completed).length;
  const checklistPercentage = checklist.length > 0
    ? Math.round((completedChecklistCount / checklist.length) * 100)
    : 0;

  if (!loading && !firebaseUser && !localUser) {
    return (
      <>
        <LoginPage />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-indigo-950/10 text-zinc-900 dark:text-white transition-colors duration-300 relative overflow-x-hidden">
      <AnimatedBackground />
      {/* Header Bar */}
      <header className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-40 text-zinc-900 dark:text-white transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-cyan-500/10 border border-white/10">
              <Cpu className="w-5 h-5 text-cyan-200 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-black text-sm sm:text-base lg:text-sm xl:text-lg tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5 leading-none">
                Technotrons <span className="hidden md:inline lg:hidden xl:inline">College of Engineering</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-zinc-500 font-mono tracking-wider uppercase leading-none mt-1">
                CAMPUS PORTAL
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav 
            className="hidden lg:flex items-center gap-2 xl:gap-4 flex-nowrap whitespace-nowrap justify-center py-1"
          >
            {[
              { id: "dashboard", label: "Dashboard", icon: Sparkles },
              { id: "timetable", label: "My Timetable", icon: Clock },
              { id: "checklist", label: "Registration steps", icon: CheckSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isProtected = ["timetable", "checklist"].includes(tab.id) && !token && !localUser;

              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isProtected) {
                      alert(`Please sign in to view your personalized ${tab.label}!`);
                      safeLoginWithGoogle();
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={`flex items-center gap-1.5 xl:gap-2 px-3 xl:px-4 py-2 xl:py-2.5 rounded-2xl text-[11px] xl:text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/10"
                      : "bg-zinc-100/80 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}

            {/* "More" Dropdown Menu */}
            <div 
              className="relative"
              onMouseLeave={() => setMoreMenuOpen(false)}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex items-center gap-1.5 xl:gap-2 px-3 xl:px-4 py-2 xl:py-2.5 rounded-2xl text-[11px] xl:text-xs font-bold transition-all cursor-pointer border ${
                  ["events", "map", "faculty", "clubs", "support", "settings", "creative", "profile", "administration"].includes(activeTab)
                    ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/10"
                    : "bg-zinc-100/80 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform duration-200 ${moreMenuOpen ? "rotate-180" : ""}`} />
              </motion.button>

              <AnimatePresence>
                {moreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
                  >
                    {[
                      { id: "profile", label: "My Profile & Attendance", icon: User },
                      { id: "administration", label: "Campus Administration", icon: Building2 },
                      { id: "creative", label: "AI Creative Studio", icon: Sparkles },
                      { id: "events", label: "Events & Poster", icon: Calendar },
                      { id: "news", label: "Campus News", icon: Newspaper },
                      { id: "map", label: "Campus Map", icon: Map },
                      { id: "faculty", label: "Faculty Directory", icon: BookOpen },
                      { id: "clubs", label: "Student Clubs", icon: Users },
                      { id: "support", label: "Contact Directory", icon: Phone },
                      { id: "settings", label: "Settings", icon: Settings }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;

                      return (
                        <motion.button
                          key={tab.id}
                          whileHover={{ x: 6, backgroundColor: "rgba(99, 102, 241, 0.05)" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setActiveTab(tab.id as any);
                          }}
                          className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-bold text-left transition-colors cursor-pointer ${
                            isActive
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600"
                              : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white border-l-2 border-transparent"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span className="flex-grow">{tab.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Auth Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Date and Time Display */}
            <div className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold font-mono select-none shadow-sm">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
              <span>{formattedDateTime}</span>
            </div>

            {/* Theme Toggle Button */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.15, rotate: 15 }}
              whileTap={{ scale: 0.85, rotate: -15 }}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-all shadow-sm flex items-center justify-center"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-zinc-600" />
              )}
            </motion.button>

            {loading ? (
              <span className="text-xs text-zinc-500 font-mono animate-pulse">Syncing session...</span>
            ) : (firebaseUser || localUser) ? (
              <div className="flex items-center gap-3">
                {/* Profile Click Target */}
                <motion.button
                  onClick={() => setActiveTab("profile")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none group"
                  title="View Profile & Smart Attendance"
                >
                  {/* Profile details */}
                  <div className="hidden xl:block text-right">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                      {dbUser?.name || firebaseUser?.displayName || localUser?.name || "Student"}
                    </p>
                    <p className="text-[9px] font-mono text-zinc-500 leading-none">
                      {firebaseUser?.email || localUser?.email}
                    </p>
                  </div>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0 shadow-sm flex items-center justify-center font-display font-bold text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-500/10 group-hover:border-indigo-500 transition-all">
                    {firebaseUser ? (
                      <img
                        src={firebaseUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                        alt="User"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{(dbUser?.name || localUser?.name || "S").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </motion.button>

                {/* Sign out */}
                <motion.button
                  onClick={logout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white rounded-xl transition-all cursor-pointer text-xs font-bold shrink-0 border border-rose-500/15"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Logout</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={loginWithGoogle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/15 flex items-center gap-1.5 cursor-pointer border border-indigo-700"
              >
                <LogIn className="w-4 h-4" />
                Google Sign-In
              </motion.button>
            )}

            {/* Mobile Menu Toggle */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-zinc-400 hover:bg-zinc-850 rounded-xl lg:hidden transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4 space-y-1.5 z-30 sticky top-16 shadow-2xl transition-all">
          <div className="max-h-[60vh] overflow-y-auto space-y-1 pb-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: Sparkles },
              { id: "profile", label: "My Profile & Attendance", icon: User },
              { id: "administration", label: "Campus Administration", icon: Building2 },
              { id: "creative", label: "AI Creative Studio", icon: Sparkles },
              { id: "events", label: "Events & Poster", icon: Calendar },
              { id: "news", label: "Campus News", icon: Newspaper },
              { id: "map", label: "Campus Map", icon: Map },
              { id: "timetable", label: "My Timetable", icon: Clock },
              { id: "checklist", label: "Registration steps", icon: CheckSquare },
              { id: "faculty", label: "Faculty Directory", icon: BookOpen },
              { id: "clubs", label: "Student Clubs", icon: Users },
              { id: "support", label: "Contact Directory", icon: Phone },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isProtected = ["timetable", "checklist"].includes(tab.id) && !token && !localUser;

              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (isProtected) {
                      alert(`Please sign in to view your personalized ${tab.label}!`);
                      loginWithGoogle();
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isActive 
                      ? "bg-indigo-600 border-indigo-700 text-white" 
                      : "text-zinc-600 dark:text-zinc-300 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>

          {(firebaseUser || localUser) && (
            <div className="pt-2 border-t border-zinc-150 dark:border-zinc-800">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span>Logout Session</span>
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-mono text-xs">Synchronizing campus mainframe...</p>
          </div>
        ) : (
          <>
            {/* Elegant Global Back Button */}
            {activeTab !== "dashboard" && (
              <div className="mb-6 animate-fadeIn">
                <button
                  onClick={() => {
                    if (tabHistory.length > 1) {
                      setActiveTab(tabHistory[tabHistory.length - 2] as any);
                    } else {
                      setActiveTab("dashboard");
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-sans text-xs font-bold rounded-xl border border-zinc-205 dark:border-zinc-800 cursor-pointer transition-all active:scale-95 shadow-sm group hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-500" />
                  <span>Back</span>
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* 1. DASHBOARD VIEW */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2, ease: "easeInOut" } }}
                  className="space-y-6"
                >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {dashboardWidgets.map((widget) => {
                    if (!widget.enabled) return null;
                    
                    switch (widget.id) {
                      case "news-ticker":
                        return <NewsTicker key={widget.id} />;
                        
                      case "welcome-banner":
                        return (
                          <motion.div
                            key={widget.id}
                            variants={itemVariants}
                            className="col-span-12 lg:col-span-8 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border border-white/10"
                          >
                            <div className="space-y-3 relative z-10">
                              <span className="bg-white/10 border border-white/20 text-white font-mono font-bold text-[9px] uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wider">
                                ★ TECHNOTRONS PORTAL
                              </span>
                              <h2 className="font-display font-black text-2xl sm:text-3xl leading-tight tracking-tight text-white animate-fade-in">
                                {getGreeting()}
                              </h2>
                              <p className="text-white/80 text-xs sm:text-sm max-w-xl leading-relaxed">
                                Everything you need as an incoming freshman is centralized right here. Browse orientations, find class schedules, explore student clubs, and complete your registration milestones!
                              </p>
                            </div>

                            {/* Quick Status / Call to Action */}
                            <div className="bg-zinc-950/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl shrink-0 w-full md:w-[240px] relative z-10 border border-white/10 text-white">
                              {(firebaseUser || localUser) ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <CheckSquare className="w-5 h-5 text-indigo-400" />
                                    <div>
                                      <p className="text-xs font-bold text-white">Registration Steps</p>
                                      <p className="text-[10px] text-zinc-400 font-mono">{completedChecklistCount} of {checklist.length} completed</p>
                                    </div>
                                  </div>
                                  <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${checklistPercentage}%` }} />
                                  </div>
                                  <button
                                    onClick={() => setActiveTab("checklist")}
                                    className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer border border-indigo-700"
                                  >
                                    Finish Registration
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2.5 text-center px-2 py-1">
                                  <p className="text-xs font-bold text-white">Personalize Your Hub</p>
                                  <p className="text-[10px] text-zinc-400 leading-normal max-w-[180px]">
                                    Sign in with Google to get your personalized timetable & checklists.
                                  </p>
                                  <button
                                    onClick={safeLoginWithGoogle}
                                    className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-2 rounded-xl transition-all shadow-md cursor-pointer border border-indigo-700"
                                  >
                                    Sign In Now
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                        
                      case "quick-links":
                        return <QuickLinks key={widget.id} setActiveTab={setActiveTab} onChecklistUpdate={fetchAllData} checklistItems={checklist} />;
                        
                      case "featured-event":
                        return welcomePartyEvent ? (
                          <motion.div
                            key={widget.id}
                            variants={itemVariants}
                            className="col-span-12 lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row items-stretch"
                          >
                            {/* Poster */}
                            <div className="lg:w-[42%] bg-zinc-950 min-h-[250px] relative border-r border-zinc-800">
                              <img
                                src={welcomePartyEvent.imageUrl || "/src/assets/images/welcome_party_poster_1784350650181.jpg"}
                                alt="Welcome Party Poster"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-4 left-4 bg-indigo-600 text-white font-display font-black text-[10px] uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider border border-white/10">
                                NANO BANANA
                              </div>
                            </div>
                            {/* Event info */}
                            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-2">
                                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                                  Featured Event
                                </span>
                                <h3 className="font-display font-black text-2xl text-white tracking-tight leading-tight">
                                  {welcomePartyEvent.title}
                                </h3>
                                <p className="text-zinc-400 text-xs leading-relaxed">
                                  {welcomePartyEvent.description}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-medium text-zinc-300">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                                    <span>{welcomePartyEvent.date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                                    <span>{welcomePartyEvent.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                                    <span className="truncate">{welcomePartyEvent.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-zinc-500 shrink-0" />
                                    <span>Max Seats: {welcomePartyEvent.capacity}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-zinc-800">
                                <button
                                  onClick={() => setActiveTab("events")}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-indigo-600/10 border border-indigo-700 cursor-pointer text-center"
                                >
                                  View Details & RSVP
                                </button>
                                <div className="text-zinc-500 text-[10px] font-mono italic text-center sm:text-left">
                                  Designed with Nano Banana AI
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : null;
                        
                      case "faculty-spotlight":
                        return (
                          <motion.div
                            key={widget.id}
                            variants={itemVariants}
                            className="col-span-12 md:col-span-5 lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4"
                          >
                            <div>
                              <h4 className="font-display font-bold text-base text-zinc-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Academic Leaders
                              </h4>
                              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 mt-2">
                                {faculty.slice(0, 2).map((f) => (
                                  <div key={f.id} className="py-3 flex gap-3 items-center first:pt-0 last:pb-0">
                                    <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 flex items-center justify-center font-display font-bold text-sm shadow-inner">
                                      {f.name.split(" ").pop()?.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{f.name}</p>
                                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">{f.designation} • {f.department}</p>
                                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate mt-0.5">{f.email}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setActiveTab("faculty")}
                              className="w-full text-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Search Faculty Directory
                            </motion.button>
                          </motion.div>
                        );
                        
                      case "ai-recommendations":
                        return (
                          <motion.div
                            key={widget.id}
                            variants={itemVariants}
                            className="col-span-12 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-xl space-y-4"
                          >
                            <AiRecommendations />
                          </motion.div>
                        );
                        
                      case "upcoming-events":
                        return (
                          <motion.div
                            key={widget.id}
                            variants={itemVariants}
                            className="col-span-12 lg:col-span-8 space-y-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                              <h4 className="font-display font-bold text-lg text-zinc-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
                                <span>Upcoming Campus Events</span>
                                {(dbUser?.department || localUser?.department) && (
                                  <span className="text-[10px] font-mono bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full uppercase font-black tracking-wider">
                                    {dbUser?.department || localUser?.department}
                                  </span>
                                )}
                              </h4>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => setActiveTab("settings")}
                                  className="text-xs font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                  <span>Customize field</span>
                                </button>
                                <button
                                  onClick={() => setActiveTab("events")}
                                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-0.5 cursor-pointer transition-colors"
                                >
                                  <span>View all</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                              {events.slice(0, 2).map((event) => (
                                <EventCard key={event.id} event={event} onStatusChange={fetchAllData} />
                              ))}
                            </div>
                          </motion.div>
                        );
                        
                      case "campus-news":
                        return (
                          <motion.div
                            key={widget.id}
                            variants={itemVariants}
                            className="col-span-12 lg:col-span-8 space-y-4"
                          >
                            <div className="flex items-center justify-between px-1">
                              <h4 className="font-display font-bold text-lg text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Newspaper className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <span>Campus News & Announcements</span>
                              </h4>
                              <button
                                onClick={() => setActiveTab("news")}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-0.5 cursor-pointer transition-colors"
                              >
                                <span>View all news</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-xl">
                              <CampusNewsList compact={true} />
                            </div>
                          </motion.div>
                        );

                      case "student-clubs":
                        return (
                          <motion.div
                            key={widget.id}
                            variants={itemVariants}
                            className="col-span-12 md:col-span-7 lg:col-span-4 space-y-4"
                          >
                            <div className="flex items-center justify-between px-1">
                              <h4 className="font-display font-bold text-lg text-zinc-900 dark:text-white tracking-tight">
                                Student Clubs
                              </h4>
                              <button
                                onClick={() => setActiveTab("clubs")}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-0.5 cursor-pointer transition-colors"
                              >
                                View all
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-xl">
                              <ClubList clubs={clubs.slice(0, 3)} onStatusChange={fetchAllData} compact={true} />
                            </div>
                          </motion.div>
                        );
                        
                      case "feedback-board":
                        return (
                          <motion.div
                            key={widget.id}
                            variants={itemVariants}
                            className="col-span-12 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl space-y-4"
                          >
                            <FeedbackForm />
                          </motion.div>
                        );
                        
                      default:
                        return null;
                    }
                  })}
                </div>
              </motion.div>
            )}

            {/* 2. EVENTS VIEW */}
            {activeTab === "events" && (
              <motion.div
                key="events"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
                    Campus Orientation & Events
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Sign up for crucial orientation events, developmental workshops, and campus social mixers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} onStatusChange={fetchAllData} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* CAMPUS NEWS VIEW */}
            {activeTab === "news" && (
              <motion.div
                key="news"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
                    Campus News & Announcements
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Stay up-to-date with official university updates, notices, achievements, and general announcements.
                  </p>
                </div>

                <CampusNewsList />
              </motion.div>
            )}

            {/* 3. TIMETABLE VIEW */}
            {activeTab === "timetable" && (
              <motion.div
                key="timetable"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
                      My Lecture Schedule
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      Personalized timetables for your class assignments. Subscribe to classes to pins them to your dashboard.
                    </p>
                  </div>
                  <div className="bg-zinc-900 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-805 self-start sm:self-auto">
                    Cohort {dbUser?.cohort || localUser?.batchNo || "CS-A"}
                  </div>
                </div>

                <Timetable courses={timetable} faculty={faculty} onToggleSubscription={fetchAllData} />
              </motion.div>
            )}

            {/* 4. CHECKLIST VIEW */}
            {activeTab === "checklist" && (
              <motion.div
                key="checklist"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
                    Registration Milestone Checklist
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Mark off critical administrative procedures to complete your orientation successfully.
                  </p>
                </div>

                <Checklist items={checklist} onToggle={fetchAllData} />
              </motion.div>
            )}

            {/* 5. FACULTY VIEW */}
            {activeTab === "faculty" && (
              <motion.div
                key="faculty"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
                    Faculty Directory
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Find and contact academic professors and schedule office hour appointments.
                  </p>
                </div>

                <FacultyList faculty={faculty} />
              </motion.div>
            )}

            {/* 6. CLUBS VIEW */}
            {activeTab === "clubs" && (
              <motion.div
                key="clubs"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
                    Campus Clubs Council
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Register and connect with active campus developer communities, hobby societies, and art clubs.
                  </p>
                </div>

                <ClubList clubs={clubs} onStatusChange={fetchAllData} />
              </motion.div>
            )}

            {/* 7. CAMPUS MAP VIEW */}
            {activeTab === "map" && (
              <motion.div
                key="map"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
                    Interactive Campus Map
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Locate lecture halls, quiet studies, canteens, c-spaces, administrative desks, and request real-time Gemini walking assistance.
                  </p>
                </div>

                <CampusMap />
              </motion.div>
            )}

            {/* 8. SETTINGS VIEW */}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <SettingsPanel 
                  events={events} 
                  widgets={dashboardWidgets} 
                  onWidgetsChange={handleWidgetsChange} 
                />
              </motion.div>
            )}

            {/* 9. SUPPORT VIEW */}
            {activeTab === "support" && (
              <motion.div
                key="support"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <SupportPanel />
              </motion.div>
            )}

            {/* 10. AI CREATIVE STUDIO VIEW */}
            {activeTab === "creative" && (
              <motion.div
                key="creative"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <AiCreativeHub />
              </motion.div>
            )}

            {/* 11. STUDENT PROFILE & ATTENDANCE VIEW */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-white tracking-tight">
                    My Student Profile & Smart Attendance
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    View profile metrics and verify your class attendance securely using our smart biometric systems.
                  </p>
                </div>
                <StudentProfile />
              </motion.div>
            )}

            {/* 12. CAMPUS ADMINISTRATION VIEW */}
            {activeTab === "administration" && (
              <motion.div
                key="administration"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <CampusAdministration />
              </motion.div>
            )}
          </AnimatePresence>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-500 py-8 border-t border-zinc-900 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-xs">
            © 2026 Campus Freshers Portal. Developed with high-performance Google Gemini & Cloud SQL PostgreSQL.
          </p>
          <p className="text-[10px] text-zinc-700 font-mono">
            PORTAL STATUS: ONLINE • HOSTED ON GOOGLE CLOUD
          </p>
        </div>
      </footer>

      {/* Local Notification Agent */}
      <NotificationManager events={events} minimal={true} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FreshersPortalMain />
      <ChatBot />
    </AuthProvider>
  );
}
