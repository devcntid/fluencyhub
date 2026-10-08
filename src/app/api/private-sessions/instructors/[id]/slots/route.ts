import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getInstructorAvailableSlots } from "@/lib/db/private-sessions.queries";

export async function GET(request: Request, context: any) {
  const params = await context.params;
  const { id } = params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const slots = await getInstructorAvailableSlots(Number(id));
    return NextResponse.json({ data: slots });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
