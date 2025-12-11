import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hasher un mot de passe
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Vérifier un mot de passe
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  const result = await bcrypt.compare(password, hashedPassword);
  return result;
};

/**
 * Valider la force d'un mot de passe
 */
export const validatePasswordStrength = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

