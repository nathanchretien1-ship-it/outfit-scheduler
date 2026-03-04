"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, CalendarSync, CloudSun } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GeneratePlanButton({ hasItems }: { hasItems: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [city, setCity] = useState("");
  const router = useRouter();

  const handleGenerate = async () => {
    if (!hasItems) {
      toast.error(
        "Vous avez besoin d'au moins 3 vêtements pour générer un planning."
      );
      return;
    }

    setIsOpen(false);
    setIsGenerating(true);
    toast.info(
      city
        ? `L'IA prépare vos tenues avec la météo de ${city}...`
        : "L'IA prépare vos tenues de la semaine..."
    );

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7, city: city.trim() }),
      });

      if (!response.ok) {
        throw new Error("Erreur de génération");
      }

      toast.success("Planning généré avec succès !");
      router.refresh();
    } catch (error) {
      toast.error("Impossible de générer le planning.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={isGenerating || !hasItems}
          className="w-full sm:w-auto shadow-sm"
        >
          {isGenerating ? (
            <CalendarSync className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? "Création en cours..." : "Générer un planning"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Générer un planning intelligent</DialogTitle>
          <DialogDescription>
            Laissez l'IA composer vos tenues pour les 7 prochains jours.
            Optionnellement, entrez votre ville pour adapter les tenues à la
            météo locale.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-primary" />
              Ville (pour la météo)
            </Label>
            <Input
              id="city"
              placeholder="Ex: Paris, Lyon, Marseille..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour un planning sans contexte météorologique.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleGenerate} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Lancer la génération
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
