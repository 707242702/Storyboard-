
export interface StoryboardItem {
  timestamp: string;
  duration: string;
  shotType: string;
  cameraMovement: string;
  description: string;
  action: string;
  lighting: string;
  reproductionPrompt: string;
  subtitles?: string; // Extracted text or dialogue
  thumbnail?: string; // Base64 thumbnail captured from video
}

export interface StoryboardResponse {
  title: string;
  summary: string;
  scenes: StoryboardItem[];
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  PREPARING = 'PREPARING',
  ANALYZING = 'ANALYZING',
  CAPTURING = 'CAPTURING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
