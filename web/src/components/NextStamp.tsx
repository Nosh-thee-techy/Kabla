import { Link } from "react-router-dom";

export function NextStamp({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <p className="mt-8">
      <Link to={to} className="stamp stamp-terracotta">{children} →</Link>
    </p>
  );
}
