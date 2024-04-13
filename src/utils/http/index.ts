import Axios, {
  type AxiosRequestConfig,
  type AxiosInstance,
  type CustomParamsSerializer,
  type CancelTokenSource,
} from "axios";
import type {
  IotHttpError,
  RequestMethods,
  IotHttpResponse,
  IotHttpRequestConfig,
} from "./types.d";
import { stringify } from "qs";

const defaultConfig: AxiosRequestConfig = {
  headers: {},
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer,
  },
};

class IotHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }
  // 保存所有的取消令牌
  private cancelTokenMap: Map<string, CancelTokenSource> = new Map();

  // 初始化配置对象
  private static initConfig: IotHttpRequestConfig = {};

  // 保存当前axios实例
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /**
   * 设置请求的HTTP拦截器。
   */
  private httpInterceptorsRequest(): void {
    IotHttp.axiosInstance.interceptors.request.use(
      async (config: IotHttpRequestConfig): Promise<any> => {
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (IotHttp.initConfig.beforeRequestCallback) {
          IotHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        return new Promise((resolve) => {
          resolve(config);
        });
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  /**
   * 设置HTTP客户端的响应拦截器。
   * 此方法负责在返回给调用者之前处理响应。
   */
  private httpInterceptorsResponse(): void {
    const instance = IotHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: IotHttpResponse) => {
        const $config = response.config;
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (IotHttp.initConfig.beforeResponseCallback) {
          IotHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      (error: IotHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      },
    );
  }

  /**
   * @name 发送HTTP请求。
   * @template T - 响应数据的类型。
   * @param method - 请求的HTTP方法。
   * @param url - 发送请求的URL。
   * @param param - 额外的Axios请求配置。
   * @param axiosConfig - 额外的IotHttpRequest配置。
   * @returns 一个Promise，解析为响应数据。
   */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: IotHttpRequestConfig,
  ): Promise<T> {
    const source = Axios.CancelToken.source();
    const config = {
      method,
      url,
      cancelToken: source.token,
      ...param,
      ...axiosConfig,
    } as IotHttpRequestConfig;
    // 保存取消令牌
    this.cancelTokenMap.set(url, source);

    return new Promise((resolve, reject) => {
      IotHttp.axiosInstance
        .request(config)
        .then((data: any) => {
          // 请求成功后，移除保存的取消令牌
          this.cancelTokenMap.delete(url);
          if (data.code === 1 || data.status == 200 || data) {
            resolve(data);
          } else {
            reject(data);
          }
        })
        .catch((err) => {
          // 请求失败后，移除保存的取消令牌
          this.cancelTokenMap.delete(url);
          reject(err);
        });
    });
  }

  /**
   * @name 取消指定URL的请求。
   * @param url - 要取消的请求的URL。
   */
  public cancel(url: string): void {
    const source = this.cancelTokenMap.get(url);
    if (source) {
      source.cancel("Request canceled.");
      this.cancelTokenMap.delete(url);
    }
  }

  /**
   * @name 发送 POST 请求
   * @param url 请求的 URL
   * @param params 请求的参数
   * @param config 请求的配置
   * @returns 返回一个 Promise 对象，包含请求的结果
   */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: IotHttpRequestConfig,
  ): Promise<P> {
    return this.request<P>("post", url, params, config);
  }

  /**
   * @name 发起 GET 请求
   * @param url 请求的 URL
   * @param params 请求参数
   * @param config 请求配置
   * @returns 返回一个 Promise，包含请求的结果
   */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: IotHttpRequestConfig,
  ): Promise<P> {
    return this.request<P>("get", url, params, config);
  }
}

export const http = new IotHttp();
