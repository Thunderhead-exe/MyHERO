import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { generateStoryContent } from '../services/geminiService';
import { STORY_COST, SAMPLE_VALUES } from '../constants';
import Button from '../components/Button';
import Card from '../components/Card';
import { ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';

const StoryWizard: React.FC = () => {
  const navigate = useNavigate();
  const { children, user, deductCredits, addStory } = useStore();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedChild = children.find(c => c.id === selectedChildId);

  const handleGenerate = async () => {
    if (!selectedChild || !selectedLesson) return;
    
    setError(null);
    if (!deductCredits(STORY_COST)) {
      setError("Not enough credits! Please top up in the dashboard.");
      return;
    }

    setIsGenerating(true);

    try {
      const generatedContent = await generateStoryContent(selectedChild, selectedLesson);
      
      const newStory = {
        id: `story-${Date.now()}`,
        childId: selectedChild.id,
        title: generatedContent.title,
        paragraphs: generatedContent.paragraphs,
        lesson: selectedLesson,
        createdAt: Date.now(),
        illustrations: [],
        isGeneratingImages: false
      };

      addStory(newStory);
      navigate(`/story/${newStory.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to generate story");
      setIsGenerating(false);
    }
  };

  if (children.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-4">No Heroes Found</h2>
        <p className="mb-6">Please create a child profile first.</p>
        <Button onClick={() => navigate('/child/new')}>Create Profile</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold">Create New Story</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-slate-700">Who is this story for?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {children.map(child => (
              <Card 
                key={child.id}
                hoverable
                className={`flex flex-col items-center justify-center py-6 cursor-pointer border-2 ${selectedChildId === child.id ? 'border-indigo-500 bg-indigo-50' : 'border-transparent'}`}
                onClick={() => setSelectedChildId(child.id)}
              >
                <div className="text-5xl mb-3">{child.avatar}</div>
                <div className="font-bold">{child.name}</div>
              </Card>
            ))}
          </div>
          <div className="flex justify-end mt-8">
            <Button 
              disabled={!selectedChildId} 
              onClick={() => setStep(2)}
            >
              Next Step
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4 mb-4 bg-indigo-50 p-4 rounded-xl">
            <div className="text-3xl">{selectedChild?.avatar}</div>
            <div>
              <p className="text-sm text-slate-500">Selected Hero</p>
              <p className="font-bold text-lg">{selectedChild?.name}</p>
            </div>
            <button 
              className="ml-auto text-sm text-indigo-600 font-medium hover:underline"
              onClick={() => setStep(1)}
            >
              Change
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-700">What is the lesson today?</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {selectedChild?.values.map(val => (
               <button
               key={val}
               onClick={() => setSelectedLesson(val)}
               className={`p-4 rounded-xl border-2 text-left transition ${selectedLesson === val ? 'border-amber-400 bg-amber-50 shadow-md' : 'border-slate-100 bg-white hover:border-amber-200'}`}
             >
               <span className="block font-bold text-amber-900">⭐ {val}</span>
             </button>
            ))}
            {SAMPLE_VALUES.filter(v => !selectedChild?.values.includes(v)).slice(0, 4).map(val => (
              <button
                key={val}
                onClick={() => setSelectedLesson(val)}
                className={`p-4 rounded-xl border-2 text-left transition ${selectedLesson === val ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
              >
                <span className="block font-medium text-slate-700">{val}</span>
              </button>
            ))}
          </div>

          <div className="mt-6">
             <label className="block text-sm font-medium text-slate-700 mb-2">Or type a custom lesson:</label>
             <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Brushing teeth before bed"
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
             />
          </div>

          <div className="bg-slate-100 p-4 rounded-xl mt-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-slate-600">Story Cost</p>
              <p className="text-xs text-slate-500">Includes AI text generation</p>
            </div>
            <div className="font-bold text-amber-600 text-lg flex items-center gap-1">
              <span>🪙</span> {STORY_COST} Credit
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedLesson || isGenerating}
              isLoading={isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? 'Writing Story...' : 'Generate Story ✨'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryWizard;