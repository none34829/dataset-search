'use client';

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  // No props needed as type will be selected within the component
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

  // Mock user data for demonstration
  const mockUserData = {
    student: { email: "student@example.com", password: "studentPass" },
    mentor: { name: "Mentor Name", email: "mentor@example.com", password: "mentorPass" },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) return;

    const userData = {
      email: formData.identifier,
      password: formData.password,
    };

    // Check credentials against mock data first
    if (selectedType === "student" && (formData.identifier === mockUserData.student.email && formData.password === mockUserData.student.password)) {
      console.log("Student signed in successfully!");
      router.push('/search');
      return;
    } else if (selectedType === "mentor" && (formData.identifier === mockUserData.mentor.email && formData.password === mockUserData.mentor.password)) {
      console.log("Mentor signed in successfully!");
      router.push('/search');
      return;
    }

    // If not matched, proceed with API call
    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...userData, type: selectedType }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`${selectedType} signed in successfully!`, data);
        router.push('/search');
      } else {
        console.error("Sign-in failed:", data.message);
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setErrorMessage("Wrong Email or Password!");
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
              onClick={() => setSelectedType("student")}
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
              onClick={() => setSelectedType("mentor")}
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
              onClick={() => setSelectedType(null)} 
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
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          <button type="submit" className="w-full bg-blue-500 text-white rounded py-2">Sign In</button>
        </form>
      )}
    </div>
  );
}