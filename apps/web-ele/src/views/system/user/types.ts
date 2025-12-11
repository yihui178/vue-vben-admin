// types.ts 类型定义和常量
/**
 * 用户接口定义
 */
export interface User {
  id: number | null;
  name: string;
  password: string;
  age: number | null;
  email: string;
  role: string;
}
/**
 * 角色选项接口
 */
export interface RoleOption {
  label: string;
  value: string;
}
/**
 * 角色选项常量
 */
export const ROLE_OPTIONS: RoleOption[] = [
  { label: '超级管理员', value: 'super' },
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' }
];
/**
 * 默认用户数据
 */
export const DEFAULT_USER: User = {
  id: null,
  name: '',
  password: '',
  age: null,
  email: '',
  role: 'user'
};
/**
 * 角色标签类型映射
 */
export const ROLE_TAG_TYPE_MAP: Record<string, string> = {
  super: 'danger',
  admin: 'warning',
  user: 'success'
};
