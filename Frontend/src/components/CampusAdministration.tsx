import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  UserCheck, 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  Award, 
  BookOpen, 
  GraduationCap, 
  Lightbulb, 
  Globe, 
  ChevronRight, 
  Sparkles,
  BookmarkCheck
} from "lucide-react";

export const CampusAdministration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"principal" | "campus" | "structure">("principal");

  // Key stats for Saranathan College of Engineering
  const stats = [
    { label: "Established", value: "1998" },
    { label: "Campus Size", value: "40+ Acres" },
    { label: "NAAC Grade", value: "A+ Grade" },
    { label: "UGC Status", value: "Autonomous" },
    { label: "TNEA Code", value: "2615" },
    { label: "Alumni Network", value: "20,000+" }
  ];

  const pillars = [
    { title: "Academic Excellence", desc: "UGC Autonomous curriculum aligned with NBA standards across all eligible departments.", icon: GraduationCap, color: "text-indigo-500 bg-indigo-500/10" },
    { title: "E-Yantra & EDC Innovation", desc: "IIT Bombay backed robotics laboratory and Entrepreneurship Development Cell incubation.", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10" },
    { title: "Value Based Education", desc: "Instilling deep ethical responsibility and holistic student empowerment founded by Auditor Shri K. Santhanam.", icon: BookmarkCheck, color: "text-emerald-500 bg-emerald-500/10" }
  ];

  const buildings = [
    {
      name: "Central Administrative Complex",
      type: "Administration & Auditorium",
      floors: "G + 3 Floors",
      desc: "Contains the Principal's Office, Academic Registrar, accounts desk, hostel warden liaison, and the air-conditioned Silver Jubilee Auditorium.",
      image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Computer Support Group (CSG Block)",
      type: "Academic & GPU Research Lab",
      floors: "G + 4 Floors",
      desc: "Houses Computer Science & Engineering, IT, AI&DS, high-speed GPU server labs, and the Infosys Campus Connect training hall.",
      image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Central Library & Digital Resource Center",
      type: "Digital & Academic Resource",
      floors: "G + 2 Floors",
      desc: "Houses over 50,000 physical volumes, IEEE digital journal subscriptions, quiet study pods, and book bank facilities.",
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "E-Yantra Robotics & EDC Incubation Center",
      type: "Research & Startup Hub",
      floors: "G + 2 Floors",
      desc: "Dedicated collaborative workspaces for IIT Bombay robotics project development, startup incubation, and patent drafting.",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="bg-white/10 border border-white/20 text-white font-mono font-bold text-[9px] uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wider">
            ★ campus administration & directory
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white leading-none">
            Saranathan College of Engineering
          </h2>
          <p className="text-zinc-200 text-xs leading-relaxed max-w-xl">
            UGC Autonomous Institution • NAAC 'A+' Accredited • All 7 eligible UG branches NBA Accredited (TNEA Code 2615, Trichy).
          </p>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-zinc-250 dark:border-zinc-800">
        {[
          { id: "principal", label: "Principal's Office", icon: UserCheck },
          { id: "campus", label: "Campus Vision", icon: Award },
          { id: "structure", label: "Key Infrastructure", icon: Building2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        
        {/* PANEL 1: PRINCIPAL DETAILS */}
        {activeTab === "principal" && (
          <motion.div
            key="principal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Principal Profile Card */}
            <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-indigo-50 dark:bg-zinc-950 border-2 border-indigo-500 p-1 shadow-md">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250" 
                      alt="Dr. D. Valavan" 
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-indigo-600 border border-white dark:border-zinc-900 p-1 text-white rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-black text-lg text-zinc-900 dark:text-white">Dr. D. Valavan</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Principal & Professor</p>
                  <p className="text-[10px] text-zinc-400 font-mono">B.E., M.E., Ph.D. (Mechanical Engineering)</p>
                </div>
              </div>

              {/* Office & Contacts */}
              <div className="border-t border-zinc-150 dark:border-zinc-800 mt-5 pt-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Principal Office, Admin Block</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="font-mono text-[11px]">principal@saranathan.ac.in</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="font-mono text-[11px]">+91-8489915214 / +91-8489915224</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Public Hours: Mon – Fri, 10:00 AM – 05:00 PM</span>
                </div>
              </div>
            </div>

            {/* Principal Welcome Message */}
            <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
              <div className="space-y-2">
                <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                  Welcome Address
                </span>
                <h3 className="font-display font-black text-xl text-zinc-900 dark:text-white tracking-tight leading-tight">
                  "Educate, Empower & Employ - Transforming Engineering Education"
                </h3>
              </div>

              <div className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed space-y-4">
                <p>
                  Dear Students & Aspirants,
                </p>
                <p>
                  It gives me immense pleasure to welcome you to <strong>Saranathan College of Engineering</strong>, Tiruchirappalli. Conferred with 10-year UGC Autonomous status and accredited with NAAC 'A+' grade, our institution stands as a beacon of academic rigor and industry-aligned innovation.
                </p>
                <p>
                  With all 7 eligible engineering disciplines reaccredited by the National Board of Accreditation (NBA), we provide our students with world-class computing facilities, Infosys Campus Connect training, IIT Bombay e-Yantra robotics research labs, and an active Entrepreneurship Development Cell.
                </p>
                <p>
                  I encourage every student to utilize our campus digital portal to access course schedules, track academic milestones, participate in IEEE student activities, and engage in high-impact technological learning.
                </p>
                <p className="italic text-zinc-500 pt-1">
                  Warm regards and best wishes,<br />
                  <strong>Dr. D. Valavan</strong><br />
                  <span className="text-xs">Principal, Saranathan College of Engineering</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* PANEL 2: CAMPUS VISION */}
        {activeTab === "campus" && (
          <motion.div
            key="campus"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats.map((s, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-md">
                  <div className="font-display font-black text-xl text-indigo-600 dark:text-indigo-400">{s.value}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${p.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-display font-bold text-base text-zinc-900 dark:text-white">{p.title}</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* PANEL 3: KEY INFRASTRUCTURE */}
        {activeTab === "structure" && (
          <motion.div
            key="structure"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {buildings.map((b, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col sm:flex-row">
                <div className="sm:w-2/5 h-44 sm:h-auto relative shrink-0">
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-md text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-white/20">
                    {b.type}
                  </span>
                </div>
                <div className="p-5 sm:w-3/5 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">{b.floors}</span>
                    <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">{b.name}</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
