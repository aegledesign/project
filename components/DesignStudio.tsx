'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  Copy,
  Download,
  ImagePlus,
  Layers3,
  Save,
  ScanSearch,
  Sparkles,
  Trash2,
  Type,
  WandSparkles,
} from 'lucide-react';
import { Canvas, FabricImage, FabricObject, Rect, Textbox } from 'fabric';
import type { PrintArea, Product, ProductMockup } from '@/lib/types';
import { useCart } from '@/lib/cartClient';
import { getUnitPrice } from '@/lib/pricing';

type SerializedCanvas = ReturnType<Canvas['toJSON']>;
type LayerItem = { object: FabricObject; name: string };
type AssistantReport = {
  score: number;
  title: string;
  findings: string[];
};

const CANVAS_SIZE = 600;
const LOCATION_SURCHARGE = 2.5;
const FONTS = ['Arial', 'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana'];

function canvasArea(area: PrintArea) {
  return {
    left: area.x * CANVAS_SIZE,
    top: area.y * CANVAS_SIZE,
    width: area.width * CANVAS_SIZE,
    height: area.height * CANVAS_SIZE,
    angle: area.rotation,
  };
}

function layerName(object: FabricObject, index: number) {
  if (object instanceof Textbox) return `Text: ${object.text.trim().slice(0, 22) || index + 1}`;
  return `Artwork ${index + 1}`;
}

function activeMockups(product: Product, colorKey: string) {
  const colorMatches = product.mockups.filter((mockup) => mockup.active && mockup.colorKey === colorKey);
  return (colorMatches.length ? colorMatches : product.mockups.filter((mockup) => mockup.active))
    .sort((left, right) => left.displayOrder - right.displayOrder);
}

