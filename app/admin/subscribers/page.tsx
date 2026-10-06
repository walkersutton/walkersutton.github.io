import { listSubscribers, type Subscriber } from "@/lib/newsletter";
import SubscribersList from "./SubscribersList";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  let subscribers: Subscriber[] = [];
  let error: string | undefined;
  try {
    subscribers = await listSubscribers();
  } catch (e) {
    console.error("AdminSubscribersPage: could not list contacts", e);
    error = (e as Error).message || "Could not reach Resend.";
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const active = subscribers.filter((s) => !s.unsubscribed).length;
  const thisWeek = subscribers.filter((s) => Date.parse(s.createdAt) > weekAgo).length;

  return (
    <div>
      <h1 className="adm-page-title">Subscribers</h1>
      <p className="adm-page-sub">Everyone who signed up for the newsletter, straight from Resend.</p>

      {error ? (
        <div className="adm-card">
          <p className="adm-empty" style={{ color: "var(--adm-red)" }}>
            {error}
          </p>
        </div>
      ) : (
        <>
          <div className="adm-stats">
            <Stat value={active} label="Subscribed" />
            <Stat value={thisWeek} label="New this week" />
            <Stat value={subscribers.length - active} label="Unsubscribed" />
          </div>
          <SubscribersList subscribers={subscribers} />
        </>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-value">{value.toLocaleString()}</div>
      <div className="adm-stat-label">{label}</div>
    </div>
  );
}
