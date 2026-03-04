import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clothingItemSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const items = await prisma.clothingItem.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[CLOTHING_GET]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const json = await req.json();
    const body = clothingItemSchema.parse(json);

    const clothingItem = await prisma.clothingItem.create({
      data: {
        ...body,
        userId: session.user.id,
      },
    });

    return NextResponse.json(clothingItem);
  } catch (error) {
    console.error("[CLOTHING_POST]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}
