"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";

export default function PrivateSessionsPage() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [learnerCourses, setLearnerCourses] = useState<any[]>([]);

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
      alert("Lengkapi kelas dan topik terlebih dahulu.");
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
        alert("Berhasil booking! Menunggu persetujuan instruktur.");
        setSelectedSlot(null);
        setSelectedCalendarDate(null);
        setTopic("");
        setCourseId("");
        fetchData();
      } else {
        alert(json.error || "Gagal booking");
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan");
    }
  }

  async function cancelSession(sessionId: number) {
    if (!confirm("Yakin ingin membatalkan sesi ini?")) return;
    try {
      const res = await fetch(`/api/private-sessions/${sessionId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        alert("Sesi dibatalkan.");
        fetchData();
      } else {
        alert(json.error || "Gagal membatalkan sesi");
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan");
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

  if (!isMounted) return <div className="p-8 text-center text-zinc-500 animate-pulse font-medium">Memuat halaman...</div>;
  if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse font-medium">Memuat jadwal instruktur...</div>;

  return (
    <div className="p-4 md:p-8 space-y-10 w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-[family-name:var(--font-heading)] mb-2 bg-gradient-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent">
          Booking Sesi Privat
        </h1>
        <p className="text-zinc-500 text-sm">Cari dan booking sesi 1-on-1 dengan instruktur dari kelas yang sudah kamu ikuti.</p>
      </div>

      <div className="flex flex-col gap-10 items-stretch">
        {/* Kolom Kalender Booking */}
        <div className="card p-0 shadow-sm border border-zinc-200/60 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-xl w-full">
          <div className="p-6 border-b border-zinc-100 bg-white/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Jadwal Instruktur
            </h2>
            
            {instructors.length > 0 && (
              <div className="w-full md:w-64">
                <select 
                  className="input w-full bg-white shadow-sm border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl" 
                  value={selectedInstructorId} 
                  onChange={(e) => setSelectedInstructorId(e.target.value)}
                >
                  <option value="">Semua Instruktur Saya</option>
                  {instructors.map(inst => (
                    <option key={inst.instructorId} value={inst.instructorId}>{inst.instructorName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        
          {instructors.length === 0 ? (
            <div className="p-8">
              <div className="text-center py-10 px-4 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-sm font-medium">
                Kamu belum mengikuti kelas apapun. Beli kelas dulu untuk bisa booking instruktur.
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-8 bg-zinc-50/50">
              <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-100 bg-zinc-50/80">
                  <h3 className="font-extrabold text-zinc-800 text-xl md:text-2xl capitalize">{format(currentMonth, "MMMM yyyy", { locale: id })}</h3>
                  <div className="flex gap-3">
                    <button className="p-2 md:p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-sm" onClick={prevMonth}>
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button className="p-2 md:p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-sm" onClick={nextMonth}>
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 border-b border-zinc-100 bg-white">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(d => (
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
                        className={`min-h-[45px] md:min-h-[60px] p-1 md:p-2 flex flex-col justify-center items-center hover:bg-blue-50 transition-colors ${!isCurrentMonth ? 'bg-zinc-50/80 opacity-60' : 'bg-white'}`}
                      >
                        <span className={`text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : 'text-zinc-700'} ${daySlots.length > 0 ? 'mb-0.5' : ''}`}>
                          {format(day, "d")}
                        </span>
                        {daySlots.length > 0 && (
                          <div className="w-full mt-0.5">
                            <div className="bg-emerald-100 text-emerald-700 text-[8px] md:text-[9px] px-0.5 md:px-1 py-0.5 rounded font-bold w-full text-center truncate shadow-sm border border-emerald-200/50 leading-none md:leading-normal">
                              <span className="md:hidden">{daySlots.length} Free</span>
                              <span className="hidden md:inline">{daySlots.length} Jam Free</span>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Riwayat */}
        <div className="card p-0 shadow-sm border border-zinc-200/60 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-xl w-full">
          <div className="p-6 border-b border-zinc-100 bg-white/80">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Riwayat Sesi Saya
            </h2>
          </div>
          
          <div className="p-6">
            {sessions.length === 0 ? (
              <div className="text-center py-10 px-4 border-2 border-dashed border-zinc-200 rounded-2xl">
                <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                <p className="text-sm font-medium text-zinc-500">Anda belum memiliki riwayat sesi privat.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map(sess => {
                  const start = new Date(sess.startAt);
                  const isPast = start < new Date();
                  return (
                    <div key={sess.id} className="border border-zinc-200 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sess.instructorAvatar || "https://i.pravatar.cc/80?img=15"} alt="" className="w-14 h-14 rounded-full ring-2 ring-zinc-100 object-cover" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-zinc-900">{sess.instructorName}</h3>
                          {sess.status === 'pending' && <span className="badge bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse">Menunggu</span>}
                          {sess.status === 'confirmed' && <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Disetujui</span>}
                          {sess.status === 'rejected' && <span className="badge bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Ditolak</span>}
                          {sess.status === 'cancelled' && <span className="badge bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Dibatalkan</span>}
                          {sess.status === 'completed' && <span className="badge bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">Selesai</span>}
                        </div>
                        
                        <div className="bg-zinc-50 p-3 rounded-xl mt-3 relative overflow-hidden border border-zinc-100">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-300"></div>
                          <p className="font-bold text-zinc-800 text-sm flex items-center gap-1.5 mb-1.5">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            {format(start, "EEEE, d MMM yyyy • HH:mm", { locale: id })} WIB
                          </p>
                          <p className="text-xs text-zinc-600">
                            <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-0.5 mt-2">Topik:</span>
                            {sess.topic}
                          </p>
                          {sess.rejectReason && <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100"><span className="font-bold">Alasan Ditolak:</span> {sess.rejectReason}</p>}
                          {sess.instructorNotes && <p className="text-xs text-indigo-700 mt-2 bg-indigo-50 p-2 rounded border border-indigo-100"><span className="font-bold">Catatan Instruktur:</span> {sess.instructorNotes}</p>}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-40 shrink-0">
                        {sess.status === 'confirmed' && (
                          <a 
                            href={sess.zoomLink || sess.instructorZoomLink || "#"} 
                            target="_blank" 
                            rel="noreferrer"
                            className={`btn bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 py-2.5 flex justify-center items-center gap-2 ${isPast ? "opacity-50 pointer-events-none" : ""}`}
                            onClick={(e) => {
                              if (isPast) {
                                e.preventDefault();
                                alert("Sesi sudah lewat.");
                              } else if (!sess.zoomLink && !sess.instructorZoomLink) {
                                e.preventDefault();
                                alert("Link Zoom belum tersedia. Instruktur akan memberikannya segera.");
                              }
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                            Gabung Zoom
                          </a>
                        )}
                        
                        {(sess.status === 'pending' || (sess.status === 'confirmed' && !isPast)) && (
                          <button 
                            className="btn bg-white border border-zinc-200 text-red-600 hover:bg-red-50 rounded-xl py-2.5 shadow-sm transition-colors"
                            onClick={() => {
                              if(confirm("Yakin ingin membatalkan booking sesi ini?")) {
                                cancelSession(sess.id);
                              }
                            }}
                          >
                            Batalkan Sesi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Booking */}
      {selectedCalendarDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 capitalize">{format(selectedCalendarDate, "EEEE, d MMMM yyyy", { locale: id })}</h3>
                <p className="text-xs text-zinc-500 mt-1">Pilih jam untuk booking sesi privat</p>
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
                    Pilih Jam Instruktur
                  </h4>
                  <div className="space-y-3">
                    {!groupedSlots[format(selectedCalendarDate, "yyyy-MM-dd")]?.length ? (
                      <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                        <p className="text-sm font-medium text-zinc-500">Tidak ada instruktur yang luang di tanggal ini.</p>
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
                                  {format(new Date(slot.startAt), "HH:mm")} - {format(new Date(slot.endAt), "HH:mm")} WIB
                                </p>
                              </div>
                            </div>
                            <button 
                              className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors" 
                              onClick={() => setSelectedSlot(slot)}
                            >
                              Pilih
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
                      <h4 className="text-sm font-bold text-blue-900 leading-tight">Booking dengan {selectedSlot.instructorName}</h4>
                      <p className="text-xs font-semibold text-blue-700 mt-0.5">
                        {format(new Date(selectedSlot.startAt), "HH:mm")} - {format(new Date(selectedSlot.endAt), "HH:mm")} WIB
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Pilih Kelas</label>
                      <select 
                        className="input w-full bg-white shadow-sm border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl" 
                        value={courseId} 
                        onChange={(e) => setCourseId(e.target.value)}
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {learnerCourses
                          .filter(c => Number(c.instructorId) === Number(selectedSlot.instructorId))
                          .map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Topik Bahasan</label>
                      <textarea 
                        className="input w-full bg-white shadow-inner border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl h-28 py-3 px-4 resize-none" 
                        placeholder="Tuliskan materi atau kesulitan apa yang ingin dibahas..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>

                    <button 
                      className="btn w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:-translate-y-0.5 transition-all rounded-xl py-3 text-sm font-bold" 
                      onClick={bookSlot}
                    >
                      Konfirmasi Booking
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
