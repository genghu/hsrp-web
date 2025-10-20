/**
 * Utility functions for handling Chinese and Western names
 */

// Common two-character Chinese compound surnames
const COMPOUND_SURNAMES = [
  '欧阳', '司马', '上官', '诸葛', '东方', '皇甫', '尉迟', '公孙',
  '慕容', '令狐', '轩辕', '长孙', '宇文', '鲜于', '闾丘', '司徒',
  '司空', '太史', '端木', '呼延', '南宫', '钟离', '夏侯', '东郭'
];

/**
 * Detect if a name starts with a compound (two-character) surname
 */
export function hasCompoundSurname(fullName: string): boolean {
  if (!fullName || fullName.length < 2) return false;

  const firstTwoChars = fullName.substring(0, 2);
  return COMPOUND_SURNAMES.includes(firstTwoChars);
}

/**
 * Split Chinese full name into lastName (surname) and firstName (given name)
 * Handles both single-character and two-character compound surnames
 *
 * @param fullName - Full Chinese name (e.g., "张三" or "欧阳修")
 * @returns Object with lastName and firstName
 *
 * @example
 * splitChineseName("张三") // { lastName: "张", firstName: "三" }
 * splitChineseName("欧阳修") // { lastName: "欧阳", firstName: "修" }
 * splitChineseName("诸葛亮") // { lastName: "诸葛", firstName: "亮" }
 */
export function splitChineseName(fullName: string): { lastName: string; firstName: string } {
  if (!fullName) {
    return { lastName: '', firstName: '' };
  }

  // Trim whitespace
  const trimmedName = fullName.trim();

  if (trimmedName.length === 0) {
    return { lastName: '', firstName: '' };
  }

  if (trimmedName.length === 1) {
    return { lastName: trimmedName, firstName: '' };
  }

  // Check for compound surname (2 characters)
  if (hasCompoundSurname(trimmedName)) {
    return {
      lastName: trimmedName.substring(0, 2),
      firstName: trimmedName.substring(2)
    };
  }

  // Default: single-character surname
  return {
    lastName: trimmedName.substring(0, 1),
    firstName: trimmedName.substring(1)
  };
}

/**
 * Format name for display based on locale
 *
 * @param firstName - First name / Given name
 * @param lastName - Last name / Surname
 * @param locale - Locale code ('zh' for Chinese, 'en' for English)
 * @returns Formatted full name
 *
 * @example
 * formatName("三", "张", "zh") // "张三"
 * formatName("John", "Smith", "en") // "John Smith"
 * formatName("修", "欧阳", "zh") // "欧阳修"
 */
export function formatName(firstName: string, lastName: string, locale: 'zh' | 'en' = 'en'): string {
  if (locale === 'zh') {
    // Chinese: LastName + FirstName (no space)
    return `${lastName}${firstName}`;
  } else {
    // English: FirstName + LastName (with space)
    return `${firstName} ${lastName}`.trim();
  }
}

/**
 * Detect if a string contains Chinese characters
 */
export function hasChineseCharacters(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Auto-detect locale based on name content
 * Returns 'zh' if name contains Chinese characters, otherwise 'en'
 */
export function detectNameLocale(firstName: string, lastName: string): 'zh' | 'en' {
  const fullName = firstName + lastName;
  return hasChineseCharacters(fullName) ? 'zh' : 'en';
}

/**
 * Get formatted full name with auto-detected locale
 */
export function getFullName(firstName: string, lastName: string): string {
  const locale = detectNameLocale(firstName, lastName);
  return formatName(firstName, lastName, locale);
}
