"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Dataset, searchDatasets } from "@/lib/api"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Mock user data for demonstration
const mockUser = {
  type: "mentor", // or "student"
  email: "john.doe@example.com",
  name: "John Doe"
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [domain, setDomain] = useState("")
  const [minCleanliness, setMinCleanliness] = useState(0)
  const [results, setResults] = useState<Dataset[]>([])
  const [activeTab, setActiveTab] = useState("curated")

  const handleSearch = () => {
    const searchResults = searchDatasets(query, domain || undefined, minCleanliness || undefined)
    setResults(searchResults)
  }

  // Generate profile initials based on user type
  const getProfileInitials = () => {
    if (mockUser.type === "mentor") {
      const nameParts = mockUser.name.split(" ")
      return nameParts.length > 1 
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase() 
        : mockUser.name.substring(0, 2).toUpperCase()
    } else {
      // Student - first two letters of email
      return mockUser.email.substring(0, 2).toUpperCase()
    }
  }

  const handleLogout = () => {
    // Handle logout functionality here
    console.log("Logging out...")
    router.push('/signin')
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <header className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
            <img 
            src="/updated+logo+3.15.24-2.png" 
            alt="INSPIRIT AI Logo" 
            className="h-13 w-48 mr-2"
          />
              
            </div>
            <h1 className="ml-8 text-xl font-semibold">Dataset Search Tool</h1>
          </div>
          
          <div className="flex items-center">
            <nav className="mr-6">
              <ul className="flex space-x-6">
                <li>
                  <button 
                    className={`px-3 py-2 ${activeTab === "curated" ? "border-b-2 border-indigo-600 font-medium" : ""}`}
                    onClick={() => setActiveTab("curated")}
                  >
                    Curated Datasets
                  </button>
                </li>
                <li>
                  <button 
                    className={`px-3 py-2 ${activeTab === "external" ? "border-b-2 border-indigo-600 font-medium" : ""}`}
                    onClick={() => setActiveTab("external")}
                  >
                    External Databases
                  </button>
                </li>
              </ul>
            </nav>
            
            {/* Profile Button with Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                  {getProfileInitials()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-0">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Log out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input 
            placeholder="Search (should be a live filter searching on Dataset Name and dataset description)" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="md:col-span-2"
          />
          <Select onValueChange={(value) => setDomain(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Domain (Dropdown)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="history">History</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
              {/* Add more domains as needed */}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setMinCleanliness(Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Cleanliness (Dropdown)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any</SelectItem>
              <SelectItem value="0.9">90%+</SelectItem>
              <SelectItem value="0.95">95%+</SelectItem>
              <SelectItem value="0.99">99%+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dataset Card - History */}
          <div className="border rounded-lg p-4 bg-amber-50">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">H</span>
              </div>
              <h2 className="text-xl font-semibold">Dataset Name</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lacinia diam et urna scelerisque, ut varius ipsum tincidunt. Phasellus aliquam felis et ipsum dapibus, et finibus risus commodo.</p>
            <div className="mb-2 text-sm">
              <strong>Domain:</strong> History
            </div>
            <div className="flex items-center justify-between mt-2">
              <Button variant="destructive" className="text-xs px-3 py-1 h-auto">Critical</Button>
              <Button variant="outline" className="text-xs px-3 py-1 h-auto">Link</Button>
              <Button variant="ghost" size="sm" className="p-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 15A7 7 0 108 1a7 7 0 000 14z" stroke="currentColor" />
                  <path d="M8 11V7.5M8 5V4.5" stroke="currentColor" strokeLinecap="round" />
                </svg>
              </Button>
            </div>
          </div>
          
          {/* Dataset Card - Environment */}
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">E</span>
              </div>
              <h2 className="text-xl font-semibold">Dataset Name</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lacinia diam et urna scelerisque, ut varius ipsum tincidunt. Phasellus aliquam felis et ipsum dapibus, et finibus risus commodo.</p>
            <div className="mb-2 text-sm">
              <strong>Domain:</strong> Environment
            </div>
            <div className="flex items-center justify-between mt-2">
              <Button variant="default" className="text-xs px-3 py-1 h-auto bg-green-500 hover:bg-green-600">Easy</Button>
              <Button variant="outline" className="text-xs px-3 py-1 h-auto">Link</Button>
              <Button variant="ghost" size="sm" className="p-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 15A7 7 0 108 1a7 7 0 000 14z" stroke="currentColor" />
                  <path d="M8 11V7.5M8 5V4.5" stroke="currentColor" strokeLinecap="round" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Note at bottom of page */}
      <div className="text-xs text-gray-500 p-2 border-t">
        Upon clicking "More Information" a modal would populate the screen above everything else with all the relevant details.
      </div>
    </div>
  )
}