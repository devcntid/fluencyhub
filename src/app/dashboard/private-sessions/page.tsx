"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday as isDateToday,
  isTomorrow as isDateTomorrow,
  addMonths,
  subMonths,
  differenceInMinutes,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useConfirm, useToast } from "@/components/ui/NotificationProvider";

interface InstructorItem {
  instructorId: number;
  instructorName: string;
  instructorAvatar?: string | null;
}

interface PrivateSlot {
  id: number;
  instructorId: number;
  instructorName: string;
  instructorAvatar?: string | null;
  startAt: string;
  endAt: string;
  status?: string;
}

interface LearnerCourse {
  id: number;
  title: string;
  instructorId: number | null;
  tier?: string | null;
  speakingPartnerType?: string | null;
  tierBadge?: string | null;
  offlineSessionsCount?: number | null;
  usedSessions?: number | null;
  isHistoryOnly?: boolean;
}

interface PrivateSessionItem {
  id: number;
  slotId?: number | null;
  learnerId?: number;
  instructorId: number;
  courseId: number;
  topic?: string | null;
  instructorNotes?: string | null;
  rejectReason?: string | null;
  zoomLink?: string | null;
  instructorZoomLink?: string | null;
  sessionType?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  locationMapsUrl?: string | null;
  locationNotes?: string | null;
  status: string;
  confirmedAt?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  courseTitle: string;
  courseTier?: string | null;
  instructorName: string;
  instructorAvatar?: string | null;
}

interface LocationPreset {
  id: string;
  label: string;
  subLabel: string;
  name: string;
  address: string;
  mapsUrl: string;
}

const VERIFIED_LOCATION_PRESETS: LocationPreset[] = [
  {
    id: "hub_menteng",
    label: "Hub Menteng",
    subLabel: "Jakarta Pusat",
    name: "English Ready Learning Hub — Menteng",
    address: "Jl. H.O.S. Cokroaminoto No. 78, Menteng, Jakarta Pusat",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Menteng+Jakarta+Pusat",
  },
  {
    id: "hub_senopati",
    label: "Hub Senopati",
    subLabel: "Jakarta Selatan",
    name: "Partner Coworking & Coffee Space — Senopati",
    address: "Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Jalan+Senopati+Jakarta+Selatan",
  },
  {
    id: "hub_bandung",
    label: "Hub Dago",
    subLabel: "Bandung",
    name: "Dago Innovation & Training Hub",
    address: "Jl. Ir. H. Juanda No. 112, Dago, Bandung",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Jalan+Ir+H+Juanda+Dago+Bandung",
  },
];

const TOPIC_PRESETS = [
  "Simulasi Interview Kerja",
  "Review CV & LinkedIn",
  "Latihan Pitch Deck",
  "Negosiasi Gaji & Bisnis",
];

const WEEKDAYS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const emptySubscribe = () => () => {};

function isExecutiveCourse(course: LearnerCourse | undefined | null): boolean {
  if (!course) return false;
  return course.tier === "tier_tinggi" || course.speakingPartnerType === "trainer_offline";
}

function isProCourse(course: LearnerCourse | undefined | null): boolean {
  if (!course) return false;
  return course.tier === "tier_menengah" || course.speakingPartnerType === "trainer_online";
}

function getCourseQuota(course: LearnerCourse, sessions: PrivateSessionItem[]) {
  const max = Number(course.offlineSessionsCount) > 0 ? Number(course.offlineSessionsCount) : 4;
  const liveUsed = sessions.filter(
    (s) =>
      Number(s.courseId) === Number(course.id) &&
      ["pending", "confirmed", "completed"].includes(s.status)
  ).length;
  const used =
    sessions.length > 0
      ? liveUsed
      : typeof course.usedSessions === "number"
      ? Number(course.usedSessions)
      : liveUsed;
  const remaining = Math.max(0, max - used);
  return { max, used, remaining, isExhausted: remaining <= 0 };
}

function getInitials(name?: string | null): string {
  const clean = (name || "TR").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function TrainerAvatar({
  src,
  name,
  size = "md",
  ringClass = "ring-2 ring-[#E6DED4]",
}: {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  ringClass?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClass =
    size === "xs"
      ? "w-5 h-5 text-[9px]"
      : size === "sm"
      ? "w-8 h-8 text-[11px]"
      : size === "lg"
      ? "w-11 h-11 text-xs"
      : "w-10 h-10 text-xs";

  const showImg = Boolean(src && src.trim() && !imgFailed);

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src!}
        alt={name || "Trainer"}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${ringClass}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} rounded-full bg-gradient-to-br from-[#0B2559] to-[#1A428A] text-white font-extrabold flex items-center justify-center shrink-0 select-none ${ringClass}`}
    >
      {getInitials(name)}
    </div>
  );
}

function getStatusMeta(status: string) {
  switch (status) {
    case "confirmed":
      return {
        label: "Diterima",
        dot: "bg-emerald-500",
        pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
        accent: "bg-emerald-500",
      };
    case "pending":
      return {
        label: "Menunggu Konfirmasi",
        dot: "bg-amber-500",
        pill: "bg-amber-50 text-amber-800 border-amber-200",
        accent: "bg-amber-400",
      };
    case "completed":
      return {
        label: "Selesai",
        dot: "bg-[#0073F5]",
        pill: "bg-blue-50 text-[#0062D1] border-blue-200",
        accent: "bg-[#0073F5]",
      };
    case "rejected":
      return {
        label: "Ditolak",
        dot: "bg-rose-500",
        pill: "bg-rose-50 text-rose-700 border-rose-200",
        accent: "bg-rose-400",
      };
    case "cancelled":
      return {
        label: "Dibatalkan",
        dot: "bg-zinc-400",
        pill: "bg-zinc-100 text-zinc-600 border-zinc-200",
        accent: "bg-zinc-300",
      };
    default:
      return {
        label: status,
        dot: "bg-zinc-400",
        pill: "bg-zinc-100 text-zinc-600 border-zinc-200",
        accent: "bg-zinc-300",
      };
  }
}

