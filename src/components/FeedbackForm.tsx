import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth.tsx";
import { Star, Send, Sparkles, MessageSquare, Smile, Frown, Meh, AlertCircle, RefreshCw } from "lucide-react";

interface FeedbackRecord {
  id: number;
  userId: number | null;
  userName: string | null;
  comment: string;
  sentiment: string; // 'positive' | 'neutral' | 'negative'
  sentimentLabel: string;
  suggestions: string | null;
  rating: number;
  createdAt: string;
}

export const FeedbackForm: React.FC = () => {
  const { token, firebaseUser, localUser, loginWithGoogle } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Last analyzed feedback details
  const [lastAnalysis, setLastAnalysis] = useState<{
    sentiment: string;
    sentimentLabel: string;
    suggestions: string;
  } | null>(null);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/feedbacks");
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
      } else {
        throw new Error("Failed to load feedbacks.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to the database to fetch feedback records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert("Please enter a comment before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setLastAnalysis(null);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/feedbacks", {
        method: "POST",
        headers,
        body: JSON.stringify({ comment, rating }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit feedback.");
      }

      const result = await response.json();
      if (result.success && result.feedback) {
        setComment("");
        setRating(5);
        setLastAnalysis({
          sentiment: result.feedback.sentiment,
          sentimentLabel: result.feedback.sentimentLabel,
          suggestions: result.feedback.suggestions || "",
        });
        // Reload list
        fetchFeedbacks();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute sentiment distribution percentages for dashboard metrics
  const total = feedbacks.length;
  const positiveCount = feedbacks.filter(f => f.sentiment === "positive").length;
  const neutralCount = feedbacks.filter(f => f.sentiment === "neutral").length;
  const negativeCount = feedbacks.filter(f => f.sentiment === "negative").length;

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Smile className="w-4 h-4 text-emerald-500" />;
      case "negative":
        return <Frown className="w-4 h-4 text-rose-500" />;
      default:
        return <Meh className="w-4 h-4 text-amber-500" />;
    }
  };

  const getSentimentBadgeStyles = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "negative":
        return "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
      default:
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Portal Feedback Board
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
            Tell us about your campus experience. Gemini will sentiment-analyze your comment and forward administrative suggestions to the IT desk!
          </p>
        </div>
        <button
          onClick={fetchFeedbacks}
          className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Portal Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating ?? rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300 dark:text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 ml-2">
                  ({rating} out of 5)
                </span>
              </div>
            </div>

            {/* Comment Area */}
            <div className="space-y-1.5">
              <label htmlFor="portal-feedback-comment" className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Your Feedback Comment
              </label>
              <textarea
                id="portal-feedback-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How has your orientation been? Is the portal easy to navigate? Are any details missing?"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs p-3 rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/15 border border-indigo-700 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse text-indigo-200" />
                  Analyzing Sentiment with Gemini...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit & Sentiment-Analyze
                </>
              )}
            </button>
          </form>

          {/* AI Result Presentation (Last Submission Analysis) */}
          {lastAnalysis && (
            <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-800 space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini Analysis Complete
                </p>
                <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getSentimentBadgeStyles(lastAnalysis.sentiment)}`}>
                  {getSentimentIcon(lastAnalysis.sentiment)}
                  <span>{lastAnalysis.sentimentLabel}</span>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs">
                <p className="font-bold text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-mono mb-1">Administrative Team Response:</p>
                <p className="text-zinc-700 dark:text-zinc-200 leading-relaxed italic">
                  "{lastAnalysis.suggestions}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Metrics and Feed Column */}
        <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
          {/* Metrics Panel */}
          {total > 0 && (
            <div className="grid grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Positive</span>
                </div>
                <p className="text-lg font-display font-black text-emerald-600 dark:text-emerald-400">
                  {Math.round((positiveCount / total) * 100)}%
                </p>
                <p className="text-[9px] font-mono text-zinc-400">{positiveCount} ratings</p>
              </div>

              <div className="text-center space-y-1 border-x border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-center gap-1.5">
                  <Meh className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Neutral</span>
                </div>
                <p className="text-lg font-display font-black text-amber-600 dark:text-amber-400">
                  {Math.round((neutralCount / total) * 100)}%
                </p>
                <p className="text-[9px] font-mono text-zinc-400">{neutralCount} ratings</p>
              </div>

              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <Frown className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Negative</span>
                </div>
                <p className="text-lg font-display font-black text-rose-600 dark:text-rose-400">
                  {Math.round((negativeCount / total) * 100)}%
                </p>
                <p className="text-[9px] font-mono text-zinc-400">{negativeCount} ratings</p>
              </div>
            </div>
          )}

          {/* Feedback Feed */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-lg flex-grow flex flex-col justify-between min-h-[300px]">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Students Voice Feed ({total})
            </p>

            {loading && feedbacks.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center space-y-2 py-12">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-mono">Synchronizing portal records...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center space-y-2 py-12 text-center">
                <MessageSquare className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                <p className="text-zinc-700 dark:text-zinc-300 text-xs font-bold">No feedback submitted yet</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-[10px] max-w-[240px]">Be the first to share your experience and let the Gemini agent evaluate it!</p>
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto max-h-[320px] pr-2 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-800"
                  >
                    {/* User and Stars Row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-100">{f.userName}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(f.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-400/10 text-amber-500 font-bold px-2 py-0.5 rounded-lg text-[11px] border border-amber-400/20">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{f.rating}</span>
                      </div>
                    </div>

                    {/* Student Comment */}
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed italic break-words bg-white dark:bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      "{f.comment}"
                    </p>

                    {/* AI Evaluation */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                      <span className="text-indigo-500 dark:text-indigo-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Gemini Sentiment:
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold border ${getSentimentBadgeStyles(f.sentiment)}`}>
                        {f.sentimentLabel}
                      </span>
                    </div>

                    {/* Team Suggestion Response */}
                    {f.suggestions && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/25 p-2.5 rounded-xl border border-indigo-100/30 dark:border-indigo-500/10 text-[11px] leading-relaxed text-indigo-750 dark:text-indigo-300">
                        <span className="font-bold font-mono text-[9px] block text-indigo-650 dark:text-indigo-400 mb-0.5 uppercase">IT Helpdesk Action:</span>
                        {f.suggestions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
