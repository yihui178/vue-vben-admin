// types.ts
/**
 * 会员接口定义
 */
export interface Member {
  id: number | null;
  userId: number | null;
  memberName: string;
  phone: string;
  idCard: string;
  gender: string;
  joinDate: string;
  motorcycleBrand: string;
  motorcycleModel: string;
  plateNumber: string;
  address: string;
  remark: string;
}
/**
 * 性别选项
 */
export const GENDER_OPTIONS = [
  { label: '男', value: '男' },
  { label: '女', value: '女' }
];
/**
 * 获取今天的日期字符串（YYYY-MM-DD）
 * 明确返回类型为 string
 */
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
/**
 * 创建默认会员对象（每次返回新对象）
 * 明确返回类型为 Member
 */
export const createDefaultMember = (): Member => ({
  id: null,
  userId: null,
  memberName: '',
  phone: '',
  idCard: '',
  gender: '男',
  joinDate: getTodayDate(),
  motorcycleBrand: '',
  motorcycleModel: '',
  plateNumber: '',
  address: '',
  remark: ''
});
/**
 * 默认会员数据（向后兼容）
 */
export const DEFAULT_MEMBER: Member = createDefaultMember();
