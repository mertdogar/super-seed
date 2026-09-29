export function SectionTitle({ title, body }: { title: string; body?: string }) {
  return (
    <div className="space-y-2 text-center">
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      {body && <p className="text-muted-foreground">{body}</p>}
    </div>
  );
}
