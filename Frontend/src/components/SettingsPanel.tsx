import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth.tsx";
import { 
  User, 
  BookOpen, 
  Save, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid
} from "lucide-react";
import { CampusEvent, DashboardWidget } from "../types.ts";
import { NotificationManager } from "./NotificationManager.tsx";
import { motion } from "motion/react";

interface SettingsPanelProps {
  events?: CampusEvent[];
  widgets?: DashboardWidget[];
  onWidgetsChange?: (widgets: DashboardWidget[]) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  events = [],
  widgets = [],
  onWidgetsChange = (_widgets: DashboardWidget[]) => {}
}) => {
  const { firebaseUser, dbUser, token, localUser, updateLocalUserProfile, refreshUserSync } = useAuth();
  
  // Local states for inputs
  const [displayName, setDisplayName] = useState("");
  const [selectedDept, setSelectedDept] = useState("Computer Science & Engineering");
  
  // Status states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const departments = [
    "Computer Science & Engineering",
    "Artificial Intelligence & Data Science",
    "Information Technology (IT)",
    "Electronics & Communication (ECE)",
    "Electrical & Electronics Engineering",
    "Robotics & Automation",
    "Aerospace Engineering",
    "Biotechnology Engineering",
    "Environmental Engineering",
    "Biomedical Engineering",
    "Civil Engineering",
    "Mechanical Engineering",
    "Chemical Engineering",
    "Metallurgical & Materials Engineering",
    "Humanities & Social Sciences"
  ];

  // Initialize fields based on loaded user data
  useEffect(() => {
    if (firebaseUser) {
      setDisplayName(dbUser?.name || firebaseUser.displayName || "");
      setSelectedDept(dbUser?.department || "Computer Science & Engineering");
    } else if (localUser) {
      setDisplayName(localUser.name || "Student");
      setSelectedDept(localUser.department || "Computer Science & Engineering");
    }
  }, [firebaseUser, dbUser, localUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setSaveError("Display name cannot be empty.");
      setSaving(false);
      return;
    }

    try {
      if (firebaseUser && token) {
        // Call backend API to update Postgres database
        const response = await fetch("/api/users/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: trimmedName,
            department: selectedDept
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to update profile settings.");
        }

        // Sync local auth context with backend
        await refreshUserSync();
      } else if (localUser) {
        // Update local session
        updateLocalUserProfile(trimmedName, selectedDept);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "An error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  // Reorder and toggle functions for widgets
  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= widgets.length) return;
    
    const updated = [...widgets];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    
    onWidgetsChange(updated);
  };

  const toggleWidget = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    onWidgetsChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...widgets];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onWidgetsChange(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div id="settings-panel" className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
      {/* 1. Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-black text-xl text-zinc-900 dark:text-white tracking-tight">
            Personalization Settings
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
            Set your preferred display name and field of study to unlock custom dashboard highlighting.
          </p>
        </div>
      </div>

      {/* 2. Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Name input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Display Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Mercer"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium"
              required
            />
          </div>
        </div>

        {/* Department picker */}
        <div className="space-y-2">
          <label className="block text-xs font-bold font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Preferred Department / Field of Study
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => {
              const isSelected = selectedDept === dept;
              return (
                <motion.button
                  key={dept}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedDept(dept)}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/15"
                      : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <span className="text-xs font-bold">{dept}</span>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Highlight Feature notice */}
        <div className="bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-300 leading-relaxed">
          <Sparkles className="w-5 h-5 shrink-0 text-amber-500 animate-pulse mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Automatic Dashboard Highlighting Active</h4>
            <p className="text-[11px] opacity-90">
              When set, our smart matching algorithm will scan incoming student events, clubs, and workshops to visually highlight classes or social meetups aligned with <strong className="font-bold underline">{selectedDept || "your chosen field"}</strong>! Look for the <span className="font-mono bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase border border-amber-500/20">My Field Highlight</span> banner on your dashboard.
            </p>
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Settings saved successfully! Your dashboard highlights have been updated.</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl border border-indigo-700 shadow-lg shadow-indigo-500/15 transition-all flex items-center justify-center gap-2 disabled:opacity-55 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving settings..." : "Save Custom Preferences"}
          </motion.button>
        </div>
      </form>

      {/* 3. Dashboard Widget Customizer Section */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <LayoutGrid className="w-5 h-5 text-indigo-500" />
          <h4 className="font-display font-black text-base text-zinc-900 dark:text-white tracking-tight">
            Dashboard Layout Customization
          </h4>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs">
          Personalize your dashboard experience. Drag and drop cards to reorder your workspace, or toggle specific elements on or off. Use the up/down arrows to shift items easily.
        </p>

        {widgets.length === 0 ? (
          <p className="text-zinc-400 dark:text-zinc-500 text-xs italic font-mono">No customizable widgets configured.</p>
        ) : (
          <div className="space-y-3.5 pt-2">
            {widgets.map((widget, idx) => {
              const isEnabled = widget.enabled;
              const isFirst = idx === 0;
              const isLast = idx === widgets.length - 1;
              const isDragging = idx === draggedIndex;

              return (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                    isDragging 
                      ? "bg-indigo-500/10 border-indigo-500 border-dashed scale-[0.99] opacity-70 cursor-grabbing"
                      : isEnabled
                        ? "bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 cursor-grab"
                        : "bg-zinc-100/30 dark:bg-zinc-950/10 border-zinc-200 dark:border-zinc-900 opacity-60 hover:opacity-85 cursor-grab"
                  }`}
                >
                  {/* Left part: drag handle, icon, details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 shrink-0 select-none">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black tracking-tight ${isEnabled ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500 line-through"}`}>
                          {widget.title}
                        </span>
                        {!isEnabled && (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-200/50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-300/40 dark:border-zinc-800/40">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-sm sm:max-w-md">
                        {widget.description}
                      </p>
                    </div>
                  </div>

                  {/* Right part: sort and toggle buttons */}
                  <div className="flex items-center justify-end gap-2.5 shrink-0 self-end sm:self-auto border-t sm:border-t-0 border-zinc-200 dark:border-zinc-800 pt-2.5 sm:pt-0">
                    {/* Sort controls */}
                    <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl shadow-sm">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => moveWidget(idx, 'up')}
                        disabled={isFirst}
                        className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:hover:text-zinc-500 dark:disabled:hover:text-zinc-400 disabled:hover:bg-transparent cursor-pointer transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => moveWidget(idx, 'down')}
                        disabled={isLast}
                        className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:hover:text-zinc-500 dark:disabled:hover:text-zinc-400 disabled:hover:bg-transparent cursor-pointer transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleWidget(widget.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                        isEnabled
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/50"
                          : "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {isEnabled ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Show</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Notification Settings */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <NotificationManager events={events} />
      </div>
    </div>
  );
};
