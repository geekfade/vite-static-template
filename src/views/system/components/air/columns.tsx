import { PlusOutlined, MinusOutlined } from "@ant-design/icons-vue";
import { Row, Col, Button, message, Modal } from "ant-design-vue";
import { debounce, isNumber } from "@pureadmin/utils";
import { useUserStoreHook } from "@/store/modules/user";
import { apiFnList, cancelFunc } from "@/api";
import { emitter } from "@/utils/mitt";
import { getImageUrl } from "@/utils";
import {
  selectedKey,
  equipmentMap,
  filterDeviceStatus,
  getDeviceData,
  handleEquipmentChange,
  getOfflineDevices,
  getMqttResPayload,
} from "../../utils";

/**
 * 自定义 Hook，用于处理列数据
 * @returns 列数据相关的属性和方法
 */
export function useColumns() {
  const { bankId, mqttLocal } = useUserStoreHook();

  /**
   * 空调列数据
   */
  const params = reactive<any>({
    areaIds: [0],
    open: false,
    component: null,
    allModel: [
      {
        model: "ac_mode",
        name: "制冷",
        icon: true,
        onClick: (item: any) => handleChangeModel("ac_mode", item),
      },
      {
        model: "ac_temp",
        text: "16",
        name: "调温",
        icon: false,
        onClick: (item: any) => handleChangeModel("ac_temp", item),
      },
      {
        model: "ac_more",
        name: "更多模式",
        icon: true,
        onClick: (item: any) => handleChangeModel("more", item),
      },
    ],
  });

  /**
   * @name 处理模式点击事件
   * @param tag 模式标签
   * @param row 当前行数据
   */
  const handleChangeModel = (tag: string, row?: any) => {
    const { telecontrol_key } = equipmentMap[selectedKey.value] || {};
    if (!telecontrol_key) {
      return message.error("请先配置设备");
    }
    const modelList = telecontrol_key.find(
      (item: { identifier: string }) => item.identifier == tag,
    )?.data;
    getOfflineDevices(row, "空调", params.areaIds, ({ ids }) => {
      const targetId = row?.id ? row.id.toString() : ids;
      const targetAreaId = row?.id ? -1 : params.areaIds.join(",");
      const tagAction = {
        ac_mode: () => {
          const activeIndex = ref<number>(
            getTelecontrolKey(row.id, tag)?.value || 0,
          );
          const loadingIndex = ref<number | null>(null);
          return (
            <Row class="flex w-full gap-2">
              {modelList.map((model: any, index: number) => (
                <Button
                  key={index}
                  onClick={() => {
                    loadingIndex.value = index;
                    handleEquipmentChange(targetId, tag, index, (data) => {
                      if (data.length) {
                        filterProcessingData(
                          targetId,
                          tag,
                          targetAreaId,
                          index,
                          data,
                        ).then(() => {
                          activeIndex.value = index;
                          loadingIndex.value = null;
                        });
                      } else {
                        message.error("操作失败，请重试", 1, () => {
                          loadingIndex.value = null; // 清除加载状态
                        });
                      }
                    });
                  }}
                  class={[
                    index == activeIndex.value
                      ? "bg-[#e5c97b]"
                      : "bg-[#3b3633]",
                    "text-white",
                  ]}
                  loading={loadingIndex.value == index}
                >
                  {model}
                </Button>
              ))}
            </Row>
          );
        },
        ac_temp: () => {
          const temp = ref<number>(
            getTelecontrolKey(row?.id, tag)?.value || 16,
          );
          const tempList = [
            {
              component: () => <MinusOutlined />,
              onClick: debounce(() => {
                const minValue = (modelList?.data || [16]).reduce(
                  (a: number, b: number) => Math.min(a, b),
                  Infinity,
                );
                if (temp.value > minValue) {
                  temp.value = temp.value - 1;
                  handleEquipmentChange(targetId, tag, temp.value, (data) => {
                    if (data.length) {
                      filterProcessingData(
                        targetId,
                        tag,
                        targetAreaId,
                        temp.value,
                        data,
                      );
                    } else {
                      message.error("操作失败，请重试");
                    }
                  });
                }
                if (temp.value == minValue) {
                  message.info("温度已达到最小值");
                }
              }, 500),
            },
            {
              component: () => (
                <span class="text-center text-xl text-[#e5c97b] leading-loose">
                  {temp.value}
                  <b class="text-sm align-text-top font-normal">℃</b>
                </span>
              ),
            },
            {
              component: () => <PlusOutlined />,
              onClick: debounce(() => {
                const maxValue = (modelList?.data || [30]).reduce(
                  (a: number, b: number) => Math.max(a, b),
                  -Infinity,
                );
                if (temp.value < maxValue) {
                  temp.value = temp.value + 1;

                  handleEquipmentChange(targetId, tag, temp.value, (data) => {
                    if (data.length) {
                      filterProcessingData(
                        targetId,
                        tag,
                        targetAreaId,
                        temp.value,
                        data,
                      );
                    } else {
                      message.error("操作失败，请重试");
                    }
                  });
                }
                if (temp.value === maxValue) {
                  message.info("温度已达到最大值");
                }
              }, 500),
            },
          ];
          return (
            <div class="w-36 flex gap-2 mx-10 h-10 justify-center">
              {tempList.map((item, index) => (
                <Button
                  key={index}
                  class="h-full grid place-content-center"
                  onClick={item.onClick}
                >
                  {item.component()}
                </Button>
              ))}
            </div>
          );
        },
        cancel: () => {
          cancelFunc.getAsyncApiIotEquipmentEquipmentChange();
          cancelFunc.getAsyncApiLocalGetTelecontrolInfo();
          cancelFunc.getAsyncApiLocalSetTelecontrolInfo();
        },
        more: () => {
          const loadingIndex = ref<string | null>(null);
          return (
            <Row class="flex-col w-[25rem] gap-6">
              {telecontrol_key.map(
                (item: { identifier: string; name: any; data: any[] }) => {
                  const activeIndex = ref<number>(
                    getTelecontrolKey(row.id, item.identifier)?.value || 0,
                  );
                  return (
                    <Col key={item.identifier}>
                      <h2 class="my-2 text-[#e5c97b] text-xl">{item.name}</h2>
                      <Col
                        class={[
                          "flex gap-3 flex-wrap",
                          item.identifier === "ac_mode" && "justify-between",
                        ]}
                      >
                        {item.data.map((item1, index) => {
                          const targetIndex =
                            item.identifier == "ac_temp" ? item1 : index;
                          return (
                            <Button
                              onClick={() => {
                                loadingIndex.value = `${item.identifier}_${targetIndex}`;
                                handleEquipmentChange(
                                  targetId,
                                  item.identifier,
                                  targetIndex,
                                  (data) => {
                                    if (data.length) {
                                      filterProcessingData(
                                        targetId,
                                        item.identifier,
                                        targetAreaId,
                                        targetIndex,
                                        data,
                                      ).then(() => {
                                        activeIndex.value = targetIndex;
                                        loadingIndex.value = null; // 清除加载状态
                                      });
                                    } else {
                                      message.error(
                                        "操作失败，请重试",
                                        1,
                                        () => {
                                          loadingIndex.value = null; // 清除加载状态
                                        },
                                      );
                                    }
                                  },
                                );
                              }}
                              class={[
                                targetIndex == activeIndex.value
                                  ? "bg-[#e5c97b]"
                                  : "bg-[#3b3633]",
                                "text-white",
                              ]}
                              loading={
                                `${item.identifier}_${targetIndex}` ==
                                loadingIndex.value
                              }
                            >
                              {item1}
                            </Button>
                          );
                        })}
                      </Col>
                    </Col>
                  );
                },
              )}
            </Row>
          );
        },
        ac_power: () => {
          return (
            <div class="w-80 h-32 grid content-between">
              <div class="ant-modal-title">
                是否{row ? "关闭" : "打开"}空调？
              </div>
              <div class="ant-modal-footer">
                <Button onClick={() => handleChangeModel("cancel")}>
                  取消
                </Button>
                <Button
                  class="bg-[#1677ff] text-white"
                  onClick={() => {
                    handleEquipmentChange(
                      targetId,
                      tag,
                      row.powerstate ? 1 : 0,
                      (data) => {
                        if (data) {
                          filterProcessingData(
                            targetId,
                            tag,
                            targetAreaId,
                            row.powerstate ? 1 : 0,
                            data,
                          ).then(() => {
                            Modal.destroyAll();
                          });
                        }
                      },
                    );
                  }}
                >
                  确定
                </Button>
              </div>
            </div>
          );
        },
      };
      Modal.info({
        icon: null,
        closable: true,
        centered: true,
        footer: null,
        width: "auto",
        content: () => tagAction[tag]?.(),
      });
    });
  };

  /**
   * @name 获取遥控信息
   * @returns 遥控信息
   */
  const getTelecontrolInfo = async () => {
    return new Promise((resolve) => {
      apiFnList
        .getAsyncApiLocalGetTelecontrolInfo({
          bank_id: bankId,
        })
        .then(({ status, data }) => {
          if (status === 200) {
            resolve(data);
          }
        });
    });
  };

  /**
   * 获取设置遥控信息
   *
   * @param area_id 区域ID
   * @param device_id 设备ID
   * @param type 类型
   * @param key 键
   */
  const getSetTelecontrolInfo = async (
    area_id: any,
    device_id: any,
    type: any,
    key: any,
  ) => {
    /**
     * 获取异步API本地设置遥控信息
     *
     * @param bank_id 银行ID
     * @param area_id 区域ID
     * @param device_id 设备ID
     * @param type 类型
     * @param key 键
     * @returns 异步API本地设置遥控信息的状态
     */
    const { status } = await apiFnList.getAsyncApiLocalSetTelecontrolInfo({
      bank_id: bankId,
      area_id,
      device_id,
      type,
      key,
    });

    if (status === 200) {
      getDeviceData({
        typeKey: "air",
        typeName: "空调",
        isArea: false,
        isNumber: false,
        url: "getAsyncApiLocalEquipmentList",
      });
    }
  };

  /**
   * 过滤并处理数据，然后通过MQTT发送处理后的数据。
   * @param data 需要处理的数据数组，数组中每一项包含网关、设备名、属性和属性值。
   * @returns 返回一个Promise，当所有数据处理并发送完成后解决。
   */
  const filterProcessingData = (
    equipment_id: string,
    attr: string,
    area_id: any,
    value: number,
    data: any[],
  ) => {
    return new Promise<void>((resolve) => {
      // 遍历数据数组，为每个数据项准备发送的消息
      getTelecontrolInfo().then(({ device }: any) => {
        data.forEach(({ attribute, deviceName, gateway, values }, index) => {
          index++;
          const message = reactive({
            device: deviceName,
            data: {
              aircontrol: null,
            },
          });
          const subscribe = `v1/gateway/${gateway}/attributes`;
          equipment_id.split(",").forEach((item1: any) => {
            const newVal = device[item1];
            if (!newVal) return;
            const isAttributeMatched = attribute === attr;
            const newObj = isAttributeMatched
              ? {}
              : {
                  key: "ac_",
                  del: [attribute, "power"],
                  typeModel: {
                    0: 2,
                    1: 1,
                    2: 0,
                    3: 4,
                    4: 8,
                  },
                };
            const filterValue = filterKeys(
              renameKeys(newVal, newObj.key),
              isAttributeMatched ? [attribute] : newObj.del,
            );
            const concatValue = { ...values, ...filterValue };
            if (attribute !== "ac_temp" || attr === "temp") {
              if (isAttributeMatched) {
                concatValue.ac_temp = +concatValue.ac_temp - 16;
              } else {
                concatValue.powerstate =
                  attr === "ac_power" ? +!concatValue.powerstate : 1;
                concatValue.mode = newObj.typeModel[concatValue.mode];
              }
            }
            message.data.aircontrol = Object.fromEntries(
              Object.entries(concatValue).map(([key, value]) => [
                key,
                Number(value),
              ]),
            );
          });
          setTimeout(() => {
            mqttLocal.sendMessage(subscribe, JSON.stringify(message));
            getMqttResPayload().then(() => {
              resolve();
            });
          }, index * 300);
        });
        getSetTelecontrolInfo(area_id, equipment_id, attr, value);
      });
    });
  };

  /**
   * Remove specified keys from an object or array-like object.
   * 从对象或类似数组的对象中删除指定的键。
   *
   * @param obj - The object or array-like object to filter. 要过滤的对象或类似数组的对象。
   * @param keysToRemove - The keys to remove. 要删除的键。
   * @returns A new object with the specified keys removed. 具有指定键被删除的新对象。
   */
  const filterKeys = (
    obj: ArrayLike<unknown> | { [s: string]: unknown },
    keysToRemove: string | any[],
  ) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => !keysToRemove.includes(key)),
    );
  };

  /**
   * Renames the keys of an object based on a given prefix.
   *
   * 根据给定的前缀重命名对象的键。
   *
   * @param obj - 需要重命名其键的对象.
   * @param prefix - 与键匹配的前缀s.
   * @returns 具有重命名键的新对象.
   */
  const renameKeys = (obj: { [x: string]: any }, prefix: string | string[]) => {
    const newObj = Object.keys(obj).reduce((acc, key) => {
      if (typeof prefix === "string" && key.startsWith(prefix)) {
        const newKey = key.slice(prefix.length);
        acc[newKey] = obj[key];
      } else if (
        Array.isArray(prefix) &&
        prefix.some((p) => key.startsWith(p))
      ) {
        const matchedPrefix = prefix.find((p) => key.startsWith(p));
        const newKey = key.slice(matchedPrefix.length);
        acc[newKey] = obj[key];
      }
      return acc;
    }, {});
    return newObj;
  };

  /**
   * Get the telecontrol key for a given ID and model.
   * 获取给定ID和模型的遥控键。
   *
   * @param id - 远程控制的 ID.
   * @param model - 遥控器的模型.
   * @returns An object containing the singleData, uniteData, and value.
   *          包含singleData、uniteData和value的对象。
   */
  const getTelecontrolKey = (id?: number, model?: string | number) => {
    const equipment = equipmentMap[selectedKey.value];
    if (!equipment) {
      return {
        singleData: undefined,
        uniteData: undefined,
        value: undefined,
      };
    }

    const { telecontrol_key, telecontrol, data } = equipment;

    const targetId = id || params.areaIds?.[0];
    const telecontrolItem = data?.find(
      (item: { id: number }) => item.id === id,
    )?.telecontrol;
    const value = isNumber(id)
      ? telecontrolItem?.[model]
      : telecontrol?.[targetId]?.[model];
    const uniteData = telecontrol?.[params.areaIds];
    const singleData = telecontrol_key?.find(
      (item: { identifier: string | number }) => item.identifier == model,
    )?.data[value];

    return {
      singleData,
      uniteData: `${model}_${uniteData?.[model] || 0}`,
      value: +value,
    };
  };

  emitter.on("changeStatu", (res) => {
    params.areaIds = res;
  });

  return {
    params,
    selectedKey,
    equipmentMap,
    getImageUrl,
    getTelecontrolKey,
    filterDeviceStatus,
    handleChangeModel,
  };
}
