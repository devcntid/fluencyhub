import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/blob";
import { auth } from "@/lib/session";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "uploads");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
  }
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "JPG, PNG, or PDF only" }, { status: 400 });
  }
  if (folder === "thumbnails" && session.user.role !== "admin" && session.user.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await uploadFile({ file, folder, filename: file.name });
  return NextResponse.json({ data: result });
}
