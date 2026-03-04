"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { clothingItemSchema } from "@/lib/validations";
import { UploadCloud, Wand2, PlusCircle, RefreshCcw, ScanLine, Camera } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useZxing } from "react-zxing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AddClothingForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const form = useForm<z.infer<typeof clothingItemSchema>>({
    resolver: zodResolver(clothingItemSchema),
    defaultValues: {
      type: "",
      color: "",
      style: "",
      brand: "",
      imageUrl: "",
      barcode: "",
    },
  });

  const { ref: barcodeRef } = useZxing({
    paused: !isScanning,
    onDecodeResult(result) {
      setIsScanning(false);
      const code = result.getText();
      form.setValue("barcode", code);
      toast.success("Code-barres scanné : " + code);
      lookupBarcode(code);
    },
    onError(error) {
      // Ignore scan errors, they happen continuously until a barcode is found
    },
  });

  const lookupBarcode = async (barcode: string) => {
    toast.info("Recherche des informations du produit...");
    try {
      // Using Open Products Facts API (free, open database)
      const response = await fetch(`https://world.openproductsfacts.org/api/v2/product/${barcode}.json`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 1 && data.product) {
          const product = data.product;

          if (product.brands) form.setValue("brand", product.brands, { shouldValidate: true });
          if (product.categories) form.setValue("type", product.categories.split(",")[0], { shouldValidate: true });

          toast.success("Informations trouvées !");
          return;
        }
      }
      toast.warning("Produit introuvable dans la base publique. Vous pouvez utiliser l'analyse photo à la place.");
    } catch (e) {
      toast.error("Erreur lors de la recherche du code-barres.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (max 4MB).");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        form.setValue("imageUrl", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    toast.info("Analyse du vêtement en cours...");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse");
      }

      const data = await response.json();

      if (data.type) {
        form.setValue("type", data.type, { shouldValidate: true });
        form.setValue("color", data.color || "", { shouldValidate: true });
        form.setValue("style", data.style || "", { shouldValidate: true });
        toast.success("Vêtement identifié avec succès !");
      } else {
        toast.warning("Impossible d'identifier clairement le vêtement.");
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de l'analyse par l'IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  async function onSubmit(values: z.infer<typeof clothingItemSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Erreur de sauvegarde");

      toast.success("Vêtement ajouté à votre dressing !");
      form.reset();
      setImagePreview(null);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      toast.error("Impossible d'ajouter le vêtement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Tabs defaultValue="photo" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="photo" onClick={() => setIsScanning(false)}>
          <Camera className="w-4 h-4 mr-2" />
          Photo & IA
        </TabsTrigger>
        <TabsTrigger value="barcode" onClick={() => setIsScanning(true)}>
          <ScanLine className="w-4 h-4 mr-2" />
          Code-barres
        </TabsTrigger>
      </TabsList>

      <TabsContent value="photo" className="space-y-4">
        <div className="flex flex-col items-center justify-center w-full">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 border-border transition-colors overflow-hidden relative"
          >
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                <UploadCloud className="w-8 h-8 mb-4" />
                <p className="mb-2 text-sm font-semibold">
                  Cliquez ou prenez une photo
                </p>
                <p className="text-xs">PNG, JPG, ou WEBP (Max. 4MB)</p>
              </div>
            )}
            <input
              id="dropzone-file"
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              onChange={handleImageChange}
              capture="environment" // Hint for mobile to use rear camera
            />
          </label>

          {imagePreview && (
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              onClick={handleAnalyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              {isAnalyzing ? "Analyse en cours..." : "Remplir avec l'IA"}
            </Button>
          )}
        </div>
      </TabsContent>

      <TabsContent value="barcode" className="space-y-4">
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative flex flex-col items-center justify-center">
          {isScanning ? (
            <video ref={barcodeRef} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6 flex flex-col items-center text-white/70">
              <ScanLine className="w-12 h-12 mb-4 opacity-50" />
              <p>Scanner en pause</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setIsScanning(true)}
              >
                Reprendre le scan
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Placez le code-barres de l'étiquette au centre. Les informations disponibles publiquement seront pré-remplies.
        </p>
      </TabsContent>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de vêtement *</FormLabel>
                  <FormControl>
                    <Input placeholder="T-shirt, pantalon, pull..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur(s) principale(s)</FormLabel>
                  <FormControl>
                    <Input placeholder="Noir, bleu marine..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style</FormLabel>
                  <FormControl>
                    <Input placeholder="Casual, sport, chic..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marque (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nike, Levi's..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4 mr-2" />
            )}
            Ajouter au dressing
          </Button>
        </form>
      </Form>
    </Tabs>
  );
}
