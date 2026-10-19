export function BadgeShelf({ names }: { names: string[] }) {
  if (!names.length) return <p className="opacity-60 text-sm">No badges yet.</p>;
  return (
    <ul className="flex flex-wrap gap-3">
      {names.map((n) => (
        <li key={n} className="ticket border border-gold/70 bg-gold/10 px-4 py-2 text-sm">
          <span className="seal seal-gold mr-2 align-middle" aria-hidden="true">●</span>
          {n}
        </li>
      ))}
    </ul>
  );
}
