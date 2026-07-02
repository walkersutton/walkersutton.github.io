import {
  getLiveEnabled,
  getBannerEnabled,
  getBannerText,
  getBannerLink,
  getActiveTripName,
} from "@/lib/live-state";
import {
  setLive,
  setBanner,
  saveBannerText,
  saveBannerLink,
  saveActiveTripName,
} from "./actions";
import { ROW, LABEL, INPUT, BTN } from "./styles";

export const dynamic = "force-dynamic";

export default async function AdminGeneralPage() {
  const isLive = await getLiveEnabled();
  const isBannerEnabled = await getBannerEnabled();
  const bannerText = await getBannerText();
  const bannerLink = await getBannerLink();
  const activeTripName = await getActiveTripName();

  return (
    <div>
      <div style={ROW}>
        <span style={LABEL}>On trip</span>
        <form action={setLive.bind(null, true)}>
          <button type="submit" style={BTN(isLive)}>On</button>
        </form>
        <form action={setLive.bind(null, false)}>
          <button type="submit" style={BTN(!isLive)}>Off</button>
        </form>
      </div>

      <form action={saveActiveTripName} style={ROW}>
        <span style={LABEL}>Active trip</span>
        <input name="activeTripName" defaultValue={activeTripName} style={{ ...INPUT, flex: 1 }} />
        <button type="submit" style={BTN(false)}>Save</button>
      </form>

      <div style={ROW}>
        <span style={LABEL}>Banner</span>
        <form action={setBanner.bind(null, true)}>
          <button type="submit" style={BTN(isBannerEnabled)}>On</button>
        </form>
        <form action={setBanner.bind(null, false)}>
          <button type="submit" style={BTN(!isBannerEnabled)}>Off</button>
        </form>
      </div>

      <form action={saveBannerText} style={ROW}>
        <span style={LABEL}>Banner text</span>
        <input name="bannerText" defaultValue={bannerText} style={{ ...INPUT, flex: 1 }} />
        <button type="submit" style={BTN(false)}>Save</button>
      </form>

      <form action={saveBannerLink} style={{ ...ROW, borderBottom: "none" }}>
        <span style={LABEL}>Banner link</span>
        <input name="bannerLink" defaultValue={bannerLink} style={{ ...INPUT, flex: 1 }} />
        <button type="submit" style={BTN(false)}>Save</button>
      </form>
    </div>
  );
}
