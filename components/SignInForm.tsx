"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

type LoginFormProps = {}

interface Student {
  email: string
  password: string
}

interface Mentor {
  email: string
  password: string
}

export default function SignInForm({}: LoginFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedType, setSelectedType] = useState<"student" | "mentor" | null>(null)
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  })
  const [errorMessage, setErrorMessage] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // We don't need mock data anymore as both students and mentors come from Google Sheets

  // Fetch students data from API when student type is selected
  useEffect(() => {
    if (selectedType === "student") {
      // Load students data silently in the background without showing any loading indicator
      fetchStudents()
    }
  }, [selectedType])

  // Function to fetch students from our API
  const fetchStudents = async (forceRefresh = false) => {
    try {
      // Add forceRefresh parameter if needed
      const url = forceRefresh ? "/api/students?forceRefresh=true" : "/api/students"
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setStudents(result.data)
        return true
      } else {
        console.error("Failed to fetch students:", result.error)
        setErrorMessage("Error loading student data. Please try again later.")
        return false
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      setErrorMessage("Error connecting to server. Please try again later.")
      return false
    }
  }

  // Function to reset form data
  const resetForm = () => {
    setFormData({
      identifier: "",
      password: "",
    })
    setShowPassword(false)
    setErrorMessage("")
    setIsRetrying(false)
  }

  // Update the account type change handler
  const handleAccountTypeChange = (type: "student" | "mentor" | null) => {
    setSelectedType(type)
    resetForm()
  }

  // Helper function to check student credentials against a list of students
  const checkStudentCredentials = (studentsList: Student[], userEmail: string, userPassword: string) => {
    return studentsList.find((student) => {
      // Handle multiple emails in a single cell separated by commas
      const emails = student.email.split(/,\s*/).map((email) => email.trim())
      // Check if the entered email matches any of the emails in this record and password matches
      return emails.includes(userEmail) && student.password === userPassword
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType) return
    // Always reset error message when starting a new submission
    setErrorMessage("")

    // Only start loading when user actually submits the form
    setIsLoading(true)
    const userData = {
      email: formData.identifier.trim(),
      password: formData.password,
    }

    try {
      // Handle different user types
      if (selectedType === "student") {
        // Use the new auth API endpoint that handles cache refreshing automatically
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
            type: "student",
          }),
        })

        const result = await response.json()

        if (result.success) {
          // Store user info in localStorage
          localStorage.setItem(
            "user",
            JSON.stringify({
              type: "student",
              email: userData.email,
            }),
          )
          console.log("Student signed in successfully!")
          router.push("/search")
          return
        } else {
          // Authentication failed
          setErrorMessage("Wrong Email or Password!")
        }
      } else if (selectedType === "mentor") {
        // Use the auth API endpoint for mentor authentication
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password, // This is the passkey for mentors
            type: "mentor",
          }),
        })

        const result = await response.json()
        console.log("Mentor auth result:", result) // Debug the mentor name

        if (result.success) {
          // Make sure we're getting the full mentor name from the Mentor Name column
          const mentorFullName = result.mentorName || ""
          console.log("Using mentor name:", mentorFullName)

          // Store user info in localStorage with mentor name from the Mentor Name column
          localStorage.setItem(
            "user",
            JSON.stringify({
              type: "mentor",
              email: userData.email,
              fullName: mentorFullName,
            }),
          )
          console.log("Mentor signed in successfully!")
          router.push("/mentor")
          return
        } else {
          setErrorMessage("Wrong Email or Passkey!")
        }
      }
      setIsRetrying(false)
    } catch (error) {
      console.error("Authentication error:", error)
      setErrorMessage("An error occurred during sign in. Please try again.")
      setIsRetrying(false)
    } finally {
      // Always ensure loading is turned off when authentication process completes
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {!selectedType ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Choose your account type to continue</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ease-out"
              onClick={() => handleAccountTypeChange("student")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-500 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="h-8 w-8 text-white"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="50" cy="30" r="16" fill="currentColor" />
                      <path d="M25 85C25 65 35 55 50 55C65 55 75 65 75 85" stroke="currentColor" strokeWidth="8" />
                      <path d="M30 30L70 30L50 15L30 30Z" fill="currentColor" />
                      <path d="M35 40C35 40 40 50 50 50C60 50 65 40 65 40" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-1">Student</h3>
                <p className="text-sm text-gray-600">Access your learning dashboard</p>
              </div>
            </div>

            <div
              className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 cursor-pointer hover:border-purple-400 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 ease-out"
              onClick={() => handleAccountTypeChange("mentor")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-purple-500 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="h-8 w-8 text-white"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="50" cy="30" r="16" fill="currentColor" />
                      <path d="M25 85C25 65 35 55 50 55C65 55 75 65 75 85" stroke="currentColor" strokeWidth="8" />
                      <path d="M40 32H60" stroke="white" strokeWidth="2" />
                      <path d="M40 28H60" stroke="white" strokeWidth="2" />
                      <rect x="40" y="27" width="5" height="6" rx="2" stroke="white" strokeWidth="2" />
                      <rect x="55" y="27" width="5" height="6" rx="2" stroke="white" strokeWidth="2" />
                      <path d="M50 45V85" stroke="currentColor" strokeWidth="4" />
                      <path d="M43 55L50 65L57 55" fill="white" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-1">Mentor</h3>
                <p className="text-sm text-gray-600">Guide and support students</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedType === "student" ? "Student Sign In" : "Mentor Sign In"}
              </h2>
              <div
                className={`w-3 h-3 rounded-full ${selectedType === "student" ? "bg-blue-500" : "bg-purple-500"}`}
              ></div>
            </div>
            <button
              type="button"
              onClick={() => handleAccountTypeChange(null)}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors duration-200 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Change account type
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {selectedType === "student" ? "Student Email" : "Mentor Email"}
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-4 ${
                selectedType === "student"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-200 shadow-lg hover:shadow-xl"
                  : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:ring-purple-200 shadow-lg hover:shadow-xl"
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  Sign In
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
