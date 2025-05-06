// Authentication types
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  organization: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  marketing_consent?: boolean;
}

export interface RegistrationResponse {
  user: User;
  tokens: AuthTokens;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  organization: number;
  organization_name: string;
  role: string;
  is_organization_admin: boolean;
  inactivity_timeout?: number;
  stay_logged_in?: boolean;
  marketing_consent?: boolean;
}

// Document types
export interface Document {
  id: number;
  title: string;
  slug: string;
  created_by: number;
  created_by_name: string;
  organization: number;
  category?: number;
  category_name?: string;
  category_color?: string;
  tags: string[];
  version: number;
  is_latest: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  comment_count: number;
  plain_text?: string; // Plain text content for search
}

export interface DocumentDetail extends Document {
  content: any; // Slate.js JSON content
  parent?: number;
  comments: Comment[];
}

export interface DocumentCreateData {
  title: string;
  content: any; // Slate.js JSON content
  organization: number;
  category?: number;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}

export interface DocumentUpdateData {
  title?: string;
  content?: any; // Slate.js JSON content
  category?: number;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  create_new_version?: boolean;
}

// Comment types
export interface Comment {
  id: number;
  document: number;
  user: number;
  user_name: string;
  text: string;
  parent?: number;
  created_at: string;
  updated_at: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent?: number;
  organization: number;
  created_at: string;
  updated_at: string;
  document_count: number;
  color?: string;
  icon?: string;
}

export interface CategoryDetail extends Category {
  children: Category[];
}

export interface CategoryCreateData {
  name: string;
  description?: string;
  parent?: number;
  organization: number;
  color?: string;
}

export interface CategoryUpdateData {
  name?: string;
  description?: string;
  parent?: number;
  color?: string;
}

// PDF Export types
export interface PDFExport {
  id: number;
  document: number;
  document_title: string;
  created_by: number;
  created_by_name: string;
  uuid: string;
  created_at: string;
  expires_at: string | null;
  expiration_type: '1h' | '24h' | '1w' | '1m' | 'never';
  expiration_display: string;
  pin_protected: boolean;
  pin_code?: string;
  share_url: string;
}

export interface PDFExportCreateData {
  document: number;
  expiration_type?: '1h' | '24h' | '1w' | '1m' | 'never';
  pin_protected?: boolean;
}

// Tag types
export interface Tag {
  id: number;
  name: string;
  slug: string;
  organization: number;
  created_at: string;
  updated_at: string;
  document_count: number;
}

export interface TagCreateData {
  name: string;
  organization: number;
}

export interface TagUpdateData {
  name?: string;
}
