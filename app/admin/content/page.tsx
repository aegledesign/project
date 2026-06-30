'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { NavigationItem, PageSectionContent, SiteConfig } from '@/lib/types';

export default function AdminContent() {
  const [site, setSite] = useState<SiteConfig>();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/site')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load site content');
        return response.json();
      })
      .then((data: SiteConfig) => {
        setSite(data);
        setDrafts(Object.fromEntries(data.pages.flatMap((page) => page.sections.map((section) => [section.id, JSON.stringify(section.content, null, 2)]))));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load site content'))
      .finally(() => setLoading(false));
  }, []);

  function updateNavigation(id: string, patch: Partial<NavigationItem>) {
    if (!site) return;
    setSite({ ...site, navigation: site.navigation.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }

  async function save() {
    if (!site) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const pages = site.pages.map((page) => ({
        ...page,
        sections: page.sections.map((section) => ({
          ...section,
          content: JSON.parse(drafts[section.id] ?? '{}') as PageSectionContent,
        })),
      }));
      const response = await fetch('/api/admin/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...site, pages }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Unable to save site content');
      setSite(body);
      setMessage('Storefront content saved');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid block configuration');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-6xl px-6 py-16 text-slate-500">Loading content configuration...</main>;
  if (!site) return <main className="mx-auto max-w-6xl px-6 py-16 text-red-700">{error || 'Content configuration unavailable'}</main>;

  const home = site.pages.find((page) => page.slug === 'home');
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black">Storefront content</h1>
          <p className="mt-2 text-slate-600">Typed content blocks only. HTML is not accepted or rendered.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" disabled={saving} onClick={() => void save()}>
          <Save size={17} /> {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
      {error && <div className="mt-5 border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>}
      {message && <div className="mt-5 border border-teal-300 bg-teal-50 p-4 text-teal-800">{message}</div>}

      <section className="mt-8 border-y border-slate-300 py-8">
        <h2 className="text-2xl font-black">Brand theme</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="label">Brand name
            <input className="input mt-1" value={site.theme.brandName} onChange={(event) => setSite({ ...site, theme: { ...site.theme, brandName: event.target.value } })} />
          </label>
          <label className="label">Logo URL
            <input className="input mt-1" value={site.theme.logoUrl ?? ''} onChange={(event) => setSite({ ...site, theme: { ...site.theme, logoUrl: event.target.value || undefined } })} />
          </label>
          {(['primaryColor', 'accentColor', 'backgroundColor'] as const).map((key) => (
            <label key={key} className="label capitalize">{key.replace('Color', ' color')}
              <div className="mt-1 flex gap-2">
                <input type="color" className="h-12 w-14 border border-slate-300 bg-white p-1" value={site.theme[key]} onChange={(event) => setSite({ ...site, theme: { ...site.theme, [key]: event.target.value } })} />
                <input className="input" value={site.theme[key]} onChange={(event) => setSite({ ...site, theme: { ...site.theme, [key]: event.target.value } })} />
              </div>
            </label>
          ))}
          <label className="label md:col-span-2">Footer description
            <textarea className="input mt-1 min-h-20" value={site.theme.footerText} onChange={(event) => setSite({ ...site, theme: { ...site.theme, footerText: event.target.value } })} />
          </label>
        </div>
      </section>

      <section className="border-b border-slate-300 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Navigation and footer links</h2>
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => {
              const item: NavigationItem = {
                id: crypto.randomUUID(),
                label: 'New link',
                href: '/',
                location: 'HEADER',
                group: '',
                displayOrder: site.navigation.length,
                active: true,
              };
              setSite({ ...site, navigation: [...site.navigation, item] });
            }}
          >
            <Plus size={16} /> Add link
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {site.navigation.map((item) => (
            <div key={item.id} className="grid gap-3 border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_130px_1fr_40px]">
              <input aria-label="Link label" className="input" value={item.label} onChange={(event) => updateNavigation(item.id, { label: event.target.value })} />
              <input aria-label="Link path" className="input" value={item.href} onChange={(event) => updateNavigation(item.id, { href: event.target.value })} />
              <select aria-label="Link location" className="input" value={item.location} onChange={(event) => updateNavigation(item.id, { location: event.target.value as NavigationItem['location'] })}>
                <option>HEADER</option><option>FOOTER</option>
              </select>
              <input aria-label="Footer group" className="input" placeholder="Footer group" value={item.group} onChange={(event) => updateNavigation(item.id, { group: event.target.value })} />
              <button aria-label="Delete link" className="text-red-700" onClick={() => setSite({ ...site, navigation: site.navigation.filter((current) => current.id !== item.id) })}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8">
        <h2 className="text-2xl font-black">Homepage blocks</h2>
        <p className="mt-2 text-sm text-slate-600">Each block is validated against an allowed renderer type. Scripts and HTML are never executed.</p>
        <div className="mt-5 space-y-5">
          {home?.sections.sort((left, right) => left.displayOrder - right.displayOrder).map((section) => (
            <div key={section.id} className="border border-slate-300 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black">{section.type}</h3>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={section.active}
                    onChange={(event) => setSite({
                      ...site,
                      pages: site.pages.map((page) => page.id === home.id
                        ? { ...page, sections: page.sections.map((item) => item.id === section.id ? { ...item, active: event.target.checked } : item) }
                        : page),
                    })}
                  />
                  Active
                </label>
              </div>
              <textarea
                aria-label={`${section.type} configuration`}
                spellCheck={false}
                className="input mt-3 min-h-52 font-mono text-xs"
                value={drafts[section.id] ?? ''}
                onChange={(event) => setDrafts({ ...drafts, [section.id]: event.target.value })}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
