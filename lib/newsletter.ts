import { Resend } from "resend";

export type Subscriber = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  unsubscribed: boolean;
};

// Resend pages contacts 100 at a time. The cap is a guard against a cursor bug
// looping forever, not a real limit: 50 pages is 5,000 subscribers.
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

/** Every newsletter contact in Resend, newest first. */
export async function listSubscribers(): Promise<Subscriber[]> {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set.");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const subscribers: Subscriber[] = [];
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await resend.contacts.list(
      after ? { limit: PAGE_SIZE, after } : { limit: PAGE_SIZE },
    );
    if (error) throw new Error(error.message);
    if (!data) break;

    for (const contact of data.data) {
      subscribers.push({
        id: contact.id,
        email: contact.email,
        name: [contact.first_name, contact.last_name].filter(Boolean).join(" "),
        createdAt: contact.created_at,
        unsubscribed: contact.unsubscribed,
      });
    }
    if (!data.has_more || data.data.length === 0) break;
    after = data.data[data.data.length - 1].id;
  }

  return subscribers.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
