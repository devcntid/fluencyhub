"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import { useConfirm, useToast } from "@/components/ui/NotificationProvider";

export default function PrivateSessionsPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [instructors, setInstructors] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [learnerCourses, setLearnerCourses] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"all" | "confirmed" | "pending" | "completed">("all");

  // Horizontal Scroll for Instructor Filter
  const instructorScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  const checkScroll = useCallback(() => {
    if (!instructorScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = instructorScrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const scrollInstructors = (direction: "left" | "right") => {
    const el = instructorScrollRef.current;
    if (!el) return;

    const items = Array.from(el.children) as HTMLElement[];
    if (items.length === 0) return;

    const containerLeft = el.getBoundingClientRect().left;

    if (direction === "right") {
      const target = items.find((item) => {
        const itemLeft = item.getBoundingClientRect().left - containerLeft;
        return itemLeft > 25;
      });
      if (target) {
        const targetScrollLeft = el.scrollLeft + (target.getBoundingClientRect().left - containerLeft);
        el.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
        return;
      }
    } else {
      const reversed = [...items].reverse();
      const target = reversed.find((item) => {
        const itemLeft = item.getBoundingClientRect().left - containerLeft;
        return itemLeft < -25;
      });
      if (target) {
        const targetScrollLeft = el.scrollLeft + (target.getBoundingClientRect().left - containerLeft);
        el.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: "smooth" });
        return;
      }
    }

    const fallbackAmount = Math.max(140, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === "left" ? -fallbackAmount : fallbackAmount,
      behavior: "smooth",
    });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!instructorScrollRef.current) return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - instructorScrollRef.current.offsetLeft;
    scrollLeftStart.current = instructorScrollRef.current.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !instructorScrollRef.current) return;
    const x = e.pageX - instructorScrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(x - startX.current) > 6) {
      hasMoved.current = true;
    }
    instructorScrollRef.current.scrollLeft = scrollLeftStart.current - walk;
    checkScroll();
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScroll();
    }, 150);
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [instructors, checkScroll]);

  useEffect(() => {
    const el = instructorScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        checkScroll();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [instructors, checkScroll]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  // Booking Form State
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [topic, setTopic] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCalendarDate) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCalendarDate]);

  async function fetchData() {
    setLoading(true);
    try {
      const [instRes, sessRes, slotsRes] = await Promise.all([
        fetch("/api/private-sessions/instructors").then(r => r.json()),
        fetch("/api/private-sessions").then(r => r.json()),
        fetch("/api/private-sessions/slots").then(r => r.json())
      ]);
      if (instRes.data) setInstructors(instRes.data);
      if (sessRes.data) setSessions(sessRes.data);
      if (slotsRes.data) setAllSlots(slotsRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function fetchCourses() {
    try {
      const res = await fetch("/api/private-sessions/courses");
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        setLearnerCourses(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function bookSlot() {
    if (!selectedSlot || !topic || !courseId) {
      alert("Please select a course and enter a topic first.");
      return;
    }
    try {
      const res = await fetch("/api/private-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          instructorId: selectedSlot.instructorId,
          courseId,
          topic
        })
      });
      const json = await res.json();
      if (res.ok) {
        alert("Booking request submitted! Waiting for instructor approval.");
        setSelectedSlot(null);
        setSelectedCalendarDate(null);
        setTopic("");
        setCourseId("");
        fetchData();
      } else {
        alert(json.error || "Failed to book session");
      }
    } catch (e) {
      alert("A network error occurred.");
    }
  }

  async function cancelSession(sessionId: number) {
    const ok = await confirm({
      title: "Batalkan Sesi Privat?",
      message: "Apakah Anda yakin ingin membatalkan sesi privat ini? Jadwal akan kembali dibuka untuk dipilih.",
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
        fetchData();
      } else {
        toast.error(json.error || "Gagal membatalkan sesi.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    }
  }

  // Calendar Logic
  const filteredSlots = selectedInstructorId 
    ? allSlots.filter(s => String(s.instructorId) === String(selectedInstructorId)) 
    : allSlots;

  const groupedSlots = filteredSlots.reduce((acc, slot) => {
    const dateStr = format(new Date(slot.startAt), "yyyy-MM-dd");
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(slot);
    return acc;
  }, {} as Record<string, any[]>);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  function nextMonth() { setCurrentMonth(addMonths(currentMonth, 1)); }
  function prevMonth() { setCurrentMonth(subMonths(currentMonth, 1)); }

  if (!isMounted) return <div className="p-8 text-center text-zinc-500 animate-pulse font-medium">Loading page...</div>;
  if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse font-medium">Loading instructor schedule...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 flex flex-col">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-[family-name:var(--font-heading)] mb-2 bg-gradient-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent">
          Book Private Session
        </h1>
        <p className="text-zinc-500 text-xs sm:text-sm">Find and book 1-on-1 private sessions with instructors from your enrolled courses.</p>
      </div>

      <div className="flex flex-col gap-6 sm:gap-8 items-stretch">
        {/* Calendar Booking Section */}
        <div className="card p-0 shadow-sm border border-zinc-200/60 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-xl w-full">
          <div className="p-3.5 sm:p-6 border-b border-zinc-100 bg-white/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Instructor Schedule
            </h2>
            
            {instructors.length > 0 && (
              <div className="relative flex-1 min-w-0 max-w-full flex items-center gap-1.5 sm:gap-2">
                {(canScrollLeft || canScrollRight) && (
                  <button
                    type="button"
                    onClick={() => scrollInstructors("left")}
                    disabled={!canScrollLeft}
                    title="Scroll left"
                    aria-label="Scroll left"
                    className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center bg-white text-zinc-700 border border-zinc-200 rounded-xl shadow-sm transition-all ${
                      canScrollLeft
                        ? "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 active:scale-95 cursor-pointer"
                        : "opacity-30 cursor-not-allowed pointer-events-none"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                <div 
                  ref={instructorScrollRef}
                  onScroll={checkScroll}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  className="flex-1 min-w-0 flex overflow-x-auto py-1 px-1 gap-2 scroll-smooth hide-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (hasMoved.current) return;
                      setSelectedInstructorId("");
                    }}
                    className={`shrink-0 snap-start px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                      selectedInstructorId === ""
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    All My Instructors
                  </button>
                  {instructors.map((inst) => (
                    <button
                      key={inst.instructorId}
                      type="button"
                      onClick={() => {
                        if (hasMoved.current) return;
                        setSelectedInstructorId(String(inst.instructorId));
                      }}
                      className={`shrink-0 snap-start px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                        selectedInstructorId === String(inst.instructorId)
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {inst.instructorName}
                    </button>
                  ))}
                </div>

                {(canScrollLeft || canScrollRight) && (
                  <button
                    type="button"
                    onClick={() => scrollInstructors("right")}
                    disabled={!canScrollRight}
                    title="Scroll right"
                    aria-label="Scroll right"
                    className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center bg-white text-zinc-700 border border-zinc-200 rounded-xl shadow-sm transition-all ${
                      canScrollRight
                        ? "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 active:scale-95 cursor-pointer"
                        : "opacity-30 cursor-not-allowed pointer-events-none"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />
        
          {instructors.length === 0 ? (
            <div className="p-8">
              <div className="text-center py-10 px-4 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-sm font-medium">
                You haven&apos;t enrolled in any courses yet. Enroll in a course to book private sessions with instructors.
              </div>
            </div>
          ) : (
            <div className="p-1 sm:p-4 md:p-6 bg-zinc-50/30 sm:bg-zinc-50/50">
              <div className="bg-white rounded-xl sm:rounded-3xl border border-zinc-200/80 overflow-hidden shadow-xs w-full">
                <div className="flex items-center justify-between p-3.5 sm:p-5 md:p-6 border-b border-zinc-100 bg-zinc-50/80">
                  <h3 className="font-extrabold text-zinc-800 text-base sm:text-xl md:text-2xl capitalize">{format(currentMonth, "MMMM yyyy", { locale: enUS })}</h3>
                  <div className="flex gap-2 sm:gap-3">
                    <button className="p-2 md:p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-xs" onClick={prevMonth}>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button className="p-2 md:p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-xs" onClick={nextMonth}>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 border-b border-zinc-100 bg-white">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                    <div key={d} className="py-2.5 text-center text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider">{d}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 bg-zinc-200 gap-px">
                  {calendarDays.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const daySlots = groupedSlots[dateStr] || [];
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <button 
                        key={day.toISOString()}
                        onClick={() => setSelectedCalendarDate(day)}
                        className={`min-h-[48px] sm:min-h-[55px] md:min-h-[64px] p-1 sm:p-1.5 md:p-2 flex flex-col justify-center items-center hover:bg-blue-50 transition-colors ${!isCurrentMonth ? 'bg-zinc-50/80 opacity-60' : 'bg-white'}`}
                      >
                        <span className={`text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30' : 'text-zinc-700'} ${daySlots.length > 0 ? 'mb-0.5' : ''}`}>
                          {format(day, "d")}
                        </span>
                        {daySlots.length > 0 ? (
                          <div className="w-full mt-0.5">
                            <div className="bg-emerald-100 text-emerald-800 text-[8px] sm:text-[9px] px-0.5 sm:px-1 py-0.5 rounded font-bold w-full text-center truncate shadow-2xs border border-emerald-200/60 leading-none sm:leading-normal">
                              <span className="sm:hidden">{daySlots.length} Free</span>
                              <span className="hidden sm:inline">{daySlots.length} Slots</span>
                            </div>
                          </div>
                        ) : (
                          day >= new Date(new Date().setHours(0,0,0,0)) && (
                            <div className="w-full mt-0.5">
                              <div className="bg-zinc-100 text-zinc-500 text-[8px] sm:text-[9px] px-0.5 sm:px-1 py-0.5 rounded font-bold w-full text-center truncate shadow-2xs border border-zinc-200/60 leading-none sm:leading-normal">
                                <span className="sm:hidden">Full</span>
                                <span className="hidden sm:inline">Booked</span>
                              </div>
                            </div>
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Session History Section */}
        {(() => {
          const confirmedCount = sessions.filter(s => s.status === 'confirmed').length;
          const pendingCount = sessions.filter(s => s.status === 'pending').length;

          const filteredSessions = sessions.filter(s => {
            if (historyFilter === "confirmed") return s.status === "confirmed";
            if (historyFilter === "pending") return s.status === "pending";
            if (historyFilter === "completed") return s.status === "completed" || s.status === "rejected" || s.status === "cancelled";
            return true;
          });

          // Prioritaskan yang diterima (confirmed) di paling atas
          const sortedSessions = [...filteredSessions].sort((a, b) => {
            const rank: Record<string, number> = {
              confirmed: 1, // Diterima: Prioritas #1
              pending: 2,   // Menunggu konfirmasi
              completed: 3, // Selesai
              rejected: 4,  // Ditolak
              cancelled: 5, // Dibatalkan
            };
            const rA = rank[a.status] ?? 99;
            const rB = rank[b.status] ?? 99;
            if (rA !== rB) return rA - rB;

            const timeA = a.startAt ? new Date(a.startAt).getTime() : 0;
            const timeB = b.startAt ? new Date(b.startAt).getTime() : 0;
            const now = Date.now();

            if (a.status === "confirmed" && b.status === "confirmed") {
              const isUpcomingA = timeA >= now - 60 * 60 * 1000;
              const isUpcomingB = timeB >= now - 60 * 60 * 1000;
              if (isUpcomingA && !isUpcomingB) return -1;
              if (!isUpcomingA && isUpcomingB) return 1;
              if (isUpcomingA && isUpcomingB) return timeA - timeB;
              return timeB - timeA;
            }

            return timeB - timeA;
          });

          return (
            <div className="card p-0 shadow-sm border border-zinc-200/60 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-xl w-full">
              <div className="p-6 border-b border-zinc-100 bg-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 font-[family-name:var(--font-heading)]">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>My Session History</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Sesi yang diterima (<span className="text-emerald-600 font-bold">Confirmed</span>) diprioritaskan di urutan paling atas.
                  </p>
                </div>

                {sessions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setHistoryFilter("all")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        historyFilter === "all"
                          ? "bg-white text-zinc-900 shadow-xs font-bold"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      Semua ({sessions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter("confirmed")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        historyFilter === "confirmed"
                          ? "bg-emerald-600 text-white shadow-xs font-bold"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <span>Diterima</span>
                      {confirmedCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          historyFilter === "confirmed" ? "bg-white text-emerald-700" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {confirmedCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter("pending")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        historyFilter === "pending"
                          ? "bg-amber-500 text-white shadow-xs font-bold"
                          : "text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      <span>Pending</span>
                      {pendingCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          historyFilter === "pending" ? "bg-white text-amber-700" : "bg-amber-100 text-amber-800"
                        }`}>
                          {pendingCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter("completed")}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        historyFilter === "completed"
                          ? "bg-white text-zinc-900 shadow-xs font-bold"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      Riwayat Lampau
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                {sessions.length === 0 ? (
                  <div className="text-center py-10 px-4 border-2 border-dashed border-zinc-200 rounded-2xl">
                    <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    <p className="text-sm font-medium text-zinc-500">You have no private session history yet.</p>
                  </div>
                ) : sortedSessions.length === 0 ? (
                  <div className="text-center py-8 px-4 border border-zinc-200 rounded-2xl bg-zinc-50/50">
                    <p className="text-sm font-medium text-zinc-500">
                      Tidak ada sesi dengan status &quot;{historyFilter}&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedSessions.map(sess => {
                      const now = new Date();
                      const start = sess.startAt ? new Date(sess.startAt) : new Date();
                      const end = sess.endAt ? new Date(sess.endAt) : new Date(start.getTime() + 60 * 60 * 1000);
                      
                      const isConfirmed = sess.status === 'confirmed';
                      const hasStarted = now.getTime() >= (start.getTime() - 10 * 60 * 1000);
                      const hasEnded = now.getTime() > end.getTime();
                      const canJoinZoom = isConfirmed && hasStarted && !hasEnded;
                      
                      const hoursDiff = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
                      const canCancel = sess.status === 'pending' || (isConfirmed && !hasEnded && hoursDiff >= 24);

                      return (
                        <div
                          key={sess.id}
                          className={`rounded-2xl p-5 transition-all ${
                            isConfirmed
                              ? "border-2 border-emerald-300 bg-gradient-to-r from-emerald-50/30 via-white to-white shadow-sm hover:shadow-md ring-1 ring-emerald-200/70"
                              : "border border-zinc-200 bg-white shadow-sm hover:shadow-md"
                          }`}
                        >
                          {/* Top: Instructor Info & Status */}
                          <div className="flex items-center gap-3.5 mb-3.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={sess.instructorAvatar || "https://i.pravatar.cc/80?img=15"}
                              alt=""
                              className={`w-11 h-11 rounded-full object-cover shrink-0 ${
                                isConfirmed ? "ring-2 ring-emerald-400" : "ring-2 ring-zinc-100"
                              }`}
                            />
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <h3 className="font-bold text-zinc-900 text-base">{sess.instructorName}</h3>
                              {sess.status === 'pending' && (
                                <span className="badge bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                  Menunggu Konfirmasi
                                </span>
                              )}
                              {isConfirmed && (
                                <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Diterima / Confirmed
                                </span>
                              )}
                              {sess.status === 'rejected' && (
                                <span className="badge bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  Ditolak
                                </span>
                              )}
                              {sess.status === 'cancelled' && (
                                <span className="badge bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  Dibatalkan
                                </span>
                              )}
                              {sess.status === 'completed' && (
                                <span className="badge bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  Selesai
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bottom: Date Card & Action Button */}
                          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                            <div className="flex-1 min-w-0 bg-zinc-50 p-4 rounded-xl relative overflow-hidden border border-zinc-100">
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isConfirmed ? "bg-emerald-500" : "bg-zinc-300"}`} />
                              <p className="font-bold text-zinc-800 text-sm flex items-center gap-1.5 mb-1.5">
                                <svg className={`w-4 h-4 ${isConfirmed ? "text-emerald-600" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <span>{format(start, "EEEE, d MMM yyyy • HH:mm", { locale: enUS })}{sess.endAt ? ` - ${format(end, "HH:mm")}` : ""}</span>
                              </p>
                              <p className="text-xs text-zinc-600">
                                <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-0.5 mt-1">Topic:</span>
                                {sess.topic}
                              </p>

                              {/* Notification box for confirmed session */}
                              {isConfirmed && !hasEnded && (
                                <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-800 font-medium">
                                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>
                                    {canJoinZoom 
                                      ? "Sesi privat sedang berlangsung! Klik tombol Join Zoom untuk bergabung." 
                                      : "Sesi telah diterima instruktur. Tombol Join Zoom akan otomatis aktif 10 menit sebelum jadwal dimulai."}
                                  </span>
                                </div>
                              )}

                              {sess.rejectReason && (
                                <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100">
                                  <span className="font-bold">{sess.status === 'cancelled' ? 'Cancellation Reason:' : 'Decline Reason:'}</span> {sess.rejectReason}
                                </p>
                              )}
                              {sess.instructorNotes && (
                                <p className="text-xs text-indigo-700 mt-2 bg-indigo-50 p-2 rounded border border-indigo-100">
                                  <span className="font-bold">Instructor Notes:</span> {sess.instructorNotes}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-44 shrink-0 justify-center">
                              {canJoinZoom && (
                                <a 
                                  href={sess.zoomLink || sess.instructorZoomLink || "#"} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-500/20 py-2.5 flex justify-center items-center gap-2 text-sm font-bold animate-pulse"
                                  onClick={(e) => {
                                    if (!sess.zoomLink && !sess.instructorZoomLink) {
                                      e.preventDefault();
                                      toast.warning("Link Zoom belum tersedia. Instruktur akan segera menyediakannya.");
                                    }
                                  }}
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                  </svg>
                                  Join Zoom
                                </a>
                              )}

                              {canCancel && (
                                <button 
                                  className="btn bg-white border border-zinc-200 text-red-600 hover:bg-red-50 rounded-xl py-2.5 shadow-sm text-sm font-medium transition-colors"
                                  onClick={() => cancelSession(sess.id)}
                                >
                                  Cancel Session
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Booking Modal */}
      {isMounted && selectedCalendarDate && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 capitalize">{format(selectedCalendarDate, "EEEE, d MMMM yyyy", { locale: enUS })}</h3>
                <p className="text-xs text-zinc-500 mt-1">Select a time slot to book your private session</p>
              </div>
              <button className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-full transition-colors" onClick={() => {
                setSelectedCalendarDate(null);
                setSelectedSlot(null);
                setCourseId("");
                setTopic("");
              }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!selectedSlot ? (
                <>
                  <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Select Time Slot
                  </h4>
                  <div className="space-y-3">
                    {!groupedSlots[format(selectedCalendarDate, "yyyy-MM-dd")]?.length ? (
                      <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                        <p className="text-sm font-medium text-zinc-500">No instructor slots available on this date.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {groupedSlots[format(selectedCalendarDate, "yyyy-MM-dd")].sort((a: any, b: any) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).map((slot: any) => (
                          <div key={slot.id} className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={slot.instructorAvatar || "https://i.pravatar.cc/80?img=11"} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                              <div>
                                <h4 className="text-sm font-bold text-zinc-900 leading-tight">{slot.instructorName}</h4>
                                <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                                  {format(new Date(slot.startAt), "HH:mm")} - {format(new Date(slot.endAt), "HH:mm")}
                                </p>
                              </div>
                            </div>
                            <button 
                              className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors" 
                              onClick={() => setSelectedSlot(slot)}
                            >
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <button className="text-blue-500 hover:text-blue-700 mr-2" onClick={() => setSelectedSlot(null)}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedSlot.instructorAvatar || "https://i.pravatar.cc/80?img=11"} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-blue-900 leading-tight">Book with {selectedSlot.instructorName}</h4>
                      <p className="text-xs font-semibold text-blue-700 mt-0.5">
                        {format(new Date(selectedSlot.startAt), "HH:mm")} - {format(new Date(selectedSlot.endAt), "HH:mm")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Select Course</label>
                      <select 
                        className="input w-full bg-white shadow-sm border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl" 
                        value={courseId} 
                        onChange={(e) => setCourseId(e.target.value)}
                      >
                        <option value="">-- Select Course --</option>
                        {learnerCourses
                          .filter(c => Number(c.instructorId) === Number(selectedSlot.instructorId))
                          .map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Discussion Topic</label>
                      <textarea 
                        className="input w-full bg-white shadow-inner border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-28 py-3 px-4 resize-none" 
                        placeholder="Describe what topic, questions, or difficulties you want to discuss..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>

                    <button 
                      className="btn w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:-translate-y-0.5 transition-all rounded-xl py-3 text-sm font-bold" 
                      onClick={bookSlot}
                    >
                      Confirm Booking
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
