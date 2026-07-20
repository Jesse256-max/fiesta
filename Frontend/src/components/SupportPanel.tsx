import React from "react";
import {
  BookOpen,
  Phone,
  Info,
  MapPin,
} from "lucide-react";

export const SupportPanel: React.FC = () => {
  return (
    <div id="support-panel" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white text-center flex flex-col items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 text-cyan-200 font-mono text-[10px] uppercase font-bold rounded-full tracking-wider shadow-sm mb-3">
          <Phone className="w-3.5 h-3.5" />
          Campus Contact Directory
        </span>
        <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">Helplines &amp; Contacts</h3>
        <p className="text-white/80 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
          Quick access to the main administrative, IT, wellness, and security contact resources of Technotrons College of Engineering.
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-8 animate-fadeIn">
        {/* Quick Helplines */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-sm hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono">Academic Affairs</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Course registries, credit allocations, and transfers.</p>
            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 font-mono text-[10px] text-zinc-500">
              <div className="flex justify-between"><span>Email:</span><span className="text-zinc-700 dark:text-zinc-300 font-semibold select-all">academics@technotrons.edu</span></div>
              <div className="flex justify-between"><span>Extension:</span><span className="text-zinc-700 dark:text-zinc-300 font-semibold select-all">+1 (555) 0192</span></div>
            </div>
          </div>

          <div className="p-5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-sm hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <Info className="w-4 h-4 text-cyan-500" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono">IT Mainframe Support</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Wi-Fi configuration, passwords, server issues.</p>
            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 font-mono text-[10px] text-zinc-500">
              <div className="flex justify-between"><span>Email:</span><span className="text-zinc-700 dark:text-zinc-300 font-semibold select-all">support@technotrons.edu</span></div>
              <div className="flex justify-between"><span>Extension:</span><span className="text-zinc-700 dark:text-zinc-300 font-semibold select-all">+1 (555) 0143</span></div>
            </div>
          </div>

          <div className="p-5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-sm hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <Phone className="w-4.5 h-4.5 text-emerald-500" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono">Student Wellness Hub</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Accommodations, clinic access, wellness advice.</p>
            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 font-mono text-[10px] text-zinc-500">
              <div className="flex justify-between"><span>Email:</span><span className="text-zinc-700 dark:text-zinc-300 font-semibold select-all">wellness@technotrons.edu</span></div>
              <div className="flex justify-between"><span>Direct:</span><span className="text-zinc-700 dark:text-zinc-300 font-semibold select-all">+1 (555) 0188</span></div>
            </div>
          </div>

          <div className="p-5 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-sm hover:border-pink-500/30 dark:hover:border-pink-500/30 transition-all">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <MapPin className="w-4 h-4 text-pink-500" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono">Campus Security Desk</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Lost keys, physical security escorts, parking decals.</p>
            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 font-mono text-[10px] text-zinc-500">
              <div className="flex justify-between"><span>Location:</span><span className="text-zinc-700 dark:text-zinc-300 font-semibold select-all">Admin Block, GF</span></div>
              <div className="flex justify-between"><span>Emergency:</span><span className="text-zinc-700 dark:text-zinc-300 font-semibold select-all">+1 (555) 9111</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
