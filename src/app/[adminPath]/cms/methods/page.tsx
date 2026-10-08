import { CmsCollectionEditor } from "@/components/admin/CmsCollectionEditor";
import { listMethodItems } from "@/lib/db/landing.queries";

export default async function MethodsCmsPage() {
  const items = await listMethodItems(false);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Method copy</h1>
      <CmsCollectionEditor
        addLabel="Add method item"
        endpoint="/api/admin/cms/method-items"
        fields={[
          { name: "title", label: "Title" },
          { name: "tab", label: "Tab", type: "select", options: ["online", "hybrid"] },
          { name: "icon", label: "Icon" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "sortOrder", label: "Sort", type: "number", min: 1 },
          { name: "isActive", label: "Active", type: "checkbox" },
        ]}
        items={items}
        createDefaults={{
          tab: "online",
          icon: "Video",
          title: "",
          description: "",
          sortOrder: items.length + 1,
          isActive: true,
        }}
      />
    </div>
  );
}
