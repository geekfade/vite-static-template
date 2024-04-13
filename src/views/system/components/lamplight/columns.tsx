import { Modal, Slider, message } from "ant-design-vue";
import { apiFnList, cancelFunc } from "@/api";
import { emitter } from "@/utils/mitt";
import { useUserStoreHook } from "@/store/modules/user";
import {
  mqttPayload,
  selectedKey,
  equipmentMap,
  filterDeviceStatus,
  getOfflineDevices,
  handleEquipmentChange,
  getMqttResPayload,
} from "../../utils";
import { getImageUrl } from "@/utils";

export function useColumns() {
  const { bankId, mqttLocal } = useUserStoreHook();
  const params = reactive({
    areaIds: [0],
    loading: null,
    areaMenu: [],
  });

  /**
   * 处理标签变化触发的行动。
   * @param tag - 标签名称，决定执行哪个功能块。
   * @param row - 可选参数，包含设备的详细信息。
   *              如果提供了row，则必须包括id（设备ID）、powerstate（电源状态）和offline（是否离线）字段。
   *              如果row未提供，则默认为undefined。
   */
  const handleChangeAction = (
    tag: string,
    row?: {
      id?: number;
      powerstate: number;
      offline?: boolean;
      port_key?: string;
    },
  ) => {
    // 解构行信息，默认值为空对象
    const { id, powerstate, offline, port_key } = row || {};
    // 根据tag激活相应的功能块
    const active = {
      smartLight: async () => {
        // 初始化智能灯的亮度和色温
        const payload: { brightness: number; colorTemperature: number } =
          reactive({
            brightness: 0,
            colorTemperature: 0,
          });

        // 查询当前区域的灯光状态
        const { status, data } =
          await apiFnList.getAsyncApiLocalLoadAreaLightSw({
            bank_id: bankId,
            area_id: params.areaIds.join(","),
          });

        if (status === 200) {
          // 如果查询成功，更新亮度和色温
          payload.brightness = +data.brightness;
          payload.colorTemperature = +data.colorTemperature;

          // 显示灯光控制模态框
          const template = () => (
            <>
              <Slider
                v-model:value={payload.brightness}
                min={0}
                max={255}
                marks={{
                  0: <span style={{ color: "#888786" }}>最暗</span>,
                  255: "最亮",
                }}
                trackStyle={{
                  background: "linear-gradient(to right,#1c1a18,#888786,#fff)",
                }}
              />
              <Slider
                v-model:value={payload.colorTemperature}
                min={0}
                max={255}
                marks={{ 0: "冷光", 255: "暖光" }}
                trackStyle={{
                  background:
                    "linear-gradient(to right,#98fbff,#cfe8c4,#fddd99)",
                }}
              />
            </>
          );
          Modal.confirm({
            title: "智能灯控制",
            content: () => template(),
            maskClosable: true,
            closable: true,
            centered: true,
            cancelText: "取消",
            okText: "确认",
            icon: null,
            okButtonProps: {
              shape: "round",
              type: "default",
            },
            cancelButtonProps: {
              shape: "round",
              type: "default",
            },
            onCancel: () => {},
            onOk: async () => {
              // 提交更新后的灯光状态
              const { status, data } =
                await apiFnList.getAsyncApiLocalChangeAreaLightSw({
                  bank_id: bankId,
                  area_id: params.areaIds.join(","),
                  ...payload,
                });

              if (status === 200) {
                // 分批更新设备状态，并在全部成功后返回成功消息
                return new Promise<void>((resolve) =>
                  data.forEach(
                    (
                      item: { gateway: any; device_name: any },
                      index: number,
                    ) => {
                      setTimeout(
                        () => {
                          mqttLocal.setDevicePropertyGateway(
                            item.gateway,
                            item.device_name,
                            JSON.stringify(payload),
                          );

                          if (index === data.length - 1) {
                            message.success("操作成功");
                            resolve();
                          }
                        },
                        (index + 1) * 300,
                      );
                    },
                  ),
                ).catch(() => message.error("操作失败"));
              }
            },
          });
        }
      },
      singleLight: () => {
        // 单个灯光控制，考虑设备在线与离线状态
        if (!offline) {
          return message.error("灯光已离线，请联系设备管理员！");
        }
        handleEquipmentChange(id, port_key, powerstate ? 0 : 1, (data) =>
          filterProcessingData(data),
        );
      },
      switch: () => {
        // 开关全部灯光，考虑设备在线状态
        getOfflineDevices(powerstate, "灯光", params.areaIds, ({ ids }) => {
          if (!ids) {
            return message.warning(
              `灯光已经全部${powerstate ? "打开" : "关闭"}`,
            );
          }
          Modal.confirm({
            title: `确定${powerstate ? "打开" : "关闭"}全部灯光吗？`,
            maskClosable: true,
            closable: true,
            centered: true,
            cancelText: "取消",
            okText: "确认",
            okButtonProps: {
              type: "default",
            },
            onOk: () => {
              // 提交更新全部灯光状态的请求
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
        // 取消所有正在进行的设备状态改变操作
        Modal.destroyAll();
        cancelFunc.getAsyncApiIotEquipmentEquipmentChange();
        cancelFunc.getAsyncApiLocalChangeAreaLightSw();
      },
    };
    // 根据tag执行对应的操作
    active[tag]?.();
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

  // 计算属性：获取设备的在线状态灯的图标和状态
  const getEquipLampOnline = computed(
    () =>
      (row: {
        offline: any; // 设备的离线状态
        DeviceName: any; // 设备名称
        port_key: string | number; // 设备端口键
        powerstate: number; // 设备电源状态
      }) => {
        const power = ref<string>("off"); // 初始化设备状态为关闭
        const { DeviceName, port_key, offline, powerstate } = row;

        // 根据设备的在线状态，设置设备的电源状态
        if (offline) {
          // 如果设备在线，根据MQTT消息确定设备状态
          if (mqttPayload[DeviceName]) {
            power.value = mqttPayload[DeviceName]?.[port_key] ? "on" : "off";
          } else {
            // 如果没有MQTT消息，则根据电源状态确定设备状态
            power.value = powerstate ? "on" : "off";
          }
        } else {
          // 如果设备离线，则设置状态为"offline"
          power.value = "offline";
        }

        // 根据设备状态选择对应的图标资源
        const src = getImageUrl(`lamplight/${power.value}.svg`);

        // 返回图标资源和设备状态
        return { src, power: power.value };
      },
  );

  emitter.on("changeStatu", (res) => {
    params.areaIds = res;
  });

  return {
    params,
    selectedKey,
    equipmentMap,
    getEquipLampOnline,
    filterDeviceStatus,
    handleChangeAction,
  };
}
