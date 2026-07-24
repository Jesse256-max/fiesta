import React, { useState, useEffect, useRef } from "react";
import { CampusLocation } from "../types.ts";
import { 
  MapPin, 
  Search, 
  Navigation, 
  GraduationCap, 
  BookOpen, 
  Coffee, 
  Activity, 
  Info, 
  Sparkles, 
  ArrowRight, 
  Sun, 
  Moon, 
  Sunset, 
  Compass, 
  RefreshCw, 
  Users,
  ChevronRight,
  Clock,
  Home
} from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { motion, AnimatePresence } from "motion/react";

interface CampusMapProps {
  onAskChatbot?: (message: string) => void;
}

const CATEGORIES = [
  { id: "academic", label: "Lecture Halls", icon: GraduationCap, color: "bg-indigo-500 text-indigo-400" },
  { id: "library", label: "Libraries", icon: BookOpen, color: "bg-emerald-500 text-emerald-400" },
  { id: "canteen", label: "Canteens", icon: Coffee, color: "bg-amber-500 text-amber-400" },
  { id: "admin", label: "Administrative Offices", icon: Info, color: "bg-sky-500 text-sky-400" },
  { id: "sports", label: "Sports & Arena", icon: Activity, color: "bg-rose-500 text-rose-400" },
  { id: "hostel", label: "Hostel & Residences", icon: Home, color: "bg-pink-500 text-pink-400" },
];

interface StudentCommuter {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  border: string;
  startLocId: number;
  endLocId: number;
  progress: number; // 0 to 100
  status: "idle" | "walking" | "resting";
  statusText: string;
}

