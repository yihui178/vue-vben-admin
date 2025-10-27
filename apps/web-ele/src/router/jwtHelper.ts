// src/utils/jwtHelper.ts（Token过期检测工具函数）
/**
 * 解析JWT中的过期时间（exp字段，秒级时间戳）
 * @param token 有效的JWT字符串
 * @returns 过期时间（毫秒级时间戳），解析失败返回null
 */
export function parseJwtExpiration(token: string): null | number {
  try {
    // 关键步骤1：拆分Token，先判断是否符合JWT格式（长度为3）
    const tokenParts = token.split('.');
    // 若拆分后不是3部分，直接返回null（视为无效Token）
    if (tokenParts.length !== 3) {
      console.warn(
        '无效JWT格式：Token必须包含3个部分（Header.Payload.Signature）',
      );
      return null;
    }

    // 关键步骤2：此时tokenParts[1]一定存在，无需担心undefined
    const payloadBase64 = tokenParts[1];
    if (!payloadBase64) {
      // 额外兜底：防止空字符串（极端场景）
      console.warn('JWT Payload部分为空');
      return null;
    }

    // 后续原有解析逻辑（不变）
    const decodedBase64 = payloadBase64
      .replaceAll('-', '+')
      .replaceAll('_', '/');
    const payloadJson = decodeURIComponent(
      atob(decodedBase64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    const payload = JSON.parse(payloadJson);
    return payload.exp ? payload.exp * 1000 : null; // 转为毫秒级时间戳
  } catch (error) {
    console.warn('解析JWT过期时间失败', error);
    return null;
  }
}

/**
 * 检测Token是否过期
 * @param token JWT字符串
 * @returns true=过期/无效，false=未过期
 */
export function isTokenExpired(token: string): boolean {
  const expTime = parseJwtExpiration(token);
  if (!expTime) return true; // 解析失败视为过期
  const currentTime = Date.now(); // 当前时间（毫秒级）
  return currentTime > expTime; // 当前时间 > 过期时间 → 过期
}
