import { Link } from "react-router-dom";

export function NextStamp({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <p className="mt-12">
      <Link to={to} className="stamp stamp-terracotta">{children}</Link>
    </p>
  );
}
