"use client";
import { Card } from "@/components/primitives/Card";
import { Mark } from "@/components/primitives/Marks";
import { Plate } from "@/components/primitives/Plate";
import { Data, Label } from "@/components/primitives/Text";
import { EmptyState, Skeleton } from "@/components/primitives/States";
import { Button } from "@/components/primitives/Button";
import { Screen, ScreenHead } from "@/components/shell/Screen";
import { data } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";

/** What you carry: the things collected from points you have reached. History
 *  is where walks live; this is the cabinet. */
export default function InventoryScreen() {
  const items = useAsync(() => data.getCollectibles(), []);
  const list = items.data ?? [];
  const total = list.reduce((n, i) => n + i.count, 0);

  return (
    <Screen>
      <ScreenHead label="Inventory" title="What you carry" />

      {items.loading ? (
        <div className="grid grid-cols-2 gap-2">
          <Skeleton h={132} /><Skeleton h={132} /><Skeleton h={132} /><Skeleton h={132} />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          line="Nothing collected yet. Reach a point on a walk and it lands here."
          action={<Button>Find a trot</Button>}
        />
      ) : (
        <>
          <div className="flex items-center gap-3 pb-4">
            <Data size="lg" className="text-ink">{total}</Data>
            <Label>items from {list.length} kinds</Label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {list.map((i) => (
              <Card key={i.id} inset={false} className="overflow-hidden">
                <Plate ratio="1/1" label={i.category} className="border-0 border-b border-rule" />
                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase leading-tight tracking-[0.04em] text-ink">
                      {i.name}
                    </p>
                    <Data className="shrink-0 text-stone">×{i.count}</Data>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-mute">
                    <Mark name={i.group} size={12} />
                    <Data className="text-[10px] uppercase">{i.townland}</Data>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
