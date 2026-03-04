import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const { id } = await params;

    const item = await prisma.clothingItem.findUnique({
      where: {
        id: id,
      },
    });

    if (!item) {
      return new NextResponse("Vêtement introuvable", { status: 404 });
    }

    if (item.userId !== session.user.id) {
      return new NextResponse("Action non autorisée", { status: 403 });
    }

    await prisma.clothingItem.delete({
      where: {
        id: id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CLOTHING_DELETE]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}
