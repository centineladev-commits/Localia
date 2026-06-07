export default function Loading() {
  return (
    <div className="p-6 space-y-4 animate-pulse max-w-5xl">
      <div className="h-9 bg-slate-100 rounded-xl w-64" />
      <div className="h-4 bg-slate-100 rounded-full w-96" />
      <div className="flex gap-2 pt-2">
        <div className="h-10 bg-slate-100 rounded-xl w-52" />
        <div className="h-10 bg-slate-100 rounded-xl w-44" />
      </div>
      <div className="flex gap-3 pt-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-xl w-32" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
      ))}
    </div>
  );
}
