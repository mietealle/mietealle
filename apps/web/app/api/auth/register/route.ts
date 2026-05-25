import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@mietealle/db";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
  role: Role;
}

export async function POST(req: Request) {
  const body = await req.json() as RegisterBody;
  const { name, email, password, company, phone, role } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Pflichtfelder fehlen." }, { status: 400 });
  }

  if (!["VENDOR", "RENTER"].includes(role)) {
    return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "E-Mail wird bereits verwendet." },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      company: company ?? null,
      phone: phone ?? null,
      role,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
