import { store } from "@/store";
import { deviceDetection, storageLocal } from "@pureadmin/utils";
import type { appType } from "./types";
import { apiFnList } from "@/api";
import { usePublicStoreHook } from "./public";
import router from "@/router";

/**
 * 应用程序状态模块
 */
export const useAppStore = defineStore({
  id: "Iot-app",
  state: (): appType => ({
    device: deviceDetection() ? "mobile" : "desktop",
    serial: "",
    version: "",
    client_serial: "",
    address: storageLocal().getItem("address"),
  }),
  getters: {
    /**
     * 获取设备类型
     * @returns 设备类型
     */
    getDevice(): string {
      return this.device;
    },

    /**
     * 获取序列号
     * @returns 序列号
     */
    getSerial(): string {
      return this.serial;
    },

    /**
     * 获取版本号
     * @returns 版本号
     */
    getVersion(): string {
      return this.version;
    },

    /**
     * 获取客户端序列号
     * @returns 客户端序列号
     */
    getClientSerial(): string {
      return this.client_serial;
    },

    /**
     * 获取地址信息。
     * @returns 地址信息。
     */
    getAddress(): string {
      return this.address;
    },
  },
  actions: {
    /**
     * 设置序列号
     * @param serial 序列号
     */
    async setSerial(serial: string): Promise<void> {
      apiFnList
        .getAsyncApiHuaersiSerialGetBankId({ serial })
        .then(({ data }) => {
          this.serial = serial;
          const userInfo = {
            bankId: data.id,
            bankName: data.nickname,
            serial,
          };
          storageLocal().setItem("user-info", userInfo);
          router.push("/");
        });
    },
    /**
     * 设置版本号
     * @param version 版本号
     */
    setVersion(version: string): void {
      this.version = version;
    },
    /**
     * 设置客户端序列号
     * @param client_serial 客户端序列号
     */
    setClientSerial(client_serial: string): void {
      this.client_serial = client_serial;
    },
    /**
     * 设置地址
     * @param address 地址
     */
    setAddress(address: string): void {
      this.address = address;
      storageLocal().setItem("address", address);
      usePublicStoreHook().getWeather();
    },
  },
});

export function useAppStoreHook() {
  return useAppStore(store);
}
