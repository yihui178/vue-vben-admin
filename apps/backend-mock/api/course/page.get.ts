import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

// 模拟课程数据
export const mockCourses = [
  {
    id: 1,
    courseName: "Java 入门",
    category: "Java",
    description: "适合零基础学习",
    online: true,
    highlights: ["老师教学生动"],
    deleted: false,
  },
  {
    id: 2,
    courseName: "Python 核心",
    category: "Python",
    description: "进阶提升课程",
    online: false,
    highlights: ["该课程有潜力", "个人爱好"],
    deleted: false,
  },
  {
    id: 3,
    courseName: "JavaScript 高级",
    category: "前端",
    description: "深入理解JS原理",
    online: true,
    highlights: ["性能优化", "设计模式"],
    deleted: false,
  },
];

export default eventHandler((event) => {
  // 验证登录状态
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取查询参数
  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const keyword = (query.keyword || "").toString().toLowerCase();

  // 筛选未删除的数据 + 模糊查询
  const filteredList = mockCourses
    .filter(item => !item.deleted)
    .filter(item => 
      item.courseName.toLowerCase().includes(keyword) || 
      item.description.toLowerCase().includes(keyword)
    );

  // 分页处理
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = filteredList.slice(start, end);

  return useResponseSuccess({
    page,
    pageSize,
    total: filteredList.length,
    records: paginatedList,
  });
});
