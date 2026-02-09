export interface Child {
  id: string;
  name: string;
  age: number;
  interests: string[]; // e.g., ["Dinosaurs", "Space"]
  favoriteColors: string[]; // Changed from favoriteColor string
  values: string[]; // e.g., ["Honesty", "Sharing"]
  avatar: string; // Emoji or simple string
}

export interface Illustration {
  id: string;
  paragraphIndex: number; // The paragraph this image belongs to
  prompt: string;
  imageUrl: string; // Base64 or URL
}

export interface Story {
  id: string;
  childId: string;
  title: string;
  paragraphs: string[];
  lesson: string; // The specific lesson chosen for this story
  createdAt: number;
  illustrations: Illustration[];
  isGeneratingImages: boolean;
}

export interface User {
  id: string;
  credits: number;
  name: string;
  email: string;
  tier?: string;
}

export interface GeneratedScene {
  index: number;
  description: string;
}

export enum AppRoute {
  DASHBOARD = '/',
  CREATE_CHILD = '/child/new',
  CREATE_STORY = '/create-story',
}