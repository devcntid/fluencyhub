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

  // 5MB limit for exams (soal & remedial), exam-answers, and documents
  const maxBytes =
    folder === "exams" || folder === "exam-answers" || folder === "documents"
      ? 5 * 1024 * 1024
      : 20 * 1024 * 1024;
  const maxMb = maxBytes / (1024 * 1024);

  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `Ukuran file melebihi batas maksimal ${maxMb}MB (ukuran file Anda: ${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
      { status: 400 }
    );
  }
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/jpg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-zip-compressed",
  ];
  if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|zip|jpg|jpeg|png|webp)$/i)) {
    return NextResponse.json({ error: "Format file tidak didukung (gunakan PDF, Word DOC/DOCX, atau Gambar)" }, { status: 400 });
  }
  if (folder === "thumbnails" && session.user.role !== "admin" && session.user.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await uploadFile({ file, folder, filename: file.name });
  return NextResponse.json({ data: result });
}
