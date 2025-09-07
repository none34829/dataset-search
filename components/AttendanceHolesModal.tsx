'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CustomCalendar } from '@/components/ui/custom-calendar';
import { CalendarIcon, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import SpecialSessionQuestions from '@/app/mentor/submit-attendance/SpecialSessionQuestions';
import { Inter } from 'next/font/google';

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'], display: 'swap' });

interface AttendanceHole {
  sessionNumber: number;
  dateRange: {
    min: Date;
    max: Date;
  };
}

interface AttendanceHolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  holes: AttendanceHole[];
  studentName: string;
  studentType: '10' | '25';
  mentorName: string;
  mentorEmail: string;
  onComplete: () => void;
}

export default function AttendanceHolesModal({
  isOpen,
  onClose,
  holes,
  studentName,
  studentType,
  mentorName,
  mentorEmail,
  onComplete
}: AttendanceHolesModalProps) {
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [dates, setDates] = useState<Record<number, Date>>({});
  const [progressDescriptions, setProgressDescriptions] = useState<Record<number, string>>({});
  const [exitTickets, setExitTickets] = useState<Record<number, string>>({});
  const [specialQuestionValues, setSpecialQuestionValues] = useState<Record<number, Record<string, string>>>({});
  const [specialQuestionErrors, setSpecialQuestionErrors] = useState<Record<number, Record<string, string>>>({});
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const currentHole = holes[currentHoleIndex];
  const currentDate = dates[currentHole?.sessionNumber] || new Date();
  const currentProgress = progressDescriptions[currentHole?.sessionNumber] || '';
  const currentExitTicket = exitTickets[currentHole?.sessionNumber] || '';
  const currentSpecialValues = specialQuestionValues[currentHole?.sessionNumber] || {};
  const currentSpecialErrors = specialQuestionErrors[currentHole?.sessionNumber] || {};
  const currentErrors = errors[currentHole?.sessionNumber] || {};

  // Initialize special question values for each hole
  useEffect(() => {
    if (holes.length > 0) {
      const newSpecialValues: Record<number, Record<string, string>> = {};
      const newSpecialErrors: Record<number, Record<string, string>> = {};
      
      holes.forEach(hole => {
        newSpecialValues[hole.sessionNumber] = {};
        newSpecialErrors[hole.sessionNumber] = {};
      });
      
      setSpecialQuestionValues(newSpecialValues);
      setSpecialQuestionErrors(newSpecialErrors);
    }
  }, [holes]);

  // Validation function for Google Docs URL
  const validateGoogleDocsUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (will be caught by required field validation)
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'docs.google.com' && 
             (urlObj.pathname.includes('/document/') || urlObj.pathname.includes('/spreadsheets/'));
    } catch {
      return false;
    }
  };

  // Validation function for progress description (no N/A allowed)
  const validateProgressDescription = (text: string): boolean => {
    if (!text.trim()) return true; // Empty is valid (will be caught by required field validation)
    
    const naPatterns = [
      /^n\/a$/i,
      /^na$/i,
      /^n\.a\.$/i,
      /^not applicable$/i,
      /^none$/i,
      /^no progress$/i,
      /^nothing$/i,
      /^nada$/i,
      /^zip$/i,
      /^zero$/i
    ];
    
    return !naPatterns.some(pattern => pattern.test(text.trim()));
  };

  const validateCurrentForm = (): boolean => {
    if (!currentHole) return false;
    
    const newErrors: Record<string, string> = {};
    
    // Validate date
    if (!dates[currentHole.sessionNumber]) {
      newErrors.date = 'Invalid Date';
    } else {
      const date = dates[currentHole.sessionNumber];
      const minDate = new Date(currentHole.dateRange.min);
      const maxDate = new Date(currentHole.dateRange.max);
      
      if (minDate.getTime() > new Date('1900-01-01').getTime() && date < minDate) {
        newErrors.date = `Date must be on or after ${(minDate.getMonth() + 1).toString().padStart(2, '0')}/${minDate.getDate().toString().padStart(2, '0')}/${minDate.getFullYear()}`;
      }
      if (date > maxDate) {
        newErrors.date = `Date must be on or before ${(maxDate.getMonth() + 1).toString().padStart(2, '0')}/${maxDate.getDate().toString().padStart(2, '0')}/${maxDate.getFullYear()}`;
      }
    }
    
    // Validate progress description
    if (!currentProgress.trim()) {
      newErrors.progress = 'Progress description is required';
    } else if (!validateProgressDescription(currentProgress)) {
      newErrors.progress = 'Please provide a meaningful description of your progress. "N/A", "None", or similar responses are not allowed.';
    }
    
    // Validate exit ticket
    if (!currentExitTicket.trim()) {
      newErrors.exitTicket = 'Exit ticket is required';
    } else if (!validateGoogleDocsUrl(currentExitTicket)) {
      newErrors.exitTicket = 'Please enter a valid Google Docs URL (https://docs.google.com/...)';
    }
    
    setErrors(prev => ({
      ...prev,
      [currentHole.sessionNumber]: newErrors
    }));
    
    return Object.keys(newErrors).length === 0;
  };

  const validateSpecialQuestions = (): boolean => {
    if (!currentHole) return true;
    
    const newSpecialErrors: Record<string, string> = {};
    
    // Check if special questions are required for this session
    const requiresSpecialQuestions = 
      (studentType === '10' && [2, 5, 10].includes(currentHole.sessionNumber)) ||
      (studentType === '25' && [2, 5, 12, 25].includes(currentHole.sessionNumber));
    
    if (requiresSpecialQuestions) {
      // Validate based on session number and student type
      if (currentHole.sessionNumber === 2) {
        const projectTopicKey = studentType === '10' ? 'projectTopic' : 'projectTopic25';
        if (!currentSpecialValues[projectTopicKey]?.trim()) {
          newSpecialErrors[projectTopicKey] = 'Project topic is required for session 2';
        }
      }
      
      if (currentHole.sessionNumber === 5) {
        if (!currentSpecialValues.confirmedTopic?.trim()) {
          newSpecialErrors.confirmedTopic = 'Confirmed topic is required for session 5';
        }
        if (studentType === '10' && !currentSpecialValues.midFeedback?.trim()) {
          newSpecialErrors.midFeedback = 'Mid feedback is required for session 5';
        }
      }
      
      if (studentType === '10' && currentHole.sessionNumber === 10) {
        if (!currentSpecialValues.finalFeedback?.trim()) {
          newSpecialErrors.finalFeedback = 'Final feedback is required for session 10';
        }
      }
      
      if (studentType === '25' && currentHole.sessionNumber === 12) {
        if (!currentSpecialValues.midFeedback25?.trim()) {
          newSpecialErrors.midFeedback25 = 'Mid feedback is required for session 12';
        }
      }
      
      if (studentType === '25' && currentHole.sessionNumber === 25) {
        if (!currentSpecialValues.finalFeedback?.trim()) {
          newSpecialErrors.finalFeedback = 'Final feedback is required for session 25';
        }
      }
    }
    
    setSpecialQuestionErrors(prev => ({
      ...prev,
      [currentHole.sessionNumber]: newSpecialErrors
    }));
    
    return Object.keys(newSpecialErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentForm() && validateSpecialQuestions()) {
      if (currentHoleIndex < holes.length - 1) {
        setCurrentHoleIndex(currentHoleIndex + 1);
      } else {
        handleSubmitAll();
      }
    }
  };

  const handlePrevious = () => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex(currentHoleIndex - 1);
    }
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    setSubmitMessage(null);
    
    try {
      // Submit each hole in sequence
      for (const hole of holes) {
        const date = dates[hole.sessionNumber];
        const progress = progressDescriptions[hole.sessionNumber];
        const exitTicket = exitTickets[hole.sessionNumber];
        const specialValues = specialQuestionValues[hole.sessionNumber] || {};
        
        const payload: any = {
          mentorName,
          mentorEmail,
          studentName,
          sessionDate: date ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}` : '',
          isUnexcusedAbsence: false,
          progressDescription: progress,
          exitTicket,
          sessionNumber: hole.sessionNumber, // Pass the specific session number for the hole
          specialQuestionValues: specialValues,
          specialQuestionSession: hole.sessionNumber.toString(),
          specialQuestionType: studentType,
        };
        
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to submit attendance');
        }
      }
      
      setSubmitMessage('Success! Missing attendance record(s) have been submitted successfully. Returning to the main form...');
      setTimeout(() => {
        onComplete();
        onClose();
      }, 3000);
      
    } catch (error: any) {
      setSubmitMessage('Failed to submit attendance: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const updateSpecialQuestionValues = (values: Record<string, string>) => {
    if (currentHole) {
      setSpecialQuestionValues(prev => ({
        ...prev,
        [currentHole.sessionNumber]: values
      }));
    }
  };

  const updateSpecialQuestionErrors = (errors: Record<string, string>) => {
    if (currentHole) {
      setSpecialQuestionErrors(prev => ({
        ...prev,
        [currentHole.sessionNumber]: errors
      }));
    }
  };

  if (!isOpen || holes.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${inter.className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Fill Missing Attendance Records
          </DialogTitle>
          <p className="text-sm text-gray-600">
            You have {holes.length} missing attendance record{holes.length > 1 ? 's' : ''} for {studentName} that must be completed.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentHoleIndex === 0 || submitting || submitMessage?.includes('Success!')}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm font-medium">
                Session {currentHole.sessionNumber} ({currentHoleIndex + 1} of {holes.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentHoleIndex === holes.length - 1 || submitting || submitMessage?.includes('Success!')}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-sm text-gray-500">
              Date must be from {currentHole.dateRange.min && new Date(currentHole.dateRange.min).getTime() > new Date('1900-01-01').getTime() ? (() => {
                const minDate = new Date(currentHole.dateRange.min);
                return `${(minDate.getMonth() + 1).toString().padStart(2, '0')}/${minDate.getDate().toString().padStart(2, '0')}/${minDate.getFullYear()}`;
              })() : 'any time'} to {(() => {
                const maxDate = new Date(currentHole.dateRange.max);
                return `${(maxDate.getMonth() + 1).toString().padStart(2, '0')}/${maxDate.getDate().toString().padStart(2, '0')}/${maxDate.getFullYear()}`;
              })()} (inclusive)
            </div>
          </div>

          {/* Session form */}
          <div className="space-y-4">
            {/* Date picker */}
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Session Date *
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={submitting || submitMessage?.includes('Success!')}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !currentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentDate ? `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear()}` : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CustomCalendar
                    selected={currentDate}
                    onSelect={(date) => {
                      if (date) {
                        setDates(prev => ({
                          ...prev,
                          [currentHole.sessionNumber]: date
                        }));
                      }
                    }}
                    className={inter.className}
                  />
                </PopoverContent>
              </Popover>
              {currentErrors.date && (
                <p className="text-sm text-red-600">{currentErrors.date}</p>
              )}
            </div>

            {/* Progress description */}
            <div className="space-y-2">
              <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">
                Please describe your progress today in a few sentences *
              </label>
              <textarea
                id="progress"
                placeholder="Describe what you accomplished in this session..."
                value={currentProgress}
                onChange={(e) => {
                  setProgressDescriptions(prev => ({
                    ...prev,
                    [currentHole.sessionNumber]: e.target.value
                  }));
                }}
                disabled={submitting || submitMessage?.includes('Success!')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-32 ${
                  currentErrors.progress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                } ${(submitting || submitMessage?.includes('Success!')) ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {currentErrors.progress && (
                <p className="text-sm text-red-600">{currentErrors.progress}</p>
              )}
            </div>

            {/* Exit ticket */}
            <div className="space-y-2">
              <label htmlFor="exitTicket" className="block text-sm font-medium text-gray-700 mb-1">
                Please link your Exit Ticket (Google Docs) from your session here. Your Exit Ticket should be in your student folder for proper attendance tracking. *
              </label>
              <input
                type="text"
                id="exitTicket"
                placeholder="https://docs.google.com/document/d/..."
                value={currentExitTicket}
                onChange={(e) => {
                  setExitTickets(prev => ({
                    ...prev,
                    [currentHole.sessionNumber]: e.target.value
                  }));
                }}
                disabled={submitting || submitMessage?.includes('Success!')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  currentErrors.exitTicket ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                } ${(submitting || submitMessage?.includes('Success!')) ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {currentErrors.exitTicket && (
                <p className="text-sm text-red-600">{currentErrors.exitTicket}</p>
              )}
            </div>

            {/* Special session questions */}
            <SpecialSessionQuestions
              studentType={studentType}
              sessionNumber={currentHole.sessionNumber}
              values={currentSpecialValues}
              setValues={updateSpecialQuestionValues}
              errors={currentSpecialErrors}
              setErrors={updateSpecialQuestionErrors}
            />
          </div>

          {/* Submit button */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleNext}
              disabled={submitting || submitMessage?.includes('Success!')}
              className="min-w-[120px]"
            >
              {submitting ? 'Submitting...' : 
               submitMessage?.includes('Success!') ? 'Submitted!' :
               currentHoleIndex === holes.length - 1 ? 'Submit All' : 'Next'}
            </Button>
          </div>

          {/* Submit message */}
          {submitMessage && (
            <div className={`p-3 rounded-md ${
              submitMessage.includes('successfully') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {submitMessage}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
