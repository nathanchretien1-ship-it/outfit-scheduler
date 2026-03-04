"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { ClothingItem } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ClothingCard({ item }: { item: ClothingItem }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Voulez-vous vraiment supprimer ce vêtement de votre dressing ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clothing/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur de suppression");
      }

      toast.success("Vêtement supprimé avec succès.");
      router.refresh();
    } catch (error) {
      toast.error("Impossible de supprimer ce vêtement.");
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full group relative">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8 rounded-full shadow-md"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative aspect-square bg-muted">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.type}
            className={`object-cover w-full h-full transition-transform group-hover:scale-105 ${
              isDeleting ? "opacity-50 grayscale" : ""
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-secondary/20">
            Aucune image
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1">
        <h3 className="font-semibold text-lg capitalize mb-1 line-clamp-1">
          {item.type}
        </h3>
        <p className="text-sm text-muted-foreground capitalize line-clamp-1">
          {item.brand || "Sans marque"}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2 flex-wrap">
        {item.color && (
          <Badge variant="secondary" className="capitalize text-xs">
            {item.color}
          </Badge>
        )}
        {item.style && (
          <Badge variant="outline" className="capitalize text-xs">
            {item.style}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}

export function ClothingCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardContent className="p-4 flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </CardFooter>
    </Card>
  );
}
