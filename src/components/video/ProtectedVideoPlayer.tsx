"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useId,
  useCallback,
  useSyncExternalStore,
} from "react";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";

export interface ProtectedVideoPlayerProps {
  playbackKey?: string | number;
  youtubeVideoId?: string | null;
  videoUrl?: string | null;
  title?: string;
  autoplay?: boolean;
  className?: string;
  onEnded?: () => void;
  onNextLesson?: () => void;
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
  [key: string]: unknown;
}

interface YTNamespace {
  Player: new (
    elementId: string,
    options: {
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
      };
    }
  ) => YTPlayerInstance;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const emptySubscribe = () => () => {};
const getClientOrigin = () => (typeof window !== "undefined" ? window.location.origin : "");
const getServerOrigin = () => "";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export function ProtectedVideoPlayer({
  playbackKey,
  youtubeVideoId,
  videoUrl,
  title = "Video Lesson",
  autoplay = false,
  className = "",
  onEnded,
  onNextLesson,
}: ProtectedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrubBarRef = useRef<HTMLDivElement>(null);

  const rawId = useId();
  const baseIframeId = `er-yt-player-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const playerIdentity = `${playbackKey ?? ""}-${youtubeVideoId ?? ""}-${videoUrl ?? ""}`;
  const activeIframeId = `${baseIframeId}-${String(playbackKey ?? youtubeVideoId ?? "none").replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const origin = useSyncExternalStore(emptySubscribe, getClientOrigin, getServerOrigin);
  const [prevIdentity, setPrevIdentity] = useState(playerIdentity);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [clickIndicator, setClickIndicator] = useState<"play" | "pause" | null>(null);

  // Cleanly reset playback overlay/timer when switching to another lesson while keeping container mounted
  if (playerIdentity !== prevIdentity) {
    setPrevIdentity(playerIdentity);
    setIsPlaying(false);
    setIsEnded(false);
    setCurrentTime(0);
    setDuration(0);
    setSpeedMenuOpen(false);
  }

  // PostMessage helper fallback to control YouTube iframe directly
  const sendCommand = useCallback((func: string, args: unknown[] = []) => {
    const fn = playerRef.current?.[func];
    if (typeof fn === "function") {
      try {
        (fn as (...callArgs: unknown[]) => void).apply(playerRef.current, args);
        return;
      } catch (e) {
        console.warn("Direct YT API call failed, falling back to postMessage:", e);
      }
    }
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  }, []);

  // Initialize YouTube Iframe Player API
  useEffect(() => {
    if (!youtubeVideoId) return;

    let destroyed = false;

    function createPlayer() {
      if (destroyed || !window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player(activeIframeId, {
          events: {
            onReady: (event) => {
              if (destroyed) return;
              const dur = event.target.getDuration();
              if (dur && dur > 0) setDuration(dur);
              if (autoplay) {
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              if (destroyed) return;
              // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
              if (event.data === 1) {
                setIsPlaying(true);
                setIsEnded(false);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                setIsEnded(true);
                if (onEnded) onEnded();
              }
            },
          },
        });
      } catch (err) {
        console.warn("Could not bind YT.Player to iframe:", err);
      }
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // Check if script already injected
      const existingTag = document.getElementById("youtube-iframe-api-script");
      if (!existingTag) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevHandler = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevHandler) prevHandler();
        createPlayer();
      };
    }

    return () => {
      destroyed = true;
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {}
      }
      playerRef.current = null;
    };
  }, [youtubeVideoId, activeIframeId, autoplay, onEnded]);

  // Sync current time and duration when playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof cur === "number" && !isNaN(cur)) setCurrentTime(cur);
          if (typeof dur === "number" && !isNaN(dur) && dur > 0) setDuration(dur);
        } catch {}
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-hide controls timer
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying && !speedMenuOpen) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying, speedMenuOpen]);

  // Player controls
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      sendCommand("pauseVideo");
      setIsPlaying(false);
      setClickIndicator("pause");
    } else {
      sendCommand("playVideo");
      setIsPlaying(true);
      setIsEnded(false);
      setClickIndicator("play");
    }
    setTimeout(() => setClickIndicator(null), 500);
    resetHideTimer();
  }, [isPlaying, sendCommand, resetHideTimer]);

  const handleSeek = (newSeconds: number) => {
    const clamped = Math.max(0, Math.min(newSeconds, duration || 1));
    setCurrentTime(clamped);
    sendCommand("seekTo", [clamped, true]);
    resetHideTimer();
  };

  const handleScrubBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubBarRef.current || duration <= 0) return;
    const rect = scrubBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleSeek(pos * duration);
  };

  const handleRewind = () => {
    handleSeek(currentTime - 10);
  };

  const handleForward = () => {
    handleSeek(currentTime + 10);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      sendCommand("unMute");
      setIsMuted(false);
      if (volume === 0) {
        setVolume(50);
        sendCommand("setVolume", [50]);
      }
    } else {
      sendCommand("mute");
      setIsMuted(true);
    }
    resetHideTimer();
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    sendCommand("setVolume", [newVol]);
    if (newVol === 0) {
      setIsMuted(true);
      sendCommand("mute");
    } else if (isMuted) {
      setIsMuted(false);
      sendCommand("unMute");
    }
    resetHideTimer();
  };

  const handleSpeedSelect = (rate: number) => {
    setPlaybackRate(rate);
    sendCommand("setPlaybackRate", [rate]);
    setSpeedMenuOpen(false);
    resetHideTimer();
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Direct video file (MP4, WebM)
  if (videoUrl && !youtubeVideoId) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-[var(--r-lg)] bg-black shadow-md ${className}`}>
        <video
          key={playerIdentity}
          src={videoUrl}
          controls
          controlsList="nodownload"
          playsInline
          autoPlay={autoplay}
          className="h-full w-full object-contain"
        >
          Your browser does not support HTML5 video.
        </video>
        <div className="pointer-events-none absolute top-3 left-3 z-30 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-md border border-white/10 shadow-xs">
          <EnglishReadyLogo variant="icon" height={16} />
          <span className="text-[10px] font-bold text-white tracking-wide">English Ready</span>
        </div>
      </div>
    );
  }

  // Fallback if no video ID
  if (!youtubeVideoId) {
    return (
      <div className={`flex aspect-video w-full items-center justify-center rounded-[var(--r-lg)] bg-[#0B2559] text-sm text-slate-300 ${className}`}>
        <div className="text-center p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 mx-auto mb-3">
            <EnglishReadyLogo variant="icon" height={28} />
          </div>
          <p className="text-white font-bold">{title}</p>
          <p className="text-xs text-white/50 mt-1">Video materi belum tersedia.</p>
        </div>
      </div>
    );
  }

  // Construct hardened embed URL with controls=0 to 100% remove YouTube branding, links, and more-videos
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    controls: "0",        // Completely disables native controls & YouTube watermark button
    modestbranding: "1",  // Minimal YouTube branding
    rel: "0",             // Prevents recommendations from other channels
    iv_load_policy: "3",  // Disables annotations
    disablekb: "1",       // Disables native keyboard shortcuts
    fs: "0",              // Disables native fullscreen button
    playsinline: "1",
    enablejsapi: "1",     // Enables JavaScript Player API
    showinfo: "0",
  });

  if (origin) {
    params.set("origin", origin);
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?${params.toString()}`;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative aspect-video w-full overflow-hidden rounded-[var(--r-lg)] bg-black shadow-lg select-none group focus:outline-hidden ${className}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "k") {
          e.preventDefault();
          handleTogglePlay();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          handleRewind();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          handleForward();
        } else if (e.key === "m") {
          e.preventDefault();
          handleToggleMute();
        } else if (e.key === "f") {
          e.preventDefault();
          handleToggleFullscreen();
        }
      }}
    >
      {/* 
        1. IFRAME WRAPPER:
        - 100% full width and height with zero cropping/scaling so captions, subtitles, and video edges are never clipped.
        - pointer-events-none prevents user mouse/touch events from reaching the YouTube iframe directly.
      */}
      <div className="absolute inset-0 pointer-events-none">
        <iframe
          key={activeIframeId}
          ref={iframeRef}
          id={activeIframeId}
          className="w-full h-full border-0 pointer-events-none"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          tabIndex={-1}
        />
      </div>

      {/* 
        2. INTERACTION SHIELD:
        Catches all clicks over the video area to toggle play/pause or fullscreen,
        completely blocking right clicks and preventing navigation to youtube.com.
      */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleTogglePlay}
        onDoubleClick={handleToggleFullscreen}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* 3. CENTER CLICK INDICATOR (Flash animation on Play/Pause) */}
      {clickIndicator && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white shadow-xl animate-ping opacity-75">
            {clickIndicator === "play" ? (
              <svg className="w-8 h-8 fill-current translate-x-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* 4. TOP BRAND BAR: Official English Ready branding */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 pointer-events-none ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-md border border-white/15 shadow-sm">
            <EnglishReadyLogo variant="icon" height={16} />
            <span className="text-[11px] font-bold text-white tracking-wide">English Ready Class</span>
          </div>
          <span className="text-xs font-medium text-white/90 line-clamp-1 max-w-[280px] sm:max-w-md drop-shadow-sm">
            {title}
          </span>
        </div>

        {/* Speed Indicator Badge */}
        {playbackRate !== 1 && (
          <span className="rounded-md bg-[#F26A12] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
            {playbackRate}x
          </span>
        )}
      </div>

      {/* 5. BIG PAUSE OVERLAY (shown when video is paused or buffering) */}
      {!isPlaying && !isEnded && (
        <div className="pointer-events-none absolute inset-0 z-15 flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F26A12] text-white shadow-2xl transition-transform duration-200 hover:scale-110">
            <svg className="w-8 h-8 fill-current translate-x-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* 6. LESSON COMPLETED END SCREEN */}
      {isEnded && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-[#0B2559]/95 backdrop-blur-md p-6 text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F26A12]/20 text-[#F26A12] border border-[#F26A12]/30 mb-3">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold">Materi Video Selesai!</h3>
          <p className="text-xs text-white/70 mt-1 max-w-sm">
            Bagus sekali! Kamu telah menyelesaikan video pelajaran ini. Siap lanjut ke materi berikutnya?
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                handleSeek(0);
                sendCommand("playVideo");
                setIsEnded(false);
                setIsPlaying(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/15 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tonton Ulang
            </button>
            {onNextLesson && (
              <button
                onClick={onNextLesson}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F26A12] hover:bg-[#D65507] text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                Materi Selanjutnya &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* 
        7. CUSTOM ENGLISH READY BOTTOM CONTROLS:
        100% custom UI. Replaces YouTube's native controls completely.
        Contains:
        - Seek slider (scrubber)
        - Play / Pause
        - -10s / +10s
        - Volume toggle + slider
        - Timestamp (current / total)
        - Speed selector
        - Fullscreen toggle
      */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pt-8 pb-3 transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrubber Bar */}
        <div
          ref={scrubBarRef}
          onClick={handleScrubBarClick}
          className="relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer group/scrub hover:h-2.5 transition-all mb-3 flex items-center"
        >
          {/* Progress bar */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-[#F26A12] rounded-full"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Scrubber Knob */}
          <div
            className="absolute -top-1 h-3.5 w-3.5 rounded-full bg-white shadow-md border border-[#F26A12] opacity-0 group-hover/scrub:opacity-100 transition-opacity transform -translate-x-1/2 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={handleTogglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 transition text-white cursor-pointer"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Rewind 10s */}
            <button
              onClick={handleRewind}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer"
              title="Mundur 10 detik"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            {/* Forward 10s */}
            <button
              onClick={handleForward}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer"
              title="Maju 10 detik"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={handleToggleMute}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-14 sm:w-18 h-1 accent-[#F26A12] bg-white/30 rounded-lg cursor-pointer transition-all opacity-80 hover:opacity-100"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-[11px] font-mono text-white/80 pl-1 select-none">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/40 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                className="px-2 py-1 rounded-md text-[11px] font-bold text-white/90 hover:bg-white/15 transition cursor-pointer"
              >
                {playbackRate}x
              </button>

              {speedMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 rounded-xl bg-[#0B2559]/95 backdrop-blur-md border border-white/15 p-1 shadow-2xl flex flex-col gap-0.5 min-w-[72px]">
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedSelect(rate)}
                      className={`px-2.5 py-1 text-left text-[11px] rounded-lg font-semibold transition cursor-pointer ${
                        playbackRate === rate
                          ? "bg-[#F26A12] text-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition cursor-pointer"
              aria-label={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
              title="Layar Penuh"
            >
              {isFullscreen ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0l5 0m-5 0l0 5m11-5l5 0m-5 0l5 5m0-5l0 5M9 15l-5 5m0 0l5 0m-5 0l0-5m11 5l5 0m-5 0l-5-5m5 5l0-5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProtectedVideoPlayer;
