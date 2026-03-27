import {
  useCallback,
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

/** Recursive backtracking: perfect maze (one path between any two cells). */
function generateMaze(width: number, height: number): CellWalls[][] {
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
  let cx = 0;
  let cy = 0;
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

  grid[0][0].N = false;
  grid[h - 1][w - 1].S = false;

  return grid;
}

function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

/** BFS from (0,0) to (w-1,h-1) using passage data in `grid`. */
function findSolutionPath(grid: CellWalls[][]): [number, number][] | null {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  if (!w || !h) return null;

  const goalX = w - 1;
  const goalY = h - 1;
  const parent = new Map<string, [number, number]>();
  const queue: [number, number][] = [[0, 0]];
  const seen = new Set<string>([cellKey(0, 0)]);

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
function solutionStepCount(grid: CellWalls[][]): number | null {
  const path = findSolutionPath(grid);
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
  difficulty: number
): CellWalls[][] {
  const w = Math.max(3, Math.min(45, width));
  const h = Math.max(3, Math.min(45, height));
  const d = Math.max(0, Math.min(100, difficulty));
  const cells = w * h;
  const sampleCount =
    cells > 1200 ? 10 : cells > 600 ? 14 : cells > 300 ? 20 : 24;

  type Cand = { grid: CellWalls[][]; steps: number };

  const pool: Cand[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const g = generateMaze(w, h);
    const steps = solutionStepCount(g);
    if (steps !== null) pool.push({ grid: g, steps });
  }

  if (!pool.length) {
    return generateMaze(w, h);
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
  const [grid, setGrid] = useState<CellWalls[][]>(() =>
    pickMazeByTravelDifficulty(12, 12, 65)
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

  const regenerate = useCallback(() => {
    const w = parseDim(widthInput, 12);
    const h = parseDim(heightInput, 12);
    setWidthInput(String(w));
    setHeightInput(String(h));
    setGrid(pickMazeByTravelDifficulty(w, h, difficulty));
  }, [widthInput, heightInput, difficulty]);

  const summary = useMemo(() => {
    const w = grid[0]?.length ?? 0;
    const h = grid.length;
    return t('mazeGenerator.mazeSummary', { width: w, height: h });
  }, [grid, t]);

  const solutionPath = useMemo(() => findSolutionPath(grid), [grid]);

  const solutionStepsLine = useMemo(() => {
    const w = grid[0]?.length ?? 0;
    const h = grid.length;
    if (!w || !h || !solutionPath?.length) return null;
    const steps = solutionPath.length - 1;
    const minSteps = w + h - 2;
    return t('mazeGenerator.solutionSteps', { steps, minSteps });
  }, [grid, solutionPath, t]);

  const mazeAriaLabel = useMemo(() => {
    const base = `${summary}${
      solutionStepsLine ? ` ${solutionStepsLine}` : ''
    } ${t('mazeGenerator.mazeAccessibilityNote')}`;
    if (!showSolution) return base;
    return `${base} ${t('mazeGenerator.solutionShownAria')}`;
  }, [showSolution, solutionStepsLine, summary, t]);

  const gw = grid[0]?.length ?? 0;
  const gh = grid.length;

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
    <div className="w-full max-w-3xl space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          {t('mazeGenerator.title')}
        </h1>
        <p className="text-muted-foreground text-xl leading-7 not-first:mt-6">
          {t('mazeGenerator.description')}
        </p>
      </div>

      <Card className="p-4 sm:p-6 space-y-6">
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

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Button
            type="button"
            className="h-11 w-full gap-2 sm:w-auto"
            onClick={regenerate}
          >
            <Shuffle className="h-4 w-4" />
            {t('mazeGenerator.regenerate')}
          </Button>

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
        </div>

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
            <p className="text-muted-foreground text-sm">{solutionStepsLine}</p>
          ) : null}
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
      </Card>
    </div>
  );
}
