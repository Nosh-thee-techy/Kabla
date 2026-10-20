/** One room = one page. Tight gutters; content capped so lines stay readable on wide screens. */
export function Room({
  children,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="w-full flex-1 flex flex-col px-4 md:px-6 py-5 max-w-[1240px] mx-auto">
      {children}
    </main>
  );
}
