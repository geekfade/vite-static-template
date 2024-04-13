import { emitter } from "@/utils/mitt";
import {
  equipmentMap,
  filterDeviceStatus,
  getMqttResPayload,
  getOfflineDevices,
  handleEquipmentChange,
  selectedKey,
} from "../../utils";
import { Modal, message } from "ant-design-vue";
import { useUserStoreHook } from "@/store/modules/user";
import { cancelFunc } from "@/api";
import { getImageUrl } from "@/utils";

export function useColumns() {
  const { mqttLocal } = useUserStoreHook();
  const params = reactive({
    areaIds: [0],
    loading: null,
  });

  const getDeviceStatusImage = computed(
    () =>
      ({
        offline,
        powerstate,
      }): {
        src: string;
        offlineUrl: string;
        offline: boolean;
        state: number;
      } => {
        const url = powerstate ? "screen_on" : "screen_off";
        return {
          src: getImageUrl(`equipment/${url}.png`),
          offlineUrl: getImageUrl("equipment/offline.svg"),
          offline,
          state: offline && powerstate ? 1 : 0,
        };
      },
  );

  const handleChangeAction = (
    tag: string,
    row: {
      id?: number;
      powerstate: number;
      equipment_name?: string;
      offline?: boolean;
    },
  ) => {
    const { id, powerstate, equipment_name, offline } = row;
    const action = {
      device: () => {
        if (!offline) {
          return message.error("设备已离线，请联系设备管理员！");
        }
        Modal.confirm({
          title: `确定${powerstate ? "关闭" : "打开"}${equipment_name}吗？`,
          maskClosable: true,
          closable: true,
          centered: true,
          cancelText: "取消",
          okText: "确认",
          okButtonProps: {
            type: "default",
          },
          onCancel: () => {
            handleChangeAction("cancel", row);
          },
          onOk: async () => {
            return new Promise<void>((resolve) => {
              handleEquipmentChange(
                id,
                "powerstate",
                powerstate ? 0 : 1,
                (data) =>
                  filterProcessingData(data).then(() => {
                    resolve();
                  }),
              );
            });
          },
        });
      },
      switch: () => {
        getOfflineDevices(powerstate, "设备", params.areaIds, ({ ids }) => {
          if (!ids) {
            return message.warning(
              `设备已经全部${powerstate ? "打开" : "关闭"}`,
            );
          }
          Modal.confirm({
            title: `确定${powerstate ? "打开" : "关闭"}全部设备吗？`,
            maskClosable: true,
            closable: true,
            centered: true,
            cancelText: "取消",
            okText: "确认",
            okButtonProps: {
              type: "default",
            },
            onCancel: () => {
              handleChangeAction("cancel", row);
            },
            onOk: async () => {
              return new Promise<void>((resolve) => {
                handleEquipmentChange(ids, "", powerstate, (data) =>
                  filterProcessingData(data).then(() => {
                    resolve();
                  }),
                );
              });
            },
          });
        });
      },
      cancel: () => {
        Modal.destroyAll();
        cancelFunc.getAsyncApiIotEquipmentEquipmentChange();
      },
    };
    action[tag]?.();
  };

  /**
   * 过滤并处理数据，然后通过MQTT发送处理后的数据。
   * @param data 需要处理的数据数组，数组中每一项包含网关、设备名、属性和属性值。
   * @returns 返回一个Promise，当所有数据处理并发送完成后解决。
   */
  const filterProcessingData = (data: any[]) => {
    return new Promise<void>((resolve) => {
      // 遍历数据数组，为每个数据项准备发送的消息
      data.map(({ gateway, deviceName, attribute, value, uuid }, index) => {
        index++; // 用于计算延迟时间的索引
        const message = {
          // 要发送的数据
          [attribute]: +value, // 属性键和经过类型转换的属性值
        };
        // 使用setTimeout异步发送消息，每个消息发送间隔递增
        setTimeout(() => {
          mqttLocal.setDevicePropertyGatewayAndReturnMessage(
            gateway,
            deviceName,
            message,
            uuid,
          ); // 发送MQTT消息
          getMqttResPayload().then(() => {
            resolve();
          });
        }, index * 300);
      });
    });
  };

  emitter.on("changeStatu", (res) => {
    params.areaIds = res;
  });
  return {
    params,
    selectedKey,
    equipmentMap,
    getDeviceStatusImage,
    filterDeviceStatus,
    handleChangeAction,
  };
}
