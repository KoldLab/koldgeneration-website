import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronDown, Copy, Check } from 'lucide-react';

interface MinecraftItem {
  Slot: number;
  count: number;
  id: string;
}

interface MinecraftData {
  Items: MinecraftItem[];
}

const MinecraftListGenerator = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [items, setItems] = useState<MinecraftItem[]>([]);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [font, setFont] = useState('Arial');
  const [columns, setColumns] = useState(1);
  const [rows, setRows] = useState(0); // 0 means auto-calculate based on columns
  const [backgroundColor, setBackgroundColor] = useState('');
  const [fontColor, setFontColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(28);
  const [iconSize, setIconSize] = useState(64);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Georgia',
    'Comic Sans MS',
    'Impact',
    'Bebas Neue',
    'Roboto',
    'Open Sans',
    'Montserrat',
    'Lato',
    'Playfair Display',
    'Oswald',
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [jsonInput]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(event.target as Node)
      ) {
        setFontDropdownOpen(false);
      }
    };

    if (fontDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fontDropdownOpen]);

  const formatItemName = (id: string): string => {
    // Remove "minecraft:" prefix and format to readable name
    const name = id.replace('minecraft:', '');
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatItemsAsText = (): string => {
    if (items.length === 0) return '';

    let text = '- Items requis -\n\n';
    items.forEach((item) => {
      const name = formatItemName(item.id);
      text += `${item.count} - ${name}\n`;
    });

    return text.trim();
  };

  const handleCopyFormattedText = async () => {
    const formattedText = formatItemsAsText();
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const generateImage = useCallback(async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Fixed 1080p resolution
    const FIXED_WIDTH = 1920;
    const FIXED_HEIGHT = 1080;

    canvas.width = FIXED_WIDTH;
    canvas.height = FIXED_HEIGHT;

    // Grid calculation
    const numCols = Math.max(1, columns);
    const numRows = rows > 0 ? rows : Math.ceil(items.length / numCols);
    const itemsToDisplay = Math.min(items.length, numCols * numRows);

    // Calculate spacing for 1080p
    const padding = 50;
    const itemHeight = iconSize + 50;
    const itemSpacing = 15;
    const headerHeight = 140;

    // Set a reasonable max grid width to fit in 1080p
    const maxGridWidth = FIXED_WIDTH - padding * 2;
    const itemWidth = (maxGridWidth - (numCols - 1) * itemSpacing) / numCols;

    // Calculate grid start position to center it
    const totalGridWidth = numCols * itemWidth + (numCols - 1) * itemSpacing;
    const gridStartX = (FIXED_WIDTH - totalGridWidth) / 2;

    // Background color
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = fontColor;
    ctx.font = `bold 60px ${font}`;
    ctx.fillText('Items requis :', canvas.width / 2, padding + 60);

    // Load all item images
    try {
      const imagePromises = items.map(async (item) => {
        const itemId = item.id.replace('minecraft:', '');
        const sources = [
          `/minecraft-icons/${itemId}.png`,
          `https://minecraft.wiki/images/${itemId}.png`,
          `https://minecraft-heads.com/images/icons/${itemId}.png`,
        ];

        for (const url of sources) {
          try {
            const img = await loadImage(url);
            return img;
          } catch {
            // Continue to next source
          }
        }
        return null;
      });

      const images = await Promise.all(imagePromises);

      // Draw items in grid - left aligned within cells
      ctx.textAlign = 'left';

      for (let i = 0; i < itemsToDisplay; i++) {
        const item = items[i];
        const name = formatItemName(item.id);
        const text = `${item.count} - ${name}`;

        // Calculate grid position
        const col = i % numCols;
        const row = Math.floor(i / numCols);

        const cellX = gridStartX + col * (itemWidth + itemSpacing);
        const y = padding + headerHeight + row * itemHeight;

        // Draw icon first (left side)
        const img = images[i];
        const iconOffset = img ? iconSize + 10 : 0;
        if (img) {
          ctx.drawImage(img, cellX + 10, y + 5, iconSize, iconSize);
        }

        // Draw text to the right of icon
        ctx.fillStyle = fontColor;
        const textX = cellX + 10 + iconOffset;

        // Try to fit text with auto-scaling font size
        let currentTextSize = fontSize;
        ctx.font = `${currentTextSize}px ${font}`;
        const textMetrics = ctx.measureText(text);
        const maxTextWidth = itemWidth - iconOffset - 20;

        if (textMetrics.width > maxTextWidth) {
          currentTextSize = Math.max(
            14,
            Math.floor((fontSize * maxTextWidth) / textMetrics.width)
          );
          ctx.font = `${currentTextSize}px ${font}`;
        }

        ctx.fillText(text, textX, y + iconSize / 2 + 5);
      }
    } catch (error) {
      // Fallback: draw without icons - left aligned
      ctx.textAlign = 'left';

      for (let i = 0; i < itemsToDisplay; i++) {
        const item = items[i];
        const name = formatItemName(item.id);
        const text = `${item.count} - ${name}`;

        const col = i % numCols;
        const row = Math.floor(i / numCols);

        const cellX = gridStartX + col * (itemWidth + itemSpacing);
        const y = padding + headerHeight + row * itemHeight;

        ctx.fillStyle = fontColor;
        const textX = cellX + 10;

        // Try to fit text with auto-scaling font size
        let currentTextSize = fontSize;
        ctx.font = `${currentTextSize}px ${font}`;
        const textMetrics = ctx.measureText(text);
        const maxTextWidth = itemWidth - 20;

        if (textMetrics.width > maxTextWidth) {
          currentTextSize = Math.max(
            14,
            Math.floor((fontSize * maxTextWidth) / textMetrics.width)
          );
          ctx.font = `${currentTextSize}px ${font}`;
        }

        ctx.fillText(text, textX, y + iconSize / 2 + 5);
      }
    }

    return canvas;
  }, [
    items,
    formatItemName,
    columns,
    rows,
    font,
    backgroundColor,
    fontColor,
    fontSize,
    iconSize,
  ]);

  const handleDownloadImage = async () => {
    if (items.length === 0) return;

    const canvas = await generateImage();

    // Download image
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'minecraft-items-list.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const handleProcess = () => {
    setError('');
    try {
      // Remove Minecraft NBT byte suffixes (e.g., 0b, 1b, etc.) and replace with proper numbers
      let cleanedJson = jsonInput.replace(/(\d+)b/g, '$1');

      // Quote all unquoted property names to make it valid JSON
      cleanedJson = cleanedJson.replace(
        /([{,\[]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g,
        '$1"$2"$3'
      );

      const parsed = JSON.parse(cleanedJson) as MinecraftData;
      if (parsed.Items && Array.isArray(parsed.Items)) {
        // Group items by id and sum quantities
        const grouped = parsed.Items.reduce((acc, item) => {
          const existing = acc.find((i) => i.id === item.id);
          if (existing) {
            existing.count += item.count;
          } else {
            acc.push({ ...item });
          }
          return acc;
        }, [] as MinecraftItem[]);

        // Sort by quantity (highest first)
        grouped.sort((a, b) => b.count - a.count);

        setItems(grouped);
      } else {
        setError('Invalid JSON structure: Missing Items array');
      }
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  // Generate preview image when items change
  useEffect(() => {
    const generatePreview = async () => {
      if (items.length === 0) {
        setPreviewUrl('');
        return;
      }

      try {
        const canvas = await generateImage();
        const dataUrl = canvas.toDataURL('image/png');
        setPreviewUrl(dataUrl);
      } catch (error) {
        console.error('Error generating preview:', error);
        setPreviewUrl('');
      }
    };

    generatePreview();
  }, [items, generateImage]);

  return (
    <div className="flex flex-col w-[80vw] gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Minecraft List Generator</h1>
        <p className="text-muted-foreground">
          Paste your Minecraft chest NBT data to generate a formatted item list
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste your JSON here..."
          className={cn(
            'flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono',
            'shadow-xs transition-[color,box-shadow] outline-none resize-none overflow-hidden',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-muted-foreground'
          )}
          style={{ minHeight: '120px' }}
        />
        <div className="flex justify-center gap-2">
          <Button onClick={handleProcess} variant="default">
            Generate
          </Button>
          <Button
            onClick={() => {
              setJsonInput(
                '{Items:[{Slot:0b,count:64,id:"minecraft:chest"},{Slot:1b,count:64,id:"minecraft:chest"},{Slot:2b,count:12,id:"minecraft:chest"},{Slot:3b,count:1,id:"minecraft:stone_button"},{Slot:4b,count:2,id:"minecraft:honeycomb"},{Slot:5b,count:59,id:"minecraft:smooth_stone"},{Slot:6b,count:2,id:"minecraft:copper_block"},{Slot:7b,count:2,id:"minecraft:carved_pumpkin"},{Slot:8b,count:29,id:"minecraft:redstone"},{Slot:9b,count:60,id:"minecraft:hopper"},{Slot:10b,count:10,id:"minecraft:comparator"},{Slot:11b,count:9,id:"minecraft:repeater"},{Slot:12b,count:9,id:"minecraft:redstone_torch"},{Slot:13b,count:1,id:"minecraft:waxed_oxidized_copper_bulb"}],components:{},id:"minecraft:chest",x:-60,y:56,z:-221}'
              );
            }}
            variant="outline"
          >
            Test
          </Button>
        </div>
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      {items.length > 0 && (
        <div className="border rounded-md p-4 bg-card">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setPreviewOpen(!previewOpen)}
              className="flex items-center gap-2 text-lg font-semibold hover:text-accent-foreground transition-colors"
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  previewOpen && 'rotate-180'
                )}
              />
              Preview
            </button>
            <div className="flex gap-2">
              <Button
                onClick={handleCopyFormattedText}
                variant="outline"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Text
                  </>
                )}
              </Button>
              <Button onClick={handleDownloadImage} variant="outline">
                Download PNG
              </Button>
            </div>
          </div>

          {previewOpen && (
            <>
              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 bg-muted/50 rounded-md">
                <div ref={fontDropdownRef} className="relative">
                  <label className="text-sm font-medium mb-2 block">Font</label>
                  <button
                    type="button"
                    onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                    className={cn(
                      'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-left flex justify-between items-center',
                      'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                    style={{ fontFamily: font }}
                  >
                    <span>{font}</span>
                    <span className="text-muted-foreground">▼</span>
                  </button>
                  {fontDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 rounded-md border border-input bg-background shadow-lg max-h-60 overflow-auto">
                      {fonts.map((fontOption) => (
                        <button
                          key={fontOption}
                          type="button"
                          onClick={() => {
                            setFont(fontOption);
                            setFontDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
                            font === fontOption && 'bg-accent'
                          )}
                          style={{ fontFamily: fontOption }}
                        >
                          {fontOption}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Columns
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={columns}
                    onChange={(e) =>
                      setColumns(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Rows (0 = auto)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={rows}
                    onChange={(e) =>
                      setRows(Math.max(0, parseInt(e.target.value) || 0))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Background Color
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={backgroundColor || '#ffffff'}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      placeholder="Transparent"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Font Color
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Font Size
                  </label>
                  <Input
                    type="number"
                    min="12"
                    max="72"
                    value={fontSize}
                    onChange={(e) =>
                      setFontSize(
                        Math.max(
                          12,
                          Math.min(72, parseInt(e.target.value) || 28)
                        )
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Icon Size
                  </label>
                  <Input
                    type="number"
                    min="16"
                    max="128"
                    value={iconSize}
                    onChange={(e) =>
                      setIconSize(
                        Math.max(
                          16,
                          Math.min(128, parseInt(e.target.value) || 64)
                        )
                      )
                    }
                  />
                </div>
              </div>
              {previewUrl && (
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Minecraft items preview"
                    className="border rounded-md"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MinecraftListGenerator;
