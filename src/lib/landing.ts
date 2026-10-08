import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { listPublishedCoursesWithInstructor } from "@/lib/db/courses.queries";
import { getSettingsMap, listFaqs, listMethodItems, listPainPoints, listTestimonials } from "@/lib/db/landing.queries";
import { cacheGet, cacheInvalidate, cacheSet, CACHE_KEYS } from "@/lib/redis";

export type LandingBundle = Awaited<ReturnType<typeof loadLandingBundle>>;

async function loadLandingBundle() {
  const [settings, pains, methods, courses, testimonials, faqs] = await Promise.all([
    getSettingsMap(),
    listPainPoints(true),
    listMethodItems(true),
    listPublishedCoursesWithInstructor(),
    listTestimonials(true),
    listFaqs(true),
  ]);
  return { settings, pains, methods, courses, testimonials, faqs };
}

const cachedLanding = unstable_cache(loadLandingBundle, ["landing-bundle"], {
  revalidate: 60,
  tags: ["landing"],
});

export async function getLandingBundle(): Promise<LandingBundle> {
  const fromRedis = await cacheGet<LandingBundle>(CACHE_KEYS.landing);
  if (fromRedis) return fromRedis;
  const data = await cachedLanding();
  await cacheSet(CACHE_KEYS.landing, data, 60);
  return data;
}

export async function revalidateLanding() {
  revalidatePath("/", "layout");
  await cacheInvalidate(CACHE_KEYS.landing);
}
