export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

export const isSafeUrl = (url: string): boolean => {
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  
  try {
    const urlObj = new URL(url);
    return allowedProtocols.includes(urlObj.protocol);
  } catch {
    return !url.startsWith('javascript:') && !url.startsWith('data:');
  }
};

export const isValidFileName = (fileName: string): boolean => {
  const dangerousChars = /[<>:"/\\|?*\x00-\x1F]/g;
  return !dangerousChars.test(fileName);
};

export const validateLength = (
  text: string,
  min: number,
  max: number
): boolean => {
  return text.length >= min && text.length <= max;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  message: string;
} => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: '비밀번호는 최소 6자 이상이어야 합니다.',
    };
  }

  if (password.length < 8) {
    return {
      isValid: true,
      message: '보안을 위해 8자 이상 권장합니다.',
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  if (strength < 2) {
    return {
      isValid: true,
      message: '대소문자, 숫자, 특수문자를 조합하면 더 안전합니다.',
    };
  }

  return {
    isValid: true,
    message: '강력한 비밀번호입니다.',
  };
};

export const sanitizeContent = (content: string): string => {
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized;
};

