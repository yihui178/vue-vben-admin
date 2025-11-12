import { eventHandler, readBody, createError } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';
import { mockCourses } from './page.get'; // 引入模拟数据（需调整page.get.ts的导出方式）

export default eventHandler(async (event) => {
  // 验证登录状态
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取请求体数据
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({ statusCode: 400, message: "课程ID必传" });
  }

  // 模拟逻辑删除（更新deleted字段为true）
  const course = mockCourses.find(item => item.id === Number(id));
  if (course) {
    course.deleted = true;
  }

  return useResponseSuccess({
    message: `课程 ${id} 已逻辑删除（模拟）`,
  });
});
