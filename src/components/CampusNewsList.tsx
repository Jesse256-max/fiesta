import React, { useState, useEffect } from "react";
import { CampusNews } from "../types.ts";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, User, Newspaper, Clock, ArrowRight, X, ChevronRight, AlertCircle } from "lucide-react";

interface CampusNewsListProps {
  compact?: boolean;
}

export const CampusNewsList: React.FC<CampusNewsListProps> = ({ compact = false }) => {
  const [news, setNews] = useState<CampusNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState<CampusNews | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/news");
        if (!res.ok) {
          throw new Error("Failed to fetch campus news");
        }
        const data = await res.json();
        setNews(data);
      } catch (err: any) {
        console.error("Error fetching news:", err);
        setError(err.message || "Could not retrieve campus news at this time.");
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const categories = ["All", ...Array.from(new Set(news.map((item) => item.category)))];

  const filteredNews = news.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const displayNews = compact ? filteredNews.slice(0, 3) : filteredNews;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">Fetching live announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 rounded-2xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <span className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {displayNews.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedArticle(item)}
              className="group flex gap-4 p-3 bg-zinc-50 hover:bg-zinc-100/80 dark:bg-zinc-950/40 dark:hover:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl cursor-pointer transition-all"
            >
              {item.imageUrl && (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(item.timestamp).split(",")[0]}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-zinc-850 dark:text-zinc-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h5>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                    {item.content}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-zinc-400">
                  <span>By {item.author}</span>
                  <span className="text-indigo-500 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedArticle && (
            <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
              >
                {selectedArticle.imageUrl && (
                  <div className="w-full h-48 bg-zinc-950 relative">
                    <img
                      src={selectedArticle.imageUrl}
                      alt={selectedArticle.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => setSelectedArticle(null)}
                        className="p-2 bg-zinc-950/50 hover:bg-zinc-950/80 text-white rounded-full transition-all cursor-pointer border border-white/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {selectedArticle.category}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      {formatDate(selectedArticle.timestamp)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-display font-black text-xl text-zinc-900 dark:text-white leading-tight">
                      {selectedArticle.title}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      Posted by <strong className="text-zinc-650 dark:text-zinc-350">{selectedArticle.author}</strong>
                    </p>
                  </div>

                  <p className="text-zinc-605 dark:text-zinc-350 text-xs sm:text-sm leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    {selectedArticle.content}
                  </p>

                  <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-all border border-zinc-200 dark:border-zinc-700"
                    >
                      Close Announcement
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search announcements, content, category or coordinator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans placeholder-zinc-500 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-zinc-500 text-xs font-mono font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {categories.map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                selectedCategory === cat
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayNews.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -4, transition: { duration: 0.15 } }}
            className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xl hover:shadow-indigo-500/5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
            onClick={() => setSelectedArticle(item)}
          >
            {item.imageUrl && (
              <div className="h-48 w-full bg-zinc-950 overflow-hidden relative border-b border-zinc-100 dark:border-zinc-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md text-white font-mono text-[9px] uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider border border-white/10">
                  {item.category}
                </span>
              </div>
            )}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{formatDate(item.timestamp)}</span>
                </div>
                <h4 className="font-display font-bold text-base text-zinc-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed line-clamp-3">
                  {item.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate max-w-[120px]">{item.author}</span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 group-hover:gap-1 transition-all">
                  Read article <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center space-y-2">
          <Newspaper className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No matching announcements found.</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Try modifying your search or choosing another category filter.</p>
        </div>
      )}

      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
            >
              {selectedArticle.imageUrl && (
                <div className="w-full h-56 bg-zinc-950 relative">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="p-2 bg-zinc-950/50 hover:bg-zinc-950/80 text-white rounded-full transition-all cursor-pointer border border-white/10"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              )}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {selectedArticle.category}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(selectedArticle.timestamp)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h4 className="font-display font-black text-xl sm:text-2xl text-zinc-900 dark:text-white leading-tight">
                    {selectedArticle.title}
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-450" />
                    Posted by <strong className="text-zinc-650 dark:text-zinc-350">{selectedArticle.author}</strong>
                  </p>
                </div>

                <p className="text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  {selectedArticle.content}
                </p>

                <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-all border border-zinc-200 dark:border-zinc-700"
                  >
                    Close Announcement
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
