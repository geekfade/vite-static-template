import { store } from "@/store";
import { storageLocal } from "@pureadmin/utils";
import type { MqttOptions } from "types";
import type { userType } from "./types";
import { type DataInfo, userKey } from "@/utils/auth";
import { MqttService, MqttLocal } from "@/utils/mqtt";
import { emitter } from "@/utils/mitt";

/**
 * 用户信息
 */
export const useUserStore = defineStore({
  id: "iot-user",
  state: (): userType => ({
    // 网点名称
    bankName: storageLocal().getItem<DataInfo>(userKey)?.bankName ?? "",
    // 网点ID
    bankId: storageLocal().getItem<DataInfo>(userKey)?.bankId,
    // 序列号
    serial: storageLocal().getItem<DataInfo>(userKey)?.serial,
    // mqtt 客户端ID
    mqttClientId: "mqtt_local_iot_general3_",
    // mqtt 服务
    mqttService: null,
    // mqtt 本地
    mqttLocal: null,
  }),
  actions: {
    /**
     * 设置银行名称。
     * @param bankName - 银行名称。
     */
    SET_BANK_NAME(bankName: string) {
      this.bankName = bankName;
    },
    /**
     * 设置银行ID
     * @param bankId 银行ID
     */
    SET_BANK_ID(bankId: number) {
      this.bankId = bankId;
    },
    /**
     * 设置序列号
     * @param {string} serial - 序列号
     */
    SET_SERIAL(serial: string) {
      this.serial = serial;
    },

    /**
     * 连接到 MQTT 服务器。
     */
    connectMqtt(): void {
      const {
        VITE_COMM_MQTT_HOSTNAME,
        VITE_COMM_MQTT_PORT,
        VITE_COMM_MQTT_PROTOCOL,
        VITE_COMM_MQTT_PATH,
        VITE_COMM_MQTT_USERNAME,
        VITE_COMM_MQTT_PASSWORD,
      } = import.meta.env;
      const options: MqttOptions = {
        hostname: VITE_COMM_MQTT_HOSTNAME,
        port: VITE_COMM_MQTT_PORT,
        protocol: VITE_COMM_MQTT_PROTOCOL,
        path: VITE_COMM_MQTT_PATH,
        clientId:
          this.mqttClientId +
          this.bankId +
          "_" +
          this.serial +
          "_" +
          Math.ceil(Math.random() * 1000),
        username: VITE_COMM_MQTT_USERNAME,
        password: VITE_COMM_MQTT_PASSWORD,
      };
      this.mqttService = new MqttService(options);
      this.mqttService.connect();
    },

    /**
     * 断开 MQTT 连接。
     */
    disconnectMqtt(): void {
      if (this.mqttService) {
        this.mqttService.disconnect();
        this.mqttService = null;
      }
    },

    /**
     * 连接到本地 MQTT 服务器。
     */
    connectLocal(): void {
      const {
        VITE_IOT_MQTT_HOSTNAME,
        VITE_IOT_MQTT_PORT,
        VITE_IOT_MQTT_PROTOCOL,
        VITE_IOT_MQTT_PATH,
        VITE_IOT_MQTT_USERNAME,
        VITE_IOT_MQTT_PASSWORD,
      } = import.meta.env;
      const options: MqttOptions = {
        hostname: VITE_IOT_MQTT_HOSTNAME,
        port: VITE_IOT_MQTT_PORT,
        protocol: VITE_IOT_MQTT_PROTOCOL,
        path: VITE_IOT_MQTT_PATH,
        clientId:
          this.mqttClientId +
          this.bankId +
          "_" +
          this.serial +
          "_" +
          Math.ceil(Math.random() * 1000),
        username: VITE_IOT_MQTT_USERNAME,
        password: VITE_IOT_MQTT_PASSWORD,
      };
      this.mqttLocal = new MqttLocal(options, (topic: any, message: string) => {
        const data = JSON.parse(message);
        emitter.emit("mqttPayload", { topic, data });
      });
      this.mqttLocal.connectAndOperate();
    },

    /**
     * 断开本地 MQTT 连接。
     */
    disconnectLocal(): void {
      if (this.mqttLocal) {
        this.mqttLocal.disconnect();
        this.mqttLocal = null;
      }
    },
  },
});

export function useUserStoreHook() {
  return useUserStore(store);
}
