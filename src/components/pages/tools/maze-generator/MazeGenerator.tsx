import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  forwardRef,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image as ImageIcon, FileCode2, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type CellWalls = { N: boolean; E: boolean; S: boolean; W: boolean };

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

type MazeDir = 'N' | 'E' | 'S' | 'W';

type MazeEndpoint = { x: number; y: number; side: MazeDir };

const SIDE_ORDER: MazeDir[] = ['N', 'E', 'S', 'W'];

function maxSlotAlongSide(side: MazeDir, w: number, h: number): number {
  return side === 'N' || side === 'S' ? w - 1 : h - 1;
}

/** Opening on the maze perimeter: `side` + index along that edge (0 = top-left along the edge). */
function parseMazeEndpoint(
  side: MazeDir,
  slotStr: string,
  w: number,
  h: number
): MazeEndpoint {
  const max = maxSlotAlongSide(side, w, h);
  let slot = parseInt(slotStr, 10);
  if (Number.isNaN(slot)) slot = 0;
  slot = Math.max(0, Math.min(max, slot));
  switch (side) {
    case 'N':
      return { x: slot, y: 0, side };
    case 'S':
      return { x: slot, y: h - 1, side };
    case 'W':
      return { x: 0, y: slot, side };
    case 'E':
      return { x: w - 1, y: slot, side };
  }
}

function sameMazeCell(a: MazeEndpoint, b: MazeEndpoint) {
  return a.x === b.x && a.y === b.y;
}

function openOuterWall(grid: CellWalls[][], ep: MazeEndpoint) {
  const c = grid[ep.y][ep.x];
  if (ep.side === 'N') c.N = false;
  else if (ep.side === 'S') c.S = false;
  else if (ep.side === 'W') c.W = false;
  else c.E = false;
}

/** Recursive backtracking: perfect maze (one path between any two cells). */
function generateMaze(
  width: number,
  height: number,
  entrance: MazeEndpoint,
  exit: MazeEndpoint
): CellWalls[][] {
  const w = Math.max(3, Math.min(45, width));
  const h = Math.max(3, Math.min(45, height));

  const grid: CellWalls[][] = [];
  for (let y = 0; y < h; y++) {
    grid[y] = [];
    for (let x = 0; x < w; x++) {
      grid[y][x] = { N: true, E: true, S: true, W: true };
    }
  }

  const visited: boolean[][] = Array(h)
    .fill(null)
    .map(() => Array(w).fill(false));

  type Neighbor = readonly [number, number, MazeDir];

  function neighbors(cx: number, cy: number): Neighbor[] {
    const n: Neighbor[] = [];
    if (cy > 0) n.push([cx, cy - 1, 'N']);
    if (cx < w - 1) n.push([cx + 1, cy, 'E']);
    if (cy < h - 1) n.push([cx, cy + 1, 'S']);
    if (cx > 0) n.push([cx - 1, cy, 'W']);
    return n;
  }

  const stack: [number, number][] = [];
  let cx = entrance.x;
  let cy = entrance.y;
  visited[cy][cx] = true;
  stack.push([cx, cy]);

  while (stack.length) {
    [cx, cy] = stack[stack.length - 1];
    const dirs = neighbors(cx, cy).filter(([nx, ny]) => !visited[ny][nx]);
    if (!dirs.length) {
      stack.pop();
      continue;
    }
    shuffleInPlace(dirs);
    const [nx, ny, dir] = dirs[0];
    visited[ny][nx] = true;
    if (dir === 'N') {
      grid[cy][cx].N = false;
      grid[ny][nx].S = false;
    } else if (dir === 'E') {
      grid[cy][cx].E = false;
      grid[ny][nx].W = false;
    } else if (dir === 'S') {
      grid[cy][cx].S = false;
      grid[ny][nx].N = false;
    } else {
      grid[cy][cx].W = false;
      grid[ny][nx].E = false;
    }
    stack.push([nx, ny]);
  }

  openOuterWall(grid, entrance);
  openOuterWall(grid, exit);

  return grid;
}

function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

