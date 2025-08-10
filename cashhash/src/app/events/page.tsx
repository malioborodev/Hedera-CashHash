import { Api } from '../lib/api';

export default async function EventsPage() {
  const events = await Api.listEvents(new URLSearchParams());
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <div className="space-y-3">
        {events.map((e: any) => (
          <div key={e.id} className="border border-white/10 rounded p-3">
            <div className="text-xs text-white/60">{e.timestamp}</div>
            <div className="font-mono text-sm">{e.type}</div>
            <pre className="text-xs text-white/70 overflow-auto">{JSON.stringify(e.payload, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}