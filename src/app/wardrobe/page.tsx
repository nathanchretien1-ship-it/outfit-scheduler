import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AddClothingForm } from "@/components/add-clothing-form";
import { ClothingCard, ClothingCardSkeleton } from "@/components/clothing-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Shirt } from "lucide-react";
import { Suspense } from "react";

export default async function WardrobePage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/wardrobe");
  }

  const items = await prisma.clothingItem.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon Dressing</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos vêtements et laissez l'IA vous conseiller.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un vêtement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter au dressing</DialogTitle>
              <DialogDescription>
                Prenez une photo de votre vêtement. Notre IA analysera ses
                caractéristiques.
              </DialogDescription>
            </DialogHeader>
            <AddClothingForm />
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl border-dashed bg-secondary/10">
          <div className="p-4 bg-secondary rounded-full mb-4">
            <Shirt className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Votre dressing est vide
          </h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Commencez par ajouter vos vêtements préférés pour débloquer les
            recommandations de tenues par l'IA.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          <Suspense
            fallback={Array.from({ length: 10 }).map((_, i) => (
              <ClothingCardSkeleton key={i} />
            ))}
          >
            {items.map((item) => (
              <ClothingCard key={item.id} item={item} />
            ))}
          </Suspense>
        </div>
      )}
    </div>
  );
}
