
import { Post, Project, Category, MediaAsset } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'HealthOne',
    websiteUrl: 'https://healthone.ae',
    niche: 'Wellness & Health',
    tone: 'Professional & Empathetic',
    location: 'Dubai, UAE',
    categories: ['Fitness', 'Nutrition', 'Mental Health'],
    tags: ['Yoga', 'Keto', 'Mindfulness'],
    createdAt: '2023-10-15',
    publishingMode: 'supabase_shared'
  },
  {
    id: '2',
    name: 'PointX',
    websiteUrl: 'https://pointx.tech',
    niche: 'Technology & AI',
    tone: 'Informative & Cutting-edge',
    location: 'Dubai, UAE',
    categories: ['AI', 'Development', 'Gadgets'],
    tags: ['React', 'Generative AI', 'SaaS'],
    createdAt: '2023-11-20',
    publishingMode: 'external_api',
    apiBaseUrl: 'https://api.pointx.tech/v1',
    apiKey: 'px_live_9a2f...'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat1', projectId: '1', name: 'Nutrition', slug: 'nutrition', description: 'Dietary tips and healthy eating habits.', status: 'Active', createdAt: '2023-10-16' },
  { id: 'cat2', projectId: '1', name: 'Fitness', slug: 'fitness', description: 'Workout routines and physical wellness.', status: 'Active', createdAt: '2023-10-17' },
  { id: 'cat3', projectId: '2', name: 'AI', slug: 'ai', description: 'Artificial Intelligence and LLM trends.', status: 'Active', createdAt: '2023-11-21' },
  { id: 'cat4', projectId: '2', name: 'Development', slug: 'development', description: 'Software engineering and coding best practices.', status: 'Active', createdAt: '2023-11-22' },
];

export const MOCK_MEDIA: MediaAsset[] = [
  {
    id: 'm1',
    projectId: '1',
    url: 'https://picsum.photos/seed/health1/800/400',
    filename: 'superfoods_dubai.jpg',
    fileSize: '450 KB',
    mimeType: 'image/jpeg',
    altText: 'Superfoods in Dubai Market',
    createdAt: '2024-03-01',
    usedInPosts: ['Top 10 Superfoods in Dubai Markets']
  },
  {
    id: 'm2',
    projectId: '1',
    url: 'https://picsum.photos/seed/yoga2/800/400',
    filename: 'morning_yoga.png',
    fileSize: '1.2 MB',
    mimeType: 'image/png',
    altText: 'Yoga routine in Dubai',
    createdAt: '2024-03-05',
    usedInPosts: ['Morning Yoga Routines for Busy Professionals']
  },
  {
    id: 'm3',
    projectId: '2',
    url: 'https://picsum.photos/seed/tech1/800/400',
    filename: 'ai_future.webp',
    fileSize: '210 KB',
    mimeType: 'image/webp',
    altText: 'AI future visualization',
    createdAt: '2024-03-02',
    usedInPosts: ['The Future of AI in the UAE Ecosystem']
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    projectId: '1',
    categoryId: 'cat1',
    title: 'Top 10 Superfoods in Dubai Markets',
    slug: 'top-10-superfoods-dubai',
    content: 'Long content here...',
    excerpt: 'Explore the nutrient-dense treasures found in local Dubai souks.',
    status: 'Published',
    category: 'Nutrition',
    author: 'Sarah Ahmed',
    date: '2024-03-01',
    image: 'https://picsum.photos/seed/health1/800/400',
  },
  {
    id: 'p2',
    projectId: '1',
    categoryId: 'cat2',
    title: 'Morning Yoga Routines for Busy Professionals',
    slug: 'morning-yoga-routines-dubai',
    content: 'Long content here...',
    excerpt: 'Start your day right with these quick 15-minute flows.',
    status: 'Draft',
    category: 'Fitness',
    author: 'Sarah Ahmed',
    date: '2024-03-05',
    image: 'https://picsum.photos/seed/yoga2/800/400',
  },
  {
    id: 'p3',
    projectId: '2',
    categoryId: 'cat3',
    title: 'The Future of AI in the UAE Ecosystem',
    slug: 'future-ai-uae',
    content: 'Long content here...',
    excerpt: 'How tech hubs in Dubai are shaping the next generation of LLMs.',
    status: 'Published',
    category: 'AI',
    author: 'Alex Tech',
    date: '2024-03-02',
    image: 'https://picsum.photos/seed/tech1/800/400',
  },
  {
    id: 'p4',
    projectId: '2',
    categoryId: 'cat4',
    title: 'Building Scalable SaaS Platforms in 2024',
    slug: 'building-scalable-saas-2024',
    content: 'Long content here...',
    excerpt: 'Best practices for cloud-native architectures.',
    status: 'Draft',
    category: 'Development',
    author: 'Alex Tech',
    date: '2024-03-08',
    image: 'https://picsum.photos/seed/dev2/800/400',
  },
];
