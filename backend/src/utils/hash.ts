import bcrypt from 'bcryptjs';

/**
 * Утилиты для хеширования паролей
 */
export class HashUtils {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Хеширование пароля
   * @param password - пароль для хеширования
   * @returns хешированный пароль
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Ошибка при хешировании пароля');
    }
  }

  /**
   * Проверка пароля
   * @param password - исходный пароль
   * @param hash - хешированный пароль
   * @returns результат сравнения
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Ошибка при сравнении пароля');
    }
  }

  /**
   * Генерация случайной соли
   * @param rounds - количество раундов
   * @returns соль
   */
  static async generateSalt(rounds: number = this.SALT_ROUNDS): Promise<string> {
    try {
      return await bcrypt.genSalt(rounds);
    } catch (error) {
      throw new Error('Ошибка при генерации соли');
    }
  }

  /**
   * Проверка валидности хеша
   * @param hash - хеш для проверки
   * @returns true если хеш валиден
   */
  static isValidHash(hash: string): boolean {
    // Проверяем формат bcrypt хеша
    const bcryptRegex = /^\$2[aby]?\$\d+\$.{53}$/;
    return bcryptRegex.test(hash);
  }

  /**
   * Получение информации о хеше
   * @param hash - хеш для анализа
   * @returns информация о хеше
   */
  static getHashInfo(hash: string): { version: string; rounds: number; valid: boolean } {
    if (!this.isValidHash(hash)) {
      return { version: 'unknown', rounds: 0, valid: false };
    }

    const parts = hash.split('$');
    return {
      version: parts[1] || 'unknown',
      rounds: parseInt(parts[2]) || 0,
      valid: true
    };
  }
}

export default HashUtils;