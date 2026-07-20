import React, { useState } from "react";
import { CampusEvent } from "../types.ts";
import { Calendar, Clock, MapPin, Users, CheckCircle, Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth.tsx";

interface EventCardProps {
  event: CampusEvent;
  onStatusChange: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onStatusChange }) => {
  const { token, loginWithGoogle, dbUser, localUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const userDept = dbUser?.department || localUser?.department;
  const isMatchingDept = !!(userDept && (
    event.title.toLowerCase().includes(userDept.toLowerCase()) ||
    event.description.toLowerCase().includes(userDept.toLowerCase()) ||
    event.category.toLowerCase().includes(userDept.toLowerCase()) ||
    (userDept.toLowerCase().includes("computer") && (
      event.title.toLowerCase().includes("code") ||
      event.title.toLowerCase().includes("hackathon") ||
      event.title.toLowerCase().includes("dev") ||
      event.title.toLowerCase().includes("tech") ||
      event.title.toLowerCase().includes("cyber") ||
      event.title.toLowerCase().includes("programming") ||
      event.title.toLowerCase().includes("software") ||
      event.description.toLowerCase().includes("coding") ||
      event.description.toLowerCase().includes("developer")
    )) ||
    (userDept.toLowerCase().includes("electrical") && (
      event.title.toLowerCase().includes("robot") ||
      event.title.toLowerCase().includes("circuit") ||
      event.title.toLowerCase().includes("hardware") ||
      event.title.toLowerCase().includes("iot")
    )) ||
    (userDept.toLowerCase().includes("mechanical") && (
      event.title.toLowerCase().includes("design") ||
      event.title.toLowerCase().includes("cad") ||
      event.title.toLowerCase().includes("robot") ||
      event.title.toLowerCase().includes("automotive")
    )) ||
    (userDept.toLowerCase().includes("business") && (
      event.title.toLowerCase().includes("startup") ||
      event.title.toLowerCase().includes("pitch") ||
      event.title.toLowerCase().includes("entrepreneur") ||
      event.title.toLowerCase().includes("management")
    ))
  ));

  const handleRegister = async () => {
    if (!token) {
      alert("Please sign in with Google first to register for campus events!");
      loginWithGoogle();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to register");
      }
      
      onStatusChange();
    } catch (err) {
      console.error(err);
      alert("Registration failed. Please try again later!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to cancel");
      }

      onStatusChange();
    } catch (err) {
      console.error(err);
      alert("Cancellation failed. Please try again later!");
    } finally {
      setLoading(false);
    }
  };

  const isWelcomeParty = event.title.toLowerCase().includes("banana");

  return (
    <div
      id={`event-card-${event.id}`}
      className={`relative rounded-3xl overflow-hidden shadow-xl border bg-white dark:bg-zinc-800 transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col h-full ${
        isWelcomeParty 
          ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/10" 
          : isMatchingDept
          ? "border-amber-500 dark:border-amber-550 ring-2 ring-amber-500/20 bg-amber-50/10 dark:bg-amber-950/10 shadow-amber-500/[0.02]"
          : "border-zinc-200 dark:border-zinc-700"
      }`}
    >
      {/* Event Header Image */}
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <img
          src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800"}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {/* Category Tag */}
        <span className={`absolute top-4 left-4 text-xs font-mono font-medium px-2.5 py-1 rounded-full ${
          isWelcomeParty 
            ? "bg-indigo-600 text-white border border-indigo-500/20" 
            : "bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm"
        }`}>
          {event.category}
        </span>
        
        {isWelcomeParty ? (
          <div className="absolute top-4 right-4 bg-indigo-600 text-white font-display font-black text-[10px] uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1 border border-white/10">
            <Sparkles className="w-3 h-3 fill-white text-white" />
            NANO BANANA
          </div>
        ) : isMatchingDept ? (
          <div className="absolute top-4 right-4 bg-amber-500 text-zinc-950 font-display font-black text-[9px] uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1 border border-amber-400">
            <Sparkles className="w-3 h-3 fill-zinc-950 text-zinc-950 animate-pulse" />
            My Field Highlight
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className={`font-display font-bold text-lg leading-tight tracking-tight mb-2 ${
            isWelcomeParty 
              ? "text-indigo-600 dark:text-indigo-200 font-extrabold" 
              : isMatchingDept
              ? "text-amber-600 dark:text-amber-400 font-extrabold"
              : "text-zinc-900 dark:text-white"
          }`}>
            {event.title}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3">
            {event.description}
          </p>

          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 text-xs font-medium">
              <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>{new Date(event.date).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 text-xs font-medium">
              <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 text-xs font-medium">
              <MapPin className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 text-xs font-medium">
              <Users className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>Capacity: {event.capacity} seats</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {event.registered ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold py-2.5 px-3 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 fill-emerald-400/10 text-emerald-500 dark:text-emerald-400" />
                Registered
              </div>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="bg-zinc-100 hover:bg-red-50 dark:bg-zinc-900 dark:hover:bg-red-950/20 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 text-xs font-semibold py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleRegister}
              disabled={loading}
              className={`w-full text-center text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50 active:scale-98 ${
                isWelcomeParty
                  ? "bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-700 shadow-md shadow-indigo-500/10"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-white dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {loading ? "Registering..." : "Register Event"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
