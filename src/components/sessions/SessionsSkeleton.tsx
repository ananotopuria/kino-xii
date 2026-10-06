const SessionsSkeleton = () => (
  <div role="status" aria-label="Loading sessions">
    <span className="sr-only">Loading sessions...</span>
    <div aria-hidden="true" className="animate-pulse space-y-8 motion-reduce:animate-none">
      {[0, 1, 2].map((row) => (
        <div key={row} className="min-w-0 border-b border-[#2a2c3d] pb-8 last:border-0 last:pb-0">
          <div className="mb-3.5 flex items-center gap-4">
            <div className="h-20 w-14 shrink-0 rounded-lg bg-[#1e2031]" />
            <div className="w-48 space-y-3">
              <div className="h-5 rounded bg-[#1e2031]" />
              <div className="h-4 w-16 rounded bg-[#1e2031]" />
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden pb-1">
            {[0, 1, 2].map((card) => (
              <div key={card} className="w-63 shrink-0 space-y-3 rounded-2xl bg-[#1e2031] p-3.75">
                <div className="flex justify-between"><div className="h-6 w-16 rounded bg-[#2a2c3d]" /><div className="h-6 w-12 rounded-full bg-[#2a2c3d]" /></div>
                <div className="h-4 rounded bg-[#2a2c3d]" />
                <div className="h-4 rounded bg-[#2a2c3d]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default SessionsSkeleton;
