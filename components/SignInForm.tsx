'use client';

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from 'next/navigation'; // Changed from 'next/router'

interface LoginFormProps {
  type: "student" | "mentor";
}

export default function SignInForm({ type }: LoginFormProps) {
  const router = useRouter(); // Now using the new App Router
  const [showPassword, setShowPassword] = useState(false);
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

    const userData = {
      email: formData.identifier,
      password: formData.password,
    };

    // Check credentials against mock data first
    if (type === "student" && (formData.identifier === mockUserData.student.email && formData.password === mockUserData.student.password)) {
      console.log("Student signed in successfully!");
      router.push('/search'); // Using new router
      return;
    } else if (type === "mentor" && (formData.identifier === mockUserData.mentor.email && formData.password === mockUserData.mentor.password)) {
      console.log("Mentor signed in successfully!");
      router.push('/search'); // Using new router
      return;
    }

    // If not matched, proceed with API call
    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`${type} signed in successfully!`, data);
        router.push('/search'); // Using new router
      } else {
        console.error("Sign-in failed:", data.message);
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setErrorMessage("An error occurred during sign-in.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">{type === "student" ? "Student Email:" : "Mentor Name:"}</label>
        <input
          type={type === "student" ? "email" : "text"}
          placeholder={type === "student" ? "example@gmail.com" : "John Doe"}
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
  );
}