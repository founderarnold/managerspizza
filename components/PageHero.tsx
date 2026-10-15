export function PageHero({ eyebrow, title, children, yellow = false }: { eyebrow?: string; title: string; children?: React.ReactNode; yellow?: boolean }) {
  return (
    <section className={yellow ? "bg-brand-yellow" : "border-b border-line bg-white"}>
      <div className="container-x py-12 md:py-16">
        {eyebrow && <p className={yellow ? "text-xs font-bold uppercase tracking-[0.14em] text-ink" : "eyebrow"}>{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-[1.05] md:text-5xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-lg leading-relaxed text-graphite">{children}</div>}
      </div>
    </section>
  );
}
