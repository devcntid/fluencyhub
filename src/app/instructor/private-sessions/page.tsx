"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";

export default function InstructorPrivateSessionsPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    sessionId: number;
    status: string;
    promptText: string;
    value: string;
  }>({ isOpen: false, sessionId: 0, status: '', promptText: '', value: '' });

  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({ show: false, type: 'success', message: '' });
  const [isMounted, setIsMounted] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<number | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  }

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [slotsRes, sessRes] = await Promise.all([
        fetch("/api/instructor/slots"),
        fetch("/api/instructor/sessions")
      ]);
      
      if (slotsRes.ok) {
        const slotsJson = await slotsRes.json();
        if (slotsJson.data) setSlots(slotsJson.data);
      }
      
      if (sessRes.ok) {
        const sessJson = await sessRes.json();
        if (sessJson.data) setSessions(sessJson.data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function addSlot() {
    if (!slotDate || !slotStart || !slotEnd) return showToast("Lengkapi semua field", "error");
    const startAt = new Date(`${slotDate}T${slotStart}:00`).toISOString();
    const endAt = new Date(`${slotDate}T${slotEnd}:00`).toISOString();

    try {
      const res = await fetch("/api/instructor/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt, endAt })
      });
      const json = await res.json();
      if (res.ok) {
        fetchData();
        showToast("Jadwal slot berhasil ditambahkan!");
        setSlotStart("");
        setSlotEnd("");
      } else {
        showToast(json.error || "Gagal menambahkan slot", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan jaringan", "error");
    }
  }

  async function executeDeleteSlot() {
    if (slotToDelete === null) return;
    try {
      await fetch(`/api/instructor/slots/${slotToDelete}`, { method: "DELETE" });
      fetchData();
      showToast("Slot berhasil dihapus!");
      setSlotToDelete(null);
    } catch (e) {
      console.error(e);
      showToast("Gagal menghapus slot", "error");
      setSlotToDelete(null);
    }
  }

  async function handleSessionAction(sessionId: number, status: string, promptText?: string) {
    if (promptText) {
      setModalConfig({ isOpen: true, sessionId, status, promptText, value: "" });
      return;
    }
    await processSessionAction(sessionId, status, "");
  }

  async function processSessionAction(sessionId: number, status: string, notesOrReason: string) {
    try {
      const res = await fetch(`/api/instructor/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notesOrReason })
      });
      if (res.ok) {
        showToast("Status sesi berhasil diperbarui!");
        fetchData();
      } else {
        const json = await res.json();
        showToast(json.error || "Gagal mengupdate sesi", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan jaringan", "error");
    }
  }

  const groupedSlots = slots.reduce((acc, slot) => {
    if (slot.status !== 'available') return acc;
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

  return (
    <div className="p-4 md:p-8 space-y-10 w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-[family-name:var(--font-heading)] mb-2 bg-gradient-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent">
          Manajemen Sesi Privat
        </h1>
        <p className="text-zinc-500 text-sm">
          Atur ketersediaan waktu luangmu dan kelola permintaan sesi privat 1-on-1 dari learner.
        </p>
      </div>

      <div className="flex flex-col gap-10 items-stretch">
        <div className="card p-0 shadow-sm border border-zinc-200/60 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-xl">
          <div className="p-6 border-b border-zinc-100 bg-white/80">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Kalender Ketersediaan (Slot)
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Pilih tanggal untuk menambah jam free.</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/80">
                <h3 className="font-bold text-zinc-800 text-lg capitalize">{format(currentMonth, "MMMM yyyy", { locale: id })}</h3>
                <div className="flex gap-2">
                  <button className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-sm" onClick={prevMonth}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors shadow-sm" onClick={nextMonth}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
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
                      onClick={() => {
                        setSelectedCalendarDate(day);
                        setSlotDate(dateStr);
                      }}
                      className={`min-h-[45px] md:min-h-[60px] p-1 md:p-2 flex flex-col justify-center items-center hover:bg-indigo-50 transition-colors ${!isCurrentMonth ? 'bg-zinc-50/80 opacity-60' : 'bg-white'}`}
                    >
                      <span className={`text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30' : 'text-zinc-700'} ${daySlots.length > 0 ? 'mb-0.5' : ''}`}>
                        {format(day, "d")}
                      </span>
                      {daySlots.length > 0 && (
                        <div className="w-full mt-0.5">
                          <div className="bg-emerald-100 text-emerald-700 text-[8px] md:text-[9px] px-0.5 md:px-1 py-0.5 rounded font-bold w-full text-center truncate shadow-sm border border-emerald-200/50 leading-none md:leading-normal">
                            <span className="md:hidden">{daySlots.length}</span>
                            <span className="hidden md:inline">{daySlots.length} Slot</span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-0 shadow-sm border border-zinc-200/60 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-xl">
          <div className="p-6 border-b border-zinc-100 bg-white/80">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Permintaan Sesi & Aktif
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Daftar booking yang masuk dari siswa.</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {sessions.filter(s => s.status === 'pending' || s.status === 'confirmed').length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-zinc-200 rounded-2xl">
                  <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                  <p className="text-sm font-medium text-zinc-500">Belum ada permintaan masuk.</p>
                </div>
              ) : (
                sessions.filter(s => s.status === 'pending' || s.status === 'confirmed').map(sess => (
                  <div key={sess.id} className="border border-zinc-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sess.learnerAvatar || "https://i.pravatar.cc/80?img=12"} alt="" className="w-12 h-12 rounded-full ring-2 ring-zinc-100 object-cover" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-zinc-900 truncate">{sess.learnerName}</h3>
                        <p className="text-[11px] font-semibold text-indigo-600 truncate uppercase tracking-wide bg-indigo-50 inline-block px-2 py-0.5 rounded mt-1">{sess.courseTitle}</p>
                      </div>
                      <div>
                        {sess.status === 'pending' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm animate-pulse">PENDING</span>}
                        {sess.status === 'confirmed' && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">DISATUJUI</span>}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-50 p-4 rounded-xl text-sm mb-5 border border-zinc-100 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-300"></div>
                      <p className="font-bold text-zinc-800 mb-1 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {format(new Date(sess.startAt), "EEEE, d MMM yyyy • HH:mm", { locale: id })} WIB
                      </p>
                      <p className="text-zinc-600 mt-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Topik Bahasan</span>
                        "{sess.topic}"
                      </p>
                    </div>

                    <div className="flex gap-3">
                      {sess.status === 'pending' && (
                        <>
                          <button className="btn flex-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-md py-2.5 transition-all" onClick={() => handleSessionAction(sess.id, 'confirmed')}>✅ Setujui</button>
                          <button className="btn flex-1 bg-white hover:bg-red-50 border border-zinc-200 text-red-600 rounded-xl shadow-sm py-2.5 transition-all" onClick={() => handleSessionAction(sess.id, 'rejected', "Alasan penolakan:")}>❌ Tolak</button>
                        </>
                      )}
                      {sess.status === 'confirmed' && (
                        <>
                          <a href={sess.zoomLink || zoomLink || "#"} target="_blank" rel="noreferrer" className="btn flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 py-2.5 flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                            Buka Zoom
                          </a>
                          <button className="btn flex-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl shadow-sm py-2.5 transition-all" onClick={() => handleSessionAction(sess.id, 'completed', "Catatan (opsional):")}>Tandai Selesai</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Aksi Sesi */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {modalConfig.status === 'rejected' ? (
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </div>
                )}
                <h3 className="text-xl font-bold text-zinc-900">{modalConfig.status === 'rejected' ? 'Tolak Sesi' : 'Selesaikan Sesi'}</h3>
              </div>
              <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">{modalConfig.promptText}</label>
              <textarea 
                className="w-full input border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl min-h-[120px] resize-y p-4 text-sm"
                value={modalConfig.value}
                onChange={(e) => setModalConfig({ ...modalConfig, value: e.target.value })}
                placeholder={modalConfig.status === 'rejected' ? 'Berikan alasan yang spesifik agar siswa mengerti...' : 'Berikan catatan atau pesan untuk siswa...'}
                autoFocus
              ></textarea>
            </div>
            <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-100 flex justify-end gap-3">
              <button 
                className="px-5 py-2.5 text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-xl transition-colors"
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
              >
                Batal
              </button>
              <button 
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-transform active:scale-95 ${modalConfig.status === 'rejected' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
                onClick={() => {
                  if (modalConfig.status === 'rejected' && !modalConfig.value.trim()) {
                    return showToast("Alasan penolakan tidak boleh kosong.", "error");
                  }
                  processSessionAction(modalConfig.sessionId, modalConfig.status, modalConfig.value);
                  setModalConfig({ ...modalConfig, isOpen: false });
                }}
              >
                Kirim & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Slot */}
      {slotToDelete !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Hapus Slot Waktu?</h3>
              <p className="text-sm text-zinc-500 mb-6">Kamu yakin ingin menghapus slot jam tersedia ini? Murid tidak akan bisa melihat jadwal ini lagi.</p>
              
              <div className="flex gap-3">
                <button 
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                  onClick={() => setSlotToDelete(null)}
                >
                  Batal
                </button>
                <button 
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-500/20 transition-all active:scale-95"
                  onClick={executeDeleteSlot}
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail & Tambah Hari Ini */}
      {selectedCalendarDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 capitalize">{format(selectedCalendarDate, "EEEE, d MMMM yyyy", { locale: id })}</h3>
                <p className="text-xs text-zinc-500 mt-1">Kelola jam luang untuk hari ini</p>
              </div>
              <button className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-full transition-colors" onClick={() => setSelectedCalendarDate(null)}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="bg-white p-5 rounded-2xl mb-8 border border-zinc-200 shadow-sm">
                <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                  Tambah Jam Baru
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Jam Mulai</label>
                    <input type="time" className="input w-full bg-zinc-50" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Jam Selesai</label>
                    <input type="time" className="input w-full bg-zinc-50" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
                  </div>
                </div>
                <button className="btn w-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-md hover:-translate-y-0.5 transition-all rounded-xl py-2.5 text-sm font-bold" onClick={addSlot}>
                  + Simpan Jam Ini
                </button>
              </div>

              <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                Jam Tersedia ({groupedSlots[format(selectedCalendarDate, "yyyy-MM-dd")]?.length || 0})
              </h4>
              
              <div className="space-y-3">
                {!groupedSlots[format(selectedCalendarDate, "yyyy-MM-dd")]?.length ? (
                  <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                    <p className="text-sm font-medium text-zinc-500">Belum ada jam yang ditambahkan.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {groupedSlots[format(selectedCalendarDate, "yyyy-MM-dd")].sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).map(slot => (
                      <div key={slot.id} className="border border-zinc-200 rounded-xl px-4 py-3 bg-white shadow-sm flex items-center justify-between group hover:border-red-200 transition-colors">
                        <span className="text-sm font-bold text-zinc-800">
                          {format(new Date(slot.startAt), "HH:mm")} - {format(new Date(slot.endAt), "HH:mm")}
                        </span>
                        <button 
                          className="w-7 h-7 rounded-full bg-zinc-50 text-zinc-400 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors" 
                          onClick={() => setSlotToDelete(slot.id)}
                          title="Hapus jam ini"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border ${toast.type === 'success' ? 'bg-white border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            {toast.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </div>
            )}
            <p className={`font-semibold text-sm ${toast.type === 'success' ? 'text-zinc-800' : 'text-red-800'}`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
