import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Wand2, CalendarSync } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center max-w-3xl mx-auto space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground flex flex-col items-center gap-4">
          <Sparkles className="h-16 w-16 text-primary" />
          Votre Dressing,
          <br /> Sublimé par l'IA.
        </h1>
        <p className="text-xl text-muted-foreground md:text-2xl leading-relaxed">
          Numérisez vos vêtements en un clin d'œil, et laissez notre
          intelligence artificielle planifier vos tenues parfaites pour toute la
          semaine.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
        <Button asChild size="lg" className="h-12 px-8 w-full sm:w-auto text-lg rounded-full">
          <Link href="/wardrobe">
            Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t text-left w-full mt-12">
        <div className="space-y-4">
          <div className="p-3 bg-secondary rounded-xl inline-block">
            <Wand2 className="h-6 w-6 text-foreground" />
          </div>
          <h3 className="text-xl font-bold">Analyse Intelligente</h3>
          <p className="text-muted-foreground leading-relaxed">
            Prenez simplement une photo. Notre IA identifie automatiquement le type, la couleur et le style de votre vêtement.
          </p>
        </div>
        <div className="space-y-4">
          <div className="p-3 bg-secondary rounded-xl inline-block">
            <CalendarSync className="h-6 w-6 text-foreground" />
          </div>
          <h3 className="text-xl font-bold">Plannings Automatiques</h3>
          <p className="text-muted-foreground leading-relaxed">
            Générez des suggestions de tenues coordonnées pour toute la semaine, adaptées à votre style.
          </p>
        </div>
      </div>
    </div>
  );
}
