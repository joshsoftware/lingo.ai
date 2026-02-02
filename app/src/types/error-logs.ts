export interface ErrorLog {
  id: number;
  endpoint: string;
  audio_file_name: string | null;
  audio_storage_path: string | null;
  translated_text: string | null;
  detected_language: string | null;
  error_type: string;
  error_message: string;
  error_traceback: string | null;
  failure_stage: string | null;
  preprocessing_logs_text: string | null;
  intent_data: unknown;
  created_at: string;
}

export interface ErrorStats {
  total_errors: number;
  by_failure_stage: Record<string, number>;
  top_error_types: Record<string, number>;
  by_endpoint: Record<string, number>;
}
