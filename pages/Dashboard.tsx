import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, BookOpen, Clock, ChevronRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { children, stories } = useStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-20">
      
      {/* Hero Section */}
      <section className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-indigo-100 mb-6 max-w-md">
            Ready to create a magical story today? Choose a hero and start an adventure.
          </p>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/create-story')}
            className="flex items-center gap-2"
          >
            <BookOpen size={20} />
            Create New Story
          </Button>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 bg-indigo-400 rounded-full opacity-30 blur-2xl"></div>
      </section>

      {/* Children Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Your Heroes</h2>
          <Link to="/child/new" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            + Add Child
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {children.map(child => (
            <Card 
              key={child.id} 
              hoverable 
              className="flex flex-col items-center justify-center text-center py-6"
              onClick={() => navigate(`/child/edit/${child.id}`)}
            >
              <div className="text-4xl mb-3">{child.avatar}</div>
              <h3 className="font-bold text-slate-800">{child.name}</h3>
              <p className="text-xs text-slate-500">{child.age} years old</p>
            </Card>
          ))}
          <Card 
            hoverable 
            className="flex flex-col items-center justify-center text-center py-6 border-dashed border-2 border-slate-200 bg-slate-50"
            onClick={() => navigate('/child/new')}
          >
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-3">
              <Plus size={24} />
            </div>
            <span className="font-semibold text-slate-400">Add Hero</span>
          </Card>
        </div>
      </section>

      {/* Recent Stories Section */}
      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Adventures</h2>
        {stories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-slate-500 mb-4">No stories yet. Let's write one!</p>
            <Button variant="outline" onClick={() => navigate('/create-story')}>
              Write First Story
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map(story => (
              <Card key={story.id} hoverable onClick={() => navigate(`/story/${story.id}`)} className="flex items-center gap-4 p-4">
                <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center text-2xl shrink-0">
                  {/* Find child avatar */}
                  {children.find(c => c.id === story.childId)?.avatar || '📖'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{story.title}</h3>
                  <p className="text-sm text-slate-500 truncate">
                    For {children.find(c => c.id === story.childId)?.name} • Lesson: {story.lesson}
                  </p>
                </div>
                <div className="text-slate-400">
                  <ChevronRight size={20} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;