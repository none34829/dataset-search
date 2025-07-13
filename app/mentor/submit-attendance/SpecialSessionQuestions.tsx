import React from 'react';

interface SpecialSessionQuestionsProps {
  studentType: '10' | '25';
  sessionNumber: number;
  values: Record<string, string>;
  setValues: (v: Record<string, string>) => void;
  errors: Record<string, string>;
  setErrors: (e: Record<string, string>) => void;
}

const forbidden = ["n/a", "na", "not applicable"];

interface Question {
  label: string;
  description: string;
  placeholder: string;
  column: string;
  min?: number;
  validate: (v: string) => string;
}

const questions: Record<string, Question> = {
  projectTopic: {
    label: `What is your student’s project topic?`,
    description: `Please try to be relatively specific in your response (i.e. instead of "cancer detection", say "leukemia diagnosis using image classification and logistic regression")\n\nPlease also share the early reflections form with your student for them to provide feedback on the program: https://inspiritai.co/1-1-Feedback-Form-Early-Reflections`,
    placeholder: "Project Topic",
    column: 'J',
    validate: (v: string) => forbidden.includes(v.trim().toLowerCase()) ? 'Please provide a specific project topic.' : '',
  },
  projectTopic25: {
    label: `What is your student’s project topic?`,
    description: `Please try to be relatively specific in your response (i.e. instead of "cancer detection", say "leukemia diagnosis using image classification and logistic regression")`,
    placeholder: "Project Topic",
    column: 'J',
    validate: (v: string) => forbidden.includes(v.trim().toLowerCase()) ? 'Please provide a specific project topic.' : '',
  },
  confirmedTopic: {
    label: `Please confirm your student's project topic!`,
    description: `Try to be relatively specific in your response (i.e. instead of "cancer detection", say "leukemia diagnosis using image classification and logistic regression")`,
    placeholder: "Confirmed Project Topic",
    column: 'R',
    validate: (v: string) => forbidden.includes(v.trim().toLowerCase()) ? 'Please provide a specific project topic.' : '',
  },
  midFeedback: {
    label: `We kindly ask, now that more sessions have progressed, that you provide a brief feedback report for your student. Your feedback should be around 4-5 sentences, and should include the following:\n• How you feel about the trajectory of the project\n• One aspect of the project that the student is doing well\n• One aspect of the project that the student needs further help with, and could perhaps work on a bit more outside of class\n• This feedback will be shared with guardians and/or counselors, so please keep that in mind!\n\nPlease also share the mid-program feedback form with your student for them to provide feedback on the program: https://inspiritai.co/1-1-Feedback-Form-Mid-Program`,
    description: '',
    placeholder: "Mid-Program Feedback",
    column: 'K',
    min: 300,
    validate: (v: string) => v.replace(/\s/g, '').length < 300 ? 'Minimum 300 characters required.' : '',
  },
  midFeedback25: {
    label: `We kindly ask, now that more sessions have progressed, that you provide a brief feedback report for your student. Your feedback should be around 4-5 sentences, and should include the following:\n• How you feel about the trajectory of the project\n• One aspect of the project that the student is doing well\n• One aspect of the project that the student needs further help with, and could perhaps work on a bit more outside of class\n• This feedback will be shared with guardians and/or counselors, so please keep that in mind!\nPlease also share the mid-program feedback form with your student for them to provide feedback on the program: https://inspiritai.co/1-1-Feedback-Form-Mid-Program`,
    description: '',
    placeholder: "Mid-Program Feedback",
    column: 'S',
    min: 300,
    validate: (v: string) => v.replace(/\s/g, '').length < 300 ? 'Minimum 300 characters required.' : '',
  },
  finalFeedback: {
    label: `Now that your student has wrapped up their project, we kindly ask that you provide a brief feedback report for your student. Your feedback should be around 4-5 sentences, and should include the following:\n• How the project went overall\n• What the student did well and areas of improvement\n• Any accomplishments the student had\n• Next steps for the student (either indicated by them, or from your expert opinion)\nThis feedback will be shared with guardians and/or counselors, so please keep that in mind. And, congratulations on finishing your 1:1 mentorship with your student! Your student has joined our hundreds of 1:1 project alum, and their projects will be featured here if they wish: https://independent-project-mentorship.netlify.app/index.html`,
    description: '',
    placeholder: "Final Feedback",
    column: 'L',
    min: 500,
    validate: (v: string) => v.replace(/\s/g, '').length < 500 ? 'Minimum 500 characters required.' : '',
  },
};

export default function SpecialSessionQuestions({ studentType, sessionNumber, values, setValues, errors, setErrors }: SpecialSessionQuestionsProps) {
  // Determine which questions to show
  const show = [] as Array<{ key: string; q: Question }>;
  if (studentType === '10') {
    if (sessionNumber === 2) show.push({ key: 'projectTopic', q: questions.projectTopic });
    if (sessionNumber === 5) {
      show.push({ key: 'confirmedTopic', q: questions.confirmedTopic });
      show.push({ key: 'midFeedback', q: questions.midFeedback });
    }
    if (sessionNumber === 10) show.push({ key: 'finalFeedback', q: questions.finalFeedback });
  } else if (studentType === '25') {
    if (sessionNumber === 2) show.push({ key: 'projectTopic25', q: questions.projectTopic25 });
    if (sessionNumber === 5) show.push({ key: 'confirmedTopic', q: questions.confirmedTopic });
    if (sessionNumber === 12) show.push({ key: 'midFeedback25', q: questions.midFeedback25 });
    if (sessionNumber === 25) show.push({ key: 'finalFeedback', q: questions.finalFeedback });
  }

  if (show.length === 0) return null;

  return (
    <>
      {show.map(({ key, q }) => {
        const value = values[key] || '';
        const error = errors[key] || '';
        const min = q.min || 0;
        const charCount = value.replace(/\s/g, '').length;
        // Special handling for midFeedback, midFeedback25, and finalFeedback to render bullets as a list
        let labelContent: React.ReactNode = q.label;
        if (key === 'midFeedback' || key === 'midFeedback25' || key === 'finalFeedback') {
          // Split label at first bullet (•)
          const [intro, ...bullets] = q.label.split(/\n•/);
          let postBullets: string | null = null;
          let bulletItems = bullets;
          if ((key === 'finalFeedback' || key === 'midFeedback25') && bullets.length > 0) {
            // Check if the last bullet contains a \n (paragraph after bullets)
            const last = bullets[bullets.length - 1];
            const split = last.split(/\n(.+)/);
            if (split.length > 1) {
              bulletItems = [...bullets.slice(0, -1), split[0]];
              postBullets = split[1].trim();
            }
          }
          labelContent = (
            <>
              <span>{intro.trim()}</span>
              {bulletItems.length > 0 && (
                <ul className="list-disc pl-6 mt-2 mb-2">
                  {bulletItems.map((b, i) => <li key={i}>{b.replace(/\n/g, '').trim()}</li>)}
                </ul>
              )}
              {postBullets && <div className="mb-2 whitespace-pre-line">{postBullets}</div>}
            </>
          );
        }
        return (
          <div className="mb-6" key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {labelContent}
              <div className="text-xs text-gray-500 whitespace-pre-line mb-2">{q.description}</div>
            </label>
            {min > 0 ? (
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-32"
                placeholder={q.placeholder}
                value={value}
                onChange={e => {
                  setValues({ ...values, [key]: e.target.value });
                  setErrors({ ...errors, [key]: q.validate(e.target.value) });
                }}
              />
            ) : (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={q.placeholder}
                value={value}
                onChange={e => {
                  setValues({ ...values, [key]: e.target.value });
                  setErrors({ ...errors, [key]: q.validate(e.target.value) });
                }}
              />
            )}
            {min > 0 && (
              <div className="text-xs text-gray-500 mt-1">{charCount} / {min} characters</div>
            )}
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          </div>
        );
      })}
    </>
  );
} 