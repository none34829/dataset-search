"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Dataset, searchDatasets } from "@/lib/api"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [domain, setDomain] = useState("")
  const [minCleanliness, setMinCleanliness] = useState(0)
  const [results, setResults] = useState<Dataset[]>([])

  const handleSearch = () => {
    const searchResults = searchDatasets(query, domain || undefined, minCleanliness || undefined)
    setResults(searchResults)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dataset Search</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Input placeholder="Search datasets..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select onValueChange={(value) => setDomain(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            <SelectItem value="Natural Language Processing">Natural Language Processing</SelectItem>
            <SelectItem value="Computer Vision">Computer Vision</SelectItem>
            {/* Add more domains as needed */}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setMinCleanliness(Number(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Min cleanliness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any</SelectItem>
            <SelectItem value="0.9">90%+</SelectItem>
            <SelectItem value="0.95">95%+</SelectItem>
            <SelectItem value="0.99">99%+</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((dataset) => (
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

