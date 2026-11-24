import { Suspense } from "react";
import { ProviderPicker } from "@/components/ProviderPicker";
import { getServiceGroups } from "@/lib/providers/service";
import { getSelection } from "@/lib/selection-server";

async function Picker() {
  const [groups, selection] = await Promise.all([getServiceGroups(), getSelection()]);
  return <ProviderPicker groups={groups} initial={selection} />;
}

export default function StreamingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-8">
      <h1 className="text-2xl font-bold">Quais streamings você assina?</h1>
      <p className="mb-4 text-sm text-muted">Dá para mudar depois em ⚙.</p>
      <Suspense fallback={<p className="text-muted">Carregando serviços...</p>}>
        <Picker />
      </Suspense>
    </main>
  );
}
