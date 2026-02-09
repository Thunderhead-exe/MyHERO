import { Child } from "./types";

export const INITIAL_CREDITS = 10;
export const STORY_COST = 1;
export const ILLUSTRATION_COST = 2;

export const MOCK_USER = {
  id: 'user-1',
  name: 'Demo Parent',
  email: 'parent@demo.com',
  credits: INITIAL_CREDITS,
  tier: 'Premium'
};

export const SAMPLE_VALUES = [
  "Honesty", "Sharing", "Bravery", "Kindness", 
  "Patience", "Cleaning Up", "Listening", "Friendship"
];

export const SAMPLE_INTERESTS = [
  "Dinosaurs", "Space", "Princesses", "Cars", 
  "Animals", "Superheroes", "Robots", "Magic", "Sports"
];

export const SAMPLE_COLORS = [
  "Red", "Blue", "Green", "Yellow", 
  "Purple", "Pink", "Orange", "Rainbow", "Sparkly Gold"
];

export const SAMPLE_CHILDREN: Child[] = [
  {
    id: 'child-1',
    name: 'Leo',
    age: 5,
    interests: ['Dinosaurs', 'Lego'],
    favoriteColors: ['Green'],
    values: ['Sharing'],
    avatar: '🦖'
  },
  {
    id: 'child-2',
    name: 'Maya',
    age: 7,
    interests: ['Space', 'Painting'],
    favoriteColors: ['Purple', 'Blue'],
    values: ['Bravery'],
    avatar: '👩‍🚀'
  }
];