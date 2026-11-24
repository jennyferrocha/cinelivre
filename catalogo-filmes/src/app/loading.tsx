import { MovieRowSkeleton } from "@/components/MovieRow";

export default function Loading() {
  return (
    <main className="flex flex-col gap-6 py-8">
      <MovieRowSkeleton />
      <MovieRowSkeleton />
    </main>
  );
}
