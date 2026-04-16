import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Copy, Check, AlertTriangle, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';

interface ParsedItem {
  name: string;
  id: string;
  total: number;
}

const SHULKER_COLORS = [
  { name: 'White',      id: 'white',      hex: '#F9FFFE', text: '#1a1a1a' },
  { name: 'Light Gray', id: 'light_gray', hex: '#9D9D97', text: '#1a1a1a' },
  { name: 'Gray',       id: 'gray',       hex: '#474F52', text: '#fff' },
  { name: 'Black',      id: 'black',      hex: '#1D1D21', text: '#fff' },
  { name: 'Brown',      id: 'brown',      hex: '#835432', text: '#fff' },
  { name: 'Red',        id: 'red',        hex: '#B02E26', text: '#fff' },
  { name: 'Orange',     id: 'orange',     hex: '#F9801D', text: '#1a1a1a' },
  { name: 'Yellow',     id: 'yellow',     hex: '#FED83D', text: '#1a1a1a' },
  { name: 'Lime',       id: 'lime',       hex: '#80C71F', text: '#1a1a1a' },
  { name: 'Green',      id: 'green',      hex: '#5E7C16', text: '#fff' },
  { name: 'Cyan',       id: 'cyan',       hex: '#169C9C', text: '#fff' },
  { name: 'Light Blue', id: 'light_blue', hex: '#3AB3DA', text: '#1a1a1a' },
  { name: 'Blue',       id: 'blue',       hex: '#3C44AA', text: '#fff' },
  { name: 'Purple',     id: 'purple',     hex: '#8932B8', text: '#fff' },
  { name: 'Magenta',    id: 'magenta',    hex: '#C74EBD', text: '#fff' },
  { name: 'Pink',       id: 'pink',       hex: '#F38BAA', text: '#1a1a1a' },
];

// Exceptions: display name → Minecraft item ID (without namespace)
const NAME_OVERRIDES: Record<string, string> = {
  'redstone comparator': 'comparator',
  'comparator': 'comparator',
  'redstone repeater': 'repeater',
  'repeater': 'repeater',
  'vines': 'vine',
  'redstone dust': 'redstone',
  'nether brick': 'nether_bricks',
  'nether bricks': 'nether_bricks',
  'stone brick': 'stone_bricks',
  'stone bricks': 'stone_bricks',
  'mossy stone bricks': 'mossy_stone_bricks',
  'mossy cobblestone': 'mossy_cobblestone',
  'chiseled stone bricks': 'chiseled_stone_bricks',
  'smooth stone': 'smooth_stone',
  'lava bucket': 'lava_bucket',
  'water bucket': 'water_bucket',
  'andesite wall': 'andesite_wall',
  'stone stairs': 'stone_stairs',
  'stone slab': 'stone_slab',
  'redstone torch': 'redstone_torch',
  'painting': 'painting',
  'item frame': 'item_frame',
  'glow item frame': 'glow_item_frame',
  'armor stand': 'armor_stand',
};

const MAX_SLOTS = 27;

function itemNameToId(name: string): string {
  const lower = name.toLowerCase().trim();
  if (NAME_OVERRIDES[lower]) return NAME_OVERRIDES[lower];
  return lower.replace(/\s+/g, '_');
}

function parseMaterialList(input: string): { items: ParsedItem[]; errors: string[] } {
  const lines = input.split('\n');
  const items: ParsedItem[] = [];
  const errors: string[] = [];

  // Match lines like: | Item Name     |    9 |    9 |    0 |
  const lineRegex = /^\|\s+(.+?)\s+\|\s+(\d+)\s+\|\s+\d+\s+\|\s+\d+\s+\|/;

  for (const line of lines) {
    const match = line.match(lineRegex);
    if (!match) continue;
    const name = match[1].trim();
    const total = parseInt(match[2], 10);
    // Skip header rows
    if (name.toLowerCase() === 'item' || isNaN(total)) continue;
    items.push({ name, id: itemNameToId(name), total });
  }

  if (items.length === 0 && input.trim().length > 0) {
    errors.push('No items could be parsed. Make sure you paste the full Litematica material list table.');
  }

  return { items, errors };
}

function buildModernCommand(items: ParsedItem[], color: string, customName: string): string {
  const slots = items.slice(0, MAX_SLOTS);
  const container = slots
    .map((item, i) => `{slot:${i},item:{id:"minecraft:${item.id}",count:${item.total}}}`)
    .join(',');
  const namePart = customName.trim()
    ? `,custom_name=[{"text":"${customName.trim()}","italic":false}]`
    : '';
  return `/give @p ${color}_shulker_box[container=[${container}]${namePart}]`;
}

function buildLegacyCommand(items: ParsedItem[], color: string, customName: string): string {
  const slots = items.slice(0, MAX_SLOTS);
  const itemList = slots
    .map((item, i) => `{Slot:${i}b,id:"minecraft:${item.id}",Count:${item.total}b}`)
    .join(',');
  const namePart = customName.trim()
    ? `,display:{Name:'{"text":"${customName.trim()}","italic":false}'}`
    : '';
  return `/give @p ${color}_shulker_box{BlockEntityTag:{Items:[${itemList}]}${namePart}} 1`;
}

