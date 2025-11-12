import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler((event) => {
  // 验证登录状态（可选，根据项目是否需要登录）
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 返回权限码数组
  return useResponseSuccess([
    "AC_100100",   // Super
    "AC_100010",   // Admin
    "AC_1000001",  // User
    "COURSE_ADD",  // 课程新增权限
    "COURSE_EDIT", // 课程编辑权限
    "COURSE_DEL"   // 课程删除权限
  ]);
});
