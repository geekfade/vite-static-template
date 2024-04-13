import dayjs from "dayjs";
import { Modal, message } from "ant-design-vue";
import { cloneDeep } from "@pureadmin/utils";
import { store } from "@/store";
import { apiFnList } from "@/api";
import { useAppStoreHook } from "./app";
import { useUserStoreHook } from "./user";
import { useNav } from "@/layout/hooks/useNav";

const { bankId, serial } = useNav();

export const usePublicStore = defineStore({
  id: "iot-public",
  state: () => ({
    time: dayjs().format("HH:mm"),
    date: dayjs().format("MM月DD日"),
    week: dayjs().format("dddd"),
    timeInterval: null as any,
    weather: [],
    lockScreenInfo: {
      is_auto: 0,
      autotime: 1,
      password: [],
    },
    sceneSetList: [],
    sceneList: [],
    taskList: [],
    funSortList: [],
    equipFunc: {},
    areaIds: "",
    envPayLoad: {
      deviceName: null,
      nickName: null,
      difference: {},
    },
    selectedKey: "lamplight",
  }),
  actions: {
    /**
     * 更新时间。
     */
    updateTime() {
      this.timeInterval = setInterval(() => {
        this.time = dayjs().format("HH:mm");
      }, 1000) as any;
    },

    /**
     * 停止计时器。
     */
    destroyTime() {
      clearInterval(this.timeInterval);
    },

    /**
     * 获取天气信息。
     */
    async getWeather() {
      const res = await apiFnList.getAsyncApiIotControlGetTianQi({
        city: useAppStoreHook().address,
      });
      if (res) {
        this.weather = res?.data
          .map((item: any, index: number) => index < 4 && item)
          .filter(Boolean);
      }
    },
    /**
     * 获取系统设置信息
     * @param params 请求参数
     */
    async getSystemSetting(params?: any): Promise<void> {
      const { status, data } = await apiFnList.getAsyncApiIotControlGetConfig({
        bank_id: bankId.value,
        serial: serial.value,
        ...params,
      });
      if (status === 200) {
        const { autotime, is_auto, quick_scene, fun_sort } = data;
        this.lockScreenInfo = {
          is_auto,
          autotime,
          password: [],
        };
        const list = Array.from({ length: 6 }, (_, i) => {
          return {
            data: JSON.parse(quick_scene)[i],
            visible: true,
          };
        });
        this.sceneSetList = cloneDeep(list);
        this.sceneList = cloneDeep(list);
        this.funSortList = JSON.parse(fun_sort).funSort;
        this.areaIds = JSON.parse(fun_sort).runArea;
        // this.selectedKey = this.funSortList[0].type_key;
        this.getEnvData(JSON.parse(fun_sort).DeviceName);
      }
    },

    async getEnvData(deviceName: string) {
      if (!deviceName) return;
      const { status, data } = await apiFnList.getAsyncApiLocalDetectionBox({
        DeviceName: deviceName,
      });
      if (status === 200) {
        const {
          DeviceName,
          Nickname,
          device_setting: { value },
        } = data && data[0];
        this.envPayLoad = {
          deviceName: DeviceName,
          nickName: Nickname,
          difference: JSON.parse(value) || {},
        };
      }
    },

    /**
     * 获取场景列表
     */
    async getSceneList() {
      const { status, data } = await apiFnList.getAsyncApiIotTaskGetTask({
        bank_id: bankId.value,
      });
      if (status === 200) {
        this.taskList = data;
      }
    },

    /**
     * 获取网关信息
     */
    async getGatewayInfo() {
      const { status, data } =
        await apiFnList.getAsyncApiIotDeviceGetBankGatewayInfo({
          bank_id: bankId.value,
        });
      if (status === 200) {
        const { mqttService } = useUserStoreHook().mqttLocal;
        data.map((item: string) => {
          mqttService.subscribe("v1/gateway/" + item + "/data");
          mqttService.subscribe("v1/gateway/" + item + "/event");
          mqttService.subscribe("v1/gateway/" + item + "/attributes/response");
        });
      }
    },

    /**
     * 执行场景
     * @param id 场景ID
     * @param title 场景标题
     */
    async executeScene(id: number, title: string) {
      Modal.confirm({
        title,
        centered: true,
        okText: "确认",
        cancelText: "取消",
        okButtonProps: {
          type: "default",
        },
        cancelButtonProps: {
          type: "default",
        },
        onOk: async () => {
          const { status } = await apiFnList.getAsyncApiLocalTaskRun({
            id,
          });
          if (status === 200) {
            message.success("执行成功");
          }
        },
      });
    },
  },
});

export function usePublicStoreHook() {
  return usePublicStore(store);
}
