import React, { useState, useRef } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music as MusicIcon, 
  Mic, 
  MicOff, 
  Eye, 
  Upload, 
  Download, 
  Play, 
  Pause, 
  RefreshCw, 
  Cpu, 
  Layers, 
  Sliders, 
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileSearch,
  CheckSquare
} from "lucide-react";
import { useAuth } from "../lib/auth.tsx";
import { motion, AnimatePresence } from "motion/react";

type HubTab = "poster" | "video" | "music" | "analyzer" | "speech";

export const AiCreativeHub: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<HubTab>("poster");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- STATE FOR POSTER STUDIO ---
  const [posterPrompt, setPosterPrompt] = useState("A stunning high-tech campus orientation welcome banner featuring vibrant yellow laser neon lights, tech details, and a dynamic 'Nano Banana' motif");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("1K");
  const [posterModel, setPosterModel] = useState("gemini-3.1-flash-image-preview");
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [posterDemoMode, setPosterDemoMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE FOR VEO VIDEO ---
  const [videoPrompt, setVideoPrompt] = useState("Cinematic slow-motion shot of students dancing under neon yellow laser lights in a campus arena");
  const [videoAspect, setVideoAspect] = useState("16:9");
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoDemoMode, setVideoDemoMode] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE FOR LYRIA MUSIC ---
  const [musicPrompt, setMusicPrompt] = useState("Upbeat electric synthpop anthem with heavy dance beats and a warm retro college atmosphere");
  const [isFullTrack, setIsFullTrack] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [musicDemoMode, setMusicDemoMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- STATE FOR ANALYZER ---
  const [analyzerPrompt, setAnalyzerPrompt] = useState("Extract all key dates, speaker names, registration steps, and coordinate details visible in this file, and structure them as a student checklist guide.");
  const [analyzerMedia, setAnalyzerMedia] = useState<string | null>(null);
  const [analyzerMime, setAnalyzerMime] = useState("image/png");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const analyzerInputRef = useRef<HTMLInputElement>(null);

  // --- STATE FOR SPEECH-TO-TEXT ---
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- REUSABLE FILE HELPERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string, mime: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string, file.type);
    };
    reader.readAsDataURL(file);
  };

  const showFeedback = (success: string | null, err: string | null) => {
    setSuccessMsg(success);
    setError(err);
    setTimeout(() => {
      setSuccessMsg(null);
      setError(null);
    }, 5000);
  };

  // --- ACTION: GENERATE/EDIT POSTER ---
  const handleGeneratePoster = async () => {
    if (!token) {
      showFeedback(null, "Please sign in to access the AI Image Studio.");
      return;
    }
    setLoading(true);
    setGeneratedImage(null);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: posterPrompt,
          aspectRatio,
          imageSize,
          model: posterModel,
          baseImage: baseImage || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate image");

      setGeneratedImage(data.imageUrl);
      setPosterDemoMode(!!data.demoMode);
      showFeedback(data.demoMode ? "Poster layout generated in Demonstration Mode!" : "Premium Image Studio generation success!", null);
    } catch (err: any) {
      showFeedback(null, err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION: GENERATE/ANIMATE VIDEO (VEO 3) ---
  const handleGenerateVideo = async () => {
    if (!token) {
      showFeedback(null, "Please sign in to access the Veo Video Lab.");
      return;
    }
    setLoading(true);
    setGeneratedVideo(null);
    try {
      const res = await fetch("/api/ai/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspect,
          image: videoSourceImage || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate video");

      setGeneratedVideo(data.videoUrl);
      setVideoDemoMode(!!data.demoMode);
      showFeedback(data.demoMode ? "Cinematic Veo loop animated in Demonstration Mode!" : "Veo 3 high-fidelity video generated!", null);
    } catch (err: any) {
      showFeedback(null, err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION: GENERATE MUSIC (LYRIA) ---
  const handleGenerateMusic = async () => {
    if (!token) {
      showFeedback(null, "Please sign in to access the Lyria Music Studio.");
      return;
    }
    setLoading(true);
    setGeneratedAudio(null);
    setIsPlaying(false);
    try {
      const res = await fetch("/api/ai/music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: musicPrompt,
          isFullTrack
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate music");

      setGeneratedAudio(data.audioUrl);
      setMusicDemoMode(!!data.demoMode);
      showFeedback(data.demoMode ? "Upbeat Lyria soundtrack synthesized in Demonstration Mode!" : "Lyria atmospheric campus music generated!", null);
    } catch (err: any) {
      showFeedback(null, err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // --- ACTION: ANALYZE FILE (GEMINI PRO MULTIMODAL) ---
  const handleAnalyzeMedia = async () => {
    if (!token) {
      showFeedback(null, "Please sign in to access the Multimodal Analyzer.");
      return;
    }
    if (!analyzerMedia) {
      showFeedback(null, "Please upload a photo or poster file to analyze first.");
      return;
    }
    setLoading(true);
    setAnalysisResult(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          mediaData: analyzerMedia,
          mimeType: analyzerMime,
          prompt: analyzerPrompt
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalysisResult(data.analysis);
      showFeedback("Intelligence analysis completed successfully!", null);
    } catch (err: any) {
      showFeedback(null, err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION: SPEECH TRANSCRIPTION (RECORDER) ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          await submitAudioForTranscription(base64);
        };
        reader.readAsDataURL(audioBlob);

        // Turn off mic tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscription(null);
      setError(null);
    } catch (err: any) {
      showFeedback(null, "Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAudioForTranscription = async (base64Audio: string) => {
    if (!token) {
      showFeedback(null, "Please sign in to use voice transcription.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: "audio/wav"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to transcribe audio");

      setTranscription(data.text);
      showFeedback("Spoken queries transcribed instantly!", null);
    } catch (err: any) {
      showFeedback(null, err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-creative-hub" className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-all duration-300">
      
      {/* Tab Navigation header */}
      <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-zinc-900 dark:text-white tracking-tight">AI Creative Studio</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">NEXT-GEN MEDIA SERVICES</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-zinc-200/55 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-300/40 dark:border-zinc-800">
          {(["poster", "video", "music", "analyzer", "speech"] as const).map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveTab(tab);
                setError(null);
                setSuccessMsg(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all capitalize cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab
                  ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              {tab === "poster" && <ImageIcon className="w-3.5 h-3.5" />}
              {tab === "video" && <VideoIcon className="w-3.5 h-3.5" />}
              {tab === "music" && <MusicIcon className="w-3.5 h-3.5" />}
              {tab === "analyzer" && <FileSearch className="w-3.5 h-3.5" />}
              {tab === "speech" && <Mic className="w-3.5 h-3.5" />}
              <span>{tab === "speech" ? "Speech Rec" : tab}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="p-6 min-h-[420px]">
        
        {/* Banner Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3.5 rounded-2xl flex items-center gap-2 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-2xl flex items-center gap-2 text-xs"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Column (left 5 columns) */}
          <div className="lg:col-span-5 space-y-5 border-r border-zinc-200 dark:border-zinc-800/60 pr-0 lg:pr-8">
            
            {/* TABS 1: POSTER STUDIO */}
            {activeTab === "poster" && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                  <ImageIcon className="w-4.5 h-4.5 text-indigo-500" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">AI Image & Poster Studio</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Poster Description Prompt</label>
                  <textarea
                    rows={3}
                    value={posterPrompt}
                    onChange={(e) => setPosterPrompt(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-zinc-400"
                  />
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
                    >
                      {["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"].map((ar) => (
                        <option key={ar} value={ar}>{ar}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Image Quality Size</label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
                    >
                      {["512px", "1K", "2K", "4K"].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Intelligence Model</label>
                  <select
                    value={posterModel}
                    onChange={(e) => setPosterModel(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
                  >
                    <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash (Aesthetic Default)</option>
                    <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image (Studio Quality)</option>
                  </select>
                </div>

                {/* Upload Base Image */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Edit Existing Poster (Optional)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-zinc-300/40 dark:border-zinc-700/65"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{baseImage ? "Change Image" : "Upload File"}</span>
                    </button>
                    {baseImage && (
                      <button
                        type="button"
                        onClick={() => setBaseImage(null)}
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, (b64) => setBaseImage(b64))}
                    className="hidden"
                  />
                  {baseImage && (
                    <div className="relative w-16 h-16 rounded-lg border border-zinc-200 overflow-hidden">
                      <img src={baseImage} alt="Base input" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePoster}
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{baseImage ? "Apply AI Poster Edit" : "Generate Studio Poster"}</span>
                </button>
              </div>
            )}

            {/* TABS 2: VEO VIDEO LAB */}
            {activeTab === "video" && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                  <VideoIcon className="w-4.5 h-4.5 text-red-500" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">Veo 3 Video Laboratory</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Veo Cinematic Video Prompt</label>
                  <textarea
                    rows={3}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-zinc-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Target Video Aspect Ratio</label>
                  <select
                    value={videoAspect}
                    onChange={(e) => setVideoAspect(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
                  >
                    <option value="16:9">16:9 Cinema Landscape</option>
                    <option value="9:16">9:16 Portrait Reels</option>
                  </select>
                </div>

                {/* Photo-to-Video Animation */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Animate Photo Input (Optional)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => videoFileInputRef.current?.click()}
                      className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-zinc-300/40 dark:border-zinc-700"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{videoSourceImage ? "Change Image" : "Upload File"}</span>
                    </button>
                    {videoSourceImage && (
                      <button
                        type="button"
                        onClick={() => setVideoSourceImage(null)}
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, (b64) => setVideoSourceImage(b64))}
                    className="hidden"
                  />
                  {videoSourceImage && (
                    <div className="relative w-16 h-16 rounded-lg border border-zinc-200 overflow-hidden">
                      <img src={videoSourceImage} alt="Video input" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-2xl text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className="font-bold text-red-600 dark:text-red-400 block mb-1">Veo 3 Engine Specifications:</span>
                  Produces state-of-the-art 5-second video sequences with deep lighting physics and extreme fidelity.
                </div>

                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>{videoSourceImage ? "Animate Picture with Veo" : "Veo 3 Render Video"}</span>
                </button>
              </div>
            )}

            {/* TABS 3: LYRIA MUSIC STUDIO */}
            {activeTab === "music" && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                  <MusicIcon className="w-4.5 h-4.5 text-amber-500" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">Lyria Music Studio</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Soundtrack Prompt</label>
                  <textarea
                    rows={3}
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-zinc-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase block">Song Format Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFullTrack(false)}
                      className={`py-2 px-3.5 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        !isFullTrack
                          ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      30s Clip (Lyria 3 Clip)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFullTrack(true)}
                      className={`py-2 px-3.5 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        isFullTrack
                          ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      Full Track (Lyria 3 Pro)
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">Lyria Synthesizer Details:</span>
                  Generates beautiful high-fidelity melodies, vocal harmonies, and dynamic audio transitions.
                </div>

                <button
                  type="button"
                  onClick={handleGenerateMusic}
                  disabled={loading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Synthesize Soundtrack</span>
                </button>
              </div>
            )}

            {/* TABS 4: MULTIMODAL ANALYZER */}
            {activeTab === "analyzer" && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                  <FileSearch className="w-4.5 h-4.5 text-teal-500" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">Multimodal Poster Analyzer</h3>
                </div>

                {/* Upload File */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Upload Media to Analyze (Image or Poster)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => analyzerInputRef.current?.click()}
                      className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-zinc-300/40 dark:border-zinc-700"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{analyzerMedia ? "Replace File" : "Upload Image"}</span>
                    </button>
                    {analyzerMedia && (
                      <button
                        type="button"
                        onClick={() => setAnalyzerMedia(null)}
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={analyzerInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, (b64, mime) => {
                      setAnalyzerMedia(b64);
                      setAnalyzerMime(mime);
                    })}
                    className="hidden"
                  />
                  {analyzerMedia && (
                    <div className="relative w-24 h-24 rounded-lg border border-zinc-200 overflow-hidden">
                      <img src={analyzerMedia} alt="Analyzer input" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Analysis Guidance & Questions</label>
                  <textarea
                    rows={3}
                    value={analyzerPrompt}
                    onChange={(e) => setAnalyzerPrompt(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-zinc-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeMedia}
                  disabled={loading || !analyzerMedia}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-bold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  <span>Reason with Gemini Pro</span>
                </button>
              </div>
            )}

            {/* TABS 5: MICROPHONE SPEECH TRANSCRIPTION */}
            {activeTab === "speech" && (
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white">
                  <Mic className="w-4.5 h-4.5 text-rose-500" />
                  <h3 className="font-bold text-sm tracking-wide uppercase">Speech-to-Text Transcriber</h3>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 flex flex-col items-center justify-center text-center py-8 space-y-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20 scale-110" 
                      : "bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                  }`}>
                    <Mic className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                      {isRecording ? "Listening & Capturing..." : "Microphone Capture"}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-[200px]">
                      {isRecording ? "Click 'Stop Recording' when finished speaking." : "Speak your campus questions into the microphone."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
                      >
                        Start Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-4 py-2 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Stop Recording</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">Gemini 3.5 Flash Transcription:</span>
                  Direct high-precision spoken audio recognition built into orientation portals.
                </div>
              </div>
            )}

          </div>

          {/* Sandbox Preview Output Area (right 7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800 p-6 rounded-2xl min-h-[420px] transition-colors duration-300">
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Real-time Render Display</span>
                <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-mono border border-indigo-200/45">
                  WORKSPACE ACTIVE
                </span>
              </div>

              {/* LOADING SCREEN */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-3.5">
                  <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">AI Sandbox Generating...</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Contacting TCE server. Processing creative content pipelines.</p>
                  </div>
                </div>
              )}

              {/* RENDER VIEW: POSTER */}
              {!loading && activeTab === "poster" && (
                <div className="space-y-4 flex flex-col items-center justify-center py-4">
                  {generatedImage ? (
                    <div className="flex flex-col items-center space-y-4 w-full">
                      <div className="relative rounded-2xl border border-zinc-200 overflow-hidden shadow-md max-w-sm w-full group">
                        <img 
                          src={generatedImage} 
                          alt="AI generated poster" 
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover max-h-[340px]" 
                        />
                        {posterDemoMode && (
                          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-yellow-400 text-[10px] px-2 py-0.5 rounded-md font-mono border border-yellow-500/30">
                            DEMO PRE-RENDER
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={generatedImage} 
                          download="tce-campus-poster.png"
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Poster
                        </a>
                        <button
                          onClick={() => setGeneratedImage(null)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg transition-all"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 space-y-3">
                      <ImageIcon className="w-12 h-12 mx-auto stroke-1" />
                      <div>
                        <p className="text-xs font-semibold">TCE Poster Canvas is empty</p>
                        <p className="text-[11px] max-w-[280px] mx-auto mt-1">Configure parameters and hit generate on the left to create or edit premium neon banana posters!</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RENDER VIEW: VIDEO */}
              {!loading && activeTab === "video" && (
                <div className="space-y-4 flex flex-col items-center justify-center py-4">
                  {generatedVideo ? (
                    <div className="flex flex-col items-center space-y-4 w-full">
                      <div className="relative rounded-2xl border border-zinc-200 overflow-hidden shadow-md max-w-md w-full aspect-video">
                        <video 
                          src={generatedVideo} 
                          controls 
                          autoPlay 
                          loop 
                          className="w-full h-full object-cover" 
                        />
                        {videoDemoMode && (
                          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-yellow-400 text-[10px] px-2 py-0.5 rounded-md font-mono border border-yellow-500/30">
                            VEO SHOWCASE
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={generatedVideo} 
                          download="veo-cinematic-loop.mp4"
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Loop
                        </a>
                        <button
                          onClick={() => setGeneratedVideo(null)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg transition-all"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 space-y-3">
                      <VideoIcon className="w-12 h-12 mx-auto stroke-1" />
                      <div>
                        <p className="text-xs font-semibold">Veo Cinematic loop is unrendered</p>
                        <p className="text-[11px] max-w-[280px] mx-auto mt-1">Use text cues or upload a photo to render next-gen 5s high-fidelity loop animations.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RENDER VIEW: MUSIC */}
              {!loading && activeTab === "music" && (
                <div className="space-y-4 flex flex-col items-center justify-center py-4">
                  {generatedAudio ? (
                    <div className="flex flex-col items-center space-y-6 w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-md">
                      
                      {/* Audio Visualizer Mock */}
                      <div className="w-full flex items-end justify-center gap-1 h-14">
                        {[4, 8, 12, 10, 6, 9, 14, 11, 7, 5, 8, 12, 15, 9, 6, 4].map((h, i) => (
                          <div 
                            key={i} 
                            style={{ height: isPlaying ? `${h * 3.5}px` : "6px" }} 
                            className="w-1.5 bg-amber-500 rounded-full transition-all duration-300 animate-pulse"
                          />
                        ))}
                      </div>

                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">Synthesized College Jam</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Lyria 3 Soundscape Synthesis Output</p>
                      </div>

                      <audio 
                        ref={(el) => {
                          audioRef.current = el;
                          if (el) {
                            el.onended = () => setIsPlaying(false);
                          }
                        }}
                        src={generatedAudio} 
                        className="hidden" 
                      />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePlayback}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          <span>{isPlaying ? "Pause Track" : "Play Showcase"}</span>
                        </button>
                        <a 
                          href={generatedAudio} 
                          download="tce-lyria-synth.mp3"
                          className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700 rounded-xl"
                          title="Download Audio File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 space-y-3">
                      <MusicIcon className="w-12 h-12 mx-auto stroke-1" />
                      <div>
                        <p className="text-xs font-semibold">Lyria sound desk is silent</p>
                        <p className="text-[11px] max-w-[280px] mx-auto mt-1">Prompt a melody or high-energy synth wave to generate downloadable soundtracks.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RENDER VIEW: ANALYZER */}
              {!loading && activeTab === "analyzer" && (
                <div className="space-y-4">
                  {analysisResult ? (
                    <div className="space-y-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-4.5 h-4.5" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Gemini Pro Reasoning Result:</h4>
                      </div>
                      <div className="text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed whitespace-pre-line border-l-2 border-indigo-500 pl-3">
                        {analysisResult}
                      </div>
                      <button
                        onClick={() => setAnalysisResult(null)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        Reset analysis
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 space-y-3">
                      <FileSearch className="w-12 h-12 mx-auto stroke-1" />
                      <div>
                        <p className="text-xs font-semibold">No media uploaded for analysis</p>
                        <p className="text-[11px] max-w-[280px] mx-auto mt-1">Upload a photo or campus document on the left and ask Gemini Pro to extract schedules or checklist steps.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RENDER VIEW: SPEECH RECOGNITION */}
              {!loading && activeTab === "speech" && (
                <div className="space-y-4">
                  {transcription ? (
                    <div className="space-y-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 text-rose-500">
                        <Mic className="w-4.5 h-4.5" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">Transcribed Spoken Query:</h4>
                      </div>
                      <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800 leading-relaxed">
                        &ldquo;{transcription}&rdquo;
                      </div>
                      
                      {/* Search trigger button based on transcription */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Dispatch event to open assistant chatbot with transcribed prompt
                            const event = new CustomEvent("ask-campus-bot", { detail: transcription });
                            window.dispatchEvent(event);
                            showFeedback("Forwarded spoken question to campus AI Guide chatbot!", null);
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Ask Campus AI Guide
                        </button>
                        <button
                          onClick={() => setTranscription(null)}
                          className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-xl"
                        >
                          Clear Text
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 space-y-3">
                      <Mic className="w-12 h-12 mx-auto stroke-1 animate-pulse" />
                      <div>
                        <p className="text-xs font-semibold">Transcription buffer is empty</p>
                        <p className="text-[11px] max-w-[280px] mx-auto mt-1">Start recording and speak. Your voice questions will be transcribed here and can be sent directly to the AI Guide!</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Premium Sandbox details footer */}
            <div className="mt-6 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex flex-wrap items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>SANDBOX ENGINE: RUNNING</span>
              <span>TCE CAMPUS GATEWAY v3.1</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
