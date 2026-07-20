import React, { useState } from "react";
import { ChecklistItem } from "../types.ts";
import { useAuth } from "../lib/auth.tsx";
import { CheckSquare, Square, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface ChecklistProps {
  items: ChecklistItem[];
  onToggle: () => void;
}

export const Checklist: React.FC<ChecklistProps> = ({ items, onToggle }) => {
  const { token, loginWithGoogle, localUser } = useAuth();
  const [updatingMap, setUpdatingMap] = useState<{ [key: number]: boolean }>({});

  const handleToggle = async (item: ChecklistItem) => {
    if (!token && !localUser) {
      alert("Please sign in first to update your registration checklist!");
      loginWithGoogle();
      return;
    }

    setUpdatingMap(prev => ({ ...prev, [item.id]: true }));
    try {
      if (token) {
        const response = await fetch(`/api/checklist/${item.id}/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: !item.completed }),
        });

        if (!response.ok) {
          throw new Error("Failed to toggle checklist item");
        }
      } else {
        // Local/guest user toggle persistence in localStorage
        const stored = localStorage.getItem("technotrons_local_checklist");
        if (stored) {
          const list = JSON.parse(stored) as ChecklistItem[];
          const updated = list.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i);
          localStorage.setItem("technotrons_local_checklist", JSON.stringify(updated));
        }
      }

      onToggle();
    } catch (err) {
      console.error(err);
      alert("Failed to update checklist item. Please try again later!");
    } finally {
      setUpdatingMap(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Calculate stats
  const totalCount = items.length;
  const completedCount = items.filter(i => i.completed).length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1.5">
          <h4 className="font-display font-bold text-lg tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            Orientation Progress
          </h4>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed max-w-sm">
            Complete all the required milestones to receive your official welcome packet and access campus amenities.
          </p>
        </div>

        {/* Completion Gauge */}
        <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
          <div className="flex-1 md:flex-none">
            <div className="h-2.5 w-full md:w-48 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-zinc-400">
              <span>{completedCount} of {totalCount} Completed</span>
              <span>{percentage}%</span>
            </div>
          </div>
          
          <div className="h-12 w-12 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center font-display font-black text-indigo-400 text-sm">
            {percentage}%
          </div>
        </div>
      </div>

      {/* List items */}
      <div className="space-y-3">
        {items.map((item) => (
          <motion.div
            key={item.id}
            id={`checklist-item-${item.id}`}
            whileHover={{ scale: 1.015, borderColor: "rgba(99, 102, 241, 0.4)" }}
            whileTap={{ scale: 0.99 }}
            onClick={() => !updatingMap[item.id] && handleToggle(item)}
            className={`p-4 rounded-2xl border transition-all duration-150 flex items-start gap-4 cursor-pointer select-none ${
              item.completed
                ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-100"
            }`}
          >
            {/* Interactive Square / CheckSquare */}
            <motion.button
              disabled={updatingMap[item.id]}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.8 }}
              className={`shrink-0 mt-0.5 transition-transform ${
                item.completed ? "text-emerald-400" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/10" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </motion.button>

            {/* Content Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`font-display font-bold text-sm ${
                  item.completed ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-900 dark:text-white"
                }`}>
                  {item.title}
                </span>
                
                {/* IsRequired indicator */}
                {item.isRequired ? (
                  <span className="bg-red-500/10 text-red-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border border-red-500/20 shrink-0">
                    Required
                  </span>
                ) : (
                  <span className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase shrink-0">
                    Optional
                  </span>
                )}
              </div>
              <p className={`text-xs leading-relaxed ${item.completed ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-400"}`}>
                {item.description}
              </p>
              
              <span className="inline-block bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono px-2 py-0.5 rounded-full mt-2">
                {item.category}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
