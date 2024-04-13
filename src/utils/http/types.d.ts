import type {
  Method,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
} from "axios";

/**
 * @name 缓存类型
 */
export type resultType = {
  accessType?: string;
};

/**
 * @name 请求方法类型
 */
export type RequestMethods = Extract<
  Method,
  "get" | "post" | "put" | "delete" | "patch" | "option" | "head"
>;

/**
 * @name 请求配置类型
 */
export interface IotHttpError extends AxiosError {
  isCancelRequest?: boolean;
}

/**
 * @name 响应类型
 */
export interface IotHttpResponse extends AxiosResponse {
  config: IotHttpRequestConfig;
}

/**
 * @name 声明两个回调函数,无返回值
 */
export interface IotHttpRequestConfig extends AxiosRequestConfig {
  beforeRequestCallback?: (request: IotHttpRequestConfig) => void;
  beforeResponseCallback?: (response: IotHttpResponse) => void;
}

/**
 * @name 声明一个类，三个方法,返回值为Promise类型
 */
export default class IotHttp {
  request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig,
  ): Promise<T>;
  post<T, P>(
    url: string,
    params?: T,
    config?: PureHttpRequestConfig,
  ): Promise<P>;
  get<T, P>(
    url: string,
    params?: T,
    config?: PureHttpRequestConfig,
  ): Promise<P>;
}
