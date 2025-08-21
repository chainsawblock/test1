import React from "react";
import VerifySignup from "../../../components/auth/VerifySignup";

export default function VerifyPage({
  searchParams,
}: {
  searchParams?: { email?: string | string[] };
}) {
  const raw = searchParams?.email;
  const email =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";

  return <VerifySignup defaultEmail={email} />;
}
