import { getAllDatasets } from "@/lib/api"

export default function DatabasesPage() {
  const datasets = getAllDatasets()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Available Databases</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">{dataset.name}</h2>
            <p className="text-gray-600 mb-2">{dataset.description}</p>
            <p>
              <strong>Domain:</strong> {dataset.domain}
            </p>
            <p>
              <strong>Cleanliness:</strong> {(dataset.cleanliness * 100).toFixed(1)}%
            </p>
            <p>
              <strong>Size:</strong> {dataset.size}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

