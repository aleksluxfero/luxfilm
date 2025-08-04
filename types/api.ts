// types/api.ts
export interface MediaItem {
  id: number;
  ru_title: string;
  orig_title: string;
  imdb_id: string;
  kinopoisk_id: number;
  created: string;
  released: string;
  updated: string;
  iframe_src: string;
  iframe: string;
  year: string;
  content_type: string;
}

export interface ApiResponse {
  result: boolean;
  php: number;
  data: MediaItem[];
  current_page: number;
  from: number;
  to: number;
  per_page: number;
  last_page: number;
  first_page_url: string;
  last_page_url: string;
  next_page_url: string | null;
  prev_page_url: string | null;
  path: string;
  total: number;
  total_count: number;
}

export interface RatingResponse {
  kp_rating: string;
  imdb_rating: string;
}