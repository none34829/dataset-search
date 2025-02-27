'use client';

import Image from 'next/image';
import SignInForm from '@/components/SignInForm';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-purple-600">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <Image
            src="/updated+logo+3.15.24-2.png"
            alt="Inspirit AI Logo"
            width={200}
            height={80}
            className="mb-4"
          />
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