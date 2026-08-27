export function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70">
      <span className="text-white/80 text-xs tracking-widest uppercase font-light">Scroll to Explore</span>
      <div className="w-[1px] h-12 bg-gradient-to-b from-white/80 to-transparent rounded-full" />
    </div>
  );
}
