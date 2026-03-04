import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OpenAI } from "openai";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("API OpenAI non configurée", { status: 500 });
    }

    const { days = 7 } = await req.json();

    // 1. Fetch user's wardrobe
    const wardrobe = await prisma.clothingItem.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        type: true,
        color: true,
        style: true,
        brand: true,
      },
    });

    if (wardrobe.length < 3) {
      return NextResponse.json(
        { error: "Pas assez de vêtements pour générer un planning (minimum 3 recommandés)." },
        { status: 400 }
      );
    }

    // 2. Call OpenAI to generate outfit plans
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Voici mon dressing : ${JSON.stringify(wardrobe)}.
Génère un planning de tenues pour les ${days} prochains jours.
Retourne UNIQUEMENT un objet JSON avec la structure suivante (et aucun autre texte) :
{
  "plans": [
    {
      "dayName": "Lundi",
      "notes": "Tenue de bureau casual",
      "itemIds": ["id1", "id2"] // Remplace par les vrais IDs des vêtements qui s'accordent bien
    }
  ]
}
Assure-toi de proposer des combinaisons logiques (ex: haut + bas, pas deux pantalons).`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "Tu es un styliste expert." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    if (!content) {
      return new NextResponse("Erreur lors de la génération", { status: 500 });
    }

    const generated = JSON.parse(content);

    // 3. Save plans to database
    const savedPlans = [];
    const today = new Date();

    for (let i = 0; i < generated.plans.length; i++) {
      const plan = generated.plans[i];
      const planDate = new Date(today);
      planDate.setDate(today.getDate() + i);

      const newPlan = await prisma.outfitPlan.create({
        data: {
          userId: session.user.id,
          date: planDate,
          notes: plan.notes,
          items: {
            create: plan.itemIds.map((itemId: string) => ({
              clothingItemId: itemId,
            })),
          },
        },
        include: {
          items: {
            include: {
              clothingItem: true,
            },
          },
        },
      });
      savedPlans.push(newPlan);
    }

    return NextResponse.json(savedPlans);
  } catch (error) {
    console.error("[PLAN_POST]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // Fetch plans from today onwards
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

    return NextResponse.json(plans);
  } catch (error) {
    console.error("[PLAN_GET]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}