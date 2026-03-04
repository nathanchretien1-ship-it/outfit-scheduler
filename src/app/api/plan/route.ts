import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OpenAI } from "openai";

async function getCoordinates(city: string) {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: data.results[0].name,
      };
    }
  } catch (e) {
    console.error("Geocoding error", e);
  }
  return null;
}

async function getWeatherForecast(lat: number, lon: number) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
    );
    return await res.json();
  } catch (e) {
    console.error("Weather API error", e);
    return null;
  }
}

// Convert Open-Meteo WMO weather codes to readable text
function decodeWeatherCode(code: number) {
  if (code === 0) return "Ciel dégagé";
  if ([1, 2, 3].includes(code)) return "Partiellement nuageux";
  if ([45, 48].includes(code)) return "Brouillard";
  if ([51, 53, 55, 56, 57].includes(code)) return "Bruine";
  if ([61, 63, 65, 66, 67].includes(code)) return "Pluie";
  if ([71, 73, 75, 77].includes(code)) return "Neige";
  if ([80, 81, 82].includes(code)) return "Averses de pluie";
  if ([85, 86].includes(code)) return "Averses de neige";
  if ([95, 96, 99].includes(code)) return "Orages";
  return "Météo incertaine";
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("API OpenAI non configurée", { status: 500 });
    }

    const { days = 7, city = "" } = await req.json();

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

    // 2. Fetch Weather if city is provided
    let weatherContext = "";
    if (city) {
      const coords = await getCoordinates(city);
      if (coords) {
        const weatherData = await getWeatherForecast(coords.lat, coords.lon);
        if (weatherData && weatherData.daily) {
          weatherContext = `Prends absolument en compte ces prévisions météorologiques pour ${coords.name} :\n`;
          for (let i = 0; i < Math.min(days, weatherData.daily.time.length); i++) {
            const date = weatherData.daily.time[i];
            const max = weatherData.daily.temperature_2m_max[i];
            const min = weatherData.daily.temperature_2m_min[i];
            const condition = decodeWeatherCode(weatherData.daily.weathercode[i]);
            weatherContext += `- Jour ${i + 1} (${date}): ${condition}, Température entre ${min}°C et ${max}°C.\n`;
          }
        }
      }
    }

    // 3. Call OpenAI to generate outfit plans
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Voici mon dressing : ${JSON.stringify(wardrobe)}.
Génère un planning de tenues pour les ${days} prochains jours.
${weatherContext}
Retourne UNIQUEMENT un objet JSON avec la structure suivante (et aucun autre texte) :
{
  "plans": [
    {
      "dayName": "Lundi",
      "notes": "Tenue de bureau casual adaptée au temps",
      "itemIds": ["id1", "id2"] // Remplace par les vrais IDs des vêtements qui s'accordent bien
    }
  ]
}
Assure-toi de proposer des combinaisons logiques (ex: haut + bas, pas deux pantalons). S'il fait froid, privilégie les pulls/manteaux si disponibles. S'il pleut, privilégie des tenues adaptées.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "Tu es un styliste expert et météorologue." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    if (!content) {
      return new NextResponse("Erreur lors de la génération", { status: 500 });
    }

    const generated = JSON.parse(content);

    // 4. Save plans to database
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
