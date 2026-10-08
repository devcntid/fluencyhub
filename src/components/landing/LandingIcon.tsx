export function LandingIcon({
  name,
  color = "currentColor",
  size = 20,
  className = "",
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    className,
  };

  if (name === "Play") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M8 5v14l11-7z" />
      </svg>
    );
  }

  return (
    <svg {...common} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      {name === "Brain" && <path d="M12 4a4 4 0 0 0-4 4v1a3 3 0 0 0-2 2.5V15a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-3.5A3 3 0 0 0 16 9V8a4 4 0 0 0-4-4z" />}
      {name === "MessageSquareOff" && (
        <>
          <path d="M4 4l16 16" />
          <path d="M8 8H6a2 2 0 0 0-2 2v7l3-2h7" />
        </>
      )}
      {name === "BookOpen" && <path d="M4 6c4-2 8-2 8 0v13c0-2-4-2-8 0V6zm8 0c4-2 8-2 8 0v13c0-2-4-2-8 0V6z" />}
      {name === "Video" && <path d="M4 7h10v10H4zM14 11l6-3v8l-6-3z" />}
      {name === "Users" && <path d="M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 0a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 17 11zM4 19a5 5 0 0 1 10 0M15 19a4 4 0 0 1 6 0" />}
      {name === "Building2" && <path d="M4 20V6h8v14M12 10h8v10M7 20v-3M16 20v-3M7 10h2M7 14h2" />}
      {name === "CheckCircle" && (
        <>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </>
      )}
      {name === "Check" && <polyline points="20 6 9 17 4 12" />}
      {name === "FileText" && (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </>
      )}
      {name === "Target" && <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9zm0-4a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0-4a1 1 0 1 0-1-1 1 1 0 0 0 1 1z" />}
      {name === "TrendingUp" && <path d="M4 17l6-6 4 4 6-8M14 7h6v6" />}
      {name === "ArrowRight" && <path d="M5 12h14M13 6l6 6-6 6" />}
      {name === "ArrowLeft" && <path d="M19 12H5M12 19l-7-7 7-7" />}
      {name === "LayoutDashboard" && (
        <>
          <rect x="3" y="3" width="7" height="9" rx="1" ry="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" ry="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" ry="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" ry="1" />
        </>
      )}
      {name === "MessageCircle" && <path d="M21 12a8 8 0 0 1-11 7L4 20l1-5a8 8 0 1 1 16-3z" />}
      {name === "LogIn" && <path d="M10 17l5-5-5-5M15 12H3M21 21V3h-8" />}
      {name === "Home" && <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />}
      {name === "X" && (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      )}
      {name === "PlayCircle" && (
        <>
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </>
      )}
      {name === "Lock" && (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      )}
      {name === "StickyNote" && (
        <>
          <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
          <path d="M15 3v6h6" />
        </>
      )}
      {name === "Clock" && (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      )}
      {name === "FileCheck" && (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <path d="M14 3v5h5M9 15l2 2 4-4" />
        </>
      )}
      {name === "Layers" && (
        <>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 12 12 17 22 12" />
          <polyline points="2 17 12 22 22 17" />
        </>
      )}
      {name === "Download" && (
        <>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </>
      )}
      {name === "Eye" && (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
      {name === "Pencil" && (
        <>
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </>
      )}
      {name === "UserPlus" && (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </>
      )}
      {name === "Calendar" && (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </>
      )}
    </svg>
  );
}
