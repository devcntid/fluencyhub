import { CmsCollectionEditor } from "@/components/admin/CmsCollectionEditor";
import { listTestimonials } from "@/lib/db/landing.queries";

export default async function TestimonialsCmsPage() {
  const items = await listTestimonials(false);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Testimonials</h1>
      <CmsCollectionEditor
        addLabel="Add testimonial"
        endpoint="/api/admin/cms/testimonials"
        fields={[
          { name: "name", label: "Name" },
          { name: "role", label: "Role" },
          { name: "quote", label: "Quote", type: "textarea" },
          { name: "avatarUrl", label: "Avatar URL" },
          { name: "rating", label: "Rating", type: "number", min: 1, max: 5 },
          { name: "sortOrder", label: "Sort", type: "number", min: 1 },
          { name: "isActive", label: "Active", type: "checkbox" },
        ]}
        items={items}
        createDefaults={{
          name: "",
          role: "",
          quote: "",
          avatarUrl: "",
          rating: 5,
          sortOrder: items.length + 1,
          isActive: true,
        }}
      />
    </div>
  );
}
