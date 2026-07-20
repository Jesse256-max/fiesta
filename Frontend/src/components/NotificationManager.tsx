import React, { useState, useEffect } from "react";
import { Bell, BellOff, Play, Clock, Sparkles, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { CampusEvent } from "../types.ts";

// Utility to parse database Event Date & Time into a standard JS Date object
export function parseEventDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    if (!dateStr || !timeStr) return null;
    
    // Standard format for date: YYYY-MM-DD
    const dateParts = dateStr.split("-");
    if (dateParts.length !== 3) return null;
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
    const day = parseInt(dateParts[2], 10);

    // Parse time: supports "14:00", "09:30 AM", "6:00 PM" etc.
    let hours = 0;
    let minutes = 0;
    const cleanTime = timeStr.trim().toUpperCase();
    
    const ampmMatch = cleanTime.match(/(AM|PM)/);
    if (ampmMatch) {
      const ampm = ampmMatch[1];
      const timeWithoutAmPm = cleanTime.replace(/(AM|PM)/, "").trim();
      const timeParts = timeWithoutAmPm.split(":");
      if (timeParts.length >= 2) {
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
        if (ampm === "PM" && hours < 12) {
          hours += 12;
        }
        if (ampm === "AM" && hours === 12) {
          hours = 0;
        }
      }
    } else {
      // 24-hour format "HH:MM"
      const timeParts = cleanTime.split(":");
      if (timeParts.length >= 2) {
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
      }
    }

    return new Date(year, month, day, hours, minutes, 0, 0);
  } catch (err) {
    console.error("Error parsing event date/time:", dateStr, timeStr, err);
    return null;
  }
}

// Generate an elegant dual-tone chime utilizing pure Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Note 1: D5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Note 2: A5 (offset by 120ms)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    }, 120);
  } catch (err) {
    console.warn("Web Audio chime could not be synthesized:", err);
  }
};

