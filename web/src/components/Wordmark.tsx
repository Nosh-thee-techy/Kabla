import { Link } from "react-router-dom";

export function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <span
        aria-hidden="true"
        className="grid place-items-center w-7 h-7 rounded-full bg-terracotta text-paper font-display italic text-base leading-none shadow-stamp"
      >
        K
      </span>
      <span className="font-display italic text-xl tracking-tight">Kabla</span>
    </Link>
  );
}
