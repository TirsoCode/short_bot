export interface MediaItem {
  id: string;
  name: string;
  path: string;
  type: 'video' | 'image';
  size: number;
  sha: string;
  url: string;
  downloadedPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HookPhrase {
  id: string;
  text: string;
  isActive: boolean;
  createdAt: string;
}

export interface Short {
  id: string;
  hookId: string;
  hookText: string;
  mediaIds: string[];
  title: string;
  description: string;
  tags: string[];
  status: 'draft' | 'rendering' | 'rendered' | 'accepted' | 'rejected' | 'uploading' | 'published' | 'failed';
  renderedPath?: string;
  duration?: number;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  errorMessage?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubPaths: string[];
  githubToken: string;
  mediaPaths: string[];
  youtubeClientId: string;
  youtubeClientSecret: string;
  youtubeRefreshToken?: string;
  syncIntervalMinutes: number;
  maxShortDuration: number;
  videoWidth: number;
  videoHeight: number;
  videoFps: number;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

export type ShortStatus = Short['status'];

export interface SyncResult {
  success: boolean;
  newMediaCount: number;
  errors: string[];
}

export interface RenderJob {
  id: string;
  shortId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputPath?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}