/** BFS from start to goal using passage data in `grid`. */
function findSolutionPath(
  grid: CellWalls[][],
  start: { x: number; y: number },
  goal: { x: number; y: number }
): [number, number][] | null {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  if (!w || !h) return null;
  if (start.x === goal.x && start.y === goal.y) {
    return [[start.x, start.y]];
  }

  const goalX = goal.x;
  const goalY = goal.y;
  const parent = new Map<string, [number, number]>();
  const queue: [number, number][] = [[start.x, start.y]];
  const seen = new Set<string>([cellKey(start.x, start.y)]);

  const neighbors = (x: number, y: number): [number, number][] => {
    const c = grid[y][x];
    const out: [number, number][] = [];
    if (!c.N && y > 0) out.push([x, y - 1]);
    if (!c.E && x < w - 1) out.push([x + 1, y]);
    if (!c.S && y < h - 1) out.push([x, y + 1]);
    if (!c.W && x > 0) out.push([x - 1, y]);
    return out;
  };

  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (x === goalX && y === goalY) {
      const path: [number, number][] = [];
      let cx = x;
      let cy = y;
      while (true) {
        path.push([cx, cy]);
        const k = cellKey(cx, cy);
        const p = parent.get(k);
        if (!p) break;
        [cx, cy] = p;
      }
      path.reverse();
      return path;
    }
    for (const [nx, ny] of neighbors(x, y)) {
      const nk = cellKey(nx, ny);
      if (seen.has(nk)) continue;
      seen.add(nk);
      parent.set(nk, [x, y]);
      queue.push([nx, ny]);
    }
  }

  return null;
}

/** Steps = number of moves (edges) along the unique solution. */
function solutionStepCount(
  grid: CellWalls[][],
  start: { x: number; y: number },
  goal: { x: number; y: number }
): number | null {
  const path = findSolutionPath(grid, start, goal);
  if (!path?.length) return null;
  return path.length - 1;
}

/**
 * Builds several random mazes and picks one whose solution length matches `difficulty`:
 * 0 ≈ shortest path among samples, 100 ≈ longest (more travel from entrance to exit).
 */
function pickMazeByTravelDifficulty(
  width: number,
  height: number,
  difficulty: number,
  entrance: MazeEndpoint,
  exit: MazeEndpoint
): CellWalls[][] {
  const w = Math.max(3, Math.min(45, width));
  const h = Math.max(3, Math.min(45, height));
  const d = Math.max(0, Math.min(100, difficulty));
  const cells = w * h;
  const sampleCount =
    cells > 1200 ? 10 : cells > 600 ? 14 : cells > 300 ? 20 : 24;

  type Cand = { grid: CellWalls[][]; steps: number };
  const start = { x: entrance.x, y: entrance.y };
  const goal = { x: exit.x, y: exit.y };

  const pool: Cand[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const g = generateMaze(w, h, entrance, exit);
    const steps = solutionStepCount(g, start, goal);
    if (steps !== null) pool.push({ grid: g, steps });
  }

  if (!pool.length) {
    return generateMaze(w, h, entrance, exit);
  }

  pool.sort((a, b) => a.steps - b.steps);
  const idx = Math.round(((pool.length - 1) * d) / 100);
  return pool[idx].grid;
}

function buildAxisSizes(cellCount: number, corridorU: number, wallU: number) {
  return Array.from({ length: cellCount * 2 + 1 }, (_, index) =>
    index % 2 === 0 ? wallU : corridorU
  );
}

function buildAxisOffsets(sizes: number[]) {
  const offsets: number[] = [];
  let total = 0;
  for (const size of sizes) {
    offsets.push(total);
    total += size;
  }
  return { offsets, total };
}

function buildMazeWallMask(grid: CellWalls[][]): boolean[][] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const mask = Array.from({ length: h * 2 + 1 }, () =>
    Array(w * 2 + 1).fill(true)
  );

  if (!w || !h) {
    return mask;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      mask[y * 2 + 1][x * 2 + 1] = false;
      if (!c.N) mask[y * 2][x * 2 + 1] = false;
      if (!c.E) mask[y * 2 + 1][x * 2 + 2] = false;
      if (!c.S) mask[y * 2 + 2][x * 2 + 1] = false;
      if (!c.W) mask[y * 2 + 1][x * 2] = false;
    }
  }

  return mask;
}

