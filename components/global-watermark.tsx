"use client"

export function GlobalWatermark() {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-end overflow-hidden z-[5] opacity-[0.05] dark:opacity-[0.03] select-none">
      <span 
        className="text-[160vh] font-black leading-none tracking-tighter translate-x-[40%] -rotate-[15deg] text-primary" 
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        X
      </span>
    </div>
  )
}
