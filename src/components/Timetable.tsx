import React, { useState } from "react";
import { TimetableCourse, FacultyMember } from "../types.ts";
import { useAuth } from "../lib/auth.tsx";
import { Calendar, MapPin, Clock, Star, StarOff, Sparkles, Filter } from "lucide-react";

interface TimetableProps {
  courses: TimetableCourse[];
  faculty: FacultyMember[];
  onToggleSubscription: () => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const Timetable: React.FC<TimetableProps> = ({ courses, faculty, onToggleSubscription }) => {
  const { token, loginWithGoogle, localUser } = useAuth();
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [loadingMap, setLoadingMap] = useState<{ [key: number]: boolean }>({});

  const handleSubscribeToggle = async (course: TimetableCourse) => {
    if (!token && !localUser) {
      alert("Please sign in first to subscribe to custom classes!");
      loginWithGoogle();
      return;
    }

    setLoadingMap(prev => ({ ...prev, [course.id]: true }));
    try {
      if (token) {
        const isSubscribed = course.isSubscribed;
        const endpoint = isSubscribed
          ? `/api/timetable/unsubscribe/${course.id}`
          : `/api/timetable/subscribe/${course.id}`;
          
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to toggle subscription");
        }
      } else {
        // Local/guest user subscription persistence in localStorage
        const stored = localStorage.getItem("technotrons_local_timetable");
        if (stored) {
          const list = JSON.parse(stored) as TimetableCourse[];
          const updated = list.map(c => c.id === course.id ? { ...c, isSubscribed: !c.isSubscribed } : c);
          localStorage.setItem("technotrons_local_timetable", JSON.stringify(updated));
        }
      }

      onToggleSubscription();
    } catch (err) {
      console.error(err);
      alert("Failed to update class schedule subscription!");
    } finally {
      setLoadingMap(prev => ({ ...prev, [course.id]: false }));
    }
  };

  // Find instructor name for a course
  const getInstructorName = (facultyId: number | null) => {
    if (!facultyId) return "Staff Instructor";
    const instructor = faculty.find(f => f.id === facultyId);
    return instructor ? instructor.name : "Staff Instructor";
  };

  const filteredCourses = courses
    .filter(c => c.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      {/* Day Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800 pb-4">
        <span className="text-zinc-500 text-xs font-mono font-medium flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          Day:
        </span>
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
              selectedDay === day
                ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Course Cards / Lists */}
      <div className="space-y-4">
        {filteredCourses.map((course) => {
          const isSubbed = course.isSubscribed;
          return (
            <div
              key={course.id}
              id={`timetable-course-${course.id}`}
              className="p-5 bg-zinc-800 border border-zinc-700 rounded-3xl shadow-xl hover:shadow-indigo-500/5 hover:border-zinc-600 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white"
            >
              {/* Timing and Code */}
              <div className="flex items-start gap-4 flex-1">
                {/* Time Badge */}
                <div className="bg-zinc-900 text-zinc-200 px-3.5 py-2.5 rounded-2xl flex flex-col items-center justify-center border border-zinc-800 shrink-0 font-mono text-center">
                  <Clock className="w-4 h-4 text-zinc-500 mb-1" />
                  <span className="text-xs font-bold">{course.startTime}</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">{course.endTime}</span>
                </div>

                {/* Course Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {course.courseCode}
                    </span>
                    <span className="text-zinc-400 text-xs font-mono">Cohort {course.cohort}</span>
                  </div>
                  <h4 className="font-display font-bold text-base text-white leading-snug">
                    {course.courseName}
                  </h4>
                  <p className="text-zinc-400 text-xs mt-1.5 flex items-center gap-1">
                    <span className="text-zinc-500">Instructor:</span>{" "}
                    <strong className="text-zinc-300">{getInstructorName(course.facultyId)}</strong>
                  </p>
                </div>
              </div>

              {/* Location and action */}
              <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                {/* Location Badge */}
                <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  <span>{course.location}</span>
                </div>

                {/* Sub toggle button */}
                <button
                  onClick={() => handleSubscribeToggle(course)}
                  disabled={loadingMap[course.id]}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isSubbed
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                  title={isSubbed ? "Remove from my schedule" : "Pin to my schedule"}
                >
                  {isSubbed ? <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400 border-0" /> : <Star className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          );
        })}

        {filteredCourses.length === 0 && (
          <div className="text-center py-10 bg-zinc-800 border border-zinc-700 rounded-3xl">
            <Calendar className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No classes scheduled for {selectedDay}.</p>
          </div>
        )}
      </div>
    </div>
  );
};
