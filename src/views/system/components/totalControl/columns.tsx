import { Col, Modal, Row, message } from "ant-design-vue";
import { buildUUID } from "@pureadmin/utils";
import { apiFnList } from "@/api";
import { emitter } from "@/utils/mitt";
import {
  selectedKey,
  equipmentMap,
  filterDeviceStatus,
  getIoTData,
  getOfflineDevices,
  getMqttResPayload,
} from "../../utils";
import productModel from "./model/product.json";
import { useUserStoreHook } from "@/store/modules/user";

export function useColumns() {
  const { mqttLocal } = useUserStoreHook();
  const params = reactive({
    areaIds: [0],
    productModel: {},
    productDetail: [],
    loading: null,
  });

  /**
   * 获取产品模型
   */
  const getProductModel = async () => {
    const { status, data } =
      await apiFnList.getAsyncApiIotDeviceGetProductModel({
        product_key: "AirSwitch2",
      });
    if (status === 200) {
      const deviceType = {
        单相1P: [17, 19, 21, 23, 25, 27],
        单相2P: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
        三相3P: [49, 51, 53, 55, 57, 59, 82, 84, 86, 88],
        三相4P: [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76],
      };
      data.map((item: { dataType: any; identifier: string | number }) => {
        params.productModel[item.identifier] = item;
        if (item.identifier == "prop_device_type") {
          item.dataType.type = "objectKey";
          item.dataType.specs = deviceType;
        }
      });

      params.productModel["status"] = {
        identifier: "status",
        name: "在线状态",
        accessMode: "rw",
        required: false,
        desc: "",
        dataType: {
          type: "object",
          specs: [
            {
              name: "在线",
              value: 1,
            },
            {
              name: "离线",
              value: 2,
            },
          ],
        },
      };
      params.productDetail = productModel.map((item) => Object.entries(item));
    }
  };

  const handleChangeAction = (tag: string, row: any) => {
    const action = {
      model: () => {
        getIoTData(row).then((res) => {
          const [{ status, data }] = res;
          if (!data) return;
          const { attributes } = data;
          const newAttr = { ...attributes, status: +status };
          const findData = findSameKeys(params.productDetail, newAttr);
          const component = () => (
            <div class="grid gap-10 max-h-[35rem] overflow-auto">
              {findData.map((item, index) => (
                <Row class="grid grid-cols-2 gap-2">
                  {item.map(
                    (
                      item1: {
                        name: any;
                        key: string | number;
                        value: string | number;
                      },
                      index1: number,
                    ) => {
                      const name = item1.name;
                      const value = loadAirSwitchDetailValue(
                        item1.key,
                        item1.value,
                      );
                      return (
                        <>
                          {value !== "正常" && (
                            <Col
                              key={item1.key}
                              class="w-full flex justify-between border-2 border-black p-2"
                            >
                              <span>{name}</span>
                              <span>{value}</span>
                            </Col>
                          )}
                          {index == findData.length - 1 &&
                            index1 == item.length - 1 && (
                              <Col class="w-full flex justify-between border-2 border-black p-2">
                                <span>设备状态</span>
                                <span>正常</span>
                              </Col>
                            )}
                        </>
                      );
                    },
                  )}
                </Row>
              ))}
            </div>
          );

          Modal.success({
            title: "设备信息",
            centered: true,
            width: 600,
            closable: true,
            footer: null,
            maskClosable: true,
            content: component(),
          });
        });
      },
      control: () => {
        if (!row.offline) {
          return message.error("设备已离线，请联系设备管理员！");
        }
        Modal.confirm({
          title: `你确定要${row.powerstate ? "关闭" : "打开"} ${
            row.nickName
          } 吗？`,
          centered: true,
          closable: true,
          maskClosable: true,
          cancelText: "取消",
          okText: "确认",
          okButtonProps: {
            type: "default",
          },
          cancelButtonProps: {
            type: "default",
          },
          onOk: () => {
            params.loading = row.id;
            return new Promise<void>((resolve) => {
              mqttLocal.setDevicePropertyGatewayAndReturnMessage(
                row.gateway,
                row.DeviceName,
                { powerstate: row.powerstate ? 0 : 1 },
                buildUUID(),
              );
              getMqttResPayload().then(() => {
                params.loading = null;
                resolve();
              });
            });
          },
        });
      },
      allControl: () => {
        getOfflineDevices(
          row.powerstate,
          "空开",
          params.areaIds,
          ({ ids, res }) => {
            if (!ids) {
              return message.warning(
                `空开已经全部${row.powerstate ? "打开" : "关闭"}`,
              );
            }
            Modal.confirm({
              title: `你确定要${row.powerstate ? "关闭" : "打开"}吗？`,
              centered: true,
              closable: true,
              maskClosable: true,
              cancelText: "取消",
              okText: "确认",
              okButtonProps: {
                type: "default",
              },
              cancelButtonProps: {
                type: "default",
              },
              onOk: () => {
                return new Promise<void>((resolve) => {
                  res.map((item, index) => {
                    index++;
                    setTimeout(() => {
                      params.loading = item.id;
                      mqttLocal.setDevicePropertyGatewayAndReturnMessage(
                        item.gateway,
                        item.DeviceName,
                        { powerstate: item.powerstate ? 0 : 1 },
                        buildUUID(),
                      );
                      getMqttResPayload().then(() => {
                        params.loading = null;
                        resolve();
                      });
                    }, index * 500);
                  });
                });
              },
            });
          },
        );
      },
    };
    action[tag]?.();
  };

  /**
   * 查找具有相同键的项。
   * @param data 数据数组
   * @param obj 包含键值对的对象
   * @returns 具有相同键的项数组
   */
  const findSameKeys = (data: any[], obj: { [x: string]: any }) => {
    const result = data
      .map((subArray) => {
        const innerResult = subArray.reduce((acc, [key, _]) => {
          const arr = [
            "empty",
            "empty1",
            "empty2",
            "empty3",
            "empty4",
            "empty5",
            "empty6",
          ];
          if (arr.includes(key)) {
            acc.push({
              key,
              value: "",
              name: "",
            });
          } else if (Object.prototype.hasOwnProperty.call(obj, key)) {
            acc.push({
              key,
              value: obj[key],
              name: _,
            });
          }
          return acc;
        }, []);

        // Check if innerResult has more than one item and the first item's key is "empty"
        if (
          innerResult.length > 1 ||
          (innerResult.length === 1 && innerResult[0].key !== "empty")
        ) {
          return innerResult;
        }
        return null;
      })
      .filter(Boolean);

    return result;
  };

  /**
   * 加载空开详细值
   * @param i - 索引值
   * @param item - 项值
   * @returns 加载的空开详细值
   */
  const loadAirSwitchDetailValue = (
    i: string | number,
    item: string | number,
  ) => {
    let value: any = item;
    // 如果是枚举型，则显示枚举值
    if (
      params.productModel[i].dataType.type == "enum" ||
      params.productModel[i].dataType.type == "bool"
    ) {
      value = params.productModel[i].dataType.specs[item];
    }
    if (params.productModel[i].dataType.type == "object") {
      value = params.productModel[i].dataType.specs.find(
        (item1: { value: string | number }) => item1.value == item,
      )?.name;
    }
    if (params.productModel[i].dataType.type == "objectKey") {
      value = Object.entries<[string, any]>(
        params.productModel[i].dataType.specs,
      ).find((item1: any) => (item1[1].includes(item) ? item1[0] : ""))?.[0];
    }

    // 如果有单位，则显示单位
    if (params.productModel[i].dataType.specs.unit != undefined) {
      value += params.productModel[i].dataType.specs.unit;
    }
    // 如果有中文的单位，则显示中文的单位
    if (params.productModel[i].dataType.specs.unitName != undefined) {
      value += "（" + params.productModel[i].dataType.specs.unitName + "）";
    }

    return value;
  };

  onBeforeMount(() => {
    getProductModel();
  });

  emitter.on("changeStatu", (res) => {
    params.areaIds = res;
  });

  return {
    params,
    selectedKey,
    equipmentMap,
    filterDeviceStatus,
    handleChangeAction,
  };
}
