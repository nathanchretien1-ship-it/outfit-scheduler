import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new NextResponse("L'email est requis", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Pour des raisons de sécurité, ne pas révéler que l'utilisateur n'existe pas
      return NextResponse.json({ message: "Si l'email existe, un lien a été envoyé." });
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Expire dans 1 heure

    // Sauvegarder dans la DB
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
        userId: user.id,
      },
    });

    // En conditions réelles, envoyer le token par email via Resend, Sendgrid, etc.
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    // Simulation : Affichage dans la console du serveur
    console.log("-----------------------------------------");
    console.log("SIMULATION ENVOI EMAIL DE RÉCUPÉRATION");
    console.log(`À: ${email}`);
    console.log(`Lien: ${resetUrl}`);
    console.log("-----------------------------------------");

    return NextResponse.json({
      message: "Si l'email existe, un lien a été envoyé.",
      // Pour la démonstration et faciliter le test, on renvoie l'URL (A NE PAS FAIRE EN PRODUCTION SANS EMAIL RÉEL)
      // _debugResetUrl: resetUrl
    });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}