function mazeWallDrawElements(
  grid: CellWalls[][],
  corridorU: number,
  wallU: number,
  wallFill: string
): ReactNode[] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  if (!w || !h) {
    return [];
  }

  const mask = buildMazeWallMask(grid);
  const xSizes = buildAxisSizes(w, corridorU, wallU);
  const ySizes = buildAxisSizes(h, corridorU, wallU);
  const { offsets: xOffsets } = buildAxisOffsets(xSizes);
  const { offsets: yOffsets } = buildAxisOffsets(ySizes);

  const els: ReactNode[] = [];
  let key = 0;

  for (let y = 0; y < mask.length; y++) {
    for (let x = 0; x < mask[y].length; x++) {
      if (!mask[y][x]) {
        continue;
      }
      els.push(
        <rect
          key={`wall-${key++}`}
          x={xOffsets[x]}
          y={yOffsets[y]}
          width={xSizes[x]}
          height={ySizes[y]}
          fill={wallFill}
        />
      );
    }
  }

  return els;
}

function cloneSvgForExport(
  svg: SVGSVGElement,
  includeSolution: boolean
): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!includeSolution) {
    clone.querySelectorAll('polyline').forEach((el) => el.remove());
  }
  return clone;
}

function getMazeViewBoxSize(
  w: number,
  h: number,
  corridorU: number,
  wallU: number
) {
  const xSizes = buildAxisSizes(w, corridorU, wallU);
  const ySizes = buildAxisSizes(h, corridorU, wallU);
  return {
    vbW: buildAxisOffsets(xSizes).total,
    vbH: buildAxisOffsets(ySizes).total,
  };
}

function solutionStrokeForCorridor(corridorU: number) {
  return Math.max(3, corridorU < 12 ? 3 : Math.round(corridorU * 0.22));
}

type MazeGridProps = {
  grid: CellWalls[][];
  ariaLabel: string;
  solutionPath: [number, number][] | null;
  showSolution: boolean;
  corridorU: number;
  wallU: number;
  wallColor: string;
  passageColor: string;
  transparentPassage: boolean;
  solutionColor: string;
};

const MazeGrid = forwardRef<SVGSVGElement, MazeGridProps>(function MazeGrid(
  {
    grid,
    ariaLabel,
    solutionPath,
    showSolution,
    corridorU,
    wallU,
    wallColor,
    passageColor,
    transparentPassage,
    solutionColor,
  },
  ref
) {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const xSizes = useMemo(
    () => buildAxisSizes(w, corridorU, wallU),
    [w, corridorU, wallU]
  );
  const ySizes = useMemo(
    () => buildAxisSizes(h, corridorU, wallU),
    [h, corridorU, wallU]
  );
  const { offsets: xOffsets, total: vbW } = useMemo(
    () => buildAxisOffsets(xSizes),
    [xSizes]
  );
  const { offsets: yOffsets, total: vbH } = useMemo(
    () => buildAxisOffsets(ySizes),
    [ySizes]
  );
  const pathStrokeU = useMemo(
    () => solutionStrokeForCorridor(corridorU),
    [corridorU]
  );
  const pointsAttr = solutionPath?.length
    ? solutionPath
        .map(
          ([x, y]) =>
            `${xOffsets[x * 2 + 1] + corridorU / 2},${
              yOffsets[y * 2 + 1] + corridorU / 2
            }`
        )
        .join(' ')
    : '';

  const wallRects = useMemo(
    () => mazeWallDrawElements(grid, corridorU, wallU, wallColor),
    [grid, corridorU, wallU, wallColor]
  );

  if (!w || !h) return null;

  return (
    <div
      className="w-full overflow-x-auto rounded-md border bg-muted/30 p-3"
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="mx-auto block h-auto w-full max-w-[min(100%,720px)]"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        {!transparentPassage ? (
          <rect
            x={0}
            y={0}
            width={vbW}
            height={vbH}
            fill={passageColor}
            stroke="none"
          />
        ) : null}
        <g shapeRendering="crispEdges" stroke="none">
          {wallRects}
        </g>
        {pointsAttr ? (
          <polyline
            className={cn(
              'pointer-events-none transition-opacity duration-150',
              showSolution ? 'opacity-100' : 'opacity-0'
            )}
            shapeRendering="geometricPrecision"
            points={pointsAttr}
            fill="none"
            stroke={solutionColor}
            strokeWidth={pathStrokeU}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          />
        ) : null}
      </svg>
    </div>
  );
});

