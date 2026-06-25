import type { PriceBreak } from '@/lib/types';
export function PriceBreaks({breaks}:{breaks:PriceBreak[]}){ return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{breaks.map(b=><div key={b.min} className="rounded-2xl border bg-white p-4 text-center"><div className="text-xs text-slate-500">{b.min}+ pcs</div><div className="text-lg font-black">${b.unitPrice}</div></div>)}</div> }
