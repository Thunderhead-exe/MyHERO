import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { extractScenes, generateIllustrationImage, generateStoryContent } from '../services/geminiService';
import { ILLUSTRATION_COST, STORY_COST } from '../constants';
import Button from '../components/Button';
import { ChevronLeft, Image as ImageIcon, Sparkles, RefreshCw, BookOpen, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import { Story, Illustration } from '../types';

const StoryReader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Added addCredits for refund logic
  const { getStory, getChild, updateStory, deductCredits, addCredits, user } = useStore();
  
  // Use local state for UI interactions, but sync with store
  const storeStory = id ? getStory(id) : undefined;
  
  // We keep a local loading state that is separate from the store
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!storeStory) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center">
        <AlertTriangle size={48} className="text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Story not found</h2>
        <Button onClick={() => navigate('/')} variant="ghost" className="mt-4">Back to Home</Button>
      </div>
    );
  }

  const child = getChild(storeStory.childId);

  const handleRegenerate = async () => {
    // Validation
    if (!storeStory) {
      console.error("Story not found in state");
      return;
    }
    
    // Explicitly re-fetch child to ensure we have the object
    const currentChild = getChild(storeStory.childId);
    if (!currentChild) {
      alert("Error: Could not find the child profile for this story.");
      return;
    }

    if (user.credits < STORY_COST) {
        alert("Not enough credits to regenerate! Please add more from the dashboard.");
        return;
    }

    const confirm = window.confirm("Regenerate this story? This will create a new version and remove current illustrations.");
    if (!confirm) return;

    // Scroll to top immediately so user sees the loading state
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Deduct credits
    const success = deductCredits(STORY_COST);
    if (!success) {
      alert("Transaction failed: Not enough credits.");
      return;
    }

    setIsRegenerating(true);
    
    try {
        console.log("Regenerating story for:", currentChild.name);
        
        // Use the existing lesson or fallback
        const lesson = storeStory.lesson || "kindness";
        
        const generatedContent = await generateStoryContent(currentChild, lesson);
        
        const updatedStory: Story = {
            ...storeStory,
            title: generatedContent.title,
            paragraphs: generatedContent.paragraphs,
            illustrations: [], // Reset illustrations as text changed
            createdAt: Date.now() // Update timestamp
        };
        
        updateStory(updatedStory);
        console.log("Story updated successfully");
        
    } catch (e: any) {
        console.error("Regeneration error:", e);
        alert(`Failed to regenerate story: ${e.message || "Unknown error"}. Credits have been refunded.`);
        // Refund credits on failure
        addCredits(STORY_COST);
    } finally {
        setIsRegenerating(false);
    }
  };

  const handleGenerateIllustrations = async () => {
    if (user.credits < ILLUSTRATION_COST) {
      alert("Not enough credits!");
      return;
    }
    
    // Check if we already have images to prevent double click waste
    if (storeStory.illustrations && storeStory.illustrations.length > 0) {
      const confirm = window.confirm("You already have illustrations. Create new ones?");
      if (!confirm) return;
    }
    
    // Scroll to top to see progress
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (!deductCredits(ILLUSTRATION_COST)) return;

    setIsGeneratingImages(true);
    setProgress(5); // Started

    try {
      // 1. Analyze story to find scenes
      const scenes = await extractScenes(storeStory.title, storeStory.paragraphs);
      setProgress(20); // Scenes extracted

      // 2. Limit to max 3 scenes for demo
      const limitedScenes = scenes.slice(0, 3);
      
      // We will build a new array of illustrations
      const currentIllustrations: Illustration[] = [];
      const colors = child?.favoriteColors?.join(', ') || 'colorful';

      // 3. Generate each image sequentially
      for (let i = 0; i < limitedScenes.length; i++) {
        const scene = limitedScenes[i];
        try {
          const stylePrompt = `Children's book illustration, vibrant tones of ${colors}, watercolor style`;
          
          const base64Image = await generateIllustrationImage(scene.description, stylePrompt);
          
          currentIllustrations.push({
            id: `img-${Date.now()}-${i}`,
            paragraphIndex: scene.index,
            prompt: scene.description,
            imageUrl: base64Image
          });
          
          // Update progress visual
          const percentage = 20 + Math.floor(((i + 1) / limitedScenes.length) * 80);
          setProgress(percentage);
          
        } catch (e) {
          console.error(`Failed to generate image for scene ${i}`, e);
        }
      }

      // Update store ONLY after everything is done to prevent re-render glitches during loop
      if (currentIllustrations.length > 0) {
        const updatedStory = { 
          ...storeStory, 
          illustrations: currentIllustrations 
        };
        updateStory(updatedStory);
      } else {
        alert("Could not generate images. Please try again.");
        addCredits(ILLUSTRATION_COST); // Refund
      }

    } catch (e) {
      console.error("Illustration generation failed", e);
      alert("Something went wrong while painting the pictures. Credits refunded.");
      addCredits(ILLUSTRATION_COST); // Refund
    } finally {
      setIsGeneratingImages(false);
      setProgress(0);
    }
  };

  // Helper to get illustration for a specific paragraph index
  const getIllustration = (index: number) => {
    return storeStory.illustrations?.find(img => img.paragraphIndex === index);
  };

  const isLoading = isGeneratingImages || isRegenerating;

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Navbar/Header actions */}
      <div className="sticky top-16 z-10 bg-slate-50/95 backdrop-blur py-4 mb-4 flex justify-between items-center border-b border-slate-200">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ChevronLeft size={20} /> Back
        </Button>
        <div className="text-sm font-medium text-slate-500">
          {child?.name}'s Adventure
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden min-h-[60vh] border border-slate-100 relative">
        
        {/* Loading Overlay - Using absolute inset-0 on the card, scroll to top ensures visibility */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center animate-fadeIn backdrop-blur-sm">
            {isGeneratingImages ? (
              <>
                 <div className="w-64 bg-slate-200 rounded-full h-4 mb-4 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="font-bold text-indigo-800 animate-pulse text-lg">
                  Painting your story... {progress}%
                </p>
                <p className="text-sm text-slate-500 mt-2">This usually takes about 20 seconds.</p>
              </>
            ) : (
               <div className="flex flex-col items-center">
                 <RefreshCw className="animate-spin text-indigo-600 mb-6" size={48}/>
                 <p className="font-bold text-indigo-800 text-xl">Writing a new version...</p>
                 <p className="text-slate-500 mt-2">Creating a unique story for {child?.name}</p>
               </div>
            )}
           
          </div>
        )}

        {/* Title Page */}
        <div className="bg-indigo-600 text-white p-12 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif">{storeStory.title}</h1>
            <p className="text-indigo-200 text-lg">A story for {child?.name}</p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
             <div className="absolute right-0 bottom-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
             <div className="absolute left-0 top-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-12">
          {storeStory.paragraphs.map((para, idx) => {
            const img = getIllustration(idx);
            return (
              <div key={idx} className="animate-fadeIn">
                <p className="text-xl leading-relaxed text-slate-700 font-serif mb-8">
                  {para}
                </p>
                
                {/* Illustration Slot */}
                {img && (
                  <div className="my-8 rounded-2xl overflow-hidden shadow-lg transform rotate-1 hover:rotate-0 transition duration-500 border-4 border-white ring-1 ring-slate-200">
                    <img src={img.imageUrl} alt="Story illustration" className="w-full h-auto object-cover" />
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-12 text-center border-t border-slate-100">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">The End</h3>
            <p className="text-slate-500 mb-8">Lesson learned: {storeStory.lesson}</p>
          </div>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 sm:static sm:bg-transparent sm:border-0 sm:shadow-none sm:p-0 sm:mt-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
          
          <Button 
            className="flex-1"
            variant="secondary"
            onClick={handleGenerateIllustrations}
            disabled={isLoading || (storeStory.illustrations && storeStory.illustrations.length > 0)}
            isLoading={isGeneratingImages}
          >
            {storeStory.illustrations && storeStory.illustrations.length > 0 
              ? 'Illustrations Complete' 
              : `Illustrate Story (${ILLUSTRATION_COST} 🪙)`}
          </Button>

          <Button 
            className="flex-1"
            variant="outline"
            onClick={handleRegenerate}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={`mr-2 ${isRegenerating ? 'animate-spin' : ''}`}/>
            Regenerate ({STORY_COST} 🪙)
          </Button>

          <Button 
            className="flex-1" 
            variant="outline" 
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            <BookOpen size={18} className="mr-2"/>
            Read Another
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryReader;