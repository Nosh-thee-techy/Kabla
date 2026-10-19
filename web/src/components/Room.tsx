export function Room({
  children,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="w-full flex-1 px-6 md:px-10 xl:px-14 py-6 md:py-8">
      {children}
    </main>
  );
}