export function DesignStudio({ product }: { product: Product }) {
  const defaultVariant = product.variants.find((variant) => variant.active) ?? product.variants[0];
  const initialMockups = activeMockups(product, defaultVariant?.colorKey ?? '');
  const defaultMockup = initialMockups.find((mockup) => mockup.isDefault) ?? initialMockups[0];

  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const designKeyRef = useRef('');
  const savedDesignsRef = useRef<Record<string, SerializedCanvas>>({});
  const currentAreaRef = useRef<PrintArea | undefined>(defaultMockup?.printAreas.find((area) => area.active));

  const [colorKey, setColorKey] = useState(defaultVariant?.colorKey ?? '');
  const [mockup, setMockup] = useState<ProductMockup | undefined>(defaultMockup);
  const [printArea, setPrintArea] = useState<PrintArea | undefined>(currentAreaRef.current);
  const [text, setText] = useState('Your text');
  const [fontFamily, setFontFamily] = useState(FONTS[0]);
  const [textColor, setTextColor] = useState('#111827');
  const [qty, setQty] = useState(24);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [outsideArea, setOutsideArea] = useState(false);
  const [objectCounts, setObjectCounts] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<string>();
  const [status, setStatus] = useState('');
  const [assistantReport, setAssistantReport] = useState<AssistantReport>();

  const addToCart = useCart((state) => state.add);
  const mockups = useMemo(() => activeMockups(product, colorKey), [product, colorKey]);
  const designKey = mockup && printArea ? `${mockup.id}:${printArea.id}` : '';
  designKeyRef.current = designKey;
  currentAreaRef.current = printArea;

  const activeLocationCount = Math.max(1, Object.values(objectCounts).filter((count) => count > 0).length);
  const baseUnitPrice = useMemo(() => getUnitPrice(product, qty), [product, qty]);
  const locationImpact = (activeLocationCount - 1) * LOCATION_SURCHARGE;
  const unitPrice = baseUnitPrice + locationImpact;

  const applyClip = useCallback((object: FabricObject) => {
    const area = currentAreaRef.current;
    if (!area) return;
    const bounds = canvasArea(area);
    object.clipPath = new Rect({
      ...bounds,
      absolutePositioned: true,
      originX: 'left',
      originY: 'top',
    });
  }, []);

  const syncCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const area = currentAreaRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    setLayers(objects.map((object, index) => ({ object, name: layerName(object, index) })).reverse());
    if (designKeyRef.current) {
      setObjectCounts((current) => ({ ...current, [designKeyRef.current]: objects.length }));
    }
    const active = canvas.getActiveObject();
    setSelected(active ?? null);
    if (!active || !area) {
      setOutsideArea(false);
      return;
    }
    const printable = canvasArea(area);
    const bounds = active.getBoundingRect();
    setOutsideArea(
      bounds.left < printable.left ||
      bounds.top < printable.top ||
      bounds.left + bounds.width > printable.left + printable.width ||
      bounds.top + bounds.height > printable.top + printable.height,
    );
  }, []);

  useEffect(() => {
    if (!canvasElementRef.current) return;
    const canvas = new Canvas(canvasElementRef.current, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      preserveObjectStacking: true,
      selectionColor: 'rgba(13, 148, 136, 0.12)',
      selectionBorderColor: '#0f766e',
    });
    canvasRef.current = canvas;
    const events = [
      'object:added',
      'object:removed',
      'object:modified',
      'selection:created',
      'selection:updated',
      'selection:cleared',
    ] as const;
    events.forEach((event) => canvas.on(event, syncCanvas));
    syncCanvas();
    return () => {
      if (designKeyRef.current) savedDesignsRef.current[designKeyRef.current] = canvas.toJSON();
      canvas.dispose();
      canvasRef.current = null;
    };
  }, [syncCanvas]);

  async function switchDesign(nextMockup: ProductMockup, nextArea?: PrintArea) {
    const canvas = canvasRef.current;
    const area = nextArea ?? nextMockup.printAreas.find((item) => item.active);
    if (!canvas || !area) return;
    if (designKeyRef.current) savedDesignsRef.current[designKeyRef.current] = canvas.toJSON();
    setMockup(nextMockup);
    setPrintArea(area);
    currentAreaRef.current = area;
    const nextKey = `${nextMockup.id}:${area.id}`;
    designKeyRef.current = nextKey;
    canvas.clear();
    if (savedDesignsRef.current[nextKey]) await canvas.loadFromJSON(savedDesignsRef.current[nextKey]);
    canvas.getObjects().forEach(applyClip);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncCanvas();
    setStatus(`Editing ${nextMockup.view.toLowerCase()} - ${area.label}`);
  }

  function changeColor(nextColor: string) {
    setColorKey(nextColor);
    const available = activeMockups(product, nextColor);
    const next = available.find((item) => item.view === mockup?.view) ?? available[0];
    if (next) void switchDesign(next);
  }

  function addText() {
    const canvas = canvasRef.current;
    if (!canvas || !printArea || !text.trim()) return;
    const area = canvasArea(printArea);
    const object = new Textbox(text.trim(), {
      left: area.left + area.width / 2,
      top: area.top + area.height / 2,
      originX: 'center',
      originY: 'center',
      width: Math.min(area.width * 0.8, 220),
      fontFamily,
      fontSize: 32,
      fontWeight: 700,
      fill: textColor,
      textAlign: 'center',
    });
    applyClip(object);
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    syncCanvas();
  }

  async function uploadArtwork(file: File) {
    const canvas = canvasRef.current;
    if (!canvas || !printArea) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setStatus('Use a PNG, JPG, WebP, or SVG file under 10 MB');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const image = await FabricImage.fromURL(dataUrl);
    const area = canvasArea(printArea);
    image.scale(Math.min((area.width * 0.7) / (image.width || 1), (area.height * 0.7) / (image.height || 1)));
    image.set({
      left: area.left + area.width / 2,
      top: area.top + area.height / 2,
      originX: 'center',
      originY: 'center',
    });
    applyClip(image);
    canvas.add(image);
    canvas.setActiveObject(image);
    canvas.requestRenderAll();
    syncCanvas();
    setStatus(`${file.name} added`);
  }

  function updateText(property: 'fontFamily' | 'fill', value: string) {
    const object = canvasRef.current?.getActiveObject();
    if (!(object instanceof Textbox)) return;
    object.set(property, value);
    canvasRef.current?.requestRenderAll();
    syncCanvas();
  }

  function deleteSelected() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getActiveObjects().forEach((object) => canvas.remove(object));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncCanvas();
  }

  async function duplicateSelected() {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    const clone = await active.clone();
    clone.set({ left: (active.left ?? 0) + 14, top: (active.top ?? 0) + 14, evented: true });
    applyClip(clone);
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
    syncCanvas();
  }

  function centerSelected(axis: 'horizontal' | 'vertical') {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || !printArea) return;
    const area = canvasArea(printArea);
    active.set(axis === 'horizontal'
      ? { left: area.left + area.width / 2, originX: 'center' }
      : { top: area.top + area.height / 2, originY: 'center' });
    active.setCoords();
    canvas.requestRenderAll();
    syncCanvas();
  }

  function analyzeSelected() {
    const active = canvasRef.current?.getActiveObject();
    if (!active || !printArea) {
      setAssistantReport({
        score: 0,
        title: 'Select an artwork or text layer',
        findings: ['The assistant analyzes one selected layer at a time.'],
      });
      return;
    }
    const area = canvasArea(printArea);
    const bounds = active.getBoundingRect();
    const findings: string[] = [];
    let score = 100;
    const extendsOutside =
      bounds.left < area.left ||
      bounds.top < area.top ||
      bounds.left + bounds.width > area.left + area.width ||
      bounds.top + bounds.height > area.top + area.height;
    if (extendsOutside) {
      score -= 35;
      findings.push(`Artwork extends outside ${printArea.label} and will be clipped.`);
    } else {
      findings.push(`Placement is contained inside ${printArea.label}.`);
    }
    const coverage = (bounds.width * bounds.height) / (area.width * area.height);
    if (coverage < 0.08) {
      score -= 15;
      findings.push('Artwork may appear too small at production size.');
    } else if (coverage > 0.9) {
      score -= 10;
      findings.push('Artwork is close to the print-zone edge; allow more production margin.');
    } else {
      findings.push('Artwork scale has a practical production margin.');
    }
    if (active instanceof FabricImage) {
      const sourceWidth = active.width || 0;
      const displayedWidth = Math.max(active.getScaledWidth(), 1);
      const resolutionRatio = sourceWidth / displayedWidth;
      if (resolutionRatio < 1) {
        score -= 30;
        findings.push('Source artwork is being enlarged and may print soft or pixelated.');
      } else if (resolutionRatio < 2) {
        score -= 10;
        findings.push('Resolution is usable, but a larger source file would improve print quality.');
      } else {
        findings.push('Source resolution is strong for the current scale.');
      }
    } else if (active instanceof Textbox) {
      findings.push('Text remains editable and resolution-independent.');
      if (active.fontSize * (active.scaleY || 1) < 14) {
        score -= 15;
        findings.push('Text may be too small for reliable decoration.');
      }
    }
    const finalScore = Math.max(0, score);
    setAssistantReport({
      score: finalScore,
      title: finalScore >= 85 ? 'Production ready' : finalScore >= 60 ? 'Review recommended' : 'Artwork needs attention',
      findings,
    });
  }

  function smartFitSelected() {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || !printArea) return;
    const area = canvasArea(printArea);
    const widthRatio = (area.width * 0.82) / Math.max(active.getScaledWidth(), 1);
    const heightRatio = (area.height * 0.82) / Math.max(active.getScaledHeight(), 1);
    const ratio = Math.min(widthRatio, heightRatio);
    active.set({
      scaleX: (active.scaleX || 1) * ratio,
      scaleY: (active.scaleY || 1) * ratio,
      left: area.left + area.width / 2,
      top: area.top + area.height / 2,
      originX: 'center',
      originY: 'center',
    });
    active.setCoords();
    applyClip(active);
    canvas.requestRenderAll();
    syncCanvas();
    setStatus('Assistant fitted artwork to the printable area');
    setTimeout(analyzeSelected, 0);
  }

  function applyContrastColor() {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !(active instanceof Textbox)) {
      setStatus('Select a text layer to apply contrast');
      return;
    }
    const hex = product.variants.find((variant) => variant.colorKey === colorKey)?.hexColor ?? '#ffffff';
    const red = Number.parseInt(hex.slice(1, 3), 16);
    const green = Number.parseInt(hex.slice(3, 5), 16);
    const blue = Number.parseInt(hex.slice(5, 7), 16);
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    const color = luminance > 0.52 ? '#111827' : '#ffffff';
    active.set('fill', color);
    setTextColor(color);
    canvas.requestRenderAll();
    syncCanvas();
    setStatus('Assistant selected a high-contrast text color');
  }

  function removeImageBackground() {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !(active instanceof FabricImage)) {
      setStatus('Select an uploaded raster image to remove its background');
      return;
    }
    const source = active.getElement();
    const width = active.width || source.width;
    const height = active.height || source.height;
    if (!width || !height || width * height > 16_000_000) {
      setStatus('Use an image smaller than 16 megapixels for background cleanup');
      return;
    }
    const output = document.createElement('canvas');
    output.width = width;
    output.height = height;
    const context = output.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    try {
      context.drawImage(source, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height);
      const corners = [
        0,
        (width - 1) * 4,
        (height - 1) * width * 4,
        ((height - 1) * width + width - 1) * 4,
      ];
      const background = corners.reduce(
        (sum, index) => [
          sum[0] + pixels.data[index],
          sum[1] + pixels.data[index + 1],
          sum[2] + pixels.data[index + 2],
        ],
        [0, 0, 0],
      ).map((value) => value / corners.length);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const distance = Math.sqrt(
          (pixels.data[index] - background[0]) ** 2 +
          (pixels.data[index + 1] - background[1]) ** 2 +
          (pixels.data[index + 2] - background[2]) ** 2,
        );
        if (distance < 52) pixels.data[index + 3] = Math.round((distance / 52) * pixels.data[index + 3]);
      }
      context.putImageData(pixels, 0, 0);
      active.setElement(output, { width, height });
      applyClip(active);
      canvas.requestRenderAll();
      syncCanvas();
      setStatus('Assistant removed the corner-matched background');
      setTimeout(analyzeSelected, 0);
    } catch {
      setStatus('Background cleanup is unavailable for this image source');
    }
  }

  function designData() {
    if (canvasRef.current && designKey) savedDesignsRef.current[designKey] = canvasRef.current.toJSON();
    return {
      version: 2,
      productId: product.id,
      productSlug: product.slug,
      colorKey,
      mockupId: mockup?.id,
      mockupView: mockup?.view,
      printAreaId: printArea?.id,
      printAreaLabel: printArea?.label,
      designs: savedDesignsRef.current,
      pricing: { baseUnitPrice, locationCount: activeLocationCount, locationImpact, unitPrice },
    };
  }

  function saveJson() {
    const json = JSON.stringify(designData(), null, 2);
    localStorage.setItem(`aegle-design:${product.slug}`, json);
    const href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${product.slug}-design.json`;
    anchor.click();
    URL.revokeObjectURL(href);
    setStatus('Design JSON saved');
  }

  async function generatePreview() {
    const canvas = canvasRef.current;
    if (!canvas || !mockup) return undefined;
    const output = document.createElement('canvas');
    output.width = CANVAS_SIZE;
    output.height = CANVAS_SIZE;
    const context = output.getContext('2d');
    if (!context) return undefined;
    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
    try {
      const [base, art] = await Promise.all([
        load(mockup.imageUrl),
        load(canvas.toDataURL({ format: 'png', multiplier: 1 })),
      ]);
      context.fillStyle = '#f8fafc';
      context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      context.drawImage(base, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      context.drawImage(art, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const dataUrl = output.toDataURL('image/png');
      setPreview(dataUrl);
      setStatus('Preview generated');
      return dataUrl;
    } catch {
      setStatus('Preview could not be generated from this remote image');
      return undefined;
    }
  }

  async function downloadPreview() {
    const dataUrl = (await generatePreview()) ?? preview;
    if (!dataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = `${product.slug}-${mockup?.view.toLowerCase()}-preview.png`;
    anchor.click();
  }

  async function saveToCart() {
    if (!mockup || !printArea) return;
    const previewData = (await generatePreview()) ?? preview;
    const json = JSON.stringify(designData());
    localStorage.setItem(`aegle-design:${product.slug}`, json);
    const variant = product.variants.find((item) => item.colorKey === colorKey);
    addToCart({
      id: crypto.randomUUID(),
      productSlug: product.slug,
      productName: product.name,
      color: variant?.colorName ?? colorKey,
      printLocation: printArea.label,
      sizes: { Mixed: qty },
      unitPrice,
      designJson: json,
      preview: previewData,
      mockupId: mockup.id,
      printAreaId: printArea.id,
    });
    setStatus('Design saved and attached to cart');
  }

  if (!defaultVariant || !defaultMockup || !mockup || !printArea) {
    return (
      <div className="mt-8 border border-amber-300 bg-amber-50 p-6 text-amber-900">
        This product has no active mockup and printable area. Configure one in the product admin.
      </div>
    );
  }

  const areaStyle = canvasArea(printArea);

  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[220px_minmax(620px,1fr)_310px]">
      <aside className="card order-2 p-4 xl:order-1">
        <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-3">
          <Layers3 size={18} />
          <h2 className="font-bold">Layers</h2>
        </div>
        {layers.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No artwork in this print area</p>
        ) : layers.map(({ object, name }, index) => (
          <button
            key={`${name}-${index}`}
            type="button"
            onClick={() => {
              canvasRef.current?.setActiveObject(object);
              canvasRef.current?.requestRenderAll();
              syncCanvas();
            }}
            className={`mb-1 w-full border px-3 py-2 text-left text-sm ${
              selected === object ? 'border-teal-600 bg-teal-50 font-semibold' : 'border-transparent hover:bg-slate-50'
            }`}
          >
            {name}
          </button>
        ))}
      </aside>

      <section className="order-1 min-w-0 xl:order-2">
        <div className="mb-3 flex flex-wrap gap-2" aria-label="Product views">
          {mockups.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void switchDesign(item)}
              className={`border px-4 py-2 text-sm font-semibold ${
                item.id === mockup.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'
              }`}
            >
              {item.view}
            </button>
          ))}
        </div>
        <div className="card overflow-auto p-3 sm:p-5">
          <div className="relative mx-auto h-[600px] w-[600px] max-w-none overflow-hidden bg-slate-100">
            <img src={mockup.imageUrl} alt={mockup.altText} className="absolute inset-0 h-full w-full object-contain" />
            <canvas ref={canvasElementRef} />
            <div
              className={`pointer-events-none absolute border-2 border-dashed ${outsideArea ? 'border-red-600' : 'border-teal-600'}`}
              style={{
                left: areaStyle.left,
                top: areaStyle.top,
                width: areaStyle.width,
                height: areaStyle.height,
                transform: `rotate(${areaStyle.angle}deg)`,
                transformOrigin: 'center',
              }}
            >
              <span className={`absolute -top-7 left-0 whitespace-nowrap bg-white px-2 py-1 text-xs font-bold ${outsideArea ? 'text-red-700' : 'text-teal-700'}`}>
                {printArea.label}
              </span>
            </div>
          </div>
        </div>
        {outsideArea && (
          <div className="mt-3 border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            Selected artwork extends outside {printArea.label}. The excess is clipped from the printed result.
          </div>
        )}
      </section>

      <aside className="card order-3 space-y-5 p-5">
        <div>
          <label className="label">Product color</label>
          <select className="input mt-2" value={colorKey} onChange={(event) => changeColor(event.target.value)}>
            {product.variants.filter((item) => item.active).map((variant) => (
              <option key={variant.id} value={variant.colorKey}>{variant.colorName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Print location</label>
          <select
            className="input mt-2"
            value={printArea.id}
            onChange={(event) => {
              const area = mockup.printAreas.find((item) => item.id === event.target.value);
              if (area) void switchDesign(mockup, area);
            }}
          >
            {mockup.printAreas.filter((item) => item.active).map((area) => (
              <option key={area.id} value={area.id}>{area.label}</option>
            ))}
          </select>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <label className="label">Add text</label>
          <input className="input mt-2" value={text} onChange={(event) => setText(event.target.value)} />
          <div className="mt-2 grid grid-cols-[1fr_48px] gap-2">
            <select
              aria-label="Font"
              className="input"
              value={fontFamily}
              onChange={(event) => {
                setFontFamily(event.target.value);
                updateText('fontFamily', event.target.value);
              }}
            >
              {FONTS.map((font) => <option key={font}>{font}</option>)}
            </select>
            <input
              aria-label="Text color"
              type="color"
              value={textColor}
              onChange={(event) => {
                setTextColor(event.target.value);
                updateText('fill', event.target.value);
              }}
              className="h-12 w-12 border border-slate-300 bg-white p-1"
            />
          </div>
          <button type="button" className="btn-secondary mt-2 flex w-full items-center justify-center gap-2" onClick={addText}>
            <Type size={17} /> Add text
          </button>
        </div>
        <div>
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadArtwork(file);
              event.target.value = '';
            }}
          />
          <button type="button" className="btn-secondary flex w-full items-center justify-center gap-2" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={17} /> Upload artwork
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button type="button" title="Duplicate" aria-label="Duplicate" className="btn-secondary !px-0" onClick={() => void duplicateSelected()} disabled={!selected}><Copy className="mx-auto" size={17} /></button>
          <button type="button" title="Delete" aria-label="Delete" className="btn-secondary !px-0" onClick={deleteSelected} disabled={!selected}><Trash2 className="mx-auto" size={17} /></button>
          <button type="button" title="Center horizontally" aria-label="Center horizontally" className="btn-secondary !px-0" onClick={() => centerSelected('horizontal')} disabled={!selected}><AlignCenterHorizontal className="mx-auto" size={17} /></button>
          <button type="button" title="Center vertically" aria-label="Center vertically" className="btn-secondary !px-0" onClick={() => centerSelected('vertical')} disabled={!selected}><AlignCenterVertical className="mx-auto" size={17} /></button>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-teal-700" />
            <h3 className="font-black">AI artwork assistant</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">Private, on-device analysis for the selected layer.</p>
          <button type="button" className="btn-secondary mt-3 flex w-full items-center justify-center gap-2" onClick={analyzeSelected}>
            <ScanSearch size={16} /> Analyze artwork
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary flex items-center justify-center gap-2 !px-2" onClick={smartFitSelected} disabled={!selected}>
              <WandSparkles size={15} /> Smart fit
            </button>
            <button type="button" className="btn-secondary !px-2" onClick={applyContrastColor} disabled={!selected}>
              Auto contrast
            </button>
          </div>
          <button type="button" className="btn-secondary mt-2 w-full" onClick={removeImageBackground} disabled={!selected}>
            Remove image background
          </button>
          {assistantReport && (
            <div className="mt-3 border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <strong className="text-sm">{assistantReport.title}</strong>
                <span className={`text-sm font-black ${assistantReport.score >= 85 ? 'text-teal-700' : assistantReport.score >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                  {assistantReport.score}/100
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {assistantReport.findings.map((finding) => <li key={finding}>{finding}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div>
          <label className="label">Quantity</label>
          <input className="input mt-2" type="number" min="1" value={qty} onChange={(event) => setQty(Math.max(1, Number(event.target.value) || 1))} />
        </div>
        <div className="border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between"><span>Base unit price</span><b>${baseUnitPrice.toFixed(2)}</b></div>
          <div className="mt-2 flex justify-between"><span>{activeLocationCount} print location{activeLocationCount > 1 ? 's' : ''}</span><b>{locationImpact ? `+$${locationImpact.toFixed(2)}` : 'Included'}</b></div>
          <div className="mt-3 flex justify-between border-t border-slate-300 pt-3 text-base"><span>Total</span><b>${(qty * unitPrice).toFixed(2)}</b></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary flex items-center justify-center gap-2 !px-3" onClick={saveJson}><Save size={16} /> JSON</button>
          <button type="button" className="btn-secondary flex items-center justify-center gap-2 !px-3" onClick={() => void downloadPreview()}><Download size={16} /> Preview</button>
        </div>
        <button type="button" className="btn-primary w-full" onClick={() => void saveToCart()}>Save design &amp; add to cart</button>
        {status && <p aria-live="polite" className="text-sm font-medium text-teal-700">{status}</p>}
      </aside>
    </div>
  );
}
