"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";

const steps = [
  { label: "Gastos", icon: "💰" },
  { label: "Ingresos", icon: "📈" },
  { label: "Inversiones", icon: "📊" },
  { label: "Objetivos", icon: "🎯" },
  { label: "Riesgos", icon: "⚠️" },
];

export function AnalyzeButton() {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [done, setDone] = useState(false);

  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setCurrentStep(0);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, 600));
    }

    setDone(true);
    await new Promise((r) => setTimeout(r, 800));

    router.push(
      `/dashboard/chat?q=${encodeURIComponent("Haceme un diagnóstico completo de mi situación financiera")}`
    );
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center animate-scale-in">
        <div className="flex items-center justify-center gap-2 text-emerald-500">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">Tu diagnóstico está listo</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Redirigiendo al asistente...</p>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 animate-pulse-glow">
        <div className="flex items-center gap-3 mb-5">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="font-semibold text-primary">Analizando tu situación...</span>
        </div>
        <div className="space-y-2.5">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className="flex items-center gap-3 text-sm"
            >
              {i < currentStep ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : i === currentStep ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-border shrink-0" />
              )}
              <span className={i <= currentStep ? "text-foreground" : "text-muted-foreground/50"}>
                {step.icon} {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleAnalyze}
      className="group w-full rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-6 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.99] animate-pulse-glow"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 transition-colors group-hover:bg-primary/30">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold">Analizar mi situación</p>
          <p className="text-sm text-muted-foreground">
            NegocIA revisa todo y te da un diagnóstico completo
          </p>
        </div>
      </div>
    </button>
  );
}
