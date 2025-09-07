"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type ExternalDatabase, loadExternalDatabases } from "@/lib/externalDatabaseLoader"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink } from "lucide-react"

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

interface User {
  type: string;
  email: string;
}

// Category color schemes
const categoryColors: { [key: string]: string } = {
  'General': 'bg-blue-100 text-blue-800',
  'Chemistry': 'bg-purple-100 text-purple-800',
  'Economics': 'bg-green-100 text-green-800',
  'Environment': 'bg-emerald-100 text-emerald-800',
  'Government': 'bg-orange-100 text-orange-800',
  'Language': 'bg-pink-100 text-pink-800',
  'Medicine': 'bg-red-100 text-red-800',
  'Social': 'bg-indigo-100 text-indigo-800'
}

export default function ExternalDatabasesPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [databases, setDatabases] = useState<ExternalDatabase[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDatabase, setSelectedDatabase] = useState<ExternalDatabase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    // Load user info from localStorage
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/') // Redirect to login if no user found
      return
    }
    setUser(JSON.parse(userStr))

    // Load databases
    async function fetchDatabases() {
      try {
        const loadedDatabases = await loadExternalDatabases()
        setDatabases(loadedDatabases)
      } catch (error) {
        console.error('Error loading databases:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDatabases()
  }, [router])

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "all" ? null : value);
  };
  
  const openDatabaseModal = (database: ExternalDatabase) => {
    setSelectedDatabase(database);
    setIsModalOpen(true);
  };
  
  const getProfileInitials = () => {
    if (!user) return '';
    
    if (user.type === 'mentor') {
      const name = user.email.split('@')[0];
      const parts = name.split(/[._-]/);
      
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        const matches = name.match(/[A-Z]|[0-9]|\b[a-z]/g);
        if (matches && matches.length > 1) {
          return (matches[0] + (matches[1] || '')).toUpperCase();
        } else {
          return name.substring(0, 2).toUpperCase();
        }
      }
    } else {
      return user.email.substring(0, 2).toUpperCase();
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) {
    return null;
  }

  // Filter databases based on search query and selected category
  const filteredDatabases = databases.filter(database => {
    const matchesQuery = query === "" || 
      database.provider.toLowerCase().includes(query.toLowerCase()) ||
      database.description.toLowerCase().includes(query.toLowerCase())
    
    const matchesCategory = !selectedCategory || selectedCategory === "all" || 
      database.category === selectedCategory

    return matchesQuery && matchesCategory
  })

  // Get unique categories from databases
  const categories = Array.from(new Set(databases.map(d => d.category))).sort()

  return (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      {/* Navigation Bar */}
      <header className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="flex justify-center">
              <Link 
                href="/search"
                className="cursor-pointer"
              >
                <img 
                  src="/updated+logo+3.15.24-2.png" 
                  alt="INSPIRIT AI Logo" 
                  className="h-13 w-48 mr-2"
                />
              </Link>
            </div>
            <h1 className="ml-8 text-xl font-semibold">Dataset Search Tool</h1>
          </div>
          
          <div className="flex items-center">
            <nav className="mr-6">
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    href="/search"
                    className="px-3 py-2"
                  >
                    Curated Datasets
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/external"
                    className="px-3 py-2 border-b-2 border-indigo-600 font-medium"
                  >
                    External Databases
                  </Link>
                </li>
                {user.type === 'mentor' && (
                  <li>
                    <Link 
                      href="/mentor"
                      className="px-3 py-2"
                    >
                      Home
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            
            {/* Profile Button with Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {getProfileInitials()}
                </button>
              </PopoverTrigger>
              <PopoverContent className={`w-32 p-0 ${inter.className}`} align="end">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Log Out
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search databases..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className={inter.className}>
                <SelectItem value="all">All Categories</SelectItem>
                {categories
                  .filter(category => category && category.trim() !== '')
                  .map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200 my-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <p className="text-sm text-blue-700">
              Click on any database card to view more detailed information.
            </p>
          </div>
        </div>

        {/* Database Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading databases...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatabases.map((database, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDatabaseModal(database)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{database.provider}</h3>
                  <span className={`px-2 py-1 rounded-full text-sm ${categoryColors[database.category] || 'bg-gray-100 text-gray-800'}`}>
                    {database.category}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{database.description}</p>
                <div className="text-sm text-gray-500 space-y-2">
                  <div>
                    <span className="font-medium">Affiliation:</span> {database.affiliation}
                  </div>
                  <div>
                    <span className="font-medium">Access:</span> {database.accessRequirements}
                  </div>
                  {database.link && (
                    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(database.link, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Database
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Database Detail Modal */}
      {selectedDatabase && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${inter.className}`}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-4">
                {selectedDatabase.provider}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
              <div className="rounded-lg p-4 border">
                <h4 className="font-semibold text-base mb-2 text-gray-700">Description</h4>
                <p className="text-gray-800">{selectedDatabase.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg p-4 border">
                  <h4 className="font-semibold text-base mb-2 text-gray-700">Category</h4>
                  <span className={`px-2 py-1 rounded-full text-sm ${categoryColors[selectedDatabase.category] || 'bg-gray-100 text-gray-800'}`}>
                    {selectedDatabase.category}
                  </span>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h4 className="font-semibold text-base mb-2 text-gray-700">Affiliation</h4>
                  <p className="text-gray-800">{selectedDatabase.affiliation}</p>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h4 className="font-semibold text-base mb-2 text-gray-700">Access Requirements</h4>
                  <p className="text-gray-800">{selectedDatabase.accessRequirements}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg p-4 border">
                  <h4 className="font-semibold text-base mb-2 text-gray-700">Handling</h4>
                  <p className="text-gray-800">{selectedDatabase.handling}</p>
                </div>
                
                <div className="rounded-lg p-4 border">
                  <h4 className="font-semibold text-base mb-2 text-gray-700">Use Cases</h4>
                  <p className="text-gray-800">{selectedDatabase.useCases}</p>
                </div>
              </div>
              
              {selectedDatabase.link && (
                <div className="rounded-lg p-4 border">
                  <h4 className="font-semibold text-base mb-2 text-gray-700">Visit Database</h4>
                  <a 
                    href={selectedDatabase.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Button variant="outline" className="px-3 py-1 flex items-center">
                      Visit Database <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 