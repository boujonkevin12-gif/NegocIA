import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-6xl font-bold tracking-tighter">404</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        La página que buscás no existe o fue movida a otro lugar.
      </p>
      <Link href="/" className="mt-8">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  );
}
