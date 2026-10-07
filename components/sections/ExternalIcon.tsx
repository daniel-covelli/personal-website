interface ExternalIconProps {
  className?: string;
}

/** Small up-right arrow marking links that leave the site. */
export default function ExternalIcon({
  className = 'h-[11px] w-[11px]',
}: ExternalIconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`shrink-0 fill-none stroke-current ${className}`}
      strokeWidth={1.6}
    >
      <path d="M3.5 8.5l5-5M4.5 3.5h4v4" />
    </svg>
  );
}
