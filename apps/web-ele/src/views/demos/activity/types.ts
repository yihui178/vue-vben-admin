/**
 * 活动接口定义
 */
export interface Activity {
  id: number | null;
  activityName: string;
  activityType: string;
  description: string;
  startTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  contactPerson: string;
  contactPhone: string;
}

/**
 * 活动报名接口定义
 */
export interface ActivityEnrollment {
  id: number | null;
  activityId: number;
  memberId: number | null;
  memberName: string;
  memberPhone: string;
  enrollmentStatus: string;
  enrollmentTime: string;
  remark: string;
  activityName?: string;
  // ✅ 新增字段
  enrollmentType?: string; // training | activity
  courseId?: number;
  courseName?: string;
}

/**
 * 活动类型选项
 */
export const ACTIVITY_TYPE_OPTIONS = [
  { label: '骑行', value: '骑行' },
  { label: '聚会', value: '聚会' },
  { label: '培训', value: '培训' },
  { label: '比赛', value: '比赛' },
];
export const ENROLLMENT_TYPE = {
  TRAINING: 'training', // 固定培训课程
  ACTIVITY: 'activity', // 临时活动
} as const;
/**
 * 报名状态选项
 */
export const ENROLLMENT_STATUS_OPTIONS = [
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已拒绝', value: 'REJECTED' },
];

/**
 * 创建默认活动对象
 */
export const createDefaultActivity = (): Activity => ({
  id: null,
  activityName: '',
  activityType: '骑行',
  description: '',
  startTime: '',
  location: '',
  maxParticipants: 0,
  currentParticipants: 0,
  contactPerson: '',
  contactPhone: '',
});
