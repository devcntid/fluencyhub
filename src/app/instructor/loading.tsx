export default function InstructorLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-pulse">
      <div className="h-44 rounded-3xl bg-[#0B2559]/15" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="h-28 rounded-2xl bg-white border border-[#E6DED4]" />
        <div className="h-28 rounded-2xl bg-white border border-[#E6DED4]" />
        <div className="h-28 rounded-2xl bg-white border border-[#E6DED4]" />
        <div className="h-28 rounded-2xl bg-white border border-[#E6DED4]" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-6 h-80 rounded-2xl bg-white border border-[#E6DED4]" />
        <div className="xl:col-span-6 h-80 rounded-2xl bg-white border border-[#E6DED4]" />
      </div>
      <div className="h-64 rounded-2xl bg-white border border-[#E6DED4]" />
    </div>
  );
}
