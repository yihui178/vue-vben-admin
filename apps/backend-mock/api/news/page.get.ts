import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';
// 模拟新闻数据库
export const mockNews = [
  {
    id: 1,
    newsName: '全国两会召开',
    newsContent: '2025年全国两会在北京隆重召开，代表们齐聚一堂，共商国是。本次会议将持续7天，聚焦经济发展、民生保障等重大议题。',
    newsCategory: ['国内新闻', '最新动态'],
    newsDescription: '本次会议聚焦民生热点，提出多项重要议案。',
    hasImage: true,
    imageUrl: 'https://picsum.photos/360/180?random=1',
    newsTags: ['动态', '国内'],
    deleted: false,
  },
  {
    id: 2,
    newsName: '本地交通新规实施',
    newsContent: '本市新交通规则正式生效，市民需注意出行变化。新规包括早晚高峰限行时段调整、停车费标准调整等内容。',
    newsCategory: ['本地新闻'],
    newsDescription: '新规包括限行时段调整、停车费调整等。',
    hasImage: false,
    imageUrl: '',
    newsTags: ['动态'],
    deleted: false,
  },
  {
    id: 3,
    newsName: '国际油价波动',
    newsContent: '受地缘政治影响，国际原油价格出现大幅波动。布伦特原油期货价格上涨3.5%，WTI原油期货上涨4.2%。',
    newsCategory: ['国际信息'],
    newsDescription: '专家分析称未来油价走势仍存不确定性。',
    hasImage: true,
    imageUrl: 'https://picsum.photos/360/180?random=3',
    newsTags: ['国际'],
    deleted: false,
  },
  {
    id: 4,
    newsName: '新游戏《星际征途》上线',
    newsContent: '备受期待的太空探索游戏今日全球发布。游戏采用虚幻5引擎打造，支持光线追踪技术，画面震撼。',
    newsCategory: ['游戏新闻'],
    newsDescription: '游戏采用虚幻5引擎，画面震撼。',
    hasImage: true,
    imageUrl: 'https://picsum.photos/360/180?random=4',
    newsTags: ['游戏'],
    deleted: false,
  },
  {
    id: 5,
    newsName: '军事演习圆满结束',
    newsContent: '我国东部海域联合军事演习圆满结束。此次演习展示了我军现代化装备水平，检验了联合作战能力。',
    newsCategory: ['国内新闻', '最新动态'],
    newsDescription: '此次演习展示了我军现代化装备水平。',
    hasImage: true,
    imageUrl: 'https://picsum.photos/360/180?random=5',
    newsTags: ['动态', '国内', '军事'],
    deleted: false,
  },
  {
    id: 6,
    newsName: '本地楼市新政发布',
    newsContent: '本市住建局发布楼市调控新政，涉及限购、限贷等多项内容。新政将于下月起正式实施，旨在稳定房价。',
    newsCategory: ['本地新闻'],
    newsDescription: '新政涉及限购、限贷等多项措施。',
    hasImage: false,
    imageUrl: '',
    newsTags: ['动态'],
    deleted: false,
  },
  {
    id: 7,
    newsName: '联合国气候大会召开',
    newsContent: '第28届联合国气候变化大会在阿联酋迪拜召开，各国代表就减排目标展开讨论。',
    newsCategory: ['国际信息'],
    newsDescription: '各国承诺加大减排力度，应对气候变化。',
    hasImage: true,
    imageUrl: 'https://picsum.photos/360/180?random=7',
    newsTags: ['国际'],
    deleted: false,
  },
  {
    id: 8,
    newsName: '热门手游迎来周年庆',
    newsContent: '知名手游《王者荣耀》迎来7周年庆典，推出限定皮肤和丰富活动。玩家参与度创历史新高。',
    newsCategory: ['游戏新闻', '最新动态'],
    newsDescription: '周年庆活动丰富，玩家热情高涨。',
    hasImage: true,
    imageUrl: 'https://picsum.photos/360/180?random=8',
    newsTags: ['游戏', '动态'],
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
  const pageSize = Number(query.pageSize) || 5;
  const keyword = (query.keyword || '').toString().toLowerCase();
  const category = (query.category || '').toString();
  // 筛选未删除的数据 + 关键词 + 分类
  const filteredList = mockNews
    .filter(item => !item.deleted)
    .filter(item => {
      // 关键词模糊查询
      const matchKeyword = !keyword || 
        item.newsName.toLowerCase().includes(keyword) || 
        item.newsContent.toLowerCase().includes(keyword);
      
      // 分类精确匹配
      const matchCategory = !category || 
        item.newsCategory.includes(category);
      
      return matchKeyword && matchCategory;
    });
  // 分页处理
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = filteredList.slice(start, end);
  // ✅ 使用你的 useResponseSuccess 格式
  return useResponseSuccess({
    list: paginatedList,
    total: filteredList.length,
    pageNum: page,
    pageSize,
    pages: Math.ceil(filteredList.length / pageSize),
  });
});