const ShulkerBoxGenerator = () => {
  const [rawInput, setRawInput] = useState('');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [boxName, setBoxName] = useState('');
  const [selectedColor, setSelectedColor] = useState('white');
  const [version, setVersion] = useState<'modern' | 'legacy'>('modern');
  const [copied, setCopied] = useState(false);

  const handleParse = () => {
    const { items: parsed, errors } = parseMaterialList(rawInput);
    setItems(parsed);
    setParseErrors(errors);
    if (parsed.length > 0) {
      toast.success(`Parsed ${parsed.length} item${parsed.length !== 1 ? 's' : ''}`);
    }
  };

  const command =
    items.length > 0
      ? version === 'modern'
        ? buildModernCommand(items, selectedColor, boxName)
        : buildLegacyCommand(items, selectedColor, boxName)
      : '';

  const handleCopy = async () => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success('Command copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const overflowCount = Math.max(0, items.length - MAX_SLOTS);
  const hasOverstack = items.slice(0, MAX_SLOTS).some((item) => item.total > 64);
  const selectedColorData = SHULKER_COLORS.find((c) => c.id === selectedColor)!;

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          Shulker Box Command Generator
        </h1>
        <p className="text-muted-foreground text-xl leading-7 mt-2">
          Paste a Litematica material list to generate a{' '}
          <code className="text-sm font-mono bg-muted px-1 py-0.5 rounded">/give</code> command for
          a shulker box pre-filled with those items.
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="material-input">Material list</Label>
        <Textarea
          id="material-input"
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={`Paste your Litematica material list here, e.g.:\n+---------------------+-------+---------+----------------+\n| Item                | Total | Missing |      Available |\n+---------------------+-------+---------+----------------+\n| Glass               |     9 |       9 |              0 |\n| Hopper              |     3 |       3 |              0 |`}
          className="font-mono min-h-40 resize-y"
        />
        <div className="flex gap-2">
          <Button onClick={handleParse}>Parse items</Button>
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setItems([]);
                setRawInput('');
                setParseErrors([]);
              }}
            >
              Clear
            </Button>
          )}
        </div>
        {parseErrors.map((err, i) => (
          <p key={i} className="text-destructive text-sm flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {err}
          </p>
        ))}
      </div>

      {items.length > 0 && (
        <>
          {/* Warnings */}
          {overflowCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                A shulker box only has 27 slots. The last{' '}
                <strong>{overflowCount} item type{overflowCount !== 1 ? 's' : ''}</strong> will be
                omitted from the command.
              </span>
            </div>
          )}
          {hasOverstack && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Some items have a count above 64. Minecraft may clamp these to the item's max stack
                size when placed in the world.
              </span>
            </div>
          )}

          {/* Settings */}
          <Card className="p-4 flex flex-col gap-6">
            {/* Box name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="box-name">Shulker box name (optional)</Label>
              <Input
                id="box-name"
                type="text"
                value={boxName}
                onChange={(e) => setBoxName(e.target.value)}
                placeholder="e.g. Building materials"
                className="max-w-sm"
              />
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-2">
              <Label>Color</Label>
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
                {SHULKER_COLORS.map((color) => (
                  <button
                    key={color.id}
                    title={color.name}
                    aria-label={color.name}
                    onClick={() => setSelectedColor(color.id)}
                    className={cn(
                      'aspect-square rounded-md border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selectedColor === color.id
                        ? 'border-foreground scale-110 shadow-md'
                        : 'border-transparent hover:border-muted-foreground hover:scale-105'
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected:{' '}
                <span
                  className="inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded text-sm"
                  style={{
                    backgroundColor: selectedColorData.hex,
                    color: selectedColorData.text,
                  }}
                >
                  <PackageOpen className="h-3 w-3" />
                  {selectedColorData.name} Shulker Box
                </span>
              </p>
            </div>

            {/* Version */}
            <div className="flex flex-col gap-2">
              <Label>Minecraft version</Label>
              <div className="flex gap-2">
                <Button
                  variant={version === 'modern' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVersion('modern')}
                >
                  1.20.5+ (components)
                </Button>
                <Button
                  variant={version === 'legacy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVersion('legacy')}
                >
                  1.20.4 and below (NBT)
                </Button>
              </div>
            </div>
          </Card>

          {/* Parsed items preview */}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              Parsed items ({Math.min(items.length, MAX_SLOTS)}/{items.length} used)
            </h2>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Slot</th>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-left font-medium">Minecraft ID</th>
                    <th className="px-3 py-2 text-right font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr
                      key={i}
                      className={cn(
                        'border-b last:border-0',
                        i >= MAX_SLOTS ? 'opacity-40' : ''
                      )}
                    >
                      <td className="px-3 py-1.5 text-muted-foreground">{i < MAX_SLOTS ? i : '—'}</td>
                      <td className="px-3 py-1.5">{item.name}</td>
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                        minecraft:{item.id}
                      </td>
                      <td className={cn('px-3 py-1.5 text-right', item.total > 64 ? 'text-yellow-600 dark:text-yellow-400' : '')}>
                        {item.total}
                        {item.total > 64 && ' ⚠'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Command output */}
          <div className="flex flex-col gap-2">
            <Label>Generated command</Label>
            <div className="flex gap-2 items-start">
              <code className="flex-1 p-3 bg-muted rounded-md text-xs font-mono break-all leading-relaxed border">
                {command}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="flex-shrink-0"
                aria-label="Copy command"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Run this command in-game with cheats/operator permissions enabled.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ShulkerBoxGenerator;
