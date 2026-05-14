export default function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      className="my-6 pl-5"
      style={{
        borderLeft: "2px solid var(--accent)",
      }}
    >
      {children}
    </blockquote>
  );
}
