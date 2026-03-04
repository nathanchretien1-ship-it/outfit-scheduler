import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { token, password } = resetPasswordSchema.parse(json);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return new NextResponse("Token invalide ou expiré", { status: 400 });
    }

    // Check expiration
    if (new Date() > resetToken.expires) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return new NextResponse("Le lien a expiré. Veuillez refaire une demande.", { status: 400 });
    }

    // Hasher the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and delete the token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return NextResponse.json({ message: "Mot de passe modifié avec succès" }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    console.error("[RESET_PASSWORD]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}
