import axios from "axios";
import { initializeApiFunctions } from "@/api";
import { flattenApiList } from "@/utils";

const { VITE_PUBLIC_PATH } = import.meta.env;

/**
 * @name 获取服务端配置
 * @param app vue实例
 * @returns 配置值
 */
export const getPlatformConfig = async (): Promise<undefined> => {
  const { data } = await axios.get(`${VITE_PUBLIC_PATH}staticApi.json`);
  initializeApiFunctions(flattenApiList(data));
};