export const CampusMap: React.FC<CampusMapProps> = ({ onAskChatbot }) => {
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCategories, setVisibleCategories] = useState<string[]>(["academic", "library", "canteen", "admin", "sports"]);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);

  // 3D Visual configurations
  const [isThreeD, setIsThreeD] = useState(true);
  const [tiltVal, setTiltVal] = useState(55);
  const [rotationVal, setRotationVal] = useState(-35);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "sunset" | "night">("night");
  const [showLiveCommuters, setShowLiveCommuters] = useState(true);
  const [hoveredLocationId, setHoveredLocationId] = useState<number | null>(null);

  // Selected student highlight
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Navigation state
  const [navStart, setNavStart] = useState<CampusLocation | null>(null);
  const [navEnd, setNavEnd] = useState<CampusLocation | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [aiGuidance, setAiGuidance] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { token } = useAuth();

  // Simulated live student commuters (Saranathan Campus)
  const [commuters, setCommuters] = useState<StudentCommuter[]>([
    {
      id: "sanjay",
      name: "Sanjay",
      role: "Infosys Campus Connect Lead",
      avatar: "👨‍💻",
      color: "bg-indigo-500",
      border: "border-indigo-400",
      startLocId: 3, // CSG GPU Lab
      endLocId: 5, // Student Cafeteria
      progress: 0,
      status: "walking",
      statusText: "Walking from CSG GPU Lab to Student Cafeteria for tea & snacks"
    },
    {
      id: "elena",
      name: "Elena",
      role: "Sara Fine Arts Secretary",
      avatar: "🎵",
      color: "bg-emerald-500",
      border: "border-emerald-400",
      startLocId: 1, // Silver Jubilee Auditorium
      endLocId: 2, // Central Library
      progress: 20,
      status: "walking",
      statusText: "Heading to Central Library to review Sara Cultural Fest guidelines"
    },
    {
      id: "barathi",
      name: "Dr. M. Barathi",
      role: "IEEE Branch Counselor & ECE HOD",
      avatar: "👨‍🏫",
      color: "bg-amber-500",
      border: "border-amber-400",
      startLocId: 4, // E-Yantra Robotics Research Center
      endLocId: 1, // Silver Jubilee Auditorium
      progress: 40,
      status: "walking",
      statusText: "Walking to Silver Jubilee Auditorium for TechXibitz inaugurations"
    },
    {
      id: "yuki",
      name: "Yuki",
      role: "E-Yantra Robotics Lead",
      avatar: "🤖",
      color: "bg-cyan-500",
      border: "border-cyan-400",
      startLocId: 4, // E-Yantra Robotics Research Center
      endLocId: 6, // Campus Hostel Blocks
      progress: 65,
      status: "walking",
      statusText: "Carrying IoT sensors from E-Yantra Lab to demonstrate at hostel study hall"
    },
    {
      id: "marcus",
      name: "Marcus",
      role: "Saranathan Sports Captain",
      avatar: "🏃",
      color: "bg-rose-500",
      border: "border-rose-400",
      startLocId: 6, // Campus Hostel Blocks
      endLocId: 5, // Student Cafeteria
      progress: 85,
      status: "walking",
      statusText: "Jogging from Hostel Complex to Student Cafeteria for morning refreshments"
    }
  ]);

  // Fetch campus locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/locations");
        if (!response.ok) {
          throw new Error("Failed to fetch campus locations");
        }
        const data = await response.json();
        setLocations(data);
        if (data.length > 0) {
          setSelectedLocation(data[0]);
        }
      } catch (err: any) {
        console.error("Error fetching locations:", err);
        setError(err.message || "Could not load campus map data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Update live student positions smoothly
  useEffect(() => {
    if (locations.length === 0 || !showLiveCommuters) return;

    const interval = setInterval(() => {
      setCommuters(prev => {
        return prev.map(student => {
          if (student.status === "walking") {
            const nextProgress = student.progress + 1.2;
            if (nextProgress >= 100) {
              // Reached! Wait there (resting)
              const destNode = locations.find(l => l.id === student.endLocId) || locations[0];
              const waitReasons = [
                `Reviewing fresh project notes inside ${destNode.name}`,
                `Chatting with first-year students at ${destNode.name}`,
                `Sipping fresh banana milkshakes near ${destNode.name}`,
                `Answering club membership queries at ${destNode.name}`,
                `Organizing interactive workshop desks at ${destNode.name}`
              ];
              return {
                ...student,
                progress: 100,
                status: "resting",
                statusText: waitReasons[Math.floor(Math.random() * waitReasons.length)]
              };
            }
            return {
              ...student,
              progress: nextProgress
            };
          } else {
            // Resting state - small chance to walk to a new node
            if (Math.random() < 0.04) {
              const currentId = student.endLocId;
              const allowedNodes = locations.filter(l => l.id !== currentId);
              const nextNode = allowedNodes.length > 0
                ? allowedNodes[Math.floor(Math.random() * allowedNodes.length)]
                : locations[0];

              const startNode = locations.find(l => l.id === currentId) || locations[0];
              const movePhrases = [
                `Strolling gracefully from ${startNode.building} to ${nextNode.name}`,
                `Rushing over to ${nextNode.name} for an urgent meeting`,
                `Heading to explore the facilities at ${nextNode.name}`,
                `Wandering towards ${nextNode.name} with classmates`
              ];

              return {
                ...student,
                startLocId: currentId,
                endLocId: nextNode.id,
                progress: 0,
                status: "walking",
                statusText: movePhrases[Math.floor(Math.random() * movePhrases.length)]
              };
            }
            return student;
          }
        });
      });
    }, 180);

    return () => clearInterval(interval);
  }, [locations, showLiveCommuters]);

  const toggleCategory = (categoryId: string) => {
    if (visibleCategories.includes(categoryId)) {
      setVisibleCategories(visibleCategories.filter(id => id !== categoryId));
    } else {
      setVisibleCategories([...visibleCategories, categoryId]);
    }
  };

  const showAllCategories = () => {
    setVisibleCategories(["academic", "library", "canteen", "admin", "sports"]);
  };

  const hideAllCategories = () => {
    setVisibleCategories([]);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "academic": return <GraduationCap className="w-3.5 h-3.5" />;
      case "library": return <BookOpen className="w-3.5 h-3.5" />;
      case "canteen": return <Coffee className="w-3.5 h-3.5" />;
      case "sports": return <Activity className="w-3.5 h-3.5" />;
      default: return <Info className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryThemeColors = (category: string) => {
    switch (category) {
      case "academic": 
        return {
          glow: "rgba(99, 102, 241, 0.4)",
          bg: "bg-indigo-600 border-indigo-400 text-indigo-100",
          solid: "border-indigo-500",
          colorClass: "text-indigo-400",
          hologramColor: "from-indigo-600/30 to-purple-600/5"
        };
      case "library": 
        return {
          glow: "rgba(16, 185, 129, 0.4)",
          bg: "bg-emerald-600 border-emerald-400 text-emerald-100",
          solid: "border-emerald-500",
          colorClass: "text-emerald-400",
          hologramColor: "from-emerald-600/30 to-teal-600/5"
        };
      case "canteen": 
        return {
          glow: "rgba(245, 158, 11, 0.4)",
          bg: "bg-amber-600 border-amber-400 text-amber-100",
          solid: "border-amber-500",
          colorClass: "text-amber-400",
          hologramColor: "from-amber-600/30 to-orange-500/5"
        };
      case "sports": 
        return {
          glow: "rgba(244, 63, 94, 0.4)",
          bg: "bg-rose-600 border-rose-400 text-rose-100",
          solid: "border-rose-500",
          colorClass: "text-rose-400",
          hologramColor: "from-rose-600/30 to-pink-500/5"
        };
      default: 
        return {
          glow: "rgba(14, 165, 233, 0.4)",
          bg: "bg-sky-600 border-sky-400 text-sky-100",
          solid: "border-sky-500",
          colorClass: "text-sky-400",
          hologramColor: "from-sky-600/30 to-blue-500/5"
        };
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = visibleCategories.includes(loc.category);

    return matchesSearch && matchesCategory;
  });

  const handleGetAiDirections = async () => {
    if (!navStart || !navEnd) return;
    setAiLoading(true);
    setAiGuidance(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Give me highly precise, step-by-step campus walking directions to navigate from "${navStart.name}" (located at ${navStart.building}, ${navStart.floor}) to "${navEnd.name}" (located at ${navEnd.building}, ${navEnd.floor}). Discuss landmarks and estimates.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("Chat error");
      }

      const data = await response.json();
      setAiGuidance(data.reply);
    } catch (err) {
      console.error(err);
      setAiGuidance("Could not fetch navigation instructions from the mainframe. Please consult the static map guide!");
    } finally {
      setAiLoading(false);
    }
  };

  const calculateDistance = () => {
    if (!navStart || !navEnd) return 0;
    const dx = navEnd.coordinatesX - navStart.coordinatesX;
    const dy = navEnd.coordinatesY - navStart.coordinatesY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const distanceVal = calculateDistance();
  const walkingTimeMinutes = Math.max(1, Math.round(distanceVal * 0.15));

  // Determine lighting and color palette based on Time of Day select
  const getLightingStyles = () => {
    switch (timeOfDay) {
      case "sunset":
        return {
          background: "bg-gradient-to-br from-zinc-950 via-slate-900 to-amber-950/40",
          gridColor: "rgba(245, 158, 11, 0.04)",
          radialLight: "radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.15) 0%, rgba(99, 102, 241, 0.02) 60%, transparent 100%)",
          accentBorder: "border-amber-900/30",
          skyGlow: "shadow-[inset_0_0_60px_rgba(249,115,22,0.1)]"
        };
      case "day":
        return {
          background: "bg-gradient-to-br from-zinc-900 via-zinc-950 to-indigo-950/10",
          gridColor: "rgba(255, 255, 255, 0.03)",
          radialLight: "radial-gradient(circle at 30% 30%, rgba(253, 224, 71, 0.1) 0%, rgba(99, 102, 241, 0.02) 50%, transparent 100%)",
          accentBorder: "border-zinc-800",
          skyGlow: ""
        };
      case "night":
      default:
        return {
          background: "bg-gradient-to-br from-neutral-950 via-zinc-950 to-indigo-950/40",
          gridColor: "rgba(99, 102, 241, 0.07)",
          radialLight: "radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.05) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 100%)",
          accentBorder: "border-indigo-500/10",
          skyGlow: "shadow-[inset_0_0_80px_rgba(99,102,241,0.08)]"
        };
    }
  };

  const lights = getLightingStyles();

  // Helper to LERP coords of dynamic commuters
  const getCommuterCoords = (student: StudentCommuter) => {
    // If we have custom seeded coords inside locations
    const startNode = locations.find(l => l.id === student.startLocId);
    const endNode = locations.find(l => l.id === student.endLocId);

    if (!startNode || !endNode) {
      // safe fallback positions
      return { x: 50, y: 50 };
    }

    const p = student.progress / 100;
    const x = startNode.coordinatesX + (endNode.coordinatesX - startNode.coordinatesX) * p;
    const y = startNode.coordinatesY + (endNode.coordinatesY - startNode.coordinatesY) * p;

    return { x, y };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left controls panel (4 cols) */}
      <div className="lg:col-span-4 space-y-5">
        
        {/* Interactive Hologram Cockpit Controls */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="space-y-0.5">
              <h4 className="font-display font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500 animate-spin" />
                3D Map Deck
              </h4>
              <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-wider">Dynamic Controls</p>
            </div>
            
            {/* 2D / 3D Mode Toggle */}
            <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setIsThreeD(false)}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  !isThreeD 
                    ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setIsThreeD(true)}
                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  isThreeD 
                    ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                3D Hologram
              </button>
            </div>
          </div>

          {/* Time of Day Presets */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-indigo-500" /> Lighting & Environment
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setTimeOfDay("day")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold cursor-pointer border flex items-center justify-center gap-1.5 transition-all ${
                  timeOfDay === "day"
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Day
              </button>
              <button
                onClick={() => setTimeOfDay("sunset")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold cursor-pointer border flex items-center justify-center gap-1.5 transition-all ${
                  timeOfDay === "sunset"
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-600 dark:text-amber-400"
                    : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Sunset className="w-3.5 h-3.5" />
                Sunset
              </button>
              <button
                onClick={() => setTimeOfDay("night")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold cursor-pointer border flex items-center justify-center gap-1.5 transition-all ${
                  timeOfDay === "night"
                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-600 dark:text-purple-400"
                    : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Night
              </button>
            </div>
          </div>

          {/* 3D Sliders (Only active in 3D mode) */}
          {isThreeD && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 overflow-hidden"
            >
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-zinc-500">
                  <span className="flex items-center gap-1">Compass Rotation: <strong className="text-zinc-900 dark:text-zinc-300 font-mono">{rotationVal}°</strong></span>
                  <button onClick={() => setRotationVal(-35)} className="text-[10px] text-indigo-500 font-mono">[Reset]</button>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotationVal}
                  onChange={(e) => setRotationVal(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-zinc-500">
                  <span className="flex items-center gap-1">Hologram Tilt Angle: <strong className="text-zinc-900 dark:text-zinc-300 font-mono">{tiltVal}°</strong></span>
                  <button onClick={() => setTiltVal(55)} className="text-[10px] text-indigo-500 font-mono">[Reset]</button>
                </div>
                <input
                  type="range"
                  min="20"
                  max="75"
                  value={tiltVal}
                  onChange={(e) => setTiltVal(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </motion.div>
          )}

          {/* Toggle Live Commuter simulation */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-500" />
              Live Commuters Sim
            </span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showLiveCommuters} 
                onChange={(e) => setShowLiveCommuters(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Standard Campus search & control */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-xl">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">Campus Finder</h4>
            <p className="text-zinc-500 text-[11px]">Filter markers, search halls, canteens, and academic offices.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search blocks, canteens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans placeholder-zinc-500"
            />
          </div>

          {/* Visibility LED Filters */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500">
              <span className="uppercase tracking-wider">Map Legend & Filters</span>
              <div className="flex gap-1.5">
                <button type="button" onClick={showAllCategories} className="text-indigo-500 hover:underline cursor-pointer">All</button>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <button type="button" onClick={hideAllCategories} className="text-zinc-500 hover:underline cursor-pointer">None</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isVisible = visibleCategories.includes(cat.id);
                const colors = getCategoryThemeColors(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold transition-all border cursor-pointer text-left ${
                      isVisible
                        ? "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-indigo-500/30 text-zinc-900 dark:text-white"
                        : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isVisible ? "bg-indigo-500/10 text-indigo-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{cat.label}</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${
                      isVisible ? `${cat.color.split(" ")[0]} shadow-[0_0_8px_rgba(99,102,241,0.5)]` : "bg-zinc-200 dark:bg-zinc-800"
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation planner */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                <Navigation className="w-4 h-4 text-indigo-500" />
              </div>
              <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">HoloPath Directions</h4>
            </div>
            <button
              onClick={() => {
                setNavigating(!navigating);
                setAiGuidance(null);
                if (!navigating && selectedLocation) {
                  setNavStart(selectedLocation);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                navigating
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500"
              }`}
            >
              {navigating ? "Cancel Route" : "Plan Route"}
            </button>
          </div>

          {navigating ? (
            <div className="space-y-3">
              {/* Start */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Start Point</label>
                <select
                  value={navStart?.id || ""}
                  onChange={(e) => {
                    const loc = locations.find(l => l.id === parseInt(e.target.value));
                    if (loc) setNavStart(loc);
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="" disabled>Choose Start Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.building})</option>
                  ))}
                </select>
              </div>

              {/* End */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Destination</label>
                <select
                  value={navEnd?.id || ""}
                  onChange={(e) => {
                    const loc = locations.find(l => l.id === parseInt(e.target.value));
                    if (loc) setNavEnd(loc);
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="" disabled>Choose Destination Point</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.building})</option>
                  ))}
                </select>
              </div>

              {navStart && navEnd && navStart.id !== navEnd.id && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-150 dark:border-zinc-800/70 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>HoloPath Distance:</span>
                    <strong className="text-zinc-900 dark:text-white font-mono">{Math.round(distanceVal * 4.2)} meters</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Est. Transit:</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-mono">~{walkingTimeMinutes} min walk</strong>
                  </div>

                  <button
                    onClick={handleGetAiDirections}
                    disabled={aiLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-45 transition-all"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    {aiLoading ? "Consulting Gemini..." : "Generate AI Walking Directions"}
                  </button>

                  {aiGuidance && (
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line shadow-inner">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-[10px] uppercase tracking-wider mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> GPS Walking Instructions:
                      </span>
                      {aiGuidance}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-xs py-2 text-center font-sans">Tap "Plan Route" or click landmarks to design an interactive transit pathway.</p>
          )}
        </div>
      </div>

      {/* Middle Map Visualizer (8 cols) */}
      <div className="lg:col-span-8 flex flex-col gap-5">
        
        {/* Visual Map Canvas Frame with Perspective */}
        <div 
          className={`relative aspect-[16/10] w-full border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden group select-none transition-all duration-500 ${lights.background} ${lights.skyGlow}`}
          style={{ perspective: isThreeD ? "1500px" : "none" }}
        >
          {/* Ambient Lighting Gradients */}
          <div className="absolute inset-0 pointer-events-none transition-all duration-1000 z-0" style={{ backgroundImage: lights.radialLight }} />

          {/* Grid Background Pattern */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none z-0 transition-colors duration-1000" 
            style={{ 
              backgroundImage: `linear-gradient(to right, ${lights.gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${lights.gridColor} 1px, transparent 1px)`,
              backgroundSize: "4% 6.4%" 
            }} 
          />

          {/* Hologram Grid Sector Labels */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none font-mono text-[9px] text-zinc-500 flex flex-col text-right">
            <span>SECTOR: DELTA-TCE</span>
            <span>SYSTEM: {isThreeD ? "3D_HOLOPATH" : "2D_STATIC"}</span>
            <span>GRID: COMM-ACTIVE</span>
          </div>

          {/* ROTATING MAP WORKSPACE CANVAS */}
          <motion.div 
            className="absolute inset-0 w-full h-full transform-gpu origin-center"
            animate={isThreeD ? {
              rotateX: tiltVal,
              rotateZ: rotationVal,
              scale: 0.95,
              y: 10
            } : {
              rotateX: 0,
              rotateZ: 0,
              scale: 1,
              y: 0
            }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
            style={{ transformStyle: isThreeD ? "preserve-3d" : "flat" }}
          >
            {/* Styled Regions / Courtyard Areas flat on the ground */}
            <div 
              className="absolute top-[10%] left-[5%] w-[40%] h-[80%] rounded-3xl border border-dashed border-indigo-500/10 bg-indigo-500/[0.01] pointer-events-none flex items-center justify-center"
              style={{ transform: "translateZ(1px)" }}
            >
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-500 font-black rotate-90 opacity-60">Academic Quadrant</span>
            </div>
            <div 
              className="absolute top-[10%] left-[48%] w-[22%] h-[80%] rounded-3xl border border-dashed border-emerald-500/10 bg-emerald-500/[0.01] pointer-events-none flex items-center justify-center"
              style={{ transform: "translateZ(1px)" }}
            >
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-500 font-black rotate-90 opacity-60">Central Green & Hub</span>
            </div>
            <div 
              className="absolute top-[10%] left-[73%] w-[22%] h-[80%] rounded-3xl border border-dashed border-sky-500/10 bg-sky-500/[0.01] pointer-events-none flex items-center justify-center"
              style={{ transform: "translateZ(1px)" }}
            >
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-500 font-black rotate-90 opacity-60">Administrative Plaza</span>
            </div>

            {/* Neon Connection Road Network Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]">
              {/* Vertical Roads */}
              <line x1="14%" y1="10%" x2="14%" y2="80%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="3" />
              <line x1="30%" y1="10%" x2="30%" y2="80%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="3" />
              <line x1="42%" y1="10%" x2="42%" y2="90%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="3" />
              <line x1="58%" y1="15%" x2="58%" y2="90%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="3" />
              <line x1="78%" y1="15%" x2="78%" y2="80%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="3" />
              <line x1="88%" y1="20%" x2="88%" y2="90%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="3" />

              {/* Horizontal Connectors */}
              <line x1="10%" y1="18%" x2="80%" y2="18%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="2" />
              <line x1="10%" y1="32%" x2="90%" y2="32%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="2" />
              <line x1="10%" y1="46%" x2="80%" y2="46%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="2" />
              <line x1="10%" y1="60%" x2="90%" y2="60%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="2" />
              <line x1="10%" y1="74%" x2="80%" y2="74%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="2" />
              <line x1="40%" y1="86%" x2="90%" y2="86%" stroke="currentColor" className="text-zinc-500/10 dark:text-zinc-700/20" strokeWidth="2" />
            </svg>

            {/* ACTIVE ROADWAY ROUTE OVERLAY */}
            {navigating && navStart && navEnd && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ transform: "translateZ(2px)" }}>
                <defs>
                  <linearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                {/* Glowing Pathway Line */}
                <line
                  x1={`${navStart.coordinatesX}%`}
                  y1={`${navStart.coordinatesY}%`}
                  x2={`${navEnd.coordinatesX}%`}
                  y2={`${navEnd.coordinatesY}%`}
                  stroke="url(#navGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="10,6"
                  className="animate-[dash_1s_linear_infinite]"
                />
                <style>{`
                  @keyframes dash {
                    to {
                      stroke-dashoffset: -16;
                    }
                  }
                `}</style>
              </svg>
            )}

            {/* 3D BUILDINGS LAYER (TALL PRISMS) */}
            {isThreeD && filteredLocations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              const isHovered = hoveredLocationId === loc.id;
              const colors = getCategoryThemeColors(loc.category);
              
              // Custom building height based on category
              let buildingHeight = "h-8";
              if (loc.category === "library") buildingHeight = "h-14";
              else if (loc.category === "academic") buildingHeight = "h-11";
              else if (loc.category === "sports") buildingHeight = "h-7";
              else if (loc.category === "admin" && loc.name.includes("Auditorium")) buildingHeight = "h-12";
              
              // Width classes
              let buildingWidth = "w-8";
              if (loc.category === "sports") buildingWidth = "w-14";
              else if (loc.category === "canteen") buildingWidth = "w-11";
              
              return (
                <div
                  key={`building-${loc.id}`}
                  style={{ 
                    left: `${loc.coordinatesX}%`, 
                    top: `${loc.coordinatesY}%`,
                    transform: "translateZ(0px)",
                    transformStyle: "preserve-3d"
                  }}
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  {/* Glowing footprint shadow */}
                  <div className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-md opacity-70 transition-all duration-300 w-16 h-16 ${
                    isSelected ? "bg-indigo-500/25 scale-125" : "bg-black/40"
                  }`} />

                  {/* Voxel Vibe CSS 3D prism construction */}
                  <motion.div 
                    className={`relative ${buildingWidth} ${buildingHeight} transition-all duration-300 transform-gpu`}
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={isHovered || isSelected ? { translateZ: 14 } : { translateZ: 4 }}
                  >
                    {/* Top Floor Roof Panel */}
                    <div 
                      className={`absolute inset-x-0 top-0 h-full rounded-md border border-white/20 transition-all bg-gradient-to-tr ${
                        isSelected 
                          ? "from-indigo-400 to-purple-500 shadow-lg" 
                          : "from-zinc-800 to-zinc-700"
                      }`}
                      style={{ transform: "rotateX(0deg) translateZ(16px)" }}
                    >
                      {/* Rooftop Helipad details or architectural vents */}
                      <div className="absolute inset-1.5 border border-white/10 rounded flex items-center justify-center text-[6px] font-bold text-white/40 font-mono">
                        {loc.building.split(" ")[1] || "A"}
                      </div>
                    </div>

                    {/* Left wall */}
                    <div 
                      className="absolute inset-y-0 left-0 w-4 bg-zinc-800/90 border-r border-black/20 origin-left"
                      style={{ transform: "rotateY(-90deg) translateZ(0px)" }}
                    />
                    
                    {/* Right wall */}
                    <div 
                      className="absolute inset-y-0 right-0 w-4 bg-zinc-850/90 border-l border-black/20 origin-right"
                      style={{ transform: "rotateY(90deg) translateZ(0px)" }}
                    />
                  </motion.div>
                </div>
              );
            })}

            {/* DYNAMIC COMMUTERS (glow student paths) */}
            {showLiveCommuters && commuters.map((student) => {
              const { x, y } = getCommuterCoords(student);
              const isSelected = selectedStudentId === student.id;
              
              // Inverse rotation billboard values to stand upright
              const billboardStyle = isThreeD 
                ? { transform: `rotateZ(${-rotationVal}deg) rotateX(${-tiltVal}deg) translateZ(28px)` }
                : {};

              return (
                <div
                  key={student.id}
                  style={{ left: `${x}%`, top: `${y}%`, transformStyle: isThreeD ? "preserve-3d" : "flat" }}
                  className="absolute pointer-events-auto z-40 transition-all duration-200"
                >
                  {/* Commuter standing card */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStudentId(isSelected ? null : student.id);
                    }}
                    style={billboardStyle}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full cursor-pointer select-none transition-all duration-300 border shadow-md -translate-x-1/2 -translate-y-1/2 ${
                      isSelected 
                        ? `${student.color} ${student.border} text-white scale-125 z-50 ring-4 ring-white/10`
                        : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:scale-110"
                    }`}
                  >
                    {/* Pulsing indicator dot */}
                    <span className="relative flex h-2 w-2">
                      {student.status === "walking" && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${student.status === "walking" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                    </span>

                    <span className="text-[9px] font-black font-sans tracking-tight">
                      {student.avatar} {student.name}
                    </span>
                  </div>

                  {/* Pulsing trail below */}
                  <div className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full blur-sm opacity-40 ${student.color} animate-pulse`} />
                </div>
              );
            })}

            {/* LANDMARKS / LOCATION PINS LAYER */}
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              const isStart = navStart?.id === loc.id;
              const isEnd = navEnd?.id === loc.id;
              const colors = getCategoryThemeColors(loc.category);
              
              // Billboard style to stand vertical in 3D mode
              const billboardStyle = isThreeD 
                ? { transform: `rotateZ(${-rotationVal}deg) rotateX(${-tiltVal}deg) translateZ(35px)`, transformStyle: "preserve-3d" as const }
                : {};

              return (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedLocation(loc);
                    if (navigating) {
                      if (!navStart) {
                        setNavStart(loc);
                      } else if (!navEnd && loc.id !== navStart.id) {
                        setNavEnd(loc);
                      } else if (navStart && navEnd) {
                        setNavStart(loc);
                        setNavEnd(null);
                        setAiGuidance(null);
                      }
                    }
                  }}
                  onMouseEnter={() => setHoveredLocationId(loc.id)}
                  onMouseLeave={() => setHoveredLocationId(null)}
                  style={{ left: `${loc.coordinatesX}%`, top: `${loc.coordinatesY}%`, transformStyle: isThreeD ? "preserve-3d" : "flat" }}
                  className="absolute p-0.5 cursor-pointer focus:outline-none transition-transform z-30 -translate-x-1/2 -translate-y-1/2"
                >
                  {/* Pulsing Holo radar rings on base ground */}
                  {(isSelected || isStart || isEnd) && (
                    <div 
                      className={`absolute w-12 h-12 rounded-full border-2 border-dashed ${colors.solid} animate-[spin_5s_linear_infinite] -translate-x-1/2 -translate-y-1/2 opacity-75`}
                      style={{ transform: "translateZ(0px)" }}
                    />
                  )}

                  {/* Vertical Elevation holograph shaft (only in 3D mode) */}
                  {isThreeD && (
                    <div 
                      className={`absolute w-0.5 bg-gradient-to-t ${colors.hologramColor} origin-bottom -translate-x-1/2`} 
                      style={{ 
                        height: "35px", 
                        transform: "rotateX(0deg)", 
                        top: "-35px"
                      }}
                    />
                  )}

                  {/* Hologram Pin Stand (stands tall in 3D space) */}
                  <div 
                    style={billboardStyle}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-2xl transition-all duration-300 ${
                      isStart 
                        ? "bg-green-600 border-green-400 text-white scale-110 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : isEnd
                        ? "bg-rose-600 border-rose-400 text-white scale-110 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                        : isSelected
                        ? "bg-indigo-600 border-indigo-400 text-white scale-115 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                        : "bg-zinc-900 border-zinc-750 text-zinc-300 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    {isStart ? (
                      <span className="text-[8px] font-black uppercase font-mono tracking-wider px-0.5">Start</span>
                    ) : isEnd ? (
                      <span className="text-[8px] font-black uppercase font-mono tracking-wider px-0.5">Dest</span>
                    ) : (
                      getCategoryIcon(loc.category)
                    )}
                    <span className="text-[9px] font-black tracking-tight max-w-[100px] truncate">
                      {loc.name.replace(/\(.*?\)/g, "").trim()}
                    </span>
                  </div>
                </button>
              );
            })}
          </motion.div>

          {/* Interactive Legend overlay */}
          <div className="absolute bottom-4 left-4 bg-zinc-900/95 border border-zinc-800 p-3.5 rounded-2xl flex flex-col gap-1.5 z-10 pointer-events-none font-mono text-[9px] text-zinc-400 max-w-[170px] shadow-lg">
            <span className="font-bold text-[10px] uppercase text-zinc-200 tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              TCE Holo Quadrants
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
              <span>Academic Zone (A/B/C)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
              <span>Central Hub & Library</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-sky-500 rounded-full shrink-0" />
              <span>Administrative Plaza</span>
            </div>
          </div>
        </div>

        {/* Selected Location Details Panel */}
        {selectedLocation && (
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col md:flex-row gap-5 shadow-xl justify-between items-start md:items-center">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-display font-black text-lg text-zinc-900 dark:text-white leading-tight">{selectedLocation.name}</h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-extrabold tracking-wider border ${getCategoryThemeColors(selectedLocation.category).bg}`}>
                  {selectedLocation.category}
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed max-w-2xl">{selectedLocation.description}</p>
              
              <div className="flex flex-wrap gap-4 text-xs font-mono font-bold text-zinc-500 pt-1">
                <span>Building: <strong className="text-zinc-850 dark:text-zinc-300">{selectedLocation.building}</strong></span>
                <span>Floor: <strong className="text-zinc-850 dark:text-zinc-300">{selectedLocation.floor}</strong></span>
                {selectedLocation.roomNumber && (
                  <span>Room/Desk: <strong className="text-zinc-850 dark:text-zinc-300">{selectedLocation.roomNumber}</strong></span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => {
                  const event = new CustomEvent("ask-campus-bot", { detail: `Where is "${selectedLocation.name}"?` });
                  window.dispatchEvent(event);
                }}
                className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 text-zinc-800 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs font-bold px-3.5 py-2.5 rounded-xl cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                Ask Chatbot
              </button>
            </div>
          </div>
        )}

        {/* Live Commuters Info Board */}
        {showLiveCommuters && (
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="space-y-0.5">
                <h5 className="font-display font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-indigo-500" />
                  Live Commuter Schedule Board
                </h5>
                <p className="text-zinc-500 text-[10px]">Real-time student transit activity inside campus sectors</p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                ● SIMULATOR ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commuters.map((student) => {
                const isSelected = selectedStudentId === student.id;
                const progressInt = Math.floor(student.progress);
                
                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudentId(isSelected ? null : student.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 shadow-sm"
                        : "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-150 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl ${student.color} border ${student.border} flex items-center justify-center text-lg shadow-sm`}>
                          {student.avatar}
                        </div>
                        <div>
                          <h6 className="text-xs font-black text-zinc-900 dark:text-white leading-snug">
                            {student.name}
                          </h6>
                          <p className="text-zinc-500 text-[10px] font-semibold">{student.role}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        student.status === "walking" 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}>
                        {student.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal flex items-start gap-1">
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span>{student.statusText}</span>
                      </p>

                      {student.status === "walking" && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                            <span>Route Progress</span>
                            <span>{progressInt}%</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${student.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
