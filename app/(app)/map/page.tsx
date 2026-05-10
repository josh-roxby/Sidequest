import { IllustratedMap } from "@/components/illustrations/IllustratedMap";
import { MapTopBar } from "@/components/domain/map/MapTopBar";
import { MapSideControls } from "@/components/domain/map/MapSideControls";
import { MapBottomCard } from "@/components/domain/map/MapBottomCard";
import { LiveDot } from "@/components/domain/map/LiveDot";
import { PinDoor, PinFlower, PinLeaf } from "@/components/marks/Pins";

export default function MapScreen() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-map-paper">
      <IllustratedMap className="h-full w-full">
        {/* Pins are positioned absolutely against the IllustratedMap's
         *  intrinsic 400x700 viewBox coords. Until we wire a real map
         *  provider these are visual placeholders. */}
        <div className="absolute" style={{ left: "26%", top: "24%" }}>
          <PinFlower size={28} />
        </div>
        <div className="absolute" style={{ left: "66%", top: "44%" }}>
          <PinLeaf size={26} />
        </div>
        <div className="absolute" style={{ left: "62%", top: "78%" }}>
          <PinDoor size={26} />
        </div>

        {/* Current position dot — start of the route */}
        <div className="absolute" style={{ left: "28%", top: "80%" }}>
          <LiveDot />
        </div>
      </IllustratedMap>

      <MapTopBar distance="2.5 km" />
      <MapSideControls />
      <MapBottomCard
        walkName="Lakeside Loop"
        distance="2.5 km"
        duration="32 min"
        difficulty="Easy"
        progress={0.3}
      />
    </div>
  );
}