interface NotificationManagerProps {
  events: CampusEvent[];
  minimal?: boolean;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ events, minimal = false }) => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [notifiedIds, setNotifiedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("technotrons_notified_events");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep track of client-side scheduled test events so users can easily verify
  const [testEvents, setTestEvents] = useState<CampusEvent[]>([]);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Save notified IDs to localStorage to prevent repeating alerts on page refresh
  const markAsNotified = (eventId: number) => {
    setNotifiedIds((prev) => {
      const updated = [...prev, eventId];
      localStorage.setItem("technotrons_notified_events", JSON.stringify(updated));
      return updated;
    });
  };

  // Notification core engine: runs an interval checking registered & scheduled events
  useEffect(() => {
    if (permission !== "granted") return;

    const checkUpcomingEvents = () => {
      const now = new Date();
      
      // Combine server events and temporary test events
      const allTrackedEvents = [...events, ...testEvents];
      
      allTrackedEvents.forEach((event) => {
        // Only notify if user is registered for the event or if it's a test event
        if (!event.registered && !testEvents.some(te => te.id === event.id)) return;
        
        // Skip if already notified
        if (notifiedIds.includes(event.id)) return;

        const eventTime = parseEventDateTime(event.date, event.time);
        if (!eventTime) return;

        // Calculate time difference in minutes
        const diffMs = eventTime.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // Alert window: exactly between 14.0 and 15.5 minutes before the event
        if (diffMinutes > 14.0 && diffMinutes <= 15.5) {
          // Trigger browser notification
          try {
            const title = "🔔 Upcoming Campus Event!";
            const options: NotificationOptions = {
              body: `"${event.title}" starts in 15 minutes at ${event.location}. Don't be late!`,
              icon: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=120",
              tag: `event-start-${event.id}`,
              requireInteraction: true,
            };

            const notification = new Notification(title, options);
            notification.onclick = () => {
              window.focus();
              notification.close();
            };

            // Play the synchronized sound chime
            playNotificationChime();
            
            // Mark as notified so we don't spam
            markAsNotified(event.id);
            console.log(`Successfully fired 15-minute alert for event: ${event.title}`);
          } catch (err) {
            console.error("Failed to display notification:", err);
          }
        }
      });
    };

    // Check immediately, then check every 15 seconds
    checkUpcomingEvents();
    const interval = setInterval(checkUpcomingEvents, 15000);

    return () => clearInterval(interval);
  }, [events, testEvents, notifiedIds, permission]);

  // Request browser notification permission
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support local desktop notifications.");
      return;
    }

    try {
      const status = await Notification.requestPermission();
      setPermission(status);
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }
  };

  // Instantly fire a test notification for confirmation
  const triggerInstantTest = () => {
    if (permission !== "granted") {
      alert("Please enable notification permissions first.");
      return;
    }

    try {
      playNotificationChime();
      const testNotify = new Notification("🔔 Technotrons College of Engineering Alerts Connected!", {
        body: "Success! Desktop reminders are fully operational and synchronized with your student portal schedule.",
        icon: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=120",
        requireInteraction: false,
      });
      testNotify.onclick = () => {
        window.focus();
        testNotify.close();
      };
    } catch (err) {
      console.error("Instant test notification failed:", err);
    }
  };

  // Create and inject a client-side mock event starting exactly 15 minutes from now!
  const scheduleTest15Minutes = () => {
    if (permission !== "granted") {
      alert("Please authorize notifications first before scheduling test alerts!");
      return;
    }

    const targetTime = new Date(Date.now() + 15 * 60 * 1000 + 10 * 1000); // 15 mins 10 seconds from now
    
    // Format YYYY-MM-DD
    const yyyy = targetTime.getFullYear();
    const mm = String(targetTime.getMonth() + 1).padStart(2, "0");
    const dd = String(targetTime.getDate()).padStart(2, "0");
    const dateString = `${yyyy}-${mm}-${dd}`;

    // Format HH:MM 24h
    const hours = String(targetTime.getHours()).padStart(2, "0");
    const minutes = String(targetTime.getMinutes()).padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    const mockEventId = Math.floor(Math.random() * 100000) + 5000;
    const testEventItem: CampusEvent = {
      id: mockEventId,
      title: "🚀 [Test] Freshers Quick Mixer",
      description: "A simulated student networking event used to test the automated 15-minute alert cycle.",
      date: dateString,
      time: timeString,
      location: "Main Quad / Virtual Sandbox",
      category: "Social",
      organizer: "Technotrons College of Engineering Core",
      capacity: 50,
      imageUrl: null,
      registered: true,
      createdAt: new Date().toISOString(),
    };

    // Remove any previously simulated events and register the new one
    setTestEvents([testEventItem]);
    
    // Remove from notified list if it was somehow there, so the check fires immediately
    setNotifiedIds((prev) => prev.filter((id) => id !== mockEventId));

    alert(`Mock event scheduled at ${timeString} (${dateString}).\nBecause this event is precisely 15 minutes away, our background checker will discover it within 15 seconds and trigger the alert!`);
  };

  // Clean logged reminder flags
  const resetNotifiedHistory = () => {
    setNotifiedIds([]);
    localStorage.removeItem("technotrons_notified_events");
    setTestEvents([]);
    alert("Alert history cleared! You can now re-test orientation events.");
  };

  if (minimal) {
    return null;
  }

  return (
    <div id="local-notifications-settings" className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            permission === "granted"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : permission === "denied"
              ? "bg-red-500/10 text-red-600 dark:text-red-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          }`}>
            {permission === "granted" ? <Bell className="w-5 h-5 animate-bounce" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-zinc-900 dark:text-white leading-tight">
              Class & Orientation Reminders
            </h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">
              Receive desktop alerts 15 minutes before your registered orientation events start.
            </p>
          </div>
        </div>

        {permission === "default" && (
          <button
            type="button"
            onClick={requestPermission}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Enable Alerts
          </button>
        )}

        {permission === "granted" && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full uppercase font-bold border border-emerald-500/20 self-start sm:self-auto">
            <Check className="w-3.5 h-3.5" />
            Reminders Active
          </span>
        )}

        {permission === "denied" && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full uppercase font-bold border border-red-500/20 self-start sm:self-auto">
            <AlertTriangle className="w-3.5 h-3.5" />
            Blocked by Browser
          </span>
        )}
      </div>

      {permission === "denied" && (
        <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl text-[11px] text-red-600 dark:text-red-400">
          <strong>Tip:</strong> You previously blocked notifications for this page. Please reset your browser site permissions (usually by clicking the lock icon next to the URL) to permit campus reminders.
        </div>
      )}

      {permission === "granted" && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 space-y-3">
          <span className="block text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">
            Alert Verification Playground
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Play Sound & Alert */}
            <button
              type="button"
              onClick={triggerInstantTest}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-left transition-colors cursor-pointer group"
            >
              <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-white">Trigger Instant Test Alert</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Fires an immediate mock alert with dual-tone chime</p>
              </div>
            </button>

            {/* Schedule 15 minute timer */}
            <button
              type="button"
              onClick={scheduleTest15Minutes}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-left transition-colors cursor-pointer group"
            >
              <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-white">Schedule 15-Min Test Event</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Creates a mock event 15 minutes away to test background trigger</p>
              </div>
            </button>
          </div>

          {/* Active / Pending Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-zinc-400 pt-1 font-mono">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Notified History Size: {notifiedIds.length}</span>
            </span>

            {testEvents.length > 0 && (
              <span className="text-amber-500 font-bold animate-pulse">
                ⏳ Simulated event pending alert checks...
              </span>
            )}

            <button
              type="button"
              onClick={resetNotifiedHistory}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Clear Simulated Triggers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
