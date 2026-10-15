import { redirect } from "next/navigation";

export default function ResourcesPage() {
  redirect("/dashboard/classroom?tab=resources&c=all");
}
