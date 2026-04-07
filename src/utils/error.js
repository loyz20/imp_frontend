/**
 * Parse API error response into a user-friendly message.
 */
export function getErrorMessage(error) {
  // Network / timeout
  if (!error.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }

  const { status, data } = error.response;

  // Field-level validation errors
  if (data?.errors?.length) {
    return data.errors.map((e) => e.message).join('. ');
  }

  // Server-provided message
  if (data?.message) {
    return data.message;
  }

  // Fallback by status
  const fallback = {
    400: 'Permintaan tidak valid.',
    401: 'Email atau password salah.',
    403: 'Akses ditolak.',
    404: 'Data tidak ditemukan.',
    409: 'Data sudah ada.',
    422: 'Validasi gagal. Periksa kembali input Anda.',
    429: 'Terlalu banyak percobaan. Silakan coba beberapa saat lagi.',
    500: 'Terjadi kesalahan pada server.',
  };

  return fallback[status] || 'Terjadi kesalahan yang tidak diketahui.';
}
