"use server";

import { auth } from "@/lib/session";
import { updateUserProfile } from "@/lib/db/users.queries";
import { revalidatePath } from "next/cache";

export async function updateProfileInfo(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const whatsappNumber = formData.get("whatsappNumber") as string;

  await updateUserProfile(Number(session.user.id), {
    name: name.trim() || undefined,
    whatsappNumber: whatsappNumber.trim() || null,
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/fh-admin/users"); // Assuming admin page might need revalidation, or just root
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateAvatar(avatarUrl: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await updateUserProfile(Number(session.user.id), {
    avatarUrl,
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/fh-admin/users");
  revalidatePath("/", "layout");
  return { success: true };
}
