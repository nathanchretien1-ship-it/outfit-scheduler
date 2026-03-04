import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GeneratePlanButton } from "@/components/generate-plan-button";
import { ClothingCard } from "@/components/clothing-card";
import { Calendar, Wand2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function PlannerPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/planner");
  }

  // Check if user has enough items
  const wardrobeCount = await prisma.clothingItem.count({
    where: { userId: session.user.id },
  });

  const hasEnoughItems = wardrobeCount >= 3;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const plans = await prisma.outfitPlan.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: today,
      },
    },
    include: {
      items: {
        include: {
          clothingItem: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Planning des tenues
          </h1>
          <p className="text-muted-foreground mt-1">
            Générez et visualisez vos tenues recommandées par l'IA.
          </p>
        </div>
        <GeneratePlanButton hasItems={hasEnoughItems} />
      </div>

      {!hasEnoughItems && plans.length === 0 && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 rounded-r-md mb-8 flex items-start gap-3">
          <Wand2 className="h-5 w-5 mt-0.5" />
          <div>
            <h3 className="font-medium">Pas assez de vêtements</h3>
            <p className="text-sm opacity-90">
              Veuillez ajouter au moins 3 vêtements dans votre dressing pour
              permettre à l'IA de créer des combinaisons intéressantes.
            </p>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl border-dashed bg-secondary/10">
          <div className="p-4 bg-secondary rounded-full mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Aucun planning actif</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Laissez l'IA composer vos tenues pour les prochains jours en
            cliquant sur le bouton "Générer un planning".
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {plans.map((plan) => {
            const dateStr = plan.date.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
            const isToday =
              plan.date.toDateString() === new Date().toDateString();

            return (
              <div key={plan.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold capitalize tracking-tight flex items-center gap-2">
                    {dateStr}
                  </h2>
                  {isToday && (
                    <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider">
                      Aujourd'hui
                    </span>
                  )}
                </div>

                {plan.notes && (
                  <p className="text-muted-foreground italic flex items-center gap-2 bg-secondary/30 p-3 rounded-md">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {plan.notes}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {plan.items.map((outfitItem) => (
                    <ClothingCard
                      key={outfitItem.id}
                      item={outfitItem.clothingItem}
                    />
                  ))}
                  {plan.items.length === 0 && (
                    <Card className="col-span-2 md:col-span-4 lg:col-span-5 bg-muted/50 border-dashed">
                      <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                        <Wand2 className="h-8 w-8 mb-2 opacity-50" />
                        <p>L'IA n'a pas pu trouver de tenue pour ce jour.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
