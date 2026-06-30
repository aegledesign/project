import { MockupEditor } from '@/components/admin/MockupEditor';

export default async function ProductMockupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-[1600px] px-6 py-10">
      <MockupEditor productId={id} />
    </main>
  );
}
