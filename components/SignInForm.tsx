'use client';

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  // No props needed as type will be selected within the component
}

interface Student {
  email: string;
  password: string;
}

interface Mentor {
  email: string;
  password: string;
}

export default function SignInForm({}: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedType, setSelectedType] = useState<"student" | "mentor" | null>(null);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Mock user data for mentors only - students come from Google Sheet
  const mockUserData = {
    mentor: [
      { email: "mentor@example.com", password: "mentorPass" },
      { email: "green_pan@gmail.com", password: "green123" },
      { email: "mentor@example.com", password: "mentorPass" },
      { email: "mentor@example.com", password: "mentorPass" },
      { email: "mentor@example.com", password: "mentorPass" },
    ]
  };

  // Fetch students data from API when student type is selected
  useEffect(() => {
    if (selectedType === "student") {
      // Load students data silently in the background without showing any loading indicator
      fetchStudents();
    }
  }, [selectedType]);

  // Function to fetch students from our API
  const fetchStudents = async (forceRefresh = false) => {
    try {
      // Add forceRefresh parameter if needed
      const url = forceRefresh ? '/api/students?forceRefresh=true' : '/api/students';
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setStudents(result.data);
        return true;
      } else {
        console.error("Failed to fetch students:", result.error);
        setErrorMessage("Error loading student data. Please try again later.");
        return false;
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setErrorMessage("Error connecting to server. Please try again later.");
      return false;
    }
  };

  // Function to reset form data
  const resetForm = () => {
    setFormData({
      identifier: "",
      password: "",
    });
    setShowPassword(false);
    setErrorMessage("");
    setIsRetrying(false);
  };

  // Update the account type change handler
  const handleAccountTypeChange = (type: "student" | "mentor" | null) => {
    setSelectedType(type);
    resetForm();
  };

  // Helper function to check student credentials against a list of students
  const checkStudentCredentials = (studentsList: Student[], userEmail: string, userPassword: string) => {
    return studentsList.find(student => {
      // Handle multiple emails in a single cell separated by commas
      const emails = student.email.split(/,\s*/).map(email => email.trim());
      // Check if the entered email matches any of the emails in this record and password matches
      return emails.includes(userEmail) && student.password === userPassword;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) return;

    // Always reset error message when starting a new submission
    setErrorMessage("");
    
    // Only start loading when user actually submits the form
    setIsLoading(true);
    const userData = {
      email: formData.identifier.trim(),
      password: formData.password,
    };

    try {
      // Check credentials against appropriate data source
      if (selectedType === "student") {
        // Step 1: Try with currently loaded data (which might be cached)
        let studentMatch = checkStudentCredentials(students, userData.email, userData.password);
        
        // Step 2: If no match is found with cached data, try with fresh data without showing error yet
        if (!studentMatch) {
          console.log("No match found in cached data, trying with fresh data...");
          
          // Fetch fresh data from Google Sheets (force refresh)
          // Note: fetchStudents no longer sets isLoading to false internally
          await fetchStudents(true);
          
          // Try matching again with fresh data
          studentMatch = checkStudentCredentials(students, userData.email, userData.password);
        }
        
        if (studentMatch) {
          // Store user info in localStorage
          localStorage.setItem('user', JSON.stringify({
            type: 'student',
            email: userData.email
          }));
          console.log("Student signed in successfully!");
          router.push('/search');
          return;
        }
      } else if (selectedType === "mentor") {
        const mentorMatch = mockUserData.mentor.find(
          mentor => mentor.email === userData.email && mentor.password === userData.password
        );
        
        if (mentorMatch) {
          localStorage.setItem('user', JSON.stringify({
            type: 'mentor',
            email: userData.email
          }));
          console.log("Mentor signed in successfully!");
          router.push('/mentor');
          return;
        }
      }

      // If no match found after retry, show error
      setErrorMessage("Wrong Email or Password!");
      setIsRetrying(false);
    } catch (error) {
      console.error("Authentication error:", error);
      setErrorMessage("An error occurred during sign in. Please try again.");
      setIsRetrying(false);
    } finally {
      // Always ensure loading is turned off when authentication process completes
      setIsLoading(false);
    }
  };

  return (
    <div>
      {!selectedType ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-center">Choose Account Type</h2>
          <div className="flex justify-center space-x-4">
            <div 
              className="border rounded p-4 cursor-pointer hover:border-blue-500 transition-colors text-center w-40"
              onClick={() => handleAccountTypeChange("student")}
            >
              <div className="flex justify-center mb-2">
                <svg className="h-20 w-20 text-blue-500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Student with backpack and graduation cap */}
                  <circle cx="50" cy="30" r="16" fill="currentColor" />
                  <path d="M25 85C25 65 35 55 50 55C65 55 75 65 75 85" stroke="currentColor" strokeWidth="8" />
                  <path d="M30 30L70 30L50 15L30 30Z" fill="currentColor" />
                  <path d="M35 40C35 40 40 50 50 50C60 50 65 40 65 40" stroke="currentColor" strokeWidth="3" />
                </svg>
              </div>
              <span className="font-medium">Student</span>
            </div>
            <div 
              className="border rounded p-4 cursor-pointer hover:border-purple-500 transition-colors text-center w-40"
              onClick={() => handleAccountTypeChange("mentor")}
            >
              <div className="flex justify-center mb-2">
                <svg className="h-20 w-20 text-purple-500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Mentor with glasses and tie */}
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
              <span className="font-medium">Mentor</span>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">
              {selectedType === "student" ? "Student Sign In" : "Mentor Sign In"}
            </h2>
            <button 
              type="button" 
              onClick={() => handleAccountTypeChange(null)} 
              className="text-sm text-blue-500 hover:underline"
            >
              Change account type
            </button>
          </div>
          <div>
            <label className="block text-sm mb-1">{selectedType === "student" ? "Student Email:" : "Mentor Email:"}</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border rounded px-3 py-2 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {errorMessage && (
            <div className="mb-4">
              <p className="text-red-500">{errorMessage}</p>
            </div>
          )}
          

          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white rounded py-2 flex justify-center items-center transition-colors" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      )}
    </div>
  );
}