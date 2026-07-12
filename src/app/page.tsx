import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Shield, Zap, BarChart3, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">NegocIA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funciones
            </a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cómo funciona
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Comenzar gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_50%_50%,rgba(59,130,246,0.12),transparent)]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Potenciado por inteligencia artificial
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Tu dinero,{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                bajo control
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              NegocIA es tu asistente financiero inteligente. Administra tu dinero, negocios e
              inversiones con la potencia de la inteligencia artificial.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="xl" className="group">
                Empezar ahora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button variant="outline" size="xl">
                Ver demo
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Todo lo que necesitás</h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Herramientas poderosas para que tomes mejores decisiones financieras.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: MessageSquare,
                  title: "Asistente IA",
                  description: "Hacé preguntas sobre tus finanzas y obtené respuestas inteligentes al instante.",
                },
                {
                  icon: BarChart3,
                  title: "Dashboard financiero",
                  description: "Visualizá tus ingresos, gastos e inversiones en tiempo real con gráficos claros.",
                },
                {
                  icon: Shield,
                  title: "Seguridad bancaria",
                  description: "Tus datos están protegidos con encriptación de grado bancario.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="border-t border-border py-24 bg-secondary/20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple como hablar</h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Solo preguntale a tu asistente y dejá que la IA haga el trabajo pesado.
              </p>
            </div>
            <div className="mx-auto max-w-2xl space-y-8">
              {[
                { step: "01", text: "Preguntale a NegocIA sobre tus finanzas" },
                { step: "02", text: "Analizá los datos y recomendaciones personalizadas" },
                { step: "03", text: "Tomá mejores decisiones con información clara" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                    {item.step}
                  </div>
                  <p className="text-lg font-medium pt-2">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Empezá a tomar mejores decisiones hoy
            </h2>
            <p className="mt-4 text-muted-foreground">
              Uníte a NegocIA y llevá tus finanzas al siguiente nivel.
            </p>
            <div className="mt-10">
              <Link href="/register">
                <Button size="xl" className="group">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">NegocIA</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 NegocIA. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
