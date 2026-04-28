import TemplateBuilder from '@/components/admin/template-builder'

export default function TemplatesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Yeni Audit Şablonu Yarat</h1>
      <TemplateBuilder />
    </div>
  )
}