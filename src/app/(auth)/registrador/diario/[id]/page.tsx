import { getDiarioById } from "@/actions/diario";
import { notFound } from "next/navigation";
import { DiarioEditClient } from "./DiarioEditClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DiarioEditPage({ params }: PageProps) {
  const { id } = await params;

  let entry: any;
  try {
    entry = await getDiarioById(id);
  } catch {
    notFound();
  }
  if (!entry) notFound();

  return <DiarioEditClient entry={entry} />;
}
