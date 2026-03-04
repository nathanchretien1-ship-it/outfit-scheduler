"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, CalendarSync } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GeneratePlanButton({ hasItems }: { hasItems: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!hasItems) {
      toast.error(
        "Vous avez besoin d'au moins 3 vêtements pour générer un planning."
      );
      return;
    }

    setIsGenerating(true);
    toast.info("L'IA prépare vos tenues de la semaine...");

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7 }),
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
    <Button
      onClick={handleGenerate}
      disabled={isGenerating || !hasItems}
      className="w-full sm:w-auto shadow-sm"
    >
      {isGenerating ? (
        <CalendarSync className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {isGenerating ? "Création en cours..." : "Générer un planning (7 jours)"}
    </Button>
  );
}
