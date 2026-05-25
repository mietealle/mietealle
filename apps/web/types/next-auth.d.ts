import type { Role, VerificationStatus } from "@mietealle/db";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: Role;
    verificationStatus: VerificationStatus;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      verificationStatus: VerificationStatus;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    verificationStatus: VerificationStatus;
  }
}
