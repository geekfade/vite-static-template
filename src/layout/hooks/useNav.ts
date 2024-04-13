import { useUserStoreHook } from "@/store/modules/user";

/**
 * 使用导航的自定义钩子。
 */
export function useNav() {
  /**
   * 获取银行名称。
   * @returns 银行名称。
   */
  const bankName = computed(() => {
    return useUserStoreHook().bankName;
  });

  /**
   * 获取银行ID。
   * @returns 银行ID。
   */
  const bankId = computed(() => {
    return useUserStoreHook().bankId;
  });

  /**
   * 获取用户的序列号。
   * @returns 用户的序列号。
   */
  const serial = computed(() => {
    return useUserStoreHook().serial;
  });

  return {
    bankName,
    bankId,
    serial,
  };
}
