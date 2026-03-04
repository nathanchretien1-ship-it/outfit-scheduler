import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const { image } = await req.json();

    if (!image) {
      return new NextResponse("L'image est requise", { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("API OpenAI non configurée", { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Call OpenAI Vision API to analyze clothing item
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyse ce vêtement et retourne-moi un objet JSON strict (sans Markdown ni balises) avec les champs suivants en français : 'type' (ex: t-shirt, pantalon, pull, chemise, etc.), 'color' (la couleur principale, ex: bleu, noir, rouge), et 'style' (ex: casual, formel, sport, etc.). Si ce n'est pas un vêtement, retourne {}. Exemple de sortie attendue : {\"type\": \"t-shirt\", \"color\": \"noir\", \"style\": \"casual\"}",
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      return new NextResponse("Impossible d'analyser l'image", { status: 500 });
    }

    try {
      const parsedData = JSON.parse(content);
      return NextResponse.json(parsedData);
    } catch (e) {
      console.error("Erreur de parsing JSON OpenAI", content);
      return new NextResponse("Format de réponse invalide", { status: 500 });
    }
  } catch (error) {
    console.error("[ANALYZE_POST]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}