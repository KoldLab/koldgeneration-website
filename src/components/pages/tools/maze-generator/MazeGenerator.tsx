import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CellWalls = { N: boolean; E: boolean; S: boolean; W: boolean };

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

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

  type Neighbor = readonly [number, number, 'N' | 'E' | 'S' | 'W'];

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

function MazeGrid({
  grid,
  ariaLabel,
}: {
  grid: CellWalls[][];
  ariaLabel: string;
}) {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const cell = `min(14px, calc((min(100vw - 3rem, 720px)) / ${Math.max(w, h)}))`;

  return (
    <div
      className="w-full overflow-x-auto rounded-md border bg-muted/30 p-3"
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className="mx-auto inline-grid gap-0 border-2 border-foreground"
        style={{
          gridTemplateColumns: `repeat(${w}, ${cell})`,
          gridTemplateRows: `repeat(${h}, ${cell})`,
        }}
      >
        {grid.map((row, y) =>
          row.map((cellWalls, x) => (
            <div
              key={`${x}-${y}`}
              className={cn(
                'box-border bg-background',
                cellWalls.N && 'border-t-2 border-foreground',
                cellWalls.E && 'border-r-2 border-foreground',
                cellWalls.S && 'border-b-2 border-foreground',
                cellWalls.W && 'border-l-2 border-foreground'
              )}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function MazeGenerator() {
  const { t } = useTranslation();
  const [widthInput, setWidthInput] = useState('12');
  const [heightInput, setHeightInput] = useState('12');
  const [grid, setGrid] = useState<CellWalls[][]>(() =>
    generateMaze(12, 12)
  );

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
    setGrid(generateMaze(w, h));
  }, [widthInput, heightInput]);

  const summary = useMemo(() => {
    const w = grid[0]?.length ?? 0;
    const h = grid.length;
    return t('mazeGenerator.mazeSummary', { width: w, height: h });
  }, [grid, t]);

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          {t('mazeGenerator.title')}
        </h1>
        <p className="text-muted-foreground text-xl leading-7 [&:not(:first-child)]:mt-6">
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

        <Button
          type="button"
          className="h-11 w-full sm:w-auto gap-2"
          onClick={regenerate}
        >
          <Shuffle className="h-4 w-4" />
          {t('mazeGenerator.regenerate')}
        </Button>

        <p className="text-muted-foreground text-sm">{summary}</p>

        <MazeGrid grid={grid} ariaLabel={summary} />
      </Card>
    </div>
  );
}
