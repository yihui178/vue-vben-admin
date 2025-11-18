import { eventHandler, readBody, createError } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';
import { mockCourses } from './page.get'; // 直接复用分页接口里的假数据

export default eventHandler(async (event) => {
  // 验证登录状态
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取请求体
  const body = await readBody(event);
  const { id, courseName, category, description, online, highlights } = body;

  // 参数校验
  if (!id) {
    throw createError({ statusCode: 400, message: '课程ID必传' });
  }
  if (!courseName || !category || !description || online === undefined || !highlights) {
    throw createError({ statusCode: 400, message: '所有字段均为必填项' });
  }
  if (courseName.length > 20) {
    throw createError({ statusCode: 400, message: '课程名称不能超过20字' });
  }
  if (description.length > 100) {
    throw createError({ statusCode: 400, message: '课程描述不能超过100字' });
  }

  // 查找课程并更新
  const index = mockCourses.findIndex((item) => item.id === Number(id) && !item.deleted);
  if (index === -1) {
    throw createError({ statusCode: 404, message: `未找到ID为 ${id} 的课程` });
  }

  mockCourses[index] = {
    ...mockCourses[index],
    courseName,
    category,
    description,
    online,
    highlights,
  };

  return useResponseSuccess({
    message: `课程 ${id} 更新成功（模拟）`,
    data: mockCourses[index],
  });
});
