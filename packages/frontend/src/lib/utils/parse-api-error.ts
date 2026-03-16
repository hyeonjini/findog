interface ApiErrorData {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
}

export function parseApiError(error: unknown): string {
  if (error && typeof error === 'object') {
    const res = (error as { response?: { data?: ApiErrorData } }).response
      ?.data;
    if (res) {
      if (typeof res.detail === 'string') return res.detail;
      if (Array.isArray(res.detail) && res.detail.length > 0) {
        return res.detail
          .map((d) => d.msg)
          .filter(Boolean)
          .join(', ');
      }
      if (res.message) return res.message;
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}