export default function PrivateSessionsPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Server data
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [sessions, setSessions] = useState<PrivateSessionItem[]>([]);
  const [allSlots, setAllSlots] = useState<PrivateSlot[]>([]);
  const [learnerCourses, setLearnerCourses] = useState<LearnerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "confirmed" | "pending" | "completed"
  >("all");

  // Horizontal scroll for Course Filter strip
  const courseScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollCoursesLeft, setCanScrollCoursesLeft] = useState(false);
  const [canScrollCoursesRight, setCanScrollCoursesRight] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [userPickedDate, setUserPickedDate] = useState<Date | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Booking modal state (opens only when user clicks "Booking" on a concrete slot)
  const [selectedSlot, setSelectedSlot] = useState<PrivateSlot | null>(null);
  const [topic, setTopic] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [sessionType, setSessionType] = useState<"online" | "offline">("offline");
  const [locationPreset, setLocationPreset] = useState<string>("hub_menteng");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationMapsUrl, setLocationMapsUrl] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  const checkCourseScroll = useCallback(() => {
    const el = courseScrollRef.current;
    if (!el) return;
    setCanScrollCoursesLeft(el.scrollLeft > 4);
    setCanScrollCoursesRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scrollCourses = (direction: "left" | "right") => {
    const el = courseScrollRef.current;
    if (!el) return;
    const step = Math.max(180, Math.floor(el.clientWidth * 0.65));
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  // Initial load
  useEffect(() => {
    let active = true;
    async function loadAll() {
      try {
        const [instRes, sessRes, slotsRes, coursesRes] = await Promise.all([
          fetch("/api/private-sessions/instructors").then((r) => (r.ok ? r.json() : { data: [] })),
          fetch("/api/private-sessions").then((r) => (r.ok ? r.json() : { data: [] })),
          fetch("/api/private-sessions/slots").then((r) => (r.ok ? r.json() : { data: [] })),
          fetch("/api/private-sessions/courses").then((r) => (r.ok ? r.json() : { data: [] })),
        ]);
        if (!active) return;
        const nextSlots: PrivateSlot[] = Array.isArray(slotsRes?.data) ? slotsRes.data : [];
        const nextCourses: LearnerCourse[] = Array.isArray(coursesRes?.data)
          ? coursesRes.data
          : [];
        if (Array.isArray(instRes?.data)) setInstructors(instRes.data);
        if (Array.isArray(sessRes?.data)) setSessions(sessRes.data);
        setAllSlots(nextSlots);
        setLearnerCourses(nextCourses);

        // Pre-apply ?c=<courseId> from Classroom navigation if valid
        let matchedCourse: LearnerCourse | undefined;
        if (typeof window !== "undefined") {
          const urlCourse = new URLSearchParams(window.location.search).get("c");
          if (urlCourse && urlCourse !== "all") {
            matchedCourse = nextCourses.find((c) => String(c.id) === urlCourse);
            if (matchedCourse) {
              setSelectedCourseId(String(matchedCourse.id));
            }
          }
        }

        // Auto-open calendar to the month of the nearest available slot
        const relevantSlots =
          matchedCourse && isExecutiveCourse(matchedCourse) && matchedCourse.instructorId
            ? nextSlots.filter(
                (s) => Number(s.instructorId) === Number(matchedCourse.instructorId)
              )
            : nextSlots;

        if (relevantSlots.length > 0) {
          const sorted = [...relevantSlots].sort(
            (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
          );
          const firstSlotDate = new Date(sorted[0].startAt);
          if (!Number.isNaN(firstSlotDate.getTime())) {
            setCurrentMonth(firstSlotDate);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAll();
    return () => {
      active = false;
    };
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [instRes, sessRes, slotsRes, coursesRes] = await Promise.all([
        fetch("/api/private-sessions/instructors").then((r) => (r.ok ? r.json() : { data: [] })),
        fetch("/api/private-sessions").then((r) => (r.ok ? r.json() : { data: [] })),
        fetch("/api/private-sessions/slots").then((r) => (r.ok ? r.json() : { data: [] })),
        fetch("/api/private-sessions/courses").then((r) => (r.ok ? r.json() : { data: [] })),
      ]);
      if (Array.isArray(instRes?.data)) setInstructors(instRes.data);
      if (Array.isArray(sessRes?.data)) setSessions(sessRes.data);
      if (Array.isArray(slotsRes?.data)) setAllSlots(slotsRes.data);
      if (Array.isArray(coursesRes?.data)) setLearnerCourses(coursesRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Lock body scroll & support Escape when booking modal is open
  useEffect(() => {
    if (!selectedSlot) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBookingSubmitting) {
        setSelectedSlot(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedSlot, isBookingSubmitting]);

  // Build sorted filterable courses: Executive courses first, then other enrolled courses, then any legacy session courses
  const filterableCourses = useMemo<LearnerCourse[]>(() => {
    const map = new Map<number, LearnerCourse>();
    const exec: LearnerCourse[] = [];
    const others: LearnerCourse[] = [];

    for (const c of learnerCourses) {
      if (map.has(Number(c.id))) continue;
      map.set(Number(c.id), c);
      if (isExecutiveCourse(c)) exec.push(c);
      else others.push(c);
    }

    const fromHistory: LearnerCourse[] = [];
    for (const s of sessions) {
      const cid = Number(s.courseId);
      if (!cid || map.has(cid)) continue;
      const synthetic: LearnerCourse = {
        id: cid,
        title: s.courseTitle || `Kelas #${cid}`,
        instructorId: s.instructorId ?? null,
        tier: s.courseTier ?? null,
        isHistoryOnly: true,
      };
      map.set(cid, synthetic);
      fromHistory.push(synthetic);
    }

    return [...exec, ...others, ...fromHistory];
  }, [learnerCourses, sessions]);

  useEffect(() => {
    const timer = setTimeout(checkCourseScroll, 120);
    window.addEventListener("resize", checkCourseScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkCourseScroll);
    };
  }, [filterableCourses, checkCourseScroll]);

  const executiveCourses = useMemo(
    () => learnerCourses.filter((c) => isExecutiveCourse(c)),
    [learnerCourses]
  );

  const selectedCourse = useMemo(
    () => filterableCourses.find((c) => String(c.id) === selectedCourseId) || null,
    [filterableCourses, selectedCourseId]
  );

  const isSelectedCourseNonExecutive = Boolean(
    selectedCourse && !isExecutiveCourse(selectedCourse)
  );

  // Instructors visible for the current course filter
  const visibleInstructors = useMemo(() => {
    if (!selectedCourse) return instructors;
    if (!isExecutiveCourse(selectedCourse)) return [];
    if (!selectedCourse.instructorId) return instructors;
    return instructors.filter(
      (i) => Number(i.instructorId) === Number(selectedCourse.instructorId)
    );
  }, [instructors, selectedCourse]);

  // Slots filtered by Course (via its instructor) AND Instructor pill
  const filteredSlots = useMemo(() => {
    if (isSelectedCourseNonExecutive) return [];

    let list = allSlots;

    if (selectedCourse && selectedCourse.instructorId) {
      list = list.filter(
        (slot) => Number(slot.instructorId) === Number(selectedCourse.instructorId)
      );
    }

    if (selectedInstructorId) {
      list = list.filter(
        (slot) => String(slot.instructorId) === String(selectedInstructorId)
      );
    }

    return [...list].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [allSlots, selectedCourse, isSelectedCourseNonExecutive, selectedInstructorId]);

  const groupedSlots = useMemo(() => {
    return filteredSlots.reduce<Record<string, PrivateSlot[]>>((acc, slot) => {
      const dateStr = format(new Date(slot.startAt), "yyyy-MM-dd");
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(slot);
      return acc;
    }, {});
  }, [filteredSlots]);

  // Nearest available upcoming slot under current filters
  const nearestAvailableDate = useMemo<Date | null>(() => {
    if (filteredSlots.length === 0) return null;
    const d = new Date(filteredSlots[0].startAt);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [filteredSlots]);

  const activeCalendarDate = useMemo<Date>(() => {
    if (userPickedDate) return userPickedDate;
    if (nearestAvailableDate) return nearestAvailableDate;
    return new Date();
  }, [userPickedDate, nearestAvailableDate]);

  const activeDateKey = format(activeCalendarDate, "yyyy-MM-dd");
  const activeDaySlots = useMemo(
    () => groupedSlots[activeDateKey] || [],
    [groupedSlots, activeDateKey]
  );

  // Next available date different from activeCalendarDate (for quick jump button)
  const nextSuggestedSlotDate = useMemo<Date | null>(() => {
    if (filteredSlots.length === 0) return null;
    const other = filteredSlots.find(
      (s) => format(new Date(s.startAt), "yyyy-MM-dd") !== activeDateKey
    );
    return other ? new Date(other.startAt) : null;
  }, [filteredSlots, activeDateKey]);

  // Quota stats (dynamically scoped to selected Executive course OR combined total)
  const hasExecutiveOffline = executiveCourses.length > 0;
  const hasProOnline = useMemo(
    () => learnerCourses.some((c) => isProCourse(c)),
    [learnerCourses]
  );

  const quotaSummary = useMemo(() => {
    if (selectedCourse && isExecutiveCourse(selectedCourse)) {
      const q = getCourseQuota(selectedCourse, sessions);
      return {
        scopeTitle: selectedCourse.title,
        isExecutive: true,
        ...q,
      };
    }

    if (selectedCourse && !isExecutiveCourse(selectedCourse)) {
      return {
        scopeTitle: selectedCourse.title,
        isExecutive: false,
        max: 0,
        used: 0,
        remaining: 0,
        isExhausted: false,
      };
    }

    const max = executiveCourses.reduce((sum, c) => sum + getCourseQuota(c, sessions).max, 0);
    const used = executiveCourses.reduce((sum, c) => sum + getCourseQuota(c, sessions).used, 0);
    const remaining = Math.max(0, max - used);
    return {
      scopeTitle:
        executiveCourses.length === 1
          ? executiveCourses[0].title
          : `Semua Kelas Executive (${executiveCourses.length})`,
      isExecutive: hasExecutiveOffline,
      max,
      used,
      remaining,
      isExhausted: max > 0 && remaining <= 0,
    };
  }, [selectedCourse, executiveCourses, sessions, hasExecutiveOffline]);

  // Sessions scoped by selected course (and optional instructor filter)
  const courseScopedSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedCourseId && String(s.courseId) !== selectedCourseId) return false;
      if (selectedInstructorId && String(s.instructorId) !== selectedInstructorId) return false;
      return true;
    });
  }, [sessions, selectedCourseId, selectedInstructorId]);

  const confirmedCount = useMemo(
    () => courseScopedSessions.filter((s) => s.status === "confirmed").length,
    [courseScopedSessions]
  );
  const pendingCount = useMemo(
    () => courseScopedSessions.filter((s) => s.status === "pending").length,
    [courseScopedSessions]
  );
  const completedOrEndedCount = useMemo(
    () =>
      courseScopedSessions.filter((s) =>
        ["completed", "rejected", "cancelled"].includes(s.status)
      ).length,
    [courseScopedSessions]
  );

  const sortedSessions = useMemo(() => {
    const filtered = courseScopedSessions.filter((s) => {
      if (historyFilter === "confirmed") return s.status === "confirmed";
      if (historyFilter === "pending") return s.status === "pending";
      if (historyFilter === "completed") {
        return ["completed", "rejected", "cancelled"].includes(s.status);
      }
      return true;
    });

    const rank: Record<string, number> = {
      confirmed: 1,
      pending: 2,
      completed: 3,
      rejected: 4,
      cancelled: 5,
    };

    return [...filtered].sort((a, b) => {
      const rA = rank[a.status] ?? 99;
      const rB = rank[b.status] ?? 99;
      if (rA !== rB) return rA - rB;

      const timeA = a.startAt ? new Date(a.startAt).getTime() : 0;
      const timeB = b.startAt ? new Date(b.startAt).getTime() : 0;

      if (a.status === "confirmed" && b.status === "confirmed") {
        const isUpcomingA = timeA >= nowMs - 60 * 60 * 1000;
        const isUpcomingB = timeB >= nowMs - 60 * 60 * 1000;
        if (isUpcomingA && !isUpcomingB) return -1;
        if (!isUpcomingA && isUpcomingB) return 1;
        if (isUpcomingA && isUpcomingB) return timeA - timeB;
        return timeB - timeA;
      }

      return timeB - timeA;
    });
  }, [courseScopedSessions, historyFilter, nowMs]);

  // Handlers
  function handleSelectCourse(nextCourseId: string) {
    setSelectedCourseId(nextCourseId);
    setUserPickedDate(null);

    if (!nextCourseId) {
      setSelectedInstructorId("");
      if (allSlots.length > 0) {
        const first = [...allSlots].sort(
          (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        )[0];
        setCurrentMonth(new Date(first.startAt));
      }
      return;
    }

    const found = filterableCourses.find((c) => String(c.id) === nextCourseId);
    if (found && selectedInstructorId && String(found.instructorId) !== selectedInstructorId) {
      setSelectedInstructorId("");
    }

    if (found && isExecutiveCourse(found) && found.instructorId) {
      const matchingSlots = allSlots
        .filter((s) => Number(s.instructorId) === Number(found.instructorId))
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      if (matchingSlots.length > 0) {
        setCurrentMonth(new Date(matchingSlots[0].startAt));
      }
    }
  }

  function handleSelectInstructor(nextInstId: string) {
    setSelectedInstructorId(nextInstId);
    setUserPickedDate(null);

    if (nextInstId && selectedCourse && String(selectedCourse.instructorId) !== nextInstId) {
      setSelectedCourseId("");
    }

    const matchingSlots = (nextInstId
      ? allSlots.filter((s) => String(s.instructorId) === nextInstId)
      : allSlots
    ).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    if (matchingSlots.length > 0) {
      setCurrentMonth(new Date(matchingSlots[0].startAt));
    }
  }

  function handleResetFilters() {
    setSelectedCourseId("");
    setSelectedInstructorId("");
    setHistoryFilter("all");
    setUserPickedDate(null);
  }

  function handleSelectPreset(presetId: string) {
    setLocationPreset(presetId);
    if (presetId === "custom") {
      setLocationName("");
      setLocationAddress("");
      setLocationMapsUrl("");
      return;
    }
    const found = VERIFIED_LOCATION_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setLocationName(found.name);
      setLocationAddress(found.address);
      setLocationMapsUrl(found.mapsUrl);
    }
  }

  function resetBookingModal() {
    setSelectedSlot(null);
    setCourseId("");
    setTopic("");
    setSessionType("offline");
    setLocationPreset("hub_menteng");
    setLocationName("");
    setLocationAddress("");
    setLocationMapsUrl("");
    setLocationNotes("");
  }

  function handleChooseSlot(slot: PrivateSlot) {
    setSelectedSlot(slot);
    setTopic("");
    setLocationNotes("");

    const matching = learnerCourses.filter(
      (c) =>
        Number(c.instructorId) === Number(slot.instructorId) && isExecutiveCourse(c)
    );
    const availableCourses = matching.filter((c) => !getCourseQuota(c, sessions).isExhausted);

    // Prefer the currently filtered course if eligible & available
    const filteredMatch = selectedCourseId
      ? availableCourses.find((c) => String(c.id) === selectedCourseId)
      : null;

    const chosen = filteredMatch || availableCourses[0] || null;

    if (chosen) {
      setCourseId(String(chosen.id));
      setSessionType("offline");
      handleSelectPreset("hub_menteng");
    } else {
      setCourseId("");
      setSessionType("online");
      handleSelectPreset("custom");
    }
  }

  async function bookSlot() {
    if (!selectedSlot || !topic.trim() || !courseId) {
      toast.warning("Silakan pilih program kelas dan isi topik diskusi terlebih dahulu.");
      return;
    }

    const chosenCourse = learnerCourses.find((c) => String(c.id) === String(courseId));
    if (chosenCourse) {
      const quota = getCourseQuota(chosenCourse, sessions);
      if (quota.isExhausted) {
        toast.warning(
          `Kuota tiket sesi privat 1-on-1 untuk kelas ini sudah habis (${quota.used}/${quota.max}).`
        );
        return;
      }
    }

    if (sessionType === "offline" && (!locationName.trim() || !locationAddress.trim())) {
      toast.warning(
        "Untuk sesi Tatap Muka (Offline), nama tempat dan alamat lengkap wajib diisi."
      );
      return;
    }

    setIsBookingSubmitting(true);
    try {
      const res = await fetch("/api/private-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          instructorId: selectedSlot.instructorId,
          courseId,
          topic: topic.trim(),
          sessionType,
          locationName: sessionType === "offline" ? locationName.trim() : null,
          locationAddress: sessionType === "offline" ? locationAddress.trim() : null,
          locationMapsUrl: sessionType === "offline" ? locationMapsUrl.trim() : null,
          locationNotes: sessionType === "offline" ? locationNotes.trim() : null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(
          sessionType === "offline"
            ? "Booking Sesi Tatap Muka Offline terkirim! Menunggu konfirmasi lokasi dari trainer."
            : "Booking Sesi Online terkirim! Menunggu konfirmasi dari trainer."
        );
        resetBookingModal();
        await refreshAll();
      } else {
        toast.error(json.error || "Gagal membooking sesi.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsBookingSubmitting(false);
    }
  }

  async function cancelSession(sessionId: number) {
    const ok = await confirm({
      title: "Batalkan Sesi Privat?",
      message:
        "Apakah Anda yakin ingin membatalkan sesi privat ini? Tiket akan dikembalikan dan jadwal kembali dibuka.",
      confirmText: "Ya, Batalkan Sesi",
      cancelText: "Kembali",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/private-sessions/${sessionId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        toast.success("Sesi privat berhasil dibatalkan.");
        await refreshAll();
      } else {
        toast.error(json.error || "Gagal membatalkan sesi.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    }
  }

  // Calendar grid dates
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function jumpToDate(target: Date) {
    setCurrentMonth(target);
    setUserPickedDate(target);
  }

  // Helper: map instructorId -> executive course titles (to annotate slot cards cleanly)
  const instructorCourseMap = useMemo(() => {
    const map = new Map<number, LearnerCourse[]>();
    for (const c of executiveCourses) {
      if (!c.instructorId) continue;
      const key = Number(c.instructorId);
      const arr = map.get(key) || [];
      arr.push(c);
      map.set(key, arr);
    }
    return map;
  }, [executiveCourses]);

  // Skeleton state
  if (!isMounted || loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 animate-pulse">
        <div className="h-44 sm:h-40 rounded-3xl bg-[#0B2559]/15" />
        <div className="h-24 rounded-2xl bg-white border border-[#E6DED4]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 h-96 rounded-2xl bg-white border border-[#E6DED4]" />
          <div className="lg:col-span-5 h-96 rounded-2xl bg-white border border-[#E6DED4]" />
        </div>
      </div>
    );
  }

  const hasActiveFilter = Boolean(selectedCourseId || selectedInstructorId);
  const activeScopeLabel = selectedCourse
    ? selectedCourse.title
    : selectedInstructorId
    ? instructors.find((i) => String(i.instructorId) === selectedInstructorId)?.instructorName ||
      "Trainer Terpilih"
    : "Semua Kelas & Trainer";

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `,
        }}
      />

      {/* 1. HERO BANNER — English Ready Navy Executive Header */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2559] via-[#102F6E] to-[#163D8A] p-5 sm:p-7 text-white shadow-lg shadow-[#0B2559]/10">
        {/* Subtle decorative ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#0073F5]/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#F26A12]/15 blur-3xl"
        />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left copy + quick live indicators */}
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold tracking-wide text-blue-100 backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F26A12]" />
              <span>
                {hasExecutiveOffline
                  ? "Paket Tinggi • Executive 1-on-1 Coaching"
                  : hasProOnline
                  ? "Paket Menengah • Cohort Live Zoom"
                  : "English Ready • Private Coaching"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-[family-name:var(--font-heading)] leading-tight">
              Private Coaching &amp; Tatap Muka
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/85 leading-relaxed max-w-xl">
              Pilih kelas, temukan jadwal kosong trainer, lalu booking sesi privat 1-on-1{" "}
              <span className="font-semibold text-white">Offline (Tatap Muka)</span> atau{" "}
              <span className="font-semibold text-white">Online Zoom</span> sesuai kebutuhanmu.
            </p>

            {/* Quick status badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {filteredSlots.length} Slot Tersedia
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-sky-300" />
                {confirmedCount} Diterima
              </span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400/20 border border-amber-300/30 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  {pendingCount} Menunggu
                </span>
              )}
            </div>
          </div>

          {/* Right: Dynamic Quota Glass Card */}
          <div className="w-full lg:w-[320px] shrink-0 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md p-4 sm:p-5">
            {quotaSummary.isExecutive ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                      Kuota Tiket 1-on-1
                    </p>
                    <p
                      className="text-xs font-bold text-white truncate mt-0.5"
                      title={quotaSummary.scopeTitle}
                    >
                      {quotaSummary.scopeTitle}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      quotaSummary.isExhausted
                        ? "bg-rose-500/25 text-rose-100 border border-rose-300/30"
                        : "bg-emerald-500/25 text-emerald-100 border border-emerald-300/30"
                    }`}
                  >
                    {quotaSummary.isExhausted ? "Habis" : "Aktif"}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-white">
                      {quotaSummary.remaining}
                    </span>
                    <span className="text-xs font-semibold text-blue-200">
                      / {quotaSummary.max} Tiket Tersisa
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-200/90">
                    {quotaSummary.used} terpakai
                  </span>
                </div>

                {/* Ticket segments bar */}
                {quotaSummary.max > 0 && quotaSummary.max <= 12 ? (
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: quotaSummary.max }).map((_, idx) => {
                      const isRemainingSlot = idx < quotaSummary.remaining;
                      return (
                        <span
                          key={idx}
                          className={`h-2 flex-1 rounded-full transition-all ${
                            isRemainingSlot ? "bg-[#F26A12]" : "bg-white/20"
                          }`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F26A12] transition-all duration-300"
                      style={{
                        width: `${
                          quotaSummary.max > 0
                            ? Math.round((quotaSummary.remaining / quotaSummary.max) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                )}

                <p className="text-[11px] text-blue-100/80 leading-snug">
                  Berlaku gabungan untuk sesi{" "}
                  <span className="font-semibold text-white">Offline Tatap Muka</span> &amp;{" "}
                  <span className="font-semibold text-white">Online Zoom</span>.
                </p>
              </div>
            ) : selectedCourse ? (
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Status Kelas Dipilih
                </p>
                <p className="text-sm font-extrabold text-white leading-snug line-clamp-2">
                  {selectedCourse.title}
                </p>
                <p className="text-[11px] text-blue-100/85 leading-relaxed">
                  {isProCourse(selectedCourse)
                    ? "Kelas ini menggunakan format Live Zoom Cohort (tanpa tiket privat 1-on-1)."
                    : "Kelas ini menggunakan format Video & AI Speaking Partner 24/7."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Akses Private 1-on-1
                </p>
                <p className="text-sm font-extrabold text-white">
                  {hasProOnline ? "Tersedia di Paket Tinggi" : "Belum Ada Kuota 1-on-1"}
                </p>
                <p className="text-[11px] text-blue-100/85 leading-relaxed">
                  Upgrade ke Paket Tinggi (Ready Path Executive) untuk membuka 4 tiket sesi privat 1-on-1 per program.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. FILTER BAR — FILTER PER KELAS + FILTER TRAINER */}
      {(filterableCourses.length > 0 || instructors.length > 0) && (
        <section className="bg-white rounded-2xl border border-[#E6DED4] shadow-xs p-4 sm:p-5 space-y-4">
          {/* Row 1: Filter Per Kelas */}
          {filterableCourses.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B2559]/8 text-[#0B2559]">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                    </svg>
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0B2559]">
                    Filter Per Kelas
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500 bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 rounded-full">
                    {filterableCourses.length} Kelas
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isRefreshing && (
                    <span className="text-[11px] font-semibold text-zinc-400">
                      Memperbarui...
                    </span>
                  )}
                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs font-bold text-[#C2530A] hover:text-[#F26A12] hover:bg-[#FFF4EC] px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Course Pills with arrows */}
              <div className="relative flex items-center gap-1.5">
                {(canScrollCoursesLeft || canScrollCoursesRight) && (
                  <button
                    type="button"
                    onClick={() => scrollCourses("left")}
                    disabled={!canScrollCoursesLeft}
                    aria-label="Geser kelas ke kiri"
                    className={`shrink-0 w-8 h-8 rounded-xl border border-[#E6DED4] bg-white flex items-center justify-center text-[#0B2559] transition ${
                      canScrollCoursesLeft
                        ? "hover:bg-[#FBF6F1] hover:border-[#0B2559]/30 cursor-pointer"
                        : "opacity-30 cursor-not-allowed"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}

                <div
                  ref={courseScrollRef}
                  onScroll={checkCourseScroll}
                  className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto py-0.5 hide-scrollbar scroll-smooth"
                >
                  {/* All Courses Pill */}
                  <button
                    type="button"
                    onClick={() => handleSelectCourse("")}
                    className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                      selectedCourseId === ""
                        ? "bg-[#0B2559] border-[#0B2559] text-white shadow-sm"
                        : "bg-[#FBF6F1]/70 border-[#E6DED4] text-[#0B2559] hover:bg-white hover:border-[#0B2559]/35"
                    }`}
                  >
                    <span>Semua Kelas</span>
                    {hasExecutiveOffline && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                          selectedCourseId === ""
                            ? "bg-white/15 text-white"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        }`}
                      >
                        {executiveCourses.reduce(
                          (sum, c) => sum + getCourseQuota(c, sessions).remaining,
                          0
                        )}{" "}
                        tiket
                      </span>
                    )}
                  </button>

                  {filterableCourses.map((course) => {
                    const isSelected = selectedCourseId === String(course.id);
                    const exec = isExecutiveCourse(course);
                    const pro = isProCourse(course);
                    const quota = exec ? getCourseQuota(course, sessions) : null;

                    return (
                      <button
                        key={course.id}
                        type="button"
                        title={course.title}
                        onClick={() => handleSelectCourse(String(course.id))}
                        className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer max-w-[280px] ${
                          isSelected
                            ? "bg-[#0B2559] border-[#0B2559] text-white shadow-sm"
                            : exec
                            ? "bg-white border-[#E6DED4] text-[#0B2559] hover:border-[#0073F5]/50 hover:bg-blue-50/30"
                            : "bg-[#FBF6F1]/50 border-[#E6DED4]/80 text-zinc-600 hover:bg-white hover:text-[#0B2559]"
                        }`}
                      >
                        <span className="truncate">{course.title}</span>
                        {exec && quota ? (
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                              isSelected
                                ? quota.isExhausted
                                  ? "bg-rose-400/30 text-rose-100"
                                  : "bg-[#F26A12] text-white"
                                : quota.isExhausted
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {quota.isExhausted ? "Habis" : `${quota.remaining}/${quota.max}`}
                          </span>
                        ) : (
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                              isSelected
                                ? "bg-white/15 text-blue-100"
                                : pro
                                ? "bg-blue-50 text-[#0062D1]"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {pro ? "Cohort" : "AI Only"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {(canScrollCoursesLeft || canScrollCoursesRight) && (
                  <button
                    type="button"
                    onClick={() => scrollCourses("right")}
                    disabled={!canScrollCoursesRight}
                    aria-label="Geser kelas ke kanan"
                    className={`shrink-0 w-8 h-8 rounded-xl border border-[#E6DED4] bg-white flex items-center justify-center text-[#0B2559] transition ${
                      canScrollCoursesRight
                        ? "hover:bg-[#FBF6F1] hover:border-[#0B2559]/30 cursor-pointer"
                        : "opacity-30 cursor-not-allowed"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Row 2: Filter Trainer (when eligible instructors exist) */}
          {visibleInstructors.length > 0 && (
            <div className="pt-3.5 border-t border-[#F0EAE2] flex flex-col sm:flex-row sm:items-center gap-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 shrink-0">
                Trainer:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
                {visibleInstructors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleSelectInstructor("")}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                      selectedInstructorId === ""
                        ? "bg-[#0073F5] border-[#0073F5] text-white shadow-2xs"
                        : "bg-white border-[#E6DED4] text-zinc-600 hover:border-[#0073F5]/40 hover:text-[#0B2559]"
                    }`}
                  >
                    Semua Trainer ({visibleInstructors.length})
                  </button>
                )}
                {visibleInstructors.map((inst) => {
                  const isActive =
                    selectedInstructorId === String(inst.instructorId) ||
                    (visibleInstructors.length === 1 && Boolean(selectedCourseId));
                  const slotCount = allSlots.filter(
                    (s) => Number(s.instructorId) === Number(inst.instructorId)
                  ).length;

                  return (
                    <button
                      key={inst.instructorId}
                      type="button"
                      onClick={() =>
                        handleSelectInstructor(
                          selectedInstructorId === String(inst.instructorId)
                            ? ""
                            : String(inst.instructorId)
                        )
                      }
                      className={`shrink-0 inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-[#0073F5] border-[#0073F5] text-white shadow-2xs"
                          : "bg-white border-[#E6DED4] text-[#0B2559] hover:border-[#0073F5]/40 hover:bg-blue-50/30"
                      }`}
                    >
                      <TrainerAvatar
                        src={inst.instructorAvatar}
                        name={inst.instructorName}
                        size="xs"
                        ringClass={isActive ? "ring-1 ring-white/60" : "ring-1 ring-[#E6DED4]"}
                      />
                      <span>{inst.instructorName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : slotCount > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {slotCount} slot
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. SCHEDULE SECTION — Split Interactive Calendar (7 cols) + Live Day Slots Panel (5 cols) */}
      {instructors.length === 0 ? (
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#E6DED4] shadow-xs p-6 sm:p-10">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[#FFF4EC] border border-[#F26A12]/25 text-[#C2530A] flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0B2559] font-[family-name:var(--font-heading)]">
                {hasProOnline
                  ? "Sesi Privat 1-on-1 Khusus Paket Tinggi"
                  : learnerCourses.length > 0
                  ? "Buka Sesi Privat 1-on-1 di Paket Tinggi"
                  : "Belum Terdaftar di Program Paket Tinggi"}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {hasProOnline
                  ? "Paket Menengah kamu mencakup kelas kelompok Live Zoom di Classroom → Live Zoom. Jadwal coaching privat 1-on-1 (Offline Tatap Muka & Online) tersedia eksklusif di Paket Tinggi (Ready Path Executive)."
                  : learnerCourses.length > 0
                  ? "Paket Bawah kamu sudah mencakup Video Materi & AI Speaking Partner 24/7. Upgrade ke Paket Tinggi untuk sesi privat 1-on-1 bersama trainer pilihanmu."
                  : "Daftar program Paket Tinggi (Ready Path Executive) untuk membuka kalender booking sesi privat 1-on-1 & Atur Lokasi Temu."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {hasProOnline ? (
                <Link
                  href="/dashboard/classroom?tab=live&c=all"
                  className="px-4 py-2.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] text-white text-xs font-bold transition shadow-xs"
                >
                  Buka Kelas Live Zoom →
                </Link>
              ) : (
                <Link
                  href="/dashboard/speaking"
                  className="px-4 py-2.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] text-white text-xs font-bold transition shadow-xs"
                >
                  Latihan di AI Speaking →
                </Link>
              )}
              <Link
                href="/#harga"
                className="px-4 py-2.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] text-white text-xs font-bold transition shadow-xs"
              >
                Lihat Paket Tinggi
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Clean Monthly Calendar */}
          <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-[#E6DED4] shadow-xs overflow-hidden">
            {/* Calendar Header */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-[#F0EAE2] flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-extrabold text-[#0B2559] capitalize font-[family-name:var(--font-heading)] leading-tight">
                  {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 truncate">
                  Menampilkan jadwal:{" "}
                  <span className="font-semibold text-[#0B2559]">{activeScopeLabel}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => jumpToDate(new Date())}
                  className="px-3 py-2 rounded-xl border border-[#E6DED4] bg-[#FBF6F1] hover:bg-[#F3ECE4] text-[#0B2559] text-xs font-bold transition cursor-pointer"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  aria-label="Bulan sebelumnya"
                  className="p-2 rounded-xl border border-[#E6DED4] bg-white hover:bg-[#FBF6F1] text-[#0B2559] transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  aria-label="Bulan berikutnya"
                  className="p-2 rounded-xl border border-[#E6DED4] bg-white hover:bg-[#FBF6F1] text-[#0B2559] transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 px-2 sm:px-4 pt-3 pb-1.5">
              {WEEKDAYS_ID.map((dayLabel, idx) => (
                <div
                  key={dayLabel}
                  className={`text-center text-[11px] font-bold uppercase tracking-wider py-1 ${
                    idx >= 5 ? "text-[#C2530A]/80" : "text-zinc-400"
                  }`}
                >
                  {dayLabel}
                </div>
              ))}
            </div>

            {/* Modern Floating Date Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 p-2 sm:p-4 pt-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const daySlots = groupedSlots[dateKey] || [];
                const inMonth = isSameMonth(day, currentMonth);
                const todayFlag = isDateToday(day);
                const selectedFlag = isSameDay(day, activeCalendarDate);
                const hasSlots = daySlots.length > 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setUserPickedDate(day);
                      if (!inMonth) setCurrentMonth(day);
                    }}
                    className={`relative min-h-[54px] sm:min-h-[64px] rounded-xl p-1 sm:p-1.5 flex flex-col items-center justify-between transition-all cursor-pointer border ${
                      selectedFlag
                        ? "bg-[#0B2559] border-[#0B2559] text-white shadow-md shadow-[#0B2559]/20"
                        : hasSlots
                        ? "bg-emerald-50/75 border-emerald-200/80 text-[#0B2559] hover:bg-emerald-100/70 hover:border-emerald-300"
                        : todayFlag
                        ? "bg-[#FFF4EC] border-[#F26A12]/50 text-[#C2530A] hover:bg-[#FFEAD9]"
                        : inMonth
                        ? "bg-white border-transparent hover:border-[#E6DED4] hover:bg-[#FBF6F1] text-zinc-700"
                        : "bg-transparent border-transparent text-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 pt-0.5">
                      <span
                        className={`text-xs sm:text-sm font-bold leading-none ${
                          selectedFlag
                            ? "text-white"
                            : todayFlag
                            ? "text-[#C2530A]"
                            : inMonth
                            ? "text-zinc-800"
                            : "text-zinc-300"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      {todayFlag && !selectedFlag && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F26A12]" />
                      )}
                    </div>

                    {hasSlots ? (
                      <span
                        className={`w-full text-center rounded-md px-1 py-0.5 text-[9px] sm:text-[10px] font-extrabold leading-tight truncate ${
                          selectedFlag
                            ? "bg-emerald-400/25 text-emerald-100"
                            : "bg-emerald-600 text-white shadow-2xs"
                        }`}
                      >
                        <span className="sm:hidden">{daySlots.length}</span>
                        <span className="hidden sm:inline">{daySlots.length} slot</span>
                      </span>
                    ) : todayFlag ? (
                      <span
                        className={`text-[9px] font-bold leading-none pb-0.5 ${
                          selectedFlag ? "text-blue-200" : "text-[#C2530A]"
                        }`}
                      >
                        Hari ini
                      </span>
                    ) : (
                      <span className="h-3" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Clean Calendar Legend Footer */}
            <div className="px-4 py-3 sm:px-6 bg-[#FBF6F1]/70 border-t border-[#F0EAE2] flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-600">
              <div className="flex flex-wrap items-center gap-3.5">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                  Tersedia
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F26A12]" />
                  Hari Ini
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0B2559]" />
                  Dipilih
                </span>
              </div>

              {nextSuggestedSlotDate && (
                <button
                  type="button"
                  onClick={() => jumpToDate(nextSuggestedSlotDate)}
                  className="text-[11px] font-extrabold text-[#0062D1] hover:text-[#0B2559] hover:underline cursor-pointer"
                >
                  Slot terdekat:{" "}
                  {format(nextSuggestedSlotDate, "d MMM yyyy", { locale: idLocale })} →
                </button>
              )}
            </div>
          </div>

          {/* Right: Live Day Slots Panel */}
          <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl border border-[#E6DED4] shadow-xs overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="px-4 py-4 sm:px-5 sm:py-5 border-b border-[#F0EAE2] bg-gradient-to-r from-[#FBF6F1]/80 to-white flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C2530A]">
                    Jadwal Tanggal Terpilih
                  </span>
                  {isDateToday(activeCalendarDate) && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF4EC] border border-[#F26A12]/30 text-[10px] font-extrabold text-[#C2530A]">
                      Hari Ini
                    </span>
                  )}
                  {isDateTomorrow(activeCalendarDate) && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-extrabold text-[#0062D1]">
                      Besok
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0B2559] capitalize mt-0.5 leading-snug">
                  {format(activeCalendarDate, "EEEE, d MMMM yyyy", { locale: idLocale })}
                </h3>
              </div>

              <span
                className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-extrabold border ${
                  activeDaySlots.length > 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-zinc-50 text-zinc-500 border-zinc-200"
                }`}
              >
                {activeDaySlots.length} Slot
              </span>
            </div>

            {/* Panel Body */}
            <div className="p-4 sm:p-5 flex-1">
              {isSelectedCourseNonExecutive && selectedCourse ? (
                <div className="rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] p-5 text-center space-y-3">
                  <div className="mx-auto h-11 w-11 rounded-2xl bg-white border border-[#E6DED4] flex items-center justify-center text-[#0B2559]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-[#0B2559]">
                      Kelas Ini Tidak Menggunakan Sesi 1-on-1
                    </h4>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      <span className="font-bold text-[#0B2559]">{selectedCourse.title}</span>{" "}
                      termasuk{" "}
                      {isProCourse(selectedCourse)
                        ? "Paket Menengah (Live Zoom Cohort)"
                        : "Paket Bawah (Video & AI Speaking 24/7)"}
                      . Pilih kelas Paket Tinggi untuk booking 1-on-1.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {executiveCourses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSelectCourse(String(executiveCourses[0].id))}
                        className="px-3.5 py-2 rounded-xl bg-[#0B2559] hover:bg-[#133882] text-white text-xs font-bold transition cursor-pointer"
                      >
                        Pilih Kelas Executive →
                      </button>
                    )}
                    <Link
                      href={
                        isProCourse(selectedCourse)
                          ? "/dashboard/classroom?tab=live&c=all"
                          : "/dashboard/speaking"
                      }
                      className="px-3.5 py-2 rounded-xl bg-white border border-[#E6DED4] hover:border-[#0B2559]/40 text-[#0B2559] text-xs font-bold transition"
                    >
                      {isProCourse(selectedCourse) ? "Buka Live Zoom" : "Buka AI Speaking"}
                    </Link>
                  </div>
                </div>
              ) : activeDaySlots.length > 0 ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-0.5">
                  {activeDaySlots.map((slot) => {
                    const start = new Date(slot.startAt);
                    const end = new Date(slot.endAt);
                    const durationMins = Math.max(15, differenceInMinutes(end, start));
                    const mappedCourses =
                      instructorCourseMap.get(Number(slot.instructorId)) || [];
                    const displayCourseLabel =
                      selectedCourse && isExecutiveCourse(selectedCourse)
                        ? selectedCourse.title
                        : mappedCourses.length === 1
                        ? mappedCourses[0].title
                        : mappedCourses.length > 1
                        ? `${mappedCourses.length} Program Executive`
                        : "Executive 1-on-1";

                    return (
                      <div
                        key={slot.id}
                        className="group rounded-2xl border border-[#E6DED4] bg-white hover:border-[#F26A12]/70 hover:shadow-md hover:shadow-[#0B2559]/5 p-3.5 sm:p-4 transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <TrainerAvatar
                              src={slot.instructorAvatar}
                              name={slot.instructorName}
                              size="md"
                              ringClass="ring-2 ring-[#F0EAE2] group-hover:ring-[#F26A12]/40 transition"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-[#0B2559] truncate">
                                {slot.instructorName}
                              </p>
                              <p className="text-[11px] font-medium text-zinc-500 truncate mt-0.5">
                                {displayCourseLabel}
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 px-2 py-0.5 rounded-lg bg-[#FBF6F1] border border-[#E6DED4] text-[10px] font-bold text-zinc-600">
                            {durationMins} mnt
                          </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-[#F3ECE4] flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl">
                            <svg
                              className="w-3.5 h-3.5 text-emerald-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {format(start, "HH:mm")} – {format(end, "HH:mm")} WIB
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleChooseSlot(slot)}
                            className="px-4 py-2 rounded-xl bg-[#F26A12] hover:bg-[#D65507] text-white text-xs font-extrabold transition shadow-xs shadow-[#F26A12]/20 cursor-pointer shrink-0"
                          >
                            Booking →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#DFD5C8] bg-[#FBF6F1]/60 p-6 text-center space-y-3">
                  <div className="mx-auto h-11 w-11 rounded-2xl bg-white border border-[#E6DED4] flex items-center justify-center text-zinc-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-[#0B2559]">
                      Belum ada slot di tanggal ini
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {nextSuggestedSlotDate
                        ? "Pilih tanggal bertanda hijau di kalender atau langsung loncat ke slot terdekat."
                        : hasActiveFilter && allSlots.length > 0
                        ? "Tidak ada jadwal kosong untuk filter kelas/trainer saat ini."
                        : "Trainer belum membuka slot baru untuk periode ini. Cek kembali secara berkala ya!"}
                    </p>
                  </div>

                  {nextSuggestedSlotDate ? (
                    <button
                      type="button"
                      onClick={() => jumpToDate(nextSuggestedSlotDate)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <span>
                        Lihat Slot Terdekat (
                        {format(nextSuggestedSlotDate, "d MMM", { locale: idLocale })}) →
                      </span>
                    </button>
                  ) : hasActiveFilter && allSlots.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E6DED4] hover:border-[#0B2559]/40 text-[#0B2559] text-xs font-bold transition cursor-pointer"
                    >
                      Tampilkan Semua Kelas
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Panel Micro Policy Footer */}
            <div className="px-4 py-3 sm:px-5 bg-[#FBF6F1]/70 border-t border-[#F0EAE2] text-[11px] text-zinc-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[#F26A12] font-bold">•</span>
                <span>Bebas pilih mode Offline Tatap Muka atau Online Zoom</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#0073F5] font-bold">•</span>
                <span>Pembatalan gratis hingga 24 jam sebelum sesi dimulai</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. SESSION HISTORY SECTION — Filtered by Selected Course + Status */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#E6DED4] shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#F0EAE2] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#0B2559] font-[family-name:var(--font-heading)] flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0073F5]/10 text-[#0073F5]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                <span>Jadwal &amp; Riwayat Sesi Saya</span>
              </h2>

              {selectedCourse && (
                <button
                  type="button"
                  onClick={() => handleSelectCourse("")}
                  title="Hapus filter kelas"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0B2559]/8 hover:bg-[#0B2559]/15 text-[#0B2559] px-2.5 py-1 text-[11px] font-bold transition cursor-pointer max-w-[240px]"
                >
                  <span className="truncate">Kelas: {selectedCourse.title}</span>
                  <span className="font-extrabold">×</span>
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Sesi yang sudah diterima (
              <span className="font-semibold text-emerald-700">Diterima</span>) selalu diprioritaskan
              di urutan paling atas.
            </p>
          </div>

          {/* Status Filter Tabs */}
          {sessions.length > 0 && (
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1 p-1 bg-[#FBF6F1] border border-[#E6DED4]/80 rounded-xl text-xs font-bold w-full lg:w-auto">
              <button
                type="button"
                onClick={() => setHistoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  historyFilter === "all"
                    ? "bg-white text-[#0B2559] shadow-xs"
                    : "text-zinc-600 hover:text-[#0B2559]"
                }`}
              >
                Semua ({courseScopedSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("confirmed")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  historyFilter === "confirmed"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <span>Diterima</span>
                {confirmedCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      historyFilter === "confirmed"
                        ? "bg-white/25 text-white"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {confirmedCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("pending")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  historyFilter === "pending"
                    ? "bg-[#F26A12] text-white shadow-xs"
                    : "text-[#C2530A] hover:bg-[#FFF4EC]"
                }`}
              >
                <span>Pending</span>
                {pendingCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      historyFilter === "pending"
                        ? "bg-white/25 text-white"
                        : "bg-orange-100 text-[#C2530A]"
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("completed")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  historyFilter === "completed"
                    ? "bg-white text-[#0B2559] shadow-xs"
                    : "text-zinc-600 hover:text-[#0B2559]"
                }`}
              >
                Riwayat ({completedOrEndedCount})
              </button>
            </div>
          )}
        </div>

        {/* History List */}
        <div className="p-4 sm:p-6">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-[#DFD5C8] bg-[#FBF6F1]/50 space-y-2">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-white border border-[#E6DED4] flex items-center justify-center text-zinc-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-extrabold text-[#0B2559]">
                Belum ada riwayat sesi privat
              </p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Pilih tanggal bertanda hijau di kalender atas untuk membooking sesi privat 1-on-1
                pertamamu bersama trainer.
              </p>
            </div>
          ) : courseScopedSessions.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl border border-[#E6DED4] bg-[#FBF6F1]/50 space-y-3">
              <p className="text-sm font-bold text-[#0B2559]">
                Belum ada sesi privat untuk kelas{" "}
                <span className="text-[#C2530A]">{selectedCourse?.title || "terpilih"}</span>.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-white border border-[#E6DED4] hover:border-[#0B2559]/40 text-xs font-bold text-[#0B2559] transition cursor-pointer"
              >
                Tampilkan Semua Kelas
              </button>
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl border border-[#E6DED4] bg-[#FBF6F1]/50 space-y-3">
              <p className="text-sm font-semibold text-zinc-600">
                Tidak ada sesi dengan status yang dipilih.
              </p>
              <button
                type="button"
                onClick={() => setHistoryFilter("all")}
                className="px-4 py-2 rounded-xl bg-white border border-[#E6DED4] hover:border-[#0B2559]/40 text-xs font-bold text-[#0B2559] transition cursor-pointer"
              >
                Lihat Semua Status
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {sortedSessions.map((sess) => {
                const start = sess.startAt ? new Date(sess.startAt) : new Date(nowMs);
                const end = sess.endAt
                  ? new Date(sess.endAt)
                  : new Date(start.getTime() + 60 * 60 * 1000);

                const isConfirmed = sess.status === "confirmed";
                const hasStarted = nowMs >= start.getTime() - 10 * 60 * 1000;
                const hasEnded = nowMs > end.getTime();
                const canJoinZoom = isConfirmed && hasStarted && !hasEnded;

                const hoursDiff = (start.getTime() - nowMs) / (1000 * 60 * 60);
                const canCancel =
                  sess.status === "pending" || (isConfirmed && !hasEnded && hoursDiff >= 24);
                const isOffline = sess.sessionType === "offline";
                const statusMeta = getStatusMeta(sess.status);

                return (
                  <article
                    key={sess.id}
                    className={`relative rounded-2xl overflow-hidden transition-all border ${
                      isConfirmed
                        ? "border-emerald-300 bg-gradient-to-r from-emerald-50/35 via-white to-white shadow-sm"
                        : "border-[#E6DED4] bg-white hover:border-[#D5C9B8]"
                    }`}
                  >
                    {/* Left status strip */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusMeta.accent}`}
                    />

                    <div className="pl-5 pr-4 py-4 sm:pl-6 sm:pr-5 sm:py-5 space-y-3.5">
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <TrainerAvatar
                            src={sess.instructorAvatar}
                            name={sess.instructorName}
                            size="lg"
                            ringClass={
                              isConfirmed
                                ? "ring-2 ring-emerald-400"
                                : "ring-2 ring-[#F0EAE2]"
                            }
                          />
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-extrabold text-[#0B2559] truncate">
                              {sess.instructorName}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleSelectCourse(String(sess.courseId))}
                              title="Filter berdasarkan kelas ini"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0062D1] hover:underline truncate max-w-full mt-0.5 cursor-pointer"
                            >
                              <span>{sess.courseTitle}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${
                              isOffline
                                ? "bg-[#FFF4EC] text-[#C2530A] border-[#F26A12]/30"
                                : "bg-blue-50 text-[#0062D1] border-blue-200"
                            }`}
                          >
                            <span>{isOffline ? "Offline Tatap Muka" : "Online Zoom"}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${statusMeta.pill}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                            <span>{statusMeta.label}</span>
                          </span>
                        </div>
                      </div>

                      {/* Middle Details + Right Actions */}
                      <div className="flex flex-col md:flex-row gap-3.5 items-stretch md:items-center">
                        <div className="flex-1 min-w-0 rounded-xl bg-[#FBF6F1]/75 border border-[#EFE7DC] p-3.5 space-y-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#0B2559]">
                            <svg
                              className={`w-4 h-4 shrink-0 ${
                                isConfirmed ? "text-emerald-600" : "text-[#0073F5]"
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="capitalize">
                              {format(start, "EEEE, d MMM yyyy • HH:mm", { locale: idLocale })}
                              {sess.endAt ? ` – ${format(end, "HH:mm")}` : ""} WIB
                            </span>
                          </div>

                          {sess.topic && (
                            <p className="text-xs text-zinc-700 leading-relaxed">
                              <span className="font-bold text-zinc-500">Topik:</span> {sess.topic}
                            </p>
                          )}

                          {/* Offline Location Box */}
                          {isOffline && sess.locationName && (
                            <div className="mt-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-0.5">
                              <div className="font-extrabold text-amber-950">
                                Titik Pertemuan: {sess.locationName}
                              </div>
                              {sess.locationAddress && (
                                <p className="text-amber-900/85">{sess.locationAddress}</p>
                              )}
                              {sess.locationNotes && (
                                <p className="text-amber-800 italic text-[11px] pt-0.5">
                                  Catatan: &ldquo;{sess.locationNotes}&rdquo;
                                </p>
                              )}
                            </div>
                          )}

                          {/* Confirmed Helper Banner */}
                          {isConfirmed && !hasEnded && (
                            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 font-medium">
                              <svg
                                className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.2"
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                {isOffline
                                  ? "Sesi Tatap Muka telah disetujui trainer. Harap hadir di titik pertemuan 10 menit sebelum jadwal dimulai."
                                  : canJoinZoom
                                  ? "Sesi sedang berlangsung! Klik tombol Gabung Zoom untuk masuk."
                                  : "Sesi diterima trainer. Tombol Gabung Zoom aktif otomatis 10 menit sebelum jadwal dimulai."}
                              </span>
                            </div>
                          )}

                          {sess.rejectReason && (
                            <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200/80">
                              <span className="font-bold">
                                {sess.status === "cancelled"
                                  ? "Alasan Pembatalan:"
                                  : "Alasan Penolakan:"}
                              </span>{" "}
                              {sess.rejectReason}
                            </p>
                          )}

                          {sess.instructorNotes && (
                            <p className="text-xs text-[#0B2559] bg-blue-50/80 p-2.5 rounded-xl border border-blue-200/70">
                              <span className="font-bold">Catatan Trainer:</span>{" "}
                              {sess.instructorNotes}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {(isOffline && sess.locationMapsUrl) ||
                        (!isOffline && canJoinZoom) ||
                        canCancel ? (
                          <div className="flex flex-row md:flex-col gap-2 w-full md:w-44 shrink-0 justify-end md:justify-center">
                            {isOffline && sess.locationMapsUrl && (
                              <a
                                href={sess.locationMapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] text-white text-xs font-bold text-center transition shadow-xs"
                              >
                                Buka Google Maps ↗
                              </a>
                            )}

                            {!isOffline && canJoinZoom && (
                              <a
                                href={sess.zoomLink || sess.instructorZoomLink || "#"}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                  if (!sess.zoomLink && !sess.instructorZoomLink) {
                                    e.preventDefault();
                                    toast.warning(
                                      "Link Zoom belum tersedia. Trainer akan segera menyediakannya."
                                    );
                                  }
                                }}
                                className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition shadow-sm shadow-emerald-600/20"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>Gabung Zoom</span>
                              </a>
                            )}

                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => cancelSession(sess.id)}
                                className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                              >
                                Batalkan Sesi
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. FOCUSED BOOKING CONFIRMATION MODAL (Portal) */}
      {isMounted &&
        selectedSlot &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-5 bg-[#0B2559]/55 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isBookingSubmitting) {
                resetBookingModal();
              }
            }}
          >
            <div className="bg-[#FBF6F1] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden border border-[#E6DED4]">
              {/* Sticky Top Header */}
              <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-[#E6DED4] bg-white flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <TrainerAvatar
                    src={selectedSlot.instructorAvatar}
                    name={selectedSlot.instructorName}
                    size="md"
                    ringClass="ring-2 ring-[#F26A12]/40"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-extrabold text-[#0B2559] truncate leading-tight">
                      Booking Sesi: {selectedSlot.instructorName}
                    </h3>
                    <p className="text-[11px] sm:text-xs font-bold text-[#C2530A] truncate mt-0.5 capitalize">
                      {format(new Date(selectedSlot.startAt), "EEEE, d MMM yyyy • HH:mm", {
                        locale: idLocale,
                      })}{" "}
                      – {format(new Date(selectedSlot.endAt), "HH:mm")} WIB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBookingSubmitting}
                  onClick={resetBookingModal}
                  aria-label="Tutup modal"
                  className="p-2 text-zinc-400 hover:text-[#0B2559] hover:bg-[#FBF6F1] rounded-xl transition cursor-pointer shrink-0 disabled:opacity-40"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Scrollable Body */}
              {(() => {
                const instructorCourses = learnerCourses.filter(
                  (c) =>
                    Number(c.instructorId) === Number(selectedSlot.instructorId) &&
                    isExecutiveCourse(c)
                );
                const selectedCourseObj = learnerCourses.find(
                  (c) => String(c.id) === String(courseId)
                );
                const selectedCourseQuota = selectedCourseObj
                  ? getCourseQuota(selectedCourseObj, sessions)
                  : null;
                const allInstructorCoursesExhausted =
                  instructorCourses.length > 0 &&
                  instructorCourses.every((c) => getCourseQuota(c, sessions).isExhausted);
                const canBookCourse =
                  Boolean(selectedCourseObj) &&
                  Boolean(selectedCourseQuota && !selectedCourseQuota.isExhausted);
                const canBookOffline = canBookCourse && isExecutiveCourse(selectedCourseObj);

                return (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-stretch">
                        {/* Left Column */}
                        <div className="md:col-span-7 space-y-4">
                          {/* Step 1 & 2 Card */}
                          <div className="bg-white rounded-2xl p-4 border border-[#E6DED4] shadow-2xs space-y-4">
                            <div>
                              <label className="block text-[11px] font-extrabold text-[#0B2559] mb-2 uppercase tracking-wider">
                                1. Program Kelas Paket Tinggi
                              </label>

                              {instructorCourses.length === 0 ? (
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                                  Trainer ini tidak terhubung dengan kelas Paket Tinggi aktifmu.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {instructorCourses.map((c) => {
                                    const quota = getCourseQuota(c, sessions);
                                    const isChecked =
                                      String(courseId) === String(c.id) && !quota.isExhausted;
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        disabled={quota.isExhausted}
                                        onClick={() => {
                                          if (quota.isExhausted) return;
                                          setCourseId(String(c.id));
                                        }}
                                        className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-2.5 ${
                                          quota.isExhausted
                                            ? "bg-zinc-100 border-zinc-200 opacity-70 cursor-not-allowed"
                                            : isChecked
                                            ? "bg-[#FFF4EC]/80 border-[#F26A12] ring-2 ring-[#F26A12]/20 cursor-pointer"
                                            : "bg-[#FBF6F1]/50 border-[#E6DED4] hover:border-[#0B2559]/35 cursor-pointer"
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-extrabold text-[#0B2559] leading-snug break-words">
                                            {c.title}
                                          </div>
                                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <span className="text-[10px] font-semibold text-[#C2530A]">
                                              Executive • Offline &amp; Online
                                            </span>
                                            <span
                                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                quota.isExhausted
                                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                              }`}
                                            >
                                              {quota.isExhausted
                                                ? `Kuota Habis (${quota.used}/${quota.max})`
                                                : `Sisa ${quota.remaining} / ${quota.max} Tiket`}
                                            </span>
                                          </div>
                                        </div>
                                        <span
                                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold ${
                                            quota.isExhausted
                                              ? "bg-zinc-200 border-zinc-300 text-zinc-400"
                                              : isChecked
                                              ? "bg-[#F26A12] border-[#F26A12] text-white"
                                              : "bg-white border-zinc-300 text-transparent"
                                          }`}
                                        >
                                          {quota.isExhausted ? "✕" : "✓"}
                                        </span>
                                      </button>
                                    );
                                  })}

                                  {allInstructorCoursesExhausted && (
                                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700">
                                      Kuota tiket sesi privat untuk program pada trainer ini sudah
                                      habis. Batalkan sesi pending jika ingin menjadwalkan ulang.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Step 2: Meeting Mode */}
                            <div>
                              <label className="block text-[11px] font-extrabold text-[#0B2559] mb-2 uppercase tracking-wider">
                                2. Metode Pertemuan
                              </label>
                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  type="button"
                                  disabled={!canBookOffline}
                                  onClick={() => {
                                    if (canBookOffline) {
                                      setSessionType("offline");
                                      if (!locationName) handleSelectPreset("hub_menteng");
                                    }
                                  }}
                                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                                    !canBookOffline
                                      ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-75"
                                      : sessionType === "offline"
                                      ? "bg-[#F26A12] border-[#C2530A] text-white shadow-sm cursor-pointer"
                                      : "bg-white border-[#E6DED4] text-[#0B2559] hover:border-[#F26A12]/50 cursor-pointer"
                                  }`}
                                >
                                  <div className="text-xs font-extrabold">Offline Tatap Muka</div>
                                  <p
                                    className={`text-[10px] mt-0.5 leading-tight ${
                                      !canBookOffline
                                        ? "text-zinc-400"
                                        : sessionType === "offline"
                                        ? "text-orange-100"
                                        : "text-zinc-500"
                                    }`}
                                  >
                                    Atur Lokasi Kafe / Hub
                                  </p>
                                </button>

                                <button
                                  type="button"
                                  disabled={!canBookCourse}
                                  onClick={() => {
                                    if (canBookCourse) setSessionType("online");
                                  }}
                                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                                    !canBookCourse
                                      ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-75"
                                      : sessionType === "online"
                                      ? "bg-[#0B2559] border-[#0B2559] text-white shadow-sm cursor-pointer"
                                      : "bg-white border-[#E6DED4] text-[#0B2559] hover:border-[#0B2559]/40 cursor-pointer"
                                  }`}
                                >
                                  <div className="text-xs font-extrabold">Online 1-on-1</div>
                                  <p
                                    className={`text-[10px] mt-0.5 leading-tight ${
                                      sessionType === "online" ? "text-blue-200" : "text-zinc-500"
                                    }`}
                                  >
                                    Video Call Privat Zoom
                                  </p>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Step 3: Offline Location Config */}
                          {sessionType === "offline" && (
                            <div className="bg-white rounded-2xl p-4 border border-amber-200/90 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-extrabold text-[#0B2559] uppercase tracking-wider">
                                  3. Lokasi Pertemuan Offline
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF4EC] text-[#C2530A] border border-[#F26A12]/25">
                                  Executive 1-on-1
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                {VERIFIED_LOCATION_PRESETS.map((preset) => (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handleSelectPreset(preset.id)}
                                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                                      locationPreset === preset.id
                                        ? "bg-[#0B2559] text-white border-[#0B2559] shadow-2xs"
                                        : "bg-[#FBF6F1]/70 text-[#0B2559] border-[#E6DED4] hover:bg-amber-50/50"
                                    }`}
                                  >
                                    <div className="text-[11px] font-extrabold truncate">
                                      {preset.label}
                                    </div>
                                    <div
                                      className={`text-[10px] truncate ${
                                        locationPreset === preset.id
                                          ? "text-blue-200"
                                          : "text-zinc-500"
                                      }`}
                                    >
                                      {preset.subLabel}
                                    </div>
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleSelectPreset("custom")}
                                  className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                                    locationPreset === "custom"
                                      ? "bg-[#F26A12] text-white border-[#C2530A] shadow-2xs"
                                      : "bg-[#FBF6F1]/70 text-[#0B2559] border-[#E6DED4] hover:bg-amber-50/50"
                                  }`}
                                >
                                  <div className="text-[11px] font-extrabold truncate">
                                    Lokasi Kustom
                                  </div>
                                  <div
                                    className={`text-[10px] truncate ${
                                      locationPreset === "custom"
                                        ? "text-orange-100"
                                        : "text-zinc-500"
                                    }`}
                                  >
                                    Kafe / Kantor Sendiri
                                  </div>
                                </button>
                              </div>

                              <div className="space-y-2.5 pt-1">
                                <div>
                                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                                    Nama Kafe / Coworking / Kantor *
                                  </label>
                                  <input
                                    type="text"
                                    value={locationName}
                                    onChange={(e) => {
                                      setLocationPreset("custom");
                                      setLocationName(e.target.value);
                                    }}
                                    placeholder="Contoh: Starbucks Reserve Senopati / Menara BCA"
                                    className="input w-full text-xs bg-[#FBF6F1]/40 focus:bg-white border-[#E6DED4] rounded-xl py-2 px-3"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                                    Alamat Lengkap *
                                  </label>
                                  <input
                                    type="text"
                                    value={locationAddress}
                                    onChange={(e) => {
                                      setLocationPreset("custom");
                                      setLocationAddress(e.target.value);
                                    }}
                                    placeholder="Contoh: Jl. Senopati No. 45, Jakarta Selatan"
                                    className="input w-full text-xs bg-[#FBF6F1]/40 focus:bg-white border-[#E6DED4] rounded-xl py-2 px-3"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-zinc-600">
                                      Link Google Maps (Opsional)
                                    </label>
                                    {locationMapsUrl && (
                                      <a
                                        href={locationMapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] font-bold text-[#C2530A] hover:underline"
                                      >
                                        Pratinjau Peta ↗
                                      </a>
                                    )}
                                  </div>
                                  <input
                                    type="url"
                                    value={locationMapsUrl}
                                    onChange={(e) => setLocationMapsUrl(e.target.value)}
                                    placeholder="Kosongkan agar dibuat otomatis dari alamat"
                                    className="input w-full text-xs bg-[#FBF6F1]/40 focus:bg-white border-[#E6DED4] rounded-xl py-2 px-3"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                                    Catatan Titik Temu untuk Trainer
                                  </label>
                                  <input
                                    type="text"
                                    value={locationNotes}
                                    onChange={(e) => setLocationNotes(e.target.value)}
                                    placeholder="Misal: Duduk di lantai 2 dekat jendela, bawa laptop"
                                    className="input w-full text-xs bg-[#FBF6F1]/40 focus:bg-white border-[#E6DED4] rounded-xl py-2 px-3"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Topic & Guarantee */}
                        <div className="md:col-span-5 flex flex-col gap-4">
                          <div className="bg-white rounded-2xl p-4 border border-[#E6DED4] shadow-2xs flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                              <label className="block text-[11px] font-extrabold text-[#0B2559] uppercase tracking-wider">
                                Fokus &amp; Topik Diskusi *
                              </label>

                              <div className="flex flex-wrap gap-1.5">
                                {TOPIC_PRESETS.map((presetTopic) => (
                                  <button
                                    key={presetTopic}
                                    type="button"
                                    onClick={() => setTopic(presetTopic)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                      topic === presetTopic
                                        ? "bg-[#0B2559] text-white border-[#0B2559]"
                                        : "bg-[#FBF6F1] text-zinc-600 border-[#E6DED4] hover:border-[#0B2559]/40"
                                    }`}
                                  >
                                    + {presetTopic}
                                  </button>
                                ))}
                              </div>

                              <textarea
                                className="input w-full bg-[#FBF6F1]/40 focus:bg-white border-[#E6DED4] focus:border-[#F26A12] rounded-xl min-h-[120px] sm:min-h-[155px] py-2.5 px-3 resize-none text-xs leading-relaxed"
                                placeholder="Jelaskan target karier atau materi spesifik yang ingin kamu latih bersama trainer..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                              />
                            </div>

                            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-[#0B2559] space-y-1.5">
                              <div className="font-extrabold">Jaminan Sesi Executive:</div>
                              <ul className="space-y-1 text-zinc-600">
                                <li>✓ Sesi privat 1-on-1 fokus penuh pada targetmu</li>
                                <li>
                                  ✓{" "}
                                  {sessionType === "offline"
                                    ? "Trainer hadir di titik lokasi pilihanmu"
                                    : "Link Zoom aktif otomatis 10 menit sebelum sesi"}
                                </li>
                                <li>
                                  ✓ Memakai 1 tiket dari kuota {selectedCourseQuota?.max ?? 4} sesi
                                  program
                                </li>
                                <li>✓ Feedback langsung pelafalan, struktur &amp; kepercayaan diri</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sticky Bottom Action Footer */}
                    <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-t border-[#E6DED4] bg-white flex items-center justify-between gap-3 shrink-0">
                      <button
                        type="button"
                        disabled={isBookingSubmitting}
                        onClick={resetBookingModal}
                        className="px-4 py-2.5 rounded-xl border border-[#E6DED4] bg-white text-zinc-600 hover:bg-[#FBF6F1] font-bold text-xs transition cursor-pointer shrink-0 disabled:opacity-40"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={
                          isBookingSubmitting || !courseId || !topic.trim() || !canBookCourse
                        }
                        onClick={bookSlot}
                        className={`flex-1 py-2.5 sm:py-3 px-4 rounded-xl text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          sessionType === "offline"
                            ? "bg-[#F26A12] hover:bg-[#D65507] shadow-orange-500/20"
                            : "bg-[#0B2559] hover:bg-[#133882] shadow-blue-900/20"
                        }`}
                      >
                        {isBookingSubmitting
                          ? "Memproses Booking..."
                          : sessionType === "offline"
                          ? "Konfirmasi Booking Sesi Offline"
                          : "Konfirmasi Booking Sesi Online"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
