import Link from 'next/link';

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold font-headline">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M17.5 19H9a7 7 0 1 1 6.326-11.85A4.5 4.5 0 1 1 18 11h-2.5" />
        <path d="M15.5 19H18" />
        <path d="M14 22H16" />
        <path d="M15 16l-2.5-2.5" />
        <path d="m12.5 13.5 2.5 2.5" />
      </svg>
      <span>AlgeoZonix</span>
    </Link>
  );
}
