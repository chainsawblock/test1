import React from "react";
import VerifySignup from "../../../components/auth/VerifySignup";

export default function VerifyPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const emailParam = searchParams?.email;
  const email =
    typeof emailParam === "string" ? emailParam : Array.isArray(emailParam) ? emailParam[0] ?? "" : "";

  return <VerifySignup defaultEmail={email} />;
}
