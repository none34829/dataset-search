'use client';
import Image from 'next/image';
import SignInForm from '@/components/SignInForm';
import DynamicDropdown from '@/components/ui/DynamicDropdown';
import { Inter } from 'next/font/google';
// Initialize the Inter font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});
export default function Home() {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-purple-600 ${inter.className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <Image
              src="/updated+logo+3.15.24-2.png"
              alt="Inspirit AI Logo"
              width={200}
              height={80}
              className="mb-4"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sign In</h1>
          <p className="text-gray-600">Welcome back! Please enter your details.</p>
        </div>
        <SignInForm />
        <div className="text-center mt-6">
        </div>
      </div>
    </div>
  );
}