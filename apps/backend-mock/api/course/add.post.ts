import { eventHandler, readBody, createError } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  // 验证登录状态
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取请求体数据
  const body = await readBody(event);
  const { courseName, category, description, online, highlights } = body;

  // 校验必填字段
  if (!courseName || !category || !description || online === undefined || !highlights) {
    throw createError({ statusCode: 400, message: "所有字段均为必填项" });
  }
  if (courseName.length > 20) {
    throw createError({ statusCode: 400, message: "课程名称不能超过20字" });
  }
  if (description.length > 100) {
    throw createError({ statusCode: 400, message: "课程描述不能超过100字" });
  }

  // 模拟新增成功（实际项目中可在这里添加数据到mock数组）
  return useResponseSuccess({
    message: "新增成功（模拟）",
  });
});
