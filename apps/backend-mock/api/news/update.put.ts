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
  const { id, newsName, newsContent, newsCategory, newsDescription, hasImage, imageUrl,newsTags } = body;
  // 校验ID
  if (!id) {
    throw createError({ statusCode: 400, message: '新闻ID不能为空' });
  }
  // 查找新闻
  const index = mockNews.findIndex(item => item.id === id && !item.deleted);
  if (index === -1) {
    throw createError({ statusCode: 404, message: '新闻不存在' });
  }
  // 校验必填字段
  if (!newsName || !newsContent || !newsCategory?.length || 
      !newsDescription || hasImage === undefined || !newsTags?.length) {
    throw createError({ statusCode: 400, message: '所有字段均为必填项' });
  }
  // 校验字段长度
  if (newsName.length > 20) {
    throw createError({ statusCode: 400, message: '新闻名称不能超过20个字' });
  }
  if (newsContent.length > 200) {
    throw createError({ statusCode: 400, message: '新闻内容不能超过200个字' });
  }
  // 更新数据
  mockNews[index] = {
    ...mockNews[index],
    newsName,
    newsContent,
    newsCategory,
    newsDescription,
    hasImage,
    imageUrl: imageUrl || '',
    newsTags,
  };
  // ✅ 返回成功响应
  return {
    code: 0,
    data: null,
    error: null,
    message: '更新成功',
  };
});
