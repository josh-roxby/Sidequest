"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Field } from "@/components/primitives/Field";
import { Mark } from "@/components/primitives/Marks";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { Frame } from "@/components/shell/Frame";
import { Screen } from "@/components/shell/Screen";
import { ThumbAction } from "@/components/shell/ThumbAction";
import { cn } from "@/lib/cn";

/** Avatars are initials on a tinted disc until people can upload a photo.
 *  Colour is the only choice, which keeps the avatar recognisable in a list
 *  without asking anyone to find a picture of themselves first. */
const TINTS = [
  { id: "field", bg: "var(--field-soft)", fg: "var(--field)", label: "Field" },
  { id: "rust", bg: "var(--rust-soft)", fg: "var(--rust)", label: "Rust" },
  { id: "stone", bg: "var(--surface-2)", fg: "var(--stone)", label: "Stone" },
  { id: "ink", bg: "var(--ink)", fg: "var(--surface)", label: "Ink" },
];

export default function ProfileEditScreen() {
  const router = useRouter();
  const [name, setName] = useState("Josh");
  const [handle, setHandle] = useState("josh");
  const [townland, setTownland] = useState("Corofin");
  const [bio, setBio] = useState("Mostly strolls, occasionally an adventure.");
  const [tint, setTint] = useState(TINTS[0]);
  const [visible, setVisible] = useState(true);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "SQ";

  function save() {
    setSaved(true);
    setTimeout(() => router.push("/profile"), 600);
  }

  return (
    <Screen docked>
      <div className="flex items-center justify-between pb-4">
        <Button tone="quiet" aria-label="Back" onClick={() => router.back()}>←</Button>
        <Label>Edit profile</Label>
      </div>

      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="flex h-20 w-20 shrink-0 items-center justify-center border border-ink text-[24px] font-semibold"
          style={{ borderRadius: "var(--r-full)", background: tint.bg, color: tint.fg }}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <Label>Avatar</Label>
          <div className="mt-2 flex gap-2">
            {TINTS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-label={t.label}
                aria-pressed={tint.id === t.id}
                onClick={() => setTint(t)}
                className={cn("h-8 w-8 border", tint.id === t.id ? "border-ink" : "border-rule")}
                style={{ borderRadius: "var(--r-full)", background: t.bg }}
              />
            ))}
          </div>
          <p className="t-small mt-2 text-stone">Photos come later. Initials for now.</p>
        </div>
      </div>

      <Rule className="my-6" />

      <div className="flex flex-col gap-4">
        <Field label="Name" value={name} onChange={(e) => setName(e.target.value)}
          hint="Shown to friends and in the community feed. First name is enough." />
        <Field label="Handle" value={handle} onChange={(e) => setHandle(e.target.value)}
          hint="How friends find you. Letters and numbers." />
        <Field label="Where you walk from" value={townland}
          onChange={(e) => setTownland(e.target.value)}
          hint="A townland or a town. Never an address." />
        <div>
          <Label>A line about you</Label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={140}
            className="selectable mt-1.5 w-full resize-none border border-ink bg-surface p-3 text-[15px] leading-snug text-ink placeholder:text-mute"
            style={{ borderRadius: "var(--r-sm)" }}
          />
          <Data className="mt-1 block text-right text-[10px] uppercase text-mute">
            {bio.length} / 140
          </Data>
        </div>
      </div>

      <Label className="mt-7">Who can see you</Label>
      <Card className="mt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="t-small font-semibold text-ink">Findable by handle</p>
            <p className="t-small mt-0.5 text-stone">
              People can send you a friend request if they know your handle. Off
              means only a referral link works.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={visible}
            aria-label="Findable by handle"
            onClick={() => setVisible(!visible)}
            className={cn("relative h-7 w-12 shrink-0 border",
              visible ? "border-field bg-field" : "border-rule bg-surface-2")}
            style={{ borderRadius: "var(--r-full)", transition: "background-color var(--dur-state)" }}
          >
            <span className="absolute top-[3px] block h-4 w-4 bg-surface"
              style={{ borderRadius: "var(--r-full)", left: visible ? 26 : 4,
                       transition: "left var(--dur-state) var(--ease)" }} />
          </button>
        </div>
        <p className="t-small mt-3 border-t border-rule pt-3 text-stone">
          Your location is never visible to anyone, friend or not. Friends see
          your quests and badges, and nothing else.
        </p>
      </Card>

      <Label className="mt-7">Account</Label>
      <Card inset={false} className="mt-2 px-3.5">
        <div className="flex items-center justify-between gap-4 border-b border-rule py-3.5">
          <div className="min-w-0">
            <p className="t-small font-semibold text-ink">Email</p>
            <Data className="mt-0.5 block truncate text-[11px] uppercase text-stone">
              josh@exhale.studio
            </Data>
          </div>
          <Button className="shrink-0" onClick={() => setConfirmEmail(true)}>Change</Button>
        </div>
        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="min-w-0">
            <p className="t-small font-semibold text-ink">Password</p>
            <p className="t-small mt-0.5 text-stone">Last changed a while ago</p>
          </div>
          <Button className="shrink-0">Change</Button>
        </div>
      </Card>

      <ThumbAction onClick={save} loading={saved}>
        <Mark name="plus" size={15} /> {saved ? "Saved" : "Save changes"}
      </ThumbAction>

      <Frame
        open={confirmEmail}
        onDismiss={() => setConfirmEmail(false)}
        label="Change email"
        title="We will send a link"
        action={<Button tone="solid" onClick={() => setConfirmEmail(false)}>Send it</Button>}
      >
        <div className="flex flex-col gap-3">
          <Field label="New email" type="email" placeholder="you@example.com" />
          <p className="t-small text-stone">
            Nothing changes until you open the link from the new address. The old
            one keeps working until then.
          </p>
        </div>
      </Frame>
    </Screen>
  );
}
