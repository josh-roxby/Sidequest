"use client";
import { useState } from "react";
import { Action } from "@/components/primitives/Action";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Field } from "@/components/primitives/Field";
import { Mark } from "@/components/primitives/Marks";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState } from "@/components/primitives/States";
import { Frame } from "@/components/shell/Frame";
import { Screen } from "@/components/shell/Screen";
import { ThumbAction } from "@/components/shell/ThumbAction";

interface Outpost {
  id: string; name: string; detail: string; base: boolean;
}

const SEED: Outpost[] = [
  { id: "o-base", name: "Base camp", detail: "Corofin, Co. Clare", base: true },
  { id: "o-home", name: "Home", detail: "Cloonanaha", base: false },
];

/** Outposts are the places you start from.
 *
 *  Adding one by link matters more than it looks: it is how you plan a walk
 *  somewhere you are not yet. Drop in a maps link for the cottage you have
 *  booked and quests generate from there before you have left the house. */
export default function OutpostsScreen() {
  const [list, setList] = useState<Outpost[]>(SEED);
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add(detail: string) {
    setList((l) => [...l, {
      id: `o-${Date.now()}`, name: name.trim() || "New outpost", detail, base: false,
    }]);
    setOpen(false); setLink(""); setName(""); setError(null);
  }

  function useCurrent() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This device cannot share a location. Paste a map link instead.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setError("That fix came back unusable. Try again in a moment.");
          return;
        }
        add(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      () => {
        setLocating(false);
        setError("Location is blocked for this site. Paste a map link instead.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  function useLink() {
    // Coordinates inside a maps URL, in the shapes the common ones use:
    // @53.12,-9.05 and !3d53.12!4d-9.05 and ?q=53.12,-9.05
    const m = link.match(/(-?\d{1,3}\.\d+)[,/!a-z0-9]*?(-?\d{1,3}\.\d+)/i);
    if (!m) {
      setError("No coordinates in that link. Open the place in your maps app and share the link from there.");
      return;
    }
    add(`${Number(m[1]).toFixed(5)}, ${Number(m[2]).toFixed(5)}`);
  }

  return (
    <Screen docked>
      <header className="pb-4">
        <Label>Outposts</Label>
        <h1 className="t-h1 mt-1.5 text-ink">Where you start from</h1>
      </header>

      {list.length === 0 ? (
        <EmptyState
          line="No outposts yet. Save a place you walk from often and quests there come up first."
          action={<Button onClick={() => setOpen(true)}>Add one</Button>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((o) => (
            <Card key={o.id} className="select-none">
              <div className="flex items-center gap-2">
                <p className="t-small font-semibold text-ink">{o.name}</p>
                {/* One active marker, not two. The corner ribbon and this
                    label were both landing top right and overlapping. */}
                {o.base ? (
                  <span className="border border-rust bg-rust-soft px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-rust"
                    style={{ borderRadius: "var(--r-full)" }}>
                    Active
                  </span>
                ) : null}
              </div>
              <p className="t-small mt-1 text-stone">{o.detail}</p>
              {!o.base ? (
                <div className="mt-2.5 flex gap-2">
                  <Button onClick={() => setList((l) =>
                    l.map((x) => ({ ...x, base: x.id === o.id })))}>
                    Make active
                  </Button>
                  <Button tone="quiet" onClick={() => setList((l) => l.filter((x) => x.id !== o.id))}>
                    Remove
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-5 bg-surface-2">
        <p className="t-small text-stone">
          Heading somewhere for the weekend? Add it as an outpost now and you can
          plan the walks before you go.
        </p>
      </Card>

      <ThumbAction onClick={() => setOpen(true)}>
        <Mark name="plus" size={15} /> Add an outpost
      </ThumbAction>

      <Frame
        open={open}
        onDismiss={() => { setOpen(false); setError(null); }}
        label="New outpost"
        title="Where from?"
        action={<Action tone="outline" onClick={useLink} disabled={!link.trim()}>Add from link</Action>}
      >
        <div className="flex flex-col gap-4">
          <Field label="Name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="The cottage" />
          <Field label="Map link" value={link} onChange={(e) => setLink(e.target.value)}
            placeholder="Paste a link from your maps app"
            hint="Any link with coordinates in it works." error={error ?? undefined} />
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-rule" />
            <Data className="text-[10px] uppercase text-mute">or</Data>
            <span className="h-px flex-1 bg-rule" />
          </div>
          <Action loading={locating} onClick={useCurrent}>
            <Mark name="target" size={15} /> Use where I am now
          </Action>
        </div>
      </Frame>
    </Screen>
  );
}
