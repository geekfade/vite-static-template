import { useUserStoreHook } from "@/store/modules/user";
import { emitter } from "@/utils/mitt";
import {
  selectedKey,
  equipmentMap,
  mqttPayload,
  getOfflineDevices,
  equipmentIsArray,
  handleEquipmentChange,
  filterDeviceStatus,
  getMqttResPayload,
} from "../../utils";
import { buildUUID } from "@pureadmin/utils";
import { getImageUrl } from "@/utils";

export function useColumns() {
  const { mqttLocal } = useUserStoreHook();
  const sliderRef = ref(null);
  const params = reactive({
    areaIds: [0],
    curActive: 0,
    curNum: 0,
    focus: true,
    title: "",
    loading: null,
  });
  const computedWidth = computed(() => {
    return Math.min(2 * params.curNum + 100, 290) + "px";
  });
  emitter.on("changeStatu", (res) => {
    params.areaIds = res;
  });

  const handleChangeAction = (tag: string, row: any) => {
    const action = {
      switch: () => {
        const attr =
          row?.devices?.[0].product_key == "DooyaCurtain"
            ? "CurtainMachineStatus"
            : "CurtainOperation";
        handleEquipmentChange(row.id, attr, row.isClose ? 1 : 0, (data) => {
          filterProcessingData(data);
        });
      },
      change: () => {
        params.focus = row;
      },
      focus: () => {
        params.focus = row;
      },
      afterChange: () => {
        if (!params.focus) return;
        const isReverse =
          equipmentIsArray()[params.curActive].devices[0].setting?.DoyReverse ==
          "1";
        const position = isReverse ? row : 100 - row;
        getOfflineDevices(
          row > 0 ? 1 : 0,
          "窗帘",
          params.areaIds,
          ({ ids }) => {
            handleEquipmentChange(ids, "CurtainPosition", position, (data) => {
              filterProcessingData(data);
            });
          },
        );
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
      data.map(({ gateway, deviceName, attribute, value }, index) => {
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
            buildUUID(),
          ); // 发送MQTT消息
          getMqttResPayload().then(() => {
            resolve();
          });
        }, index * 300);
      });
    });
  };

  watchDeep(
    () => mqttPayload,
    (res) => {
      if (Object.keys(res).length > 0) {
        updateDataPosition(res);
      }
    },
  );

  const updateDataPosition = (res: Record<string, any>) => {
    const result = equipmentIsArray();
    result.forEach(
      (item: {
        DeviceName: string | number;
        devices: { setting: { DoyReverse: string } }[];
        position: any;
        isClose: boolean;
      }) => {
        const position = res[item.DeviceName].CurtainPosition;
        const isReverse = item.devices[0].setting?.DoyReverse == "1";
        item.position = isReverse ? position : 100 - position;
        item.isClose = isReverse
          ? position == 0 && true
          : position == 100 && true;
        params.curNum = isReverse ? position : 100 - position;
      },
    );
  };

  return {
    params,
    sliderRef,
    selectedKey,
    equipmentMap,
    getImageUrl,
    computedWidth,
    filterDeviceStatus,
    handleChangeAction,
  };
}
