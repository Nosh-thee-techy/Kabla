import { Link } from "react-router-dom";

export function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0">
      <span
        aria-hidden="true"
        className="grid place-items-center w-8 h-8 rounded-full bg-terracotta text-paper font-display italic text-lg leading-none shadow-stamp"
      >
        K
      </span>
      <span className="font-display italic text-2xl tracking-tight">Kabla</span>
    </Link>
  );
}
