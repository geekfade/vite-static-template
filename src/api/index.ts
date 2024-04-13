import { http } from "@/utils/http";
import type { AxiosRequestConfig } from "axios";
import type { IotHttpRequestConfig } from "@/utils/http/types";

export const apiFnList: Record<
  string,
  (data?: any, config?: IotHttpRequestConfig) => Promise<any>
> = reactive({});
export const cancelFunc: Record<string, any> = reactive({});
export const baseApiList: Record<string, string> = {};

/**
 * 根据环境模式处理接口URL。
 * 如果模式为"development"，则将VITE_BASE_URL附加到每个URL值上。
 * 否则，返回原始的URL对象。
 *
 * @param url - 要处理的URL对象。
 * @returns 处理后的URL对象。
 */
export const processingInterface = (
  url: Record<string, string>,
): Record<string, string> => {
  const { VITE_BASE_URL, VITE_IOT_BASE_URL, VITE_BASE_PORT, MODE } = import.meta
    .env;
  if (MODE === "development") {
    return Object.fromEntries(
      Object.entries(url).map(([key, value]) => [
        key,
        value.includes("lastdata")
          ? `${VITE_IOT_BASE_URL}:${VITE_BASE_PORT}${value}`
          : `${VITE_BASE_URL}${value}`,
      ]),
    );
  } else {
    return Object.fromEntries(
      Object.entries(url).map(([key, value]) => [
        key,
        value.includes("lastdata")
          ? `${VITE_IOT_BASE_URL}:${VITE_BASE_PORT}${value}`
          : `${VITE_BASE_URL}${value}`,
      ]),
    );
  }
};

/**
 * 获取配置 API 函数。
 * 此函数处理扁平化的 API 列表，将其分配给基本 API 列表，并为列表中的每个键创建 API 函数。
 * @returns {void}
 */
export const initializeApiFunctions = (apiList: Record<string, any>): void => {
  const list = processingInterface(apiList);
  Object.assign(baseApiList, list);
  Object.keys(list).forEach((key: string) => {
    apiFnList[key] = (
      data?: AxiosRequestConfig<any>,
      config?: IotHttpRequestConfig,
    ) => {
      return http.post(list[key], { data }, config);
    };
    cancelFunc[key] = () => {
      http.cancel(list[key]);
    };
  });
  console.log(apiFnList);
};
