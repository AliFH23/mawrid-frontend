// requires at least 8 characters, one uppercase letter, one lowercase letter, and one number.
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const PASSWORD_HINT = 'كلمة المرور لازم تكون 8 أحرف على الأقل، وتحتوي على حرف كبير وحرف صغير ورقم واحد على الأقل';

export function isPasswordStrong(password) {
  return PASSWORD_REGEX.test(password);
}