import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Child } from '../types';
import { SAMPLE_INTERESTS, SAMPLE_VALUES, SAMPLE_COLORS } from '../constants';
import Button from '../components/Button';
import Card from '../components/Card';
import { ChevronLeft, Plus } from 'lucide-react';

const AVATARS = ['🦖', '👩‍🚀', '👸', '🦸', '🧚', '🧙‍♂️', '🦁', '🦊', '🐯', '🦄'];

const ChildProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { children, addChild, updateChild } = useStore();
  
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<Omit<Child, 'id'>>({
    name: '',
    age: 5,
    interests: [],
    favoriteColors: [],
    values: [],
    avatar: '🦖'
  });

  // Local state for adding custom items
  const [customInterest, setCustomInterest] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [customColor, setCustomColor] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      const existing = children.find(c => c.id === id);
      if (existing) {
        // Handle migration from old favoriteColor string if necessary, though types enforce array now
        const colors = existing.favoriteColors || ( (existing as any).favoriteColor ? [(existing as any).favoriteColor] : []);
        
        setFormData({
          name: existing.name,
          age: existing.age,
          interests: existing.interests,
          favoriteColors: colors,
          values: existing.values,
          avatar: existing.avatar
        });
      }
    }
  }, [id, isEditing, children]);

  const toggleSelection = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const addCustomItem = (
    item: string, 
    list: string[], 
    setter: (val: string[]) => void, 
    clearer: () => void
  ) => {
    if (item && !list.includes(item)) {
      setter([...list, item]);
      clearer();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (isEditing && id) {
      updateChild({ ...formData, id });
    } else {
      addChild({ ...formData, id: `child-${Date.now()}` });
    }
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Hero' : 'New Hero Profile'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info */}
        <Card>
          <div className="flex flex-col items-center mb-6">
            <label className="text-sm font-semibold text-slate-500 mb-2">Choose Avatar</label>
            <div className="flex gap-2 overflow-x-auto max-w-full p-2">
              {AVATARS.map(emoji => (
                <button
                  type="button"
                  key={emoji}
                  className={`w-12 h-12 text-2xl rounded-full flex items-center justify-center transition ${formData.avatar === emoji ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-slate-50 hover:bg-slate-100'}`}
                  onClick={() => setFormData({ ...formData, avatar: emoji })}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Hero's name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        </Card>

        {/* Favorite Colors */}
        <Card>
          <h3 className="font-bold text-lg mb-4">Favorite Colors</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {[...SAMPLE_COLORS, ...formData.favoriteColors.filter(c => !SAMPLE_COLORS.includes(c))].map(color => (
              <button
                type="button"
                key={color}
                onClick={() => toggleSelection(formData.favoriteColors, color, (val) => setFormData({ ...formData, favoriteColors: val }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${formData.favoriteColors.includes(color) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {color}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="Add other favorite color..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
                  e.preventDefault();
                  addCustomItem(customColor, formData.favoriteColors, (val) => setFormData({...formData, favoriteColors: val}), () => setCustomColor(''));
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={() => addCustomItem(customColor, formData.favoriteColors, (val) => setFormData({...formData, favoriteColors: val}), () => setCustomColor(''))}
              disabled={!customColor}
            >
              <Plus size={18} />
            </Button>
          </div>
        </Card>

        {/* Interests */}
        <Card>
          <h3 className="font-bold text-lg mb-4">Interests</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {[...SAMPLE_INTERESTS, ...formData.interests.filter(i => !SAMPLE_INTERESTS.includes(i))].map(interest => (
              <button
                type="button"
                key={interest}
                onClick={() => toggleSelection(formData.interests, interest, (val) => setFormData({ ...formData, interests: val }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${formData.interests.includes(interest) ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {interest}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text"
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              placeholder="Add other interest..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
                  e.preventDefault();
                  addCustomItem(customInterest, formData.interests, (val) => setFormData({...formData, interests: val}), () => setCustomInterest(''));
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={() => addCustomItem(customInterest, formData.interests, (val) => setFormData({...formData, interests: val}), () => setCustomInterest(''))}
              disabled={!customInterest}
            >
              <Plus size={18} />
            </Button>
          </div>
        </Card>

        {/* Values */}
        <Card>
          <h3 className="font-bold text-lg mb-4">Values to Learn</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {[...SAMPLE_VALUES, ...formData.values.filter(v => !SAMPLE_VALUES.includes(v))].map(value => (
              <button
                type="button"
                key={value}
                onClick={() => toggleSelection(formData.values, value, (val) => setFormData({ ...formData, values: val }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${formData.values.includes(value) ? 'bg-amber-400 text-amber-900 shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {value}
              </button>
            ))}
          </div>
           <div className="flex gap-2">
            <input 
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Add other value..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
                  e.preventDefault();
                  addCustomItem(customValue, formData.values, (val) => setFormData({...formData, values: val}), () => setCustomValue(''));
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={() => addCustomItem(customValue, formData.values, (val) => setFormData({...formData, values: val}), () => setCustomValue(''))}
              disabled={!customValue}
            >
              <Plus size={18} />
            </Button>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
          <Button type="submit">{isEditing ? 'Save Changes' : 'Create Hero'}</Button>
        </div>

      </form>
    </div>
  );
};

export default ChildProfile;