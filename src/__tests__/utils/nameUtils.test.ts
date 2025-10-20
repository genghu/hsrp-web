import {
  splitChineseName,
  formatName,
  hasChineseCharacters,
  detectNameLocale,
  getFullName,
  hasCompoundSurname
} from '../../utils/nameUtils';

describe('Name Utilities', () => {
  describe('hasCompoundSurname', () => {
    it('should detect compound surnames', () => {
      expect(hasCompoundSurname('欧阳修')).toBe(true);
      expect(hasCompoundSurname('司马迁')).toBe(true);
      expect(hasCompoundSurname('诸葛亮')).toBe(true);
      expect(hasCompoundSurname('上官婉儿')).toBe(true);
    });

    it('should return false for single-character surnames', () => {
      expect(hasCompoundSurname('张三')).toBe(false);
      expect(hasCompoundSurname('李四')).toBe(false);
      expect(hasCompoundSurname('王五')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(hasCompoundSurname('')).toBe(false);
      expect(hasCompoundSurname('欧')).toBe(false);
    });
  });

  describe('splitChineseName', () => {
    it('should split single-character surname names correctly', () => {
      expect(splitChineseName('张三')).toEqual({ lastName: '张', firstName: '三' });
      expect(splitChineseName('李明')).toEqual({ lastName: '李', firstName: '明' });
      expect(splitChineseName('王小明')).toEqual({ lastName: '王', firstName: '小明' });
    });

    it('should split compound surname names correctly', () => {
      expect(splitChineseName('欧阳修')).toEqual({ lastName: '欧阳', firstName: '修' });
      expect(splitChineseName('司马迁')).toEqual({ lastName: '司马', firstName: '迁' });
      expect(splitChineseName('诸葛亮')).toEqual({ lastName: '诸葛', firstName: '亮' });
      expect(splitChineseName('上官婉儿')).toEqual({ lastName: '上官', firstName: '婉儿' });
      expect(splitChineseName('东方不败')).toEqual({ lastName: '东方', firstName: '不败' });
    });

    it('should handle edge cases', () => {
      expect(splitChineseName('')).toEqual({ lastName: '', firstName: '' });
      expect(splitChineseName('李')).toEqual({ lastName: '李', firstName: '' });
      expect(splitChineseName('  张三  ')).toEqual({ lastName: '张', firstName: '三' });
    });
  });

  describe('formatName', () => {
    it('should format Chinese names correctly', () => {
      expect(formatName('三', '张', 'zh')).toBe('张三');
      expect(formatName('明', '李', 'zh')).toBe('李明');
      expect(formatName('修', '欧阳', 'zh')).toBe('欧阳修');
    });

    it('should format English names correctly', () => {
      expect(formatName('John', 'Smith', 'en')).toBe('John Smith');
      expect(formatName('Jane', 'Doe', 'en')).toBe('Jane Doe');
    });

    it('should default to English format', () => {
      expect(formatName('John', 'Smith')).toBe('John Smith');
    });

    it('should handle empty values', () => {
      expect(formatName('', 'Smith', 'en')).toBe('Smith');
      expect(formatName('John', '', 'en')).toBe('John');
      expect(formatName('', '张', 'zh')).toBe('张');
      expect(formatName('三', '', 'zh')).toBe('三');
    });
  });

  describe('hasChineseCharacters', () => {
    it('should detect Chinese characters', () => {
      expect(hasChineseCharacters('张三')).toBe(true);
      expect(hasChineseCharacters('李明')).toBe(true);
      expect(hasChineseCharacters('Hello 世界')).toBe(true);
    });

    it('should return false for non-Chinese text', () => {
      expect(hasChineseCharacters('John Smith')).toBe(false);
      expect(hasChineseCharacters('123')).toBe(false);
      expect(hasChineseCharacters('')).toBe(false);
    });
  });

  describe('detectNameLocale', () => {
    it('should detect Chinese locale', () => {
      expect(detectNameLocale('三', '张')).toBe('zh');
      expect(detectNameLocale('明', '李')).toBe('zh');
      expect(detectNameLocale('修', '欧阳')).toBe('zh');
    });

    it('should detect English locale', () => {
      expect(detectNameLocale('John', 'Smith')).toBe('en');
      expect(detectNameLocale('Jane', 'Doe')).toBe('en');
    });
  });

  describe('getFullName', () => {
    it('should format Chinese names with detected locale', () => {
      expect(getFullName('三', '张')).toBe('张三');
      expect(getFullName('明', '李')).toBe('李明');
      expect(getFullName('修', '欧阳')).toBe('欧阳修');
    });

    it('should format English names with detected locale', () => {
      expect(getFullName('John', 'Smith')).toBe('John Smith');
      expect(getFullName('Jane', 'Doe')).toBe('Jane Doe');
    });
  });
});
