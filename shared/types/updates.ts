// ============================================================================
// TYPES - Sistema de Atualizações e Sugestões
// ============================================================================

export type UpdateType = 'feature' | 'improvement' | 'bugfix' | 'announcement';

export type SuggestionCategory = 'feature' | 'improvement' | 'bugfix' | 'ux' | 'performance' | 'other';

export type SuggestionStatus = 'pending' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'rejected';

export type SuggestionPriority = 'low' | 'medium' | 'high';

export interface AppUpdate {
  id: string;
  title: string;
  content: string;
  update_type: UpdateType;
  icon?: string;
  is_published: boolean;
  published_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ImprovementSuggestion {
  id: string;
  title: string;
  description: string;
  category: SuggestionCategory;
  status: SuggestionStatus;
  priority?: SuggestionPriority;
  votes_count: number;
  broker_id: string;
  broker_name?: string;
  admin_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
  user_has_voted?: boolean;
}

export interface SuggestionVote {
  id: string;
  suggestion_id: string;
  broker_id: string;
  created_at: string;
}
