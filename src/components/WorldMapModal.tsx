import { Compass, MapPin, Navigation, X } from 'lucide-react';
import { INTERACTIVE_STATIONS, WORLD_LOCATIONS } from '../data/worldLocations';
import { LocationId } from '../types/game';

interface WorldMapModalProps {
  playerX: number;
  playerZ: number;
  visitedLocations: LocationId[];
  activeWaypoint: LocationId | null;
  onSelectWaypoint: (id: LocationId | null) => void;
  onFastTravel: (x: number, y: number, z: number, id: LocationId) => void;
  onClose: () => void;
}

const PERIMETER_LINKS: [[number, number], [number, number]][] = [
  [[-13, -15], [-24.5, -10]], // Gym <-> Player Home
  [[-34, -2], [-25, 19]], // Player Home <-> Nutrition Center
  [[-16, 26], [13.5, 27.5]], // Nutrition Center <-> Arena
  [[34, 11.5], [26.5, 15.5]], // Outdoor Park <-> Arena
  [[13, -17], [22.5, -11.5]], // Gym <-> Outdoor Park
];

export function WorldMapModal({
  playerX,
  playerZ,
  visitedLocations,
  activeWaypoint,
  onSelectWaypoint,
  onFastTravel,
  onClose,
}: WorldMapModalProps) {
  // Campus bounds [-64, 64] mapped to percentage 0..100
  const toPct = (val: number) => ((val + 64) / 128) * 100;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-4xl rounded-2xl bg-[#111713] border border-white/15 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080B09]">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-[#C7FF00]" />
            <div>
              <h3 className="font-display text-lg font-bold text-white">FITFORM Campus Map</h3>
              <p className="text-xs text-[#A5ACA6]">
                Click a district to set a 3D navigation beacon or fast-travel to discovered locations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 text-[#A5ACA6] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-y-auto">
          {/* Interactive 2D Top-Down Campus Schematic */}
          <div className="lg:col-span-2 relative aspect-square max-h-[460px] w-full mx-auto rounded-xl bg-[#0c140f] border border-white/15 overflow-hidden">
            {/* Coordinate Grid, District Footprints & Connected Pathways */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {[20, 40, 60, 80].map((v) => (
                <g key={v} opacity="0.2">
                  <line x1={v} y1={0} x2={v} y2={100} stroke="#8DAF26" strokeWidth="0.25" />
                  <line x1={0} y1={v} x2={100} y2={v} stroke="#8DAF26" strokeWidth="0.25" />
                </g>
              ))}

              {/* Perimeter Inter-District Loop Trails */}
              {PERIMETER_LINKS.map(([a, b], idx) => (
                <line
                  key={`loop_${idx}`}
                  x1={toPct(a[0])}
                  y1={toPct(a[1])}
                  x2={toPct(b[0])}
                  y2={toPct(b[1])}
                  stroke="#36463b"
                  strokeWidth="1.2"
                  strokeDasharray="1.8 1.2"
                />
              ))}

              {/* Connecting Radial Avenues from Central Plaza (0, 5) */}
              {WORLD_LOCATIONS.map((loc) => (
                <line
                  key={loc.id}
                  x1={toPct(0)}
                  y1={toPct(5)}
                  x2={toPct(loc.x)}
                  y2={toPct(loc.z)}
                  stroke="#425448"
                  strokeWidth="1.8"
                />
              ))}

              {/* Subtle District Building / Ground Footprints */}
              <circle cx={toPct(0)} cy={toPct(5)} r={6.6} fill="#1b2620" stroke="#C7FF00" strokeWidth="0.35" opacity="0.8" />
              <rect x={toPct(-13)} y={toPct(-28)} width={toPct(13) - toPct(-13)} height={toPct(-8) - toPct(-28)} rx="1" fill="#18241d" stroke="#C7FF00" strokeWidth="0.35" opacity="0.7" />
              <ellipse cx={toPct(36)} cy={toPct(-2)} rx={10.5} ry={15} fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.45" />
              <circle cx={toPct(48.2)} cy={toPct(10.5)} r={3.4} fill="#0369a1" opacity="0.65" />
              <rect x={toPct(-42)} y={toPct(-16.25)} width={toPct(-26) - toPct(-42)} height={toPct(-3.75) - toPct(-16.25)} rx="1" fill="#1f1c2c" stroke="#a78bfa" strokeWidth="0.35" opacity="0.75" />
              <rect x={toPct(-32.25)} y={toPct(19.25)} width={toPct(-15.75) - toPct(-32.25)} height={toPct(32.75) - toPct(19.25)} rx="1" fill="#15261e" stroke="#34d399" strokeWidth="0.35" opacity="0.75" />
              <circle cx={toPct(26)} cy={toPct(28)} r={10.5} fill="#261c16" stroke="#f97316" strokeWidth="0.5" opacity="0.75" />
            </svg>

            {/* Location Markers */}
            {WORLD_LOCATIONS.map((loc) => {
              const isSelected = activeWaypoint === loc.id;
              const visited = visitedLocations.includes(loc.id);
              return (
                <button
                  key={loc.id}
                  onClick={() => onSelectWaypoint(isSelected ? null : loc.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${toPct(loc.x)}%`, top: `${toPct(loc.z)}%` }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition ${
                      isSelected
                        ? 'scale-115 border-white bg-[#C7FF00] text-[#080B09]'
                        : 'border-white/50 bg-[#111713] text-white group-hover:scale-110'
                    }`}
                    style={!isSelected ? { borderColor: loc.accentColor } : undefined}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded bg-[#080B09]/95 border border-white/15 text-[10px] font-semibold text-white whitespace-nowrap">
                    {loc.shortName} {!visited && '· New'}
                  </div>
                </button>
              );
            })}

            {/* Player Dot */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#C7FF00] shadow"
              style={{ left: `${toPct(playerX)}%`, top: `${toPct(playerZ)}%` }}
              title="Your Athlete"
            />
          </div>

          {/* Location List & Waypoint Controls */}
          <div className="space-y-2.5">
            {WORLD_LOCATIONS.map((loc) => {
              const isWaypoint = activeWaypoint === loc.id;
              const isVisited = visitedLocations.includes(loc.id);
              const stationCount = INTERACTIVE_STATIONS.filter((s) => s.locationId === loc.id).length;
              return (
                <div
                  key={loc.id}
                  className={`p-3 rounded-xl border ${
                    isWaypoint ? 'bg-[#18221b] border-[#C7FF00]' : 'bg-[#080B09] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold text-sm text-white">{loc.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono-num text-[#A5ACA6]">
                        {stationCount} {stationCount === 1 ? 'hub' : 'hubs'}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: loc.accentColor }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#A5ACA6] mt-1">{loc.description}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => onSelectWaypoint(isWaypoint ? null : loc.id)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        isWaypoint
                          ? 'bg-[#C7FF00] text-[#080B09]'
                          : 'bg-[#111713] border border-white/15 text-white hover:border-[#C7FF00]'
                      }`}
                    >
                      <Navigation className="w-3 h-3" />
                      {isWaypoint ? 'Clear Marker' : 'Set Waypoint'}
                    </button>
                    {isVisited && (
                      <button
                        onClick={() => {
                          onFastTravel(
                            loc.spawnX ?? loc.x,
                            loc.spawnY ?? 0,
                            loc.spawnZ ?? loc.z + 6,
                            loc.id,
                          );
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-[#A5ACA6] hover:text-white cursor-pointer"
                      >
                        Go Here
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
