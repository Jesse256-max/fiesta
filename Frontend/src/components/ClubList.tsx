import React, { useState } from "react";
import { Club } from "../types.ts";
import { useAuth } from "../lib/auth.tsx";
import { ShieldCheck, Plus, Check, Mail, Sparkles, Filter, Search } from "lucide-react";
import { motion } from "motion/react";

interface ClubListProps {
  clubs: Club[];
  onStatusChange: () => void;
  compact?: boolean;
}

const CATEGORIES = ["All", "Tech", "Music", "Literary", "Sports", "Creative", "Social"];

export const ClubList: React.FC<ClubListProps> = ({ clubs, onStatusChange, compact = false }) => {
  const { token, loginWithGoogle, localUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingMap, setLoadingMap] = useState<{ [key: number]: boolean }>({});
  const [localJoinedClubIds, setLocalJoinedClubIds] = useState<number[]>(() => {
    const saved = localStorage.getItem("technotrons_local_joined_clubs");
    return saved ? JSON.parse(saved) : [];
  });

  const handleJoin = async (clubId: number) => {
    if (!token && !localUser) {
      alert("Please sign in with Google or use the portal as guest to join student clubs!");
      loginWithGoogle();
      return;
    }

    if (!token && localUser) {
      // Guest local persistence mode
      const updated = [...localJoinedClubIds, clubId];
      setLocalJoinedClubIds(updated);
      localStorage.setItem("technotrons_local_joined_clubs", JSON.stringify(updated));
      onStatusChange();
      return;
    }

    setLoadingMap(prev => ({ ...prev, [clubId]: true }));
    try {
      const response = await fetch(`/api/clubs/${clubId}/join`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to join club");
      }

      onStatusChange();
    } catch (err) {
      console.error(err);
      alert("Failed to join club. Please try again later!");
    } finally {
      setLoadingMap(prev => ({ ...prev, [clubId]: false }));
    }
  };

  const processedClubs = clubs.map(club => {
    const isLocallyJoined = localJoinedClubIds.includes(club.id);
    return {
      ...club,
      membershipStatus: isLocallyJoined ? ("member" as const) : club.membershipStatus
    };
  });

  const filteredClubs = processedClubs.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.president && c.president.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter bar */}
      {!compact && (
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search clubs by name, category, keyword or president..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans placeholder-zinc-500 shadow-inner"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-zinc-500 text-xs font-mono font-medium flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                  selectedCategory === cat
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={selectedCategory}
        className={compact ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-5"}
      >
        {filteredClubs.map((club) => (
          <motion.div
            key={club.id}
            id={`club-card-${club.id}`}
            variants={itemVariants}
            whileHover={{ y: compact ? 0 : -4, x: compact ? 3 : 0, transition: { duration: 0.15 } }}
            className={
              compact
                ? "p-3.5 bg-zinc-50/50 hover:bg-zinc-100/80 dark:bg-zinc-950/40 dark:hover:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl transition-all flex items-center justify-between gap-3 text-zinc-900 dark:text-white cursor-pointer"
                : "p-5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl shadow-xl hover:shadow-indigo-500/5 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all flex flex-col md:flex-row gap-5 items-start md:items-center text-zinc-900 dark:text-white"
            }
          >
            {/* Club Logo / Image */}
            <div className={compact ? "w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center" : "w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center"}>
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-5 h-5 text-yellow-500" />
              )}
            </div>

            {/* Club Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className={compact ? "font-display font-bold text-xs text-zinc-850 dark:text-zinc-150 truncate" : "font-display font-bold text-base text-zinc-900 dark:text-white truncate"}>
                  {club.name}
                </h4>
                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0">
                  {club.category}
                </span>
              </div>
              {!compact && (
                <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mb-3 line-clamp-2">
                  {club.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-zinc-400 text-[10px] font-mono">
                {club.president && (
                  <span>Pres: <strong className="text-zinc-650 dark:text-zinc-350">{club.president}</strong></span>
                )}
                {!compact && club.contactEmail && (
                  <a href={`mailto:${club.contactEmail}`} className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-300">
                    <Mail className="w-3 h-3" />
                    {club.contactEmail}
                  </a>
                )}
              </div>
            </div>

            {/* Join Action Button */}
            <div className="shrink-0">
              {club.membershipStatus === "member" ? (
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Joined
                </div>
              ) : (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoin(club.id);
                  }}
                  disabled={loadingMap[club.id]}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={
                    compact
                      ? "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      : "w-full md:w-auto bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-white dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                  }
                >
                  {loadingMap[club.id] ? (
                    "..."
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Join
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
