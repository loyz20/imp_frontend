/**
 * Client-side validation helpers matching backend password policy.
 * Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit.
 */

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email) return 'Email wajib diisi.';
  if (!EMAIL_REGEX.test(email)) return 'Format email tidak valid.';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Password wajib diisi.';
  if (password.length < 8) return 'Password minimal 8 karakter.';
  if (!PASSWORD_REGEX.test(password))
    return 'Password harus mengandung huruf besar, huruf kecil, dan angka.';
  return null;
}

export function validateName(name) {
  if (!name) return 'Nama wajib diisi.';
  if (name.length < 2) return 'Nama minimal 2 karakter.';
  if (name.length > 100) return 'Nama maksimal 100 karakter.';
  return null;
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  const passErr = validatePassword(password);
  if (passErr) errors.password = passErr;
  return Object.keys(errors).length ? errors : null;
}

export function validateRegisterForm({ name, email, password }) {
  const errors = {};
  const nameErr = validateName(name);
  if (nameErr) errors.name = nameErr;
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  const passErr = validatePassword(password);
  if (passErr) errors.password = passErr;
  return Object.keys(errors).length ? errors : null;
}

export function validateForgotPasswordForm({ email }) {
  const errors = {};
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  return Object.keys(errors).length ? errors : null;
}
