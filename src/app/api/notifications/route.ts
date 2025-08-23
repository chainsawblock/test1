import { NextResponse } from "next/server";
import { createNotification } from "@/features/notifications/server";

function verifyBearer(req: Request) {
  const hdr = req.headers.get("authorization") ?? "";
  const token = hdr.toLowerCase().startsWith("bearer ") ? hdr.slice(7) : null;
  return token && token === process.env.NOTIFICATIONS_BEARER_TOKEN;
}

export async function POST(req: Request) {
  if (!verifyBearer(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  try {
    const id = await createNotification(body);
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 400 });
  }
}
