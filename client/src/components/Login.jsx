function BrandLogo({ className = "h-16 w-16" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {/* Back card — lighter blue peeking out on the right */}
      <rect x="16" y="6" width="24" height="32" rx="7" fill="#7EB3F5" />

      {/* Front card — primary brand blue */}
      <rect x="6" y="10" width="24" height="32" rx="7" fill="#0C66E4" />

      {/* Checkmark */}
      <path
        d="M13 23.5l4 4 8-9"
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Checklist lines */}
      <rect x="12.5" y="32" width="11" height="2.4" rx="1.2" fill="white" />
      <rect x="12.5" y="36.5" width="8" height="2.4" rx="1.2" fill="white" />
    </svg>
  );
}

export default BrandLogo;
