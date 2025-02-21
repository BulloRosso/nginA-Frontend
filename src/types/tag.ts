// src/types/tag.ts
export interface TagNode {
  id: string;           // Unique identifier for the tree node
  category: string;     // Category name
  name: string;        // Tag name or category name
  full_tag: string;    // Full tag string (category:name)
  children: TagNode[]; // Child nodes, empty array for leaf nodes
}

export interface TagResponse {
  tags: string;  // Comma-separated list of tags
}

export interface TagSuggestion {
  category: string;
  name: string;
  full_tag: string;
}