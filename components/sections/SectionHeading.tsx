interface SectionHeadingProps {
  children: React.ReactNode;
}

/**
 * Editorial section heading: a tracked uppercase label with a trailing
 * hairline rule that fills the remaining width. Shared across all sections so
 * the treatment stays consistent.
 */
export default function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h2 className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-brand">
      {children}
      <span className="h-px flex-1 bg-hair" aria-hidden="true" />
    </h2>
  );
}
