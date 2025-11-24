import { eventHandler, readBody, createError } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import { mockNews } from './page.get';
let nextId = 9;
export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  const body = await readBody(event);
  
  // ✅ 明确解构所有字段
  const { 
    newsName, 
    newsContent, 
    newsCategory, 
    newsDescription, 
    hasImage, 
    imageUrl,  // ✅ 确保在这里声明
    newsTags 
  } = body;
  if (!newsName || !newsContent || !newsCategory?.length || 
      !newsDescription || hasImage === undefined || !newsTags?.length) {
    throw createError({ statusCode: 400, message: '所有字段均为必填项' });
  }
  if (newsName.length > 20) {
    throw createError({ statusCode: 400, message: '新闻名称不能超过20个字' });
  }
  if (newsContent.length > 200) {
    throw createError({ statusCode: 400, message: '新闻内容不能超过200个字' });
  }
  const newNews = {
    id: nextId++,
    newsName,
    newsContent,
    newsCategory,
    newsDescription,
    hasImage,
    imageUrl: imageUrl || '', // ✅ 现在不会报错了
    newsTags,
    deleted: false,
  };
  mockNews.push(newNews);
  return {
    code: 0,
    data: null,
    error: null,
    message: '新增成功',
  };
});
