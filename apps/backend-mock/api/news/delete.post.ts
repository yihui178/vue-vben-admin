import { eventHandler, readBody, createError } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import { mockNews } from './page.get';
export default eventHandler(async (event) => {
  // 验证登录状态
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  // 获取请求体数据
  const body = await readBody(event);
  const { id } = body;
  // 校验ID
  if (!id) {
    throw createError({ statusCode: 400, message: '新闻ID不能为空' });
  }
  // 查找新闻
  const index = mockNews.findIndex(item => item.id === id && !item.deleted);
  if (index === -1) {
    throw createError({ statusCode: 404, message: '新闻不存在' });
  }
  // 逻辑删除
  mockNews[index].deleted = true;
  // ✅ 返回成功响应
  return {
    code: 0,
    data: null,
    error: null,
    message: '删除成功',
  };
});
