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

  // Key stats
  const stats = [
    { label: "Established", value: "1996" },
    { label: "Campus Size", value: "50+ Acres" },
    { label: "High-Tech Labs", value: "45+" },
    { label: "Smart Classrooms", value: "100%" },
    { label: "NIRF Ranking", value: "Top 50" },
    { label: "Alumni Network", value: "15,000+" }
  ];

  const pillars = [
    { title: "Academic Excellence", desc: "Rigorous research-driven curriculum aligned with global engineering standards.", icon: GraduationCap, color: "text-indigo-500 bg-indigo-500/10" },
    { title: "Pioneering Innovation", desc: "Incubating dynamic student startups with $2M+ seed funding directly on-campus.", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10" },
    { title: "Ethical Responsibility", desc: "Instilling deep societal accountability and green energy engineering paradigms.", icon: BookmarkCheck, color: "text-emerald-500 bg-emerald-500/10" }
  ];

  const buildings = [
    {
      name: "Sir C. V. Raman Academic Block",
      type: "Academic & Tech Lab",
      floors: "G + 5 Floors",
      desc: "Houses Computer Science, Electrical Engineering, the central mainframe room, and advanced hardware prototyping hubs.",
      image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Visvesvaraya Administrative Block",
      type: "Administration",
      floors: "G + 3 Floors",
      desc: "Contains the Principal's Office, Academic Registrar, accounts desk, hostel warden liaison, and primary freshman help desks.",
      image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Srinivasa Ramanujan Library",
      type: "Digital & Research Resource",
      floors: "G + 4 Floors",
      desc: "Contains over 120,000 physical titles, 24/7 quiet air-conditioned pods, IEEE digital catalog access, and private debate salons.",
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "TCE Incubation & StartUp Hub",
      type: "Research & Startup",
      floors: "G + 2 Floors",
      desc: "Dedicated workspaces for active student startups, venture capitalism mentoring tables, and 3D additive printing maker spaces.",
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
            Technotrons College of Engineering
          </h2>
          <p className="text-zinc-200 text-xs leading-relaxed max-w-xl">
            Administered by academic pioneers and tech visionaries, TCE coordinates state-of-the-art campus learning to prepare students for global research and technology careers.
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
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250" 
                      alt="Dr. G. K. Technotron" 
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-indigo-600 border border-white dark:border-zinc-900 p-1 text-white rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-black text-lg text-zinc-900 dark:text-white">Dr. G. K. Technotron</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Principal & Chief Admin Director</p>
                  <p className="text-[10px] text-zinc-400 font-mono">B.E, M.Tech, Ph.D. (MIT • Computer Engineering)</p>
                </div>
              </div>

              {/* Office & Contacts */}
              <div className="border-t border-zinc-150 dark:border-zinc-800 mt-5 pt-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Room 101, 1st Floor, Admin Block</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="font-mono text-[11px]">principal@technotrons.edu</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="font-mono text-[11px]">+1 (555) 700-1101 (Direct)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Public Hours: Mon & Wed, 2:00 PM – 4:00 PM</span>
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
                  "Empowering the Future with High-Performance Technical Rigor"
                </h3>
              </div>

              <div className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed space-y-4">
                <p>
                  Dear Freshmen of the 2026 Academic Cohort,
                </p>
                <p>
                  It is my absolute privilege to welcome you to the <strong>Technotrons College of Engineering</strong>. You are embarking on a magnificent four-year scholastic odyssey that will fundamentally reshape your analytical capabilities, technical competencies, and societal insights.
                </p>
                <p>
                  At TCE, we do not simply teach engineering; we build high-precision systems. Our classrooms are smart environments, our faculty are active developers and leading publishers, and our dynamic, canvas-infused portal provides an elegant platform to handle your courses, track attendance, and connect with academic peers.
                </p>
                <p>
                  I urge you to make full use of our Sir C. V. Raman academic computing facilities, register for student clubs to build team excellence, and complete your registration milestones. Our administration remains entirely committed to facilitating your absolute success.
                </p>
                <p className="italic text-zinc-500 pt-1">
                  Warm regards and best wishes,
                  <br />
                  <strong className="text-zinc-900 dark:text-white not-italic block mt-1">Dr. G. K. Technotron</strong>
                  <span className="text-xs text-zinc-400 block font-mono">Principal, Technotrons College of Engineering</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* PANEL 2: CAMPUS STATISTICS & VISION PILLARS */}
        {activeTab === "campus" && (
          <motion.div
            key="campus"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.map((st) => (
                <div key={st.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-center shadow-md">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">{st.label}</p>
                  <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">{st.value}</p>
                </div>
              ))}
            </div>

            {/* Core Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {pillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-lg space-y-3.5">
                    <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white">{p.title}</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* General Campus Overview Text */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-lg space-y-4">
              <h4 className="font-display font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                History & Strategic Vision
              </h4>
              <p className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed">
                Founded in 1996 with just two engineering streams and 120 students, Technotrons College of Engineering has grown into a world-class institute of engineering, technology, and applied research. Accredited with a prestigious 'A++' Grade, our campus hosts ultra-high-speed internet terminals, specialized materials laboratories, and private research cells designed to address global industrial dilemmas.
              </p>
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
            {buildings.map((b) => (
              <div 
                key={b.name} 
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col sm:flex-row items-stretch"
              >
                {/* Visual Thumbnail */}
                <div className="sm:w-1/3 min-h-[140px] bg-zinc-100 dark:bg-zinc-950 relative">
                  <img 
                    src={b.image} 
                    alt={b.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent to-zinc-900/10 pointer-events-none" />
                </div>
                {/* Content info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                        {b.type}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-zinc-400">
                        {b.floors}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white leading-snug">
                      {b.name}
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                      {b.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer">
                    <span>View Map Coordinates</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
