export function BadgeShelf({ names }: { names: string[] }) {
  if (!names.length) return <p className="text-ink/60">No badges yet.</p>;
  return (
    <ul className="flex flex-wrap gap-3">
      {names.map((n) => (
        <li key={n} className="border border-gold bg-gold/15 px-3 py-2 rounded-md text-sm">
          <span aria-hidden="true">● </span>
          {n}
        </li>
      ))}
    </ul>
  );
}
