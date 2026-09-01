"use client";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Data, Label, Rule } from "@/components/primitives/Text";
import { Skeleton } from "@/components/primitives/States";
import { Screen } from "@/components/shell/Screen";
import { TaleCarousel } from "@/components/domain/TaleCarousel";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

export default function TaleScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const tale = useAsync(() => data.getTale(id), [id]);
  const t = tale.data;
  const [copied, setCopied] = useState(false);

  const link = `https://sidequest.ie/tales/${id}`;
  const blurb = t ? `${t.title}. ${t.pointName}, townland of ${t.townland}.` : "";

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: t?.title, text: blurb, url: link });
        return;
      } catch { /* dismissed */ }
    }
    try {
      await navigator.clipboard.writeText(`${blurb} ${link}`);
    } catch {
      const el = document.createElement("input");
      el.value = `${blurb} ${link}`;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch { /* nothing else to try */ }
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Screen>
      <div className="flex items-center justify-between pb-3">
        <Button tone="quiet" aria-label="Back" onClick={() => router.back()}>←</Button>
        <Data className="text-[10px] uppercase text-mute">Tale</Data>
      </div>

      {tale.loading ? (
        <div className="flex flex-col gap-3"><Skeleton h={300} /><Skeleton h={40} /></div>
      ) : !t ? (
        <p className="t-body text-stone">That tale is no longer here.</p>
      ) : (
        <>
          <h1 className="t-h1 text-ink">{t.title}</h1>
          <p className="t-small mt-1.5 text-stone">
            {t.pointName}, townland of {t.townland}
          </p>

          <div className="mt-4">
            <TaleCarousel cards={t.cards} plate={t.plate} />
          </div>

          <Rule className="my-5" />

          <Label>Share it</Label>
          <Card className="mt-2">
            <p className="t-small text-stone">
              Sends the title and the place. Sources travel with it, so whoever
              opens it can check the same archives you did.
            </p>
            <div className="mt-3 flex gap-2">
              <Button tone="solid" onClick={share}>
                {copied ? "Copied" : "Share"}
              </Button>
              <Button onClick={() => router.push("/tales")}>All tales</Button>
            </div>
          </Card>
        </>
      )}
    </Screen>
  );
}
