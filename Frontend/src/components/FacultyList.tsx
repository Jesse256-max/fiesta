import React, { useState } from "react";
import { FacultyMember } from "../types.ts";
import { Search, Mail, MapPin, Clock, BookOpen, GraduationCap, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FacultyListProps {
  faculty: FacultyMember[];
}

export const FacultyList: React.FC<FacultyListProps> = ({ faculty }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Dynamically extract unique departments from the faculty list and sort Academic Leadership first
  const rawDepts = Array.from(new Set(faculty.map((f) => f.department))) as string[];
  const sortedDepts = rawDepts.filter(d => d !== "Academic Leadership");
  if (rawDepts.includes("Academic Leadership")) {
    sortedDepts.unshift("Academic Leadership");
  }
  const departments: string[] = ["All", ...sortedDepts];

  // Helper to count members in each department
  const getDeptCount = (dept: string) => {
    if (dept === "All") return faculty.length;
    return faculty.filter((f) => f.department === dept).length;
  };

  const filteredFaculty = faculty.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.researchInterests && f.researchInterests.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesDept = selectedDept === "All" || f.department === selectedDept;
    
    return matchesSearch && matchesDept;
  }).sort((a, b) => {
    // 1. Academic Leadership department always first
    const aIsAL = a.department === "Academic Leadership";
    const bIsAL = b.department === "Academic Leadership";
    if (aIsAL && !bIsAL) return -1;
    if (!aIsAL && bIsAL) return 1;

    // Sort by department alphabetically if they are different
    if (a.department !== b.department) {
      return a.department.localeCompare(b.department);
    }

    // 2. Sort by designation seniority order
    const getDesignationOrder = (designation: string) => {
      const d = designation.toLowerCase();
      if (d.includes("principal")) return 1;
      if (d.includes("dean")) return 2;
      if (d.includes("hod")) return 3;
      if (d.includes("associate professor")) return 5;
      if (d.includes("assistant professor")) return 6;
      if (d.includes("professor")) return 4;
      return 7;
    };

    return getDesignationOrder(a.designation) - getDesignationOrder(b.designation);
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
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search faculty name, room, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 text-white text-sm border border-zinc-700 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans placeholder-zinc-500 shadow-inner"
          />
        </div>

        {/* Dept chips/selector */}
        <div className="flex flex-wrap gap-2 shrink-0 items-center">
          {departments.map((dept) => {
            const count = getDeptCount(dept);
            const isActive = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border flex items-center gap-2 ${
                  isActive
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <span>{dept === "All" ? "All Departments" : dept}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={selectedDept} // Re-animate on department filter change
        className="space-y-8"
      >
        {/* If a specific department is selected, display its HOD at the Top Middle */}
        {selectedDept !== "All" && filteredFaculty.some(f => f.designation.includes("HOD")) ? (
          (() => {
            const hod = filteredFaculty.find(f => f.designation.includes("HOD"));
            const others = filteredFaculty.filter(f => f.id !== hod?.id);

            return (
              <div className="space-y-8">
                {/* HOD Top Middle Spotlight */}
                {hod && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="text-center mb-3">
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-widest inline-flex items-center gap-1.5 shadow-md shadow-amber-950/20">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        Head of Department (HOD)
                      </span>
                    </div>
                    
                    <motion.div
                      key={hod.id}
                      id={`faculty-card-${hod.id}`}
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.15 } }}
                      onMouseEnter={() => setHoveredId(hod.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="relative w-full max-w-xl p-6 rounded-3xl shadow-2xl transition-all flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left text-white cursor-help border bg-gradient-to-br from-zinc-850 via-zinc-900 to-zinc-950 border-amber-500/40 shadow-amber-950/15 hover:border-amber-500/80 hover:shadow-amber-500/10"
                    >
                      {/* Hover Tooltip / Popup */}
                      <AnimatePresence>
                        {hoveredId === hod.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-80 p-4 bg-zinc-950 rounded-2xl shadow-2xl text-zinc-200 pointer-events-none border border-amber-500/50"
                          >
                            <div className="space-y-2.5 text-left">
                              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-amber-400">Department Head Spotlight</span>
                              </div>
                              <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">
                                {hod.name} leads the {hod.department} department, managing academic development, faculty standards, and student innovation milestones.
                              </p>
                              <div className="pt-2 border-t border-zinc-800">
                                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Office Hours Summary</span>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                                  Consultation & guidance held on <strong className="text-zinc-200 font-semibold">{hod.hours}</strong> in office room <strong className="text-zinc-200 font-semibold">{hod.office}</strong>.
                                </p>
                              </div>
                            </div>
                            {/* Tooltip arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-zinc-950" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Avatar Photo / Fallback */}
                      <div className="w-20 h-20 rounded-full border text-white shrink-0 overflow-hidden shadow-xl bg-zinc-900 border-amber-500/50 flex items-center justify-center">
                        {hod.avatarUrl ? (
                          <img 
                            src={hod.avatarUrl} 
                            alt={hod.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center font-display font-bold text-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600">
                          {hod.name.split(" ").pop()?.charAt(0)}
                        </div>
                      </div>

                      {/* Core Info */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h4 className="font-display font-bold text-lg text-white flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <span>{hod.name}</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm font-mono shrink-0 mx-auto sm:mx-0">
                              <Crown className="w-3 h-3 text-amber-400" />
                              HOD
                            </span>
                          </h4>
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-amber-400 font-semibold mt-1">
                            <GraduationCap className="w-4 h-4 shrink-0 text-amber-400" />
                            <span>{hod.designation} • {hod.department}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-zinc-300 font-medium">
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <MapPin className="w-4 h-4 text-amber-500/60 shrink-0" />
                            <span>Office: <strong className="text-white">{hod.office}</strong></span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <Clock className="w-4 h-4 text-amber-500/60 shrink-0" />
                            <span>Hours: <strong className="text-white">{hod.hours}</strong></span>
                          </div>
                        </div>

                        {hod.researchInterests && (
                          <div className="text-xs bg-zinc-950/60 p-3 rounded-xl border border-amber-500/20 text-zinc-300 leading-relaxed text-left">
                            <span className="font-bold text-[9px] uppercase tracking-wider block mb-0.5 text-amber-400">
                              Leadership Expertise & Research Focus
                            </span>
                            {hod.researchInterests}
                          </div>
                        )}

                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-center sm:justify-between">
                          <a
                            href={`mailto:${hod.email}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-amber-400 transition-colors font-sans"
                          >
                            <Mail className="w-4 h-4 text-amber-500/60" />
                            {hod.email}
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Separator line */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold font-mono tracking-wider text-zinc-500 uppercase">Department Faculty Members</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                {/* Remaining Faculty Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {others.map((f) => {
                    const isLeader = f.department === "Academic Leadership" || 
                                     f.designation.includes("Dean") || 
                                     f.designation.includes("Principal");

                    return (
                      <motion.div
                        key={f.id}
                        id={`faculty-card-${f.id}`}
                        variants={itemVariants}
                        whileHover={{ y: -4, transition: { duration: 0.15 } }}
                        onMouseEnter={() => setHoveredId(f.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`relative p-5 rounded-3xl shadow-xl transition-all flex gap-4 items-start text-white cursor-help group border ${
                          isLeader
                            ? "bg-gradient-to-b from-zinc-800 to-zinc-900 border-amber-500/30 hover:border-amber-500/60 shadow-amber-950/10 hover:shadow-amber-500/5"
                            : "bg-zinc-800 border-zinc-700 hover:border-indigo-500/30 hover:shadow-indigo-500/10"
                        }`}
                      >
                        <AnimatePresence>
                          {hoveredId === f.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.96, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96, y: 8 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-76 p-4 bg-zinc-950 rounded-2xl shadow-2xl text-zinc-200 pointer-events-none border ${
                                isLeader ? "border-amber-500/40" : "border-indigo-500/40"
                              }`}
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                                  {isLeader ? (
                                    <>
                                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                                      <span className="text-amber-400">Leadership Spotlight Bio</span>
                                    </>
                                  ) : (
                                    <>
                                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                                      <span className="text-indigo-400">Faculty Spotlight Bio</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">
                                  {isLeader 
                                    ? `${f.name} steers the strategic direction, academic standards, and executive operations as ${f.designation} at Saranathan College of Engineering.`
                                    : `${f.name} is a distinguished ${f.designation.toLowerCase()} in the ${f.department} department. Highly active in undergraduate mentorship and specialized academic initiatives.`
                                  }
                                </p>
                                <div className="pt-2 border-t border-zinc-800">
                                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Office Hours Summary</span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                                    Consultation & guidance held on <strong className="text-zinc-200 font-semibold">{f.hours}</strong> in office room <strong className="text-zinc-200 font-semibold">{f.office}</strong>.
                                  </p>
                                </div>
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-zinc-950" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="w-14 h-14 rounded-full border text-white shrink-0 overflow-hidden shadow-inner bg-zinc-900 border-zinc-700 flex items-center justify-center relative">
                          {f.avatarUrl ? (
                            <img 
                              src={f.avatarUrl} 
                              alt={f.name} 
                              className="w-full h-full object-cover relative z-10"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div className={`absolute inset-0 flex items-center justify-center font-display font-bold text-lg ${
                            isLeader 
                              ? "bg-gradient-to-br from-amber-400 to-orange-600"
                              : "bg-gradient-to-br from-indigo-500 to-purple-600"
                          }`}>
                            {f.name.split(" ").pop()?.charAt(0)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <h4 className="font-display font-bold text-base text-white truncate flex items-center justify-between gap-1.5">
                              <span className="truncate">{f.name}</span>
                              {isLeader && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm font-mono shrink-0">
                                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                                  LEADER
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                              <GraduationCap className={`w-4 h-4 shrink-0 ${isLeader ? "text-amber-400" : "text-zinc-500"}`} />
                              <span className={isLeader ? "text-zinc-300 font-semibold" : ""}>{f.designation} • {f.department}</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-zinc-300 font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span>Office: <strong className="text-zinc-200">{f.office}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span>Hours: <strong className="text-zinc-200">{f.hours}</strong></span>
                            </div>
                          </div>

                          {f.researchInterests && (
                            <div className="text-[11px] bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800 text-zinc-400 leading-normal">
                              <span className={`font-bold text-[9px] uppercase tracking-wider block mb-0.5 ${isLeader ? "text-amber-400" : "text-indigo-400"}`}>
                                {isLeader ? "Leadership Expertise & Focus" : "Research Interests"}
                              </span>
                              {f.researchInterests}
                            </div>
                          )}

                          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                            <a
                              href={`mailto:${f.email}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-indigo-400 transition-colors font-sans"
                            >
                              <Mail className="w-4 h-4 text-zinc-500" />
                              {f.email}
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : (
          /* Normal grid rendering for "All" or if no HOD exists */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredFaculty.map((f) => {
              const isLeader = f.department === "Academic Leadership" || 
                               f.designation.includes("Dean") || 
                               f.designation.includes("Principal") || 
                               f.designation.includes("HOD");

              return (
                <motion.div
                  key={f.id}
                  id={`faculty-card-${f.id}`}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.15 } }}
                  onMouseEnter={() => setHoveredId(f.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`relative p-5 rounded-3xl shadow-xl transition-all flex gap-4 items-start text-white cursor-help group border ${
                    isLeader
                      ? "bg-gradient-to-b from-zinc-800 to-zinc-900 border-amber-500/30 hover:border-amber-500/60 shadow-amber-950/10 hover:shadow-amber-500/5"
                      : "bg-zinc-800 border-zinc-700 hover:border-indigo-500/30 hover:shadow-indigo-500/10"
                  }`}
                >
                  <AnimatePresence>
                    {hoveredId === f.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-76 p-4 bg-zinc-950 rounded-2xl shadow-2xl text-zinc-200 pointer-events-none border ${
                          isLeader ? "border-amber-500/40" : "border-indigo-500/40"
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider">
                            {isLeader ? (
                              <>
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-amber-400">Leadership Spotlight Bio</span>
                              </>
                            ) : (
                              <>
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-indigo-400">Faculty Spotlight Bio</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">
                            {isLeader 
                              ? `${f.name} steers the strategic direction, academic standards, and executive operations as ${f.designation} at Saranathan College of Engineering.`
                              : `${f.name} is a distinguished ${f.designation.toLowerCase()} in the ${f.department} department. Highly active in undergraduate mentorship and specialized academic initiatives.`
                          }
                          </p>
                          <div className="pt-2 border-t border-zinc-800">
                            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Office Hours Summary</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                              Consultation & guidance held on <strong className="text-zinc-200 font-semibold">{f.hours}</strong> in office room <strong className="text-zinc-200 font-semibold">{f.office}</strong>.
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-zinc-950" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`w-14 h-14 rounded-full border text-white shrink-0 flex items-center justify-center font-display font-bold text-lg shadow-inner ${
                    isLeader 
                      ? "bg-gradient-to-br from-amber-400 to-orange-600 border-amber-500/50"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600 border-zinc-700"
                  }`}>
                    {f.name.split(" ").pop()?.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h4 className="font-display font-bold text-base text-white truncate flex items-center justify-between gap-1.5">
                        <span className="truncate">{f.name}</span>
                        {isLeader && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm font-mono shrink-0">
                            <Crown className="w-2.5 h-2.5 text-amber-400" />
                            LEADER
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                        <GraduationCap className={`w-4 h-4 shrink-0 ${isLeader ? "text-amber-400" : "text-zinc-500"}`} />
                        <span className={isLeader ? "text-zinc-300 font-semibold" : ""}>{f.designation} • {f.department}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-zinc-300 font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Office: <strong className="text-zinc-200">{f.office}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Hours: <strong className="text-zinc-200">{f.hours}</strong></span>
                      </div>
                    </div>

                    {f.researchInterests && (
                      <div className="text-[11px] bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800 text-zinc-400 leading-normal">
                        <span className={`font-bold text-[9px] uppercase tracking-wider block mb-0.5 ${isLeader ? "text-amber-400" : "text-indigo-400"}`}>
                          {isLeader ? "Leadership Expertise & Focus" : "Research Interests"}
                        </span>
                        {f.researchInterests}
                      </div>
                    )}

                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                      <a
                        href={`mailto:${f.email}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-indigo-400 transition-colors font-sans"
                      >
                        <Mail className="w-4 h-4 text-zinc-500" />
                        {f.email}
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filteredFaculty.length === 0 && (
          <div className="text-center py-12 bg-zinc-850 border border-zinc-700 rounded-3xl">
            <BookOpen className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No faculty members found matching your search.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
