import { CmsCollectionEditor } from "@/components/admin/CmsCollectionEditor";
import { listFaqs } from "@/lib/db/landing.queries";

export default async function FaqsCmsPage() {
  const items = await listFaqs(false);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">FAQs</h1>
      <CmsCollectionEditor
        addLabel="Add FAQ"
        endpoint="/api/admin/cms/faqs"
        fields={[
          { name: "question", label: "Question" },
          { name: "answer", label: "Answer", type: "textarea" },
          { name: "sortOrder", label: "Sort", type: "number", min: 1 },
          { name: "isActive", label: "Active", type: "checkbox" },
        ]}
        items={items}
        createDefaults={{
          question: "",
          answer: "",
          sortOrder: items.length + 1,
          isActive: true,
        }}
      />
    </div>
  );
}