const DEFAULT_WALL_COLOR = '#fafafa';
const DEFAULT_PASSAGE_COLOR = '#09090b';
const DEFAULT_SOLUTION_COLOR = '#dc2626';

export default function MazeGenerator() {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [widthInput, setWidthInput] = useState('12');
  const [heightInput, setHeightInput] = useState('12');
  const [difficulty, setDifficulty] = useState(65);
  const [entranceSide, setEntranceSide] = useState<MazeDir>('N');
  const [entranceSlotIndex, setEntranceSlotIndex] = useState(0);
  const [exitSide, setExitSide] = useState<MazeDir>('S');
  const [exitSlotIndex, setExitSlotIndex] = useState(11);
  const [grid, setGrid] = useState<CellWalls[][]>(() => {
    const w = 12;
    const h = 12;
    return pickMazeByTravelDifficulty(
      w,
      h,
      65,
      parseMazeEndpoint('N', '0', w, h),
      parseMazeEndpoint('S', String(w - 1), w, h)
    );
  });
  const [appliedEntrance, setAppliedEntrance] = useState<MazeEndpoint>(() =>
    parseMazeEndpoint('N', '0', 12, 12)
  );
  const [appliedExit, setAppliedExit] = useState<MazeEndpoint>(() =>
    parseMazeEndpoint('S', String(11), 12, 12)
  );
  const [showSolution, setShowSolution] = useState(false);
  const [wallU, setWallU] = useState(8);
  const [corridorU, setCorridorU] = useState(24);
  const [wallColor, setWallColor] = useState(DEFAULT_WALL_COLOR);
  const [passageColor, setPassageColor] = useState(DEFAULT_PASSAGE_COLOR);
  const [solutionColor, setSolutionColor] = useState(DEFAULT_SOLUTION_COLOR);
  const [transparentPassage, setTransparentPassage] = useState(false);

  const parseDim = (value: string, fallback: number) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.max(3, Math.min(45, n));
  };

  const nextW = parseDim(widthInput, 12);
  const nextH = parseDim(heightInput, 12);

  useEffect(() => {
    setEntranceSlotIndex((i) =>
      Math.min(i, maxSlotAlongSide(entranceSide, nextW, nextH))
    );
    setExitSlotIndex((i) =>
      Math.min(i, maxSlotAlongSide(exitSide, nextW, nextH))
    );
  }, [entranceSide, exitSide, nextW, nextH]);

  const regenerate = useCallback(() => {
    const w = parseDim(widthInput, 12);
    const h = parseDim(heightInput, 12);
    setWidthInput(String(w));
    setHeightInput(String(h));
    const ent = parseMazeEndpoint(
      entranceSide,
      String(entranceSlotIndex),
      w,
      h
    );
    const ex = parseMazeEndpoint(exitSide, String(exitSlotIndex), w, h);
    if (sameMazeCell(ent, ex)) {
      toast.error(t('mazeGenerator.sameEntranceExit'));
      return;
    }
    setAppliedEntrance(ent);
    setAppliedExit(ex);
    setGrid(pickMazeByTravelDifficulty(w, h, difficulty, ent, ex));
  }, [
    widthInput,
    heightInput,
    difficulty,
    entranceSide,
    entranceSlotIndex,
    exitSide,
    exitSlotIndex,
    t,
  ]);

  const summary = useMemo(() => {
    const w = grid[0]?.length ?? 0;
    const h = grid.length;
    return t('mazeGenerator.mazeSummary', { width: w, height: h });
  }, [grid, t]);

  const gw = grid[0]?.length ?? 0;
  const gh = grid.length;

  const solutionPath = useMemo(() => {
    if (!gw || !gh) return null;
    return findSolutionPath(grid, appliedEntrance, appliedExit);
  }, [grid, appliedEntrance, appliedExit, gw, gh]);

  const solutionStepsLine = useMemo(() => {
    if (!gw || !gh || !solutionPath?.length) return null;
    const steps = solutionPath.length - 1;
    const minSteps =
      Math.abs(appliedExit.x - appliedEntrance.x) +
      Math.abs(appliedExit.y - appliedEntrance.y);
    return t('mazeGenerator.solutionSteps', { steps, minSteps });
  }, [gw, gh, appliedEntrance, appliedExit, solutionPath, t]);

  const edgeAccessibilityEntrance = useMemo(() => {
    const slot =
      appliedEntrance.side === 'N' || appliedEntrance.side === 'S'
        ? appliedEntrance.x
        : appliedEntrance.y;
    const edgeKey =
      appliedEntrance.side === 'N'
        ? 'mazeGenerator.edgeNorth'
        : appliedEntrance.side === 'S'
          ? 'mazeGenerator.edgeSouth'
          : appliedEntrance.side === 'E'
            ? 'mazeGenerator.edgeEast'
            : 'mazeGenerator.edgeWest';
    const originKey =
      appliedEntrance.side === 'N' || appliedEntrance.side === 'S'
        ? 'mazeGenerator.fromLeft'
        : 'mazeGenerator.fromTop';
    return t('mazeGenerator.positionOnEdge', {
      edge: t(edgeKey),
      slot,
      origin: t(originKey),
    });
  }, [appliedEntrance, t]);

  const edgeAccessibilityExit = useMemo(() => {
    const slot =
      appliedExit.side === 'N' || appliedExit.side === 'S'
        ? appliedExit.x
        : appliedExit.y;
    const edgeKey =
      appliedExit.side === 'N'
        ? 'mazeGenerator.edgeNorth'
        : appliedExit.side === 'S'
          ? 'mazeGenerator.edgeSouth'
          : appliedExit.side === 'E'
            ? 'mazeGenerator.edgeEast'
            : 'mazeGenerator.edgeWest';
    const originKey =
      appliedExit.side === 'N' || appliedExit.side === 'S'
        ? 'mazeGenerator.fromLeft'
        : 'mazeGenerator.fromTop';
    return t('mazeGenerator.positionOnEdge', {
      edge: t(edgeKey),
      slot,
      origin: t(originKey),
    });
  }, [appliedExit, t]);

  const mazeAriaLabel = useMemo(() => {
    const placement = t('mazeGenerator.mazeAccessibilityNote', {
      entrance: edgeAccessibilityEntrance,
      exit: edgeAccessibilityExit,
    });
    const base = `${summary}${
      solutionStepsLine ? ` ${solutionStepsLine}` : ''
    } ${placement}`;
    if (!showSolution) return base;
    return `${base} ${t('mazeGenerator.solutionShownAria')}`;
  }, [
    showSolution,
    solutionStepsLine,
    summary,
    edgeAccessibilityEntrance,
    edgeAccessibilityExit,
    t,
  ]);

  const entranceSlotMax = maxSlotAlongSide(entranceSide, nextW, nextH);
  const exitSlotMax = maxSlotAlongSide(exitSide, nextW, nextH);

  const sideLabelKey: Record<MazeDir, string> = {
    N: 'mazeGenerator.sideNorth',
    E: 'mazeGenerator.sideEast',
    S: 'mazeGenerator.sideSouth',
    W: 'mazeGenerator.sideWest',
  };

  const clampWallU = useCallback((n: number) => {
    if (Number.isNaN(n)) return 8;
    return Math.max(2, Math.min(24, Math.round(n)));
  }, []);

  const clampCorridorU = useCallback((n: number) => {
    if (Number.isNaN(n)) return 24;
    return Math.max(6, Math.min(56, Math.round(n)));
  }, []);

  const copyMazePng = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg || !gw || !gh) {
      toast.error(t('mazeGenerator.copyImageError'));
      return;
    }
    if (!navigator.clipboard?.write || !window.ClipboardItem) {
      toast.error(t('mazeGenerator.copyNotSupported'));
      return;
    }
    try {
      const clone = cloneSvgForExport(svg, showSolution);
      const xml = new XMLSerializer().serializeToString(clone);
      const withNs = xml.includes('xmlns=')
        ? xml
        : xml.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      const blobUrl = URL.createObjectURL(
        new Blob([withNs], { type: 'image/svg+xml;charset=utf-8' })
      );
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('img'));
        img.src = blobUrl;
      });
      const { vbW, vbH } = getMazeViewBoxSize(gw, gh, corridorU, wallU);
      const scale = 3;
      const canvas = document.createElement('canvas');
      canvas.width = vbW * scale;
      canvas.height = vbH * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2d');
      if (!transparentPassage) {
        ctx.fillStyle = passageColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(blobUrl);
      const pngBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!pngBlob) throw new Error('png');
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      toast.success(t('mazeGenerator.copyImageSuccess'));
    } catch {
      toast.error(t('mazeGenerator.copyImageError'));
    }
  }, [
    corridorU,
    gw,
    gh,
    passageColor,
    showSolution,
    t,
    transparentPassage,
    wallU,
  ]);

  const copyMazeSvg = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) {
      toast.error(t('mazeGenerator.copySvgError'));
      return;
    }
    try {
      const clone = cloneSvgForExport(svg, showSolution);
      let out = new XMLSerializer().serializeToString(clone);
      if (!out.includes('xmlns=')) {
        out = out.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      }
      await navigator.clipboard.writeText(out);
      toast.success(t('mazeGenerator.copySvgSuccess'));
    } catch {
      toast.error(t('mazeGenerator.copySvgError'));
    }
  }, [showSolution, t]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 lg:max-w-7xl">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          {t('mazeGenerator.title')}
        </h1>
        <p className="text-muted-foreground text-xl leading-7 not-first:mt-6">
          {t('mazeGenerator.description')}
        </p>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
          <div className="min-w-0 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="maze-width">{t('mazeGenerator.width')}</Label>
            <Input
              id="maze-width"
              type="number"
              min={3}
              max={45}
              inputMode="numeric"
              className="h-11"
              value={widthInput}
              onChange={(e) => setWidthInput(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maze-height">{t('mazeGenerator.height')}</Label>
            <Input
              id="maze-height"
              type="number"
              min={3}
              max={45}
              inputMode="numeric"
              className="h-11"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            {t('mazeGenerator.entranceAndExit')}
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="space-y-3">
              <p className="text-sm leading-none font-medium">
                {t('mazeGenerator.entrance')}
              </p>
              <Select
                value={entranceSide}
                onValueChange={(v) => setEntranceSide(v as MazeDir)}
              >
                <SelectTrigger className="h-11 w-full" id="maze-entrance-side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIDE_ORDER.map((d) => (
                    <SelectItem key={d} value={d}>
                      {t(sideLabelKey[d])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground text-sm">
                    {t('mazeGenerator.positionAlongEdge')}
                  </span>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {entranceSlotIndex}
                  </span>
                </div>
                <input
                  id="maze-entrance-slot"
                  type="range"
                  min={0}
                  max={entranceSlotMax}
                  step={1}
                  value={entranceSlotIndex}
                  onChange={(e) =>
                    setEntranceSlotIndex(Number(e.target.value))
                  }
                  aria-label={t('mazeGenerator.entranceSlotAria')}
                  className={cn(
                    'h-11 w-full cursor-pointer touch-manipulation',
                    'accent-primary'
                  )}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {t('mazeGenerator.slotHint', { max: entranceSlotMax })}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm leading-none font-medium">
                {t('mazeGenerator.exit')}
              </p>
              <Select
                value={exitSide}
                onValueChange={(v) => setExitSide(v as MazeDir)}
              >
                <SelectTrigger className="h-11 w-full" id="maze-exit-side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIDE_ORDER.map((d) => (
                    <SelectItem key={d} value={d}>
                      {t(sideLabelKey[d])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground text-sm">
                    {t('mazeGenerator.positionAlongEdge')}
                  </span>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {exitSlotIndex}
                  </span>
                </div>
                <input
                  id="maze-exit-slot"
                  type="range"
                  min={0}
                  max={exitSlotMax}
                  step={1}
                  value={exitSlotIndex}
                  onChange={(e) =>
                    setExitSlotIndex(Number(e.target.value))
                  }
                  aria-label={t('mazeGenerator.exitSlotAria')}
                  className={cn(
                    'h-11 w-full cursor-pointer touch-manipulation',
                    'accent-primary'
                  )}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {t('mazeGenerator.slotHint', { max: exitSlotMax })}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('mazeGenerator.entranceExitHint')}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="maze-difficulty">{t('mazeGenerator.difficulty')}</Label>
            <span className="text-muted-foreground text-sm tabular-nums">
              {difficulty}
            </span>
          </div>
          <input
            id="maze-difficulty"
            type="range"
            min={0}
            max={100}
            step={1}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className={cn(
              'h-11 w-full cursor-pointer touch-manipulation',
              'accent-primary'
            )}
          />
          <p className="text-muted-foreground text-sm">
            {t('mazeGenerator.difficultyHint')}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            {t('mazeGenerator.lookAndExport')}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maze-wall-u">{t('mazeGenerator.wallThickness')}</Label>
              <Input
                id="maze-wall-u"
                type="number"
                min={2}
                max={24}
                inputMode="numeric"
                className="h-11"
                value={wallU}
                onChange={(e) => setWallU(clampWallU(Number(e.target.value)))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maze-corridor-u">
                {t('mazeGenerator.corridorWidth')}
              </Label>
              <Input
                id="maze-corridor-u"
                type="number"
                min={6}
                max={56}
                inputMode="numeric"
                className="h-11"
                value={corridorU}
                onChange={(e) =>
                  setCorridorU(clampCorridorU(Number(e.target.value)))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maze-color-wall">{t('mazeGenerator.wallColor')}</Label>
              <Input
                id="maze-color-wall"
                type="color"
                className="h-11 w-full cursor-pointer p-1"
                value={wallColor}
                onChange={(e) => setWallColor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maze-color-passage">
                {t('mazeGenerator.passageColor')}
              </Label>
              <Input
                id="maze-color-passage"
                type="color"
                className="h-11 w-full cursor-pointer p-1"
                value={passageColor}
                onChange={(e) => setPassageColor(e.target.value)}
                disabled={transparentPassage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maze-color-solution">
                {t('mazeGenerator.solutionColor')}
              </Label>
              <Input
                id="maze-color-solution"
                type="color"
                className="h-11 w-full cursor-pointer p-1"
                value={solutionColor}
                onChange={(e) => setSolutionColor(e.target.value)}
              />
            </div>
            <div className="flex min-h-11 items-center gap-3 sm:col-span-2">
              <Checkbox
                id="maze-transparent-passage"
                checked={transparentPassage}
                onCheckedChange={(v) => setTransparentPassage(v === true)}
                className="size-5 shrink-0"
              />
              <Label
                htmlFor="maze-transparent-passage"
                className="text-sm leading-none font-medium cursor-pointer"
              >
                {t('mazeGenerator.transparentPassage')}
              </Label>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('mazeGenerator.lookHint')}
          </p>
        </div>

        <Button
          type="button"
          className="h-11 w-full gap-2 sm:w-auto"
          onClick={regenerate}
        >
          <Shuffle className="h-4 w-4" />
          {t('mazeGenerator.regenerate')}
        </Button>
          </div>

          <div className="min-w-0 space-y-4 lg:sticky lg:top-4">
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox
                id="maze-show-solution"
                checked={showSolution}
                onCheckedChange={(v) => setShowSolution(v === true)}
                className="size-5 shrink-0"
              />
              <Label
                htmlFor="maze-show-solution"
                className="text-sm leading-none font-medium cursor-pointer"
              >
                {t('mazeGenerator.showSolution')}
              </Label>
            </div>

            <MazeGrid
              ref={svgRef}
              grid={grid}
              ariaLabel={mazeAriaLabel}
              solutionPath={solutionPath}
              showSolution={showSolution}
              corridorU={corridorU}
              wallU={wallU}
              wallColor={wallColor}
              passageColor={passageColor}
              transparentPassage={transparentPassage}
              solutionColor={solutionColor}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="secondary"
                className="h-11 gap-2 sm:w-auto"
                onClick={() => void copyMazePng()}
              >
                <ImageIcon className="h-4 w-4" />
                {t('mazeGenerator.copyImage')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-11 gap-2 sm:w-auto"
                onClick={() => void copyMazeSvg()}
              >
                <FileCode2 className="h-4 w-4" />
                {t('mazeGenerator.copySvg')}
              </Button>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">{summary}</p>
              {solutionStepsLine ? (
                <p className="text-muted-foreground text-sm">
                  {solutionStepsLine}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
