'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Flag, Star, Trophy, Target, Zap } from "lucide-react";

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

interface User {
  type: string;
  email: string;
  fullName?: string;
}

interface Milestone {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  position: number; // 0-100 percentage along the road
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

export default function ProgressTracking() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample milestones data
  const milestones: Milestone[] = [
    {
      id: 1,
      name: "Milestone 1",
      description: "Complete your first project setup and understand the basics of data analysis. This milestone marks the beginning of your journey into the world of data science.",
      completed: true,
      position: 15,
      icon: Flag,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      id: 2,
      name: "Milestone 2", 
      description: "Successfully analyze your first dataset and create meaningful visualizations. You're now getting comfortable with data manipulation and insights.",
      completed: true,
      position: 30,
      icon: Star,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      id: 3,
      name: "Milestone 3",
      description: "Build your first machine learning model and understand the fundamentals of predictive analytics. You're becoming a data scientist!",
      completed: false,
      position: 50,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      id: 4,
      name: "Milestone 4",
      description: "Complete an advanced project that showcases your skills in data science. This is where you demonstrate mastery of the field.",
      completed: false,
      position: 70,
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      id: 5,
      name: "Milestone 5",
      description: "Achieve expert level proficiency and mentor others in their data science journey. You've become a true data science champion!",
      completed: false,
      position: 85,
      icon: Zap,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  useEffect(() => {
    // Load user info from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/'); // Redirect to login if no user found
      return;
    }
    
    const parsedUser = JSON.parse(userStr);
    if (parsedUser.type !== 'student') {
      router.push('/search'); // Redirect non-students to dataset search
      return;
    }
    
    setUser(parsedUser);
  }, [router]);

  const getProfileInitials = () => {
    if (!user) return '';
    
    if (user.fullName) {
      const nameParts = user.fullName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else if (nameParts[0]) {
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    
    const name = user.email.split('@')[0];
    const parts = name.split(/[._-]/);
    
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      return name.substring(0, 2).toUpperCase();
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  }

  const handleMilestoneClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setIsModalOpen(true);
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-[#F8F8F8] flex flex-col ${inter.className}`}> 
      {/* Header Bar */}
      <header className="w-full bg-[rgba(86,88,137,0.5)] py-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <img src="/updated+logo+3.15.24-2.png" alt="INSPIRIT AI Logo" className="h-10 w-auto" />
          <span className="text-white text-2xl font-semibold tracking-wide">Student Portal</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search"
            className="rounded-full px-4 py-1.5 bg-white text-[#535353] focus:outline-none focus:ring-2 focus:ring-[#565889] w-48 shadow-sm placeholder:text-[#b0b0b0]"
            style={{ border: '1px solid #E0E0E0' }}
          />
          {/* Profile Button */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-10 w-10 rounded-full bg-[#6869A0] text-white flex items-center justify-center font-bold text-lg shadow hover:bg-[#2f3167] transition-colors">
                {getProfileInitials()}
              </button>
            </PopoverTrigger>
            <PopoverContent className={`w-32 p-0 ${inter.className}`} align="end">
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-[#2f3167] hover:bg-[#F8F8F8] transition-colors">Log Out</button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center py-10 px-4">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-[#2f3167]">Your Learning Journey</h1>
            <p className="text-xl text-gray-600 mb-4">Track your progress and celebrate your achievements!</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Completed: {milestones.filter(m => m.completed).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-400" />
                <span>Remaining: {milestones.filter(m => !m.completed).length}</span>
              </div>
            </div>
          </div>

          {/* Road and Milestones */}
          <div className="relative h-80 overflow-hidden">
            {/* Curvy Road SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
              {/* Road Path - More natural curves */}
              <path
                d="M 50 150 Q 200 100 350 120 Q 500 140 650 100 Q 800 80 950 120"
                stroke="#4B5563"
                strokeWidth="50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Road Surface */}
              <path
                d="M 50 150 Q 200 100 350 120 Q 500 140 650 100 Q 800 80 950 120"
                stroke="url(#roadGradient)"
                strokeWidth="46"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Center Line */}
              <path
                d="M 50 150 Q 200 100 350 120 Q 500 140 650 100 Q 800 80 950 120"
                stroke="#FCD34D"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="30,15"
              />
              
              {/* Road Edges */}
              <path
                d="M 50 150 Q 200 100 350 120 Q 500 140 650 100 Q 800 80 950 120"
                stroke="#FFFFFF"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Define gradient for road */}
              <defs>
                <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9CA3AF" />
                  <stop offset="50%" stopColor="#6B7280" />
                  <stop offset="100%" stopColor="#9CA3AF" />
                </linearGradient>
              </defs>
            </svg>

            {/* Milestones positioned along the curvy road */}
            {milestones.map((milestone) => {
              const IconComponent = milestone.icon;
              
              // Calculate position along the curved path
              const getPositionOnCurve = (percentage: number) => {
                const t = percentage / 100;
                // Better positions that follow the natural road curve
                const positions = [
                  { x: 12, y: 50 }, // Milestone 1 (15%) - early on the road
                  { x: 25, y: 35 }, // Milestone 2 (30%) - first curve
                  { x: 45, y: 45 }, // Milestone 3 (50%) - middle curve
                  { x: 65, y: 35 }, // Milestone 4 (70%) - second curve
                  { x: 85, y: 30 }  // Milestone 5 (85%) - moved up to stay on road
                ];
                
                const index = Math.floor(t * (positions.length - 1));
                const nextIndex = Math.min(index + 1, positions.length - 1);
                const localT = (t * (positions.length - 1)) - index;
                
                const current = positions[index];
                const next = positions[nextIndex];
                
                return {
                  x: current.x + (next.x - current.x) * localT,
                  y: current.y + (next.y - current.y) * localT
                };
              };
              
              const position = getPositionOnCurve(milestone.position);
              
              return (
                <div
                  key={milestone.id}
                  className="absolute cursor-pointer group"
                  style={{ 
                    left: `${position.x}%`, 
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => handleMilestoneClick(milestone)}
                >
                  {/* Milestone Flag */}
                  <div className={`relative ${milestone.completed ? 'animate-bounce' : ''}`}>
                    {/* Flag Pole */}
                    <div className="w-1 h-16 bg-gray-600 mx-auto"></div>
                    
                    {/* Flag */}
                    <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-8 ${milestone.bgColor} rounded-r-lg shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-200`}>
                      <div className="flex items-center justify-center h-full">
                        <IconComponent className={`h-5 w-5 ${milestone.color}`} />
                      </div>
                    </div>
                    
                    {/* Completion Check */}
                    {milestone.completed && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Milestone Label */}
                  <div className="mt-4 text-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${milestone.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} group-hover:bg-opacity-80 transition-colors`}>
                      {milestone.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-medium text-gray-700">
                {Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(milestones.filter(m => m.completed).length / milestones.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/student')}
              className="bg-[#565889] text-white px-8 py-3 rounded-lg hover:bg-[#2f3167] transition-colors font-medium"
            >
              Back to Student Portal
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white py-4 text-center text-[#535353] text-sm border-t">
        <p>© {new Date().getFullYear()} Inspirit AI. All rights reserved.</p>
      </footer>

      {/* Milestone Detail Modal */}
      {selectedMilestone && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className={`max-w-2xl ${inter.className}`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className={`w-12 h-12 ${selectedMilestone.bgColor} rounded-full flex items-center justify-center`}>
                  <selectedMilestone.icon className={`h-6 w-6 ${selectedMilestone.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{selectedMilestone.name}</span>
                    {selectedMilestone.completed && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                  <div className={`text-sm font-normal ${selectedMilestone.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {selectedMilestone.completed ? 'Completed!' : 'In Progress'}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">Description</h3>
                <p className="text-gray-700 leading-relaxed">{selectedMilestone.description}</p>
              </div>
              
              {selectedMilestone.completed ? (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Congratulations!</span>
                  </div>
                  <p className="text-green-700 mt-2 text-sm">
                    You've successfully completed this milestone. Keep up the great work!
                  </p>
                </div>
              ) : (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Target className="h-5 w-5" />
                    <span className="font-medium">Next Steps</span>
                  </div>
                  <p className="text-blue-700 mt-2 text-sm">
                    Focus on the requirements for this milestone. You're making great progress!
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
              {!selectedMilestone.completed && (
                <Button 
                  className="bg-[#565889] hover:bg-[#2f3167]"
                  onClick={() => setIsModalOpen(false)}
                >
                  Start Working
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
