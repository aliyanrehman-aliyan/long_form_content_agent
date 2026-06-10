
export type PostStatus = 'Draft' | 'Published' | 'Scheduled';
export type PublishingMode = 'supabase_shared' | 'email_delivery';
export type CategoryStatus = 'Active' | 'Hidden';

export type BlockType = 'heading' | 'paragraph' | 'bullet_list' | 'image' | 'quote';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string | string[];
}

export interface SEOData {
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
}

// Fixed missing export of Post interface
export interface Post {
  id: string;
  projectId: string;
  categoryId?: string;
  categoryIds?: string[];
  title: string;
  titleAr?: string;
  slug: string;
  content: string;
  excerpt: string;
  excerptAr?: string;
  status: PostStatus;
  category: string;
  author: string;
  date: string;
  publishAt?: string;
  image: string;
  seo?: SEOData;
  blocksEn?: ContentBlock[];
  blocksAr?: ContentBlock[];
  tags?: string[];
}

export interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  niche: string;
  tone: string;
  location: string;
  category?: string;
  categories?: string[]; 
  tags?: string[];
  createdAt: string;
  publishingMode: PublishingMode;
  apiBaseUrl?: string;
  apiKey?: string;
}

export interface Category {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  description: string;
  status: CategoryStatus;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  projectId: string;
  url: string;
  filename: string;
  fileSize: string;
  mimeType: string;
  altText: string;
  createdAt: string;
  usedInPosts: string[];
}

export type Tab = 'Projects' | 'Posts' | 'Categories' | 'CategoryDetail' | 'Calendar' | 'Editor' | 'Analytics' | 'Settings' | 'AutoGenerate';
