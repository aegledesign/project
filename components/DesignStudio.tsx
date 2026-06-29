'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  Copy,
  Download,
  ImagePlus,
  Layers3,
  RotateCcw,
  Save,
  Trash2,
  Type,
} from 'lucide-react';
import { Canvas, FabricImage, FabricObject, Textbox } from 'fabric';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cartClient';
import { getUnitPrice } from '@/lib/pricing';

type DesignSide = 'front' | 'back';
type SerializedCanvas = ReturnType<Canvas['toJSON']>;
type LayerItem = { object: FabricObject; name: string };

const CANVAS_SIZE = 600;
const PRINT_AREA = { left: 205, top: 170, width: 190, height: 230 };
const LOCATION_SURCHARGE = 2.5;
const FONTS = ['Arial', 'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana'];

function getLayerName(object: FabricObject, index: number) {
  if (object instanceof Textbox) {
    const value = object.text.trim();
    return value ? `Text: ${value.slice(0, 22)}` : `Text ${index + 1}`;
  }
  return `Artwork ${index + 1}`;
}

export function DesignStudio({ product }: { product: Product }) {
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sideRef = useRef<DesignSide>('front');
  const savedSidesRef = useRef<Record<DesignSide, SerializedCanvas | null>>({
    front: null,
    back: null,
  });

  const [side, setSide] = useState<DesignSide>('front');
  const [text, setText] = useState('Your text');
  const [fontFamily, setFontFamily] = useState(FONTS[0]);
  const [textColor, setTextColor] = useState('#111827');
  const [productColor, setProductColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(24);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [outsideArea, setOutsideArea] = useState(false);
  const [objectCounts, setObjectCounts] = useState<Record<DesignSide, number>>({
    front: 0,
    back: 0,
  });
  const [preview, setPreview] = useState<string>();
  const [status, setStatus] = useState('');

  const addToCart = useCart((state) => state.add);
  const baseUnitPrice = useMemo(() => getUnitPrice(product, qty), [product, qty]);
  const printLocationCount = Math.max(
    1,
    Number(objectCounts.front > 0) + Number(objectCounts.back > 0),
  );
  const locationImpact = (printLocationCount - 1) * LOCATION_SURCHARGE;
  const unitPrice = baseUnitPrice + locationImpact;

  const syncCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    setLayers(objects.map((object, index) => ({ object, name: getLayerName(object, index) })).reverse());
    setObjectCounts((current) => ({ ...current, [sideRef.current]: objects.length }));

    const active = canvas.getActiveObject();
    setSelected(active ?? null);
    if (!active) {
      setOutsideArea(false);
      return;
    }

    const bounds = active.getBoundingRect();
    const isOutside =
      bounds.left < PRINT_AREA.left ||
      bounds.top < PRINT_AREA.top ||
      bounds.left + bounds.width > PRINT_AREA.left + PRINT_AREA.width ||
      bounds.top + bounds.height > PRINT_AREA.top + PRINT_AREA.height;
    setOutsideArea(isOutside);
  }, []);

  useEffect(() => {
    if (!canvasElementRef.current) return;

    const canvas = new Canvas(canvasElementRef.current, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      preserveObjectStacking: true,
      selectionColor: 'rgba(13, 148, 136, 0.12)',
      selectionBorderColor: '#0d9488',
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
    events.forEach((event) => canvas.on(event, syncCanvasState));
    syncCanvasState();

    return () => {
      savedSidesRef.current[sideRef.current] = canvas.toJSON();
      canvas.dispose();
      canvasRef.current = null;
    };
  }, [syncCanvasState]);

  function updateSelectedText(property: 'fontFamily' | 'fill', value: string) {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!(active instanceof Textbox)) return;
    active.set(property, value);
    canvas?.requestRenderAll();
    syncCanvasState();
  }

  function addText() {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
    const textObject = new Textbox(text.trim(), {
      left: CANVAS_SIZE / 2,
      top: CANVAS_SIZE / 2,
      originX: 'center',
      originY: 'center',
      width: 180,
      fontFamily,
      fontSize: 32,
      fontWeight: 700,
      fill: textColor,
      textAlign: 'center',
    });
    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    canvas.requestRenderAll();
    syncCanvasState();
  }

  async function uploadArtwork(file: File) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const image = await FabricImage.fromURL(dataUrl);
    const maxDimension = 150;
    image.scale(Math.min(maxDimension / (image.width || 1), maxDimension / (image.height || 1)));
    image.set({
      left: CANVAS_SIZE / 2,
      top: CANVAS_SIZE / 2,
      originX: 'center',
      originY: 'center',
    });
    canvas.add(image);
    canvas.setActiveObject(image);
    canvas.requestRenderAll();
    syncCanvasState();
    setStatus(`${file.name} added`);
  }

  function deleteSelected() {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObjects() ?? [];
    if (!canvas || active.length === 0) return;
    active.forEach((object) => canvas.remove(object));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncCanvasState();
  }

  async function duplicateSelected() {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    const clone = await active.clone();
    clone.set({
      left: (active.left ?? 0) + 18,
      top: (active.top ?? 0) + 18,
      evented: true,
    });
    canvas.add(clone);
    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
    syncCanvasState();
  }

  function centerSelected(axis: 'horizontal' | 'vertical') {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    if (axis === 'horizontal') {
      active.set({ left: PRINT_AREA.left + PRINT_AREA.width / 2, originX: 'center' });
    } else {
      active.set({ top: PRINT_AREA.top + PRINT_AREA.height / 2, originY: 'center' });
    }
    active.setCoords();
    canvas.requestRenderAll();
    syncCanvasState();
  }

  async function changeSide(nextSide: DesignSide) {
    const canvas = canvasRef.current;
    if (!canvas || nextSide === sideRef.current) return;
    savedSidesRef.current[sideRef.current] = canvas.toJSON();
    sideRef.current = nextSide;
    setSide(nextSide);
    canvas.clear();
    const saved = savedSidesRef.current[nextSide];
    if (saved) await canvas.loadFromJSON(saved);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncCanvasState();
    setStatus(`Editing ${nextSide}`);
  }

  function getDesignData() {
    const canvas = canvasRef.current;
    if (canvas) savedSidesRef.current[sideRef.current] = canvas.toJSON();
    return {
      version: 1,
      productSlug: product.slug,
      productColor,
      activeSide: sideRef.current,
      printLocations: {
        front: savedSidesRef.current.front,
        back: savedSidesRef.current.back,
      },
      pricing: {
        baseUnitPrice,
        locationCount: printLocationCount,
        additionalLocationPrice: LOCATION_SURCHARGE,
        unitPrice,
      },
    };
  }

  function saveJson() {
    const json = JSON.stringify(getDesignData(), null, 2);
    localStorage.setItem(`aegle-design:${product.slug}`, json);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${product.slug}-design.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Design JSON saved');
  }

  async function generatePreview() {
    const fabricCanvas = canvasRef.current;
    if (!fabricCanvas) return undefined;

    const artwork = fabricCanvas.toDataURL({ format: 'png', multiplier: 1 });
    const output = document.createElement('canvas');
    output.width = CANVAS_SIZE;
    output.height = CANVAS_SIZE;
    const context = output.getContext('2d');
    if (!context) return undefined;

    context.fillStyle = '#f8fafc';
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });

    const [mockup, art] = await Promise.all([loadImage(product.hero), loadImage(artwork)]);
    context.drawImage(mockup, 0, 60, CANVAS_SIZE, 480);
    context.drawImage(art, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.fillStyle = '#111827';
    context.font = '700 18px Arial';
    context.fillText(`${product.name} - ${sideRef.current}`, 20, 32);
    const dataUrl = output.toDataURL('image/png');
    setPreview(dataUrl);
    setStatus('Preview generated');
    return dataUrl;
  }

  async function downloadPreview() {
    const dataUrl = (await generatePreview()) ?? preview;
    if (!dataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = `${product.slug}-${sideRef.current}-preview.png`;
    anchor.click();
  }

  async function saveToCart() {
    const previewData = (await generatePreview()) ?? preview;
    const designJson = JSON.stringify(getDesignData());
    localStorage.setItem(`aegle-design:${product.slug}`, designJson);
    const locations = [
      objectCounts.front > 0 ? 'Front' : '',
      objectCounts.back > 0 ? 'Back' : '',
    ].filter(Boolean);
    addToCart({
      id: crypto.randomUUID(),
      productSlug: product.slug,
      productName: product.name,
      color: productColor,
      printLocation: locations.join(' + ') || 'Front',
      sizes: { Mixed: qty },
      unitPrice,
      designJson,
      preview: previewData,
    });
    setStatus('Design saved and attached to cart');
  }

  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[240px_minmax(620px,1fr)_310px]">
      <aside className="card order-2 p-4 xl:order-1">
        <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-3">
          <Layers3 size={18} />
          <h2 className="font-bold">Layers</h2>
          <span className="ml-auto text-xs text-slate-500">{side}</span>
        </div>
        {layers.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No artwork on this side</p>
        ) : (
          <div className="space-y-1">
            {layers.map(({ object, name }, index) => (
              <button
                key={`${name}-${index}`}
                type="button"
                onClick={() => {
                  canvasRef.current?.setActiveObject(object);
                  canvasRef.current?.requestRenderAll();
                  syncCanvasState();
                }}
                className={`w-full border px-3 py-2 text-left text-sm ${
                  selected === object
                    ? 'border-teal-600 bg-teal-50 font-semibold'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </aside>

      <section className="order-1 min-w-0 xl:order-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex border border-slate-300 bg-white p-1" aria-label="Design side">
            {(['front', 'back'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => void changeSide(value)}
                className={`px-5 py-2 text-sm font-semibold capitalize ${
                  side === value ? 'bg-slate-900 text-white' : 'text-slate-700'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <span className="text-sm font-medium text-slate-600">
            {side === 'front' ? 'Front print area' : 'Back print area'}
          </span>
        </div>

        <div className="card overflow-auto p-3 sm:p-5">
          <div
            className="relative mx-auto h-[600px] w-[600px] max-w-none bg-white"
            style={{
              backgroundImage: `url("${product.hero}")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '600px 480px',
            }}
          >
            <canvas ref={canvasElementRef} />
            <div
              className={`pointer-events-none absolute border-2 border-dashed ${
                outsideArea ? 'border-red-600' : 'border-teal-600'
              }`}
              style={PRINT_AREA}
            >
              <span
                className={`absolute -top-7 left-0 bg-white px-2 py-1 text-xs font-bold ${
                  outsideArea ? 'text-red-700' : 'text-teal-700'
                }`}
              >
                Printable area
              </span>
            </div>
          </div>
        </div>
        {outsideArea && (
          <div className="mt-3 border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            Selected artwork extends outside the printable area. Move or resize it before ordering.
          </div>
        )}
        <p className="mt-3 text-center text-sm text-slate-500">
          Select an object to drag, resize, or rotate it using the canvas handles.
        </p>
      </section>

      <aside className="card order-3 space-y-5 p-5">
        <div>
          <label className="label">Product color</label>
          <select
            className="input mt-2"
            value={productColor}
            onChange={(event) => setProductColor(event.target.value)}
          >
            {product.colors.map((color) => (
              <option key={color}>{color}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <label className="label">Add text</label>
          <input
            className="input mt-2"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && addText()}
          />
          <div className="mt-2 grid grid-cols-[1fr_48px] gap-2">
            <select
              aria-label="Font"
              className="input"
              value={fontFamily}
              onChange={(event) => {
                setFontFamily(event.target.value);
                updateSelectedText('fontFamily', event.target.value);
              }}
            >
              {FONTS.map((font) => (
                <option key={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
            <input
              aria-label="Text color"
              title="Text color"
              type="color"
              value={textColor}
              onChange={(event) => {
                setTextColor(event.target.value);
                updateSelectedText('fill', event.target.value);
              }}
              className="h-12 w-12 cursor-pointer border border-slate-300 bg-white p-1"
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
          <button
            type="button"
            className="btn-secondary flex w-full items-center justify-center gap-2"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus size={17} /> Upload logo or image
          </button>
        </div>

        <div>
          <span className="label">Selected object</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            <button type="button" title="Duplicate" aria-label="Duplicate selected object" className="btn-secondary !px-0" onClick={() => void duplicateSelected()} disabled={!selected}>
              <Copy className="mx-auto" size={17} />
            </button>
            <button type="button" title="Delete" aria-label="Delete selected object" className="btn-secondary !px-0" onClick={deleteSelected} disabled={!selected}>
              <Trash2 className="mx-auto" size={17} />
            </button>
            <button type="button" title="Center horizontally" aria-label="Center horizontally" className="btn-secondary !px-0" onClick={() => centerSelected('horizontal')} disabled={!selected}>
              <AlignCenterHorizontal className="mx-auto" size={17} />
            </button>
            <button type="button" title="Center vertically" aria-label="Center vertically" className="btn-secondary !px-0" onClick={() => centerSelected('vertical')} disabled={!selected}>
              <AlignCenterVertical className="mx-auto" size={17} />
            </button>
          </div>
        </div>

        <div>
          <label className="label">Quantity</label>
          <input
            className="input mt-2"
            type="number"
            min="1"
            value={qty}
            onChange={(event) => setQty(Math.max(1, Number(event.target.value) || 1))}
          />
        </div>

        <div className="border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <span>Base unit price</span>
            <b>${baseUnitPrice.toFixed(2)}</b>
          </div>
          <div className="mt-2 flex justify-between">
            <span>{printLocationCount} print location{printLocationCount > 1 ? 's' : ''}</span>
            <b>{locationImpact ? `+$${locationImpact.toFixed(2)}` : 'Included'}</b>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-300 pt-3 text-base">
            <span>Total</span>
            <b>${(qty * unitPrice).toFixed(2)}</b>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary flex items-center justify-center gap-2 !px-3" onClick={saveJson}>
            <Save size={16} /> JSON
          </button>
          <button type="button" className="btn-secondary flex items-center justify-center gap-2 !px-3" onClick={() => void downloadPreview()}>
            <Download size={16} /> Preview
          </button>
        </div>
        <button type="button" className="btn-primary w-full" onClick={() => void saveToCart()}>
          Save design &amp; add to cart
        </button>
        {status && (
          <p aria-live="polite" className="flex items-center gap-2 text-sm font-medium text-teal-700">
            <RotateCcw size={14} /> {status}
          </p>
        )}
      </aside>
    </div>
  );
}
