import { CmsCollectionEditor } from "@/components/admin/CmsCollectionEditor";
import { listPainPoints } from "@/lib/db/landing.queries";

export default async function PainPointsCmsPage() {
  const items = await listPainPoints(false);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Pain points</h1>
      <CmsCollectionEditor
        addLabel="Add pain point"
        endpoint="/api/admin/cms/pain-points"
        fields={[
          { name: "title", label: "Title" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "icon", label: "Icon" },
          { name: "iconBg", label: "Icon background", type: "color" },
          { name: "iconColor", label: "Icon color", type: "color" },
          { name: "sortOrder", label: "Sort", type: "number", min: 1 },
          { name: "isActive", label: "Active", type: "checkbox" },
        ]}
        items={items}
        createDefaults={{
          icon: "Brain",
          iconBg: "#fef2f2",
          iconColor: "#dc2626",
          title: "",
          description: "",
          sortOrder: items.length + 1,
          isActive: true,
        }}
      />
    </div>
  );
}
