import { apiFnList } from "@/api";
import { usePublicStoreHook } from "@/store/modules/public";
import { useUserStoreHook } from "@/store/modules/user";
import {
  ReCurtains,
  ReEquipment,
  ReLamplight,
  ReScenes,
  ReTotalControl,
  ReAir,
} from "../components";
import { emitter } from "@/utils/mitt";
import { message } from "ant-design-vue";
import { buildUUID } from "@pureadmin/utils";
import type { MenuItem } from "types";

export const { areaIds } = usePublicStoreHook();
export const selectedKey = ref<string>(usePublicStoreHook().selectedKey);
export const { bankId, serial } = useUserStoreHook();
export const equipmentMap = reactive<any>({});
export const mqttPayload = reactive<Record<string, any>>({});
export const mqttResPayload = reactive<Record<string, any>>({});
export const loadingMap = reactive<Record<string, any>>({
  scenes: false,
});
export const menuList = reactive<MenuItem[]>([
  {
    typeKey: "lamplight",
    typeName: "灯光",
    isArea: true,
    isNumber: true,
    url: "getAsyncApiIotEquipmentEquipmentList",
    component: markRaw(ReLamplight),
  },
  {
    typeKey: "equipment",
    typeName: "设备",
    isArea: false,
    isNumber: true,
    url: "getAsyncApiIotEquipmentEquipmentList",
    component: markRaw(ReEquipment),
  },
  {
    typeKey: "totalControl",
    typeName: "总控",
    isArea: false,
    isNumber: true,
    isDefault: true,
    params: {
      product_key: "AirSwitch2",
    },
    url: "getAsyncApiIotDeviceGetAirSwitchInfo",
    component: markRaw(ReTotalControl),
  },
  {
    typeKey: "curtains",
    typeName: "窗帘",
    isArea: false,
    isNumber: false,
    url: "getAsyncApiIotEquipmentEquipmentList",
    component: markRaw(ReCurtains),
  },
  {
    typeKey: "air",
    typeName: "空调",
    isArea: false,
    isNumber: false,
    url: "getAsyncApiIotEquipmentEquipmentList",
    component: markRaw(ReAir),
  },
  {
    typeKey: "scenes",
    typeName: "场景",
    isArea: false,
    isMenu: true,
    isNumber: true,
    component: markRaw(ReScenes),
  },
]);

/**
 * 初始化设备列表
 */
export const initEquipmentList = async () => {
  menuList.map((item: MenuItem) => {
    if (item.isMenu) return;
    getDeviceData(item).then((code) => {
      loadingMap[item.typeKey] = code[item.typeKey];
    });
  });
};

/**
 * 获取设备数据
 * @param row - 菜单项
 * @returns 返回一个Promise
 */
export const getDeviceData = (row: MenuItem) => {
  return new Promise<any>((resolve) => {
    const params = row.params ? row.params : { type_key: row.typeKey };
    apiFnList[row.url]({
      bank_id: bankId,
      area_id: areaIds,
      ...params,
    }).then(({ status, data }) => {
      if (status === 200) {
        const transData = transformData(params, data);
        const newResult = Array.isArray(transData) ? transData : transData.data;
        const filterResult = filterData(newResult);
        if (filterResult.length > 0) {
          const flatData = filterResult.flat(Infinity);
          getIoTData(getDeviceName(flatData)).then((res) => {
            const flatMapData = flatMapsDevice(flatData, res, row.isNumber);
            const result = row.isArea ? filterData(flatMapData) : flatMapData;
            equipmentMap[row.typeKey] = Array.isArray(transData)
              ? result
              : {
                  data: result,
                  telecontrol: transData.telecontrol,
                  telecontrol_key: transData.telecontrol_key,
                };
            resolve({
              [row.typeKey]: false,
            });
          });
        } else {
          resolve({
            [row.typeKey]: false,
          });
        }
      } else {
        resolve({
          [row.typeKey]: false,
        });
      }
    });
  });
};

/**
 * 获取本地设备变更信息
 * @param equipment_id 设备ID，类型为number
 * @param attr 属性名称，类型为string
 * @param value 属性值，类型为number
 * @returns 返回一个Promise，解析时返回变更数据，如果请求成功且有数据返回
 */
export const getLocalEquipmentChange = (
  equipment_id: number,
  attr?: string,
  value?: number,
) => {
  return new Promise<any>((resolve) => {
    // 调用异步API获取本地设备变更信息
    const url = attr
      ? "getAsyncApiIotEquipmentEquipmentChange"
      : "getAsyncApiLocalEquipmentPower";
    apiFnList[url]({
      bank_id: bankId,
      serial,
      equipment_id,
      attribute: attr,
      value,
    }).then(({ status, data }) => {
      // 请求成功且有数据时，解决Promise
      if (status === 200 && data) {
        resolve(data);
      }
    });
  });
};

/**
 * 获取物联网设备数据
 * @param device 设备标识数组
 * @returns 返回一个Promise，解析为API返回的数据
 */
export const getIoTData = (device: string[]): Promise<any> => {
  return new Promise((resolve) => {
    apiFnList
      .getAsyncApiDeviceLastdata(JSON.stringify(device), {
        headers: {
          "Content-Type": "text/plain",
        },
      })
      .then((res) => {
        if (res) {
          resolve(res);
        }
      });
  });
};

/**
 * 获取离线设备列表。
 * @param powerstate 设备的电源状态（1：开启，0：关闭），用于筛选设备。
 * @param title 消息标题，用于错误提示。
 * @param areaIds 区域ID数组，用于筛选设备。
 * @param callback 回调函数，根据设备状态返回不同结果。
 * @returns 返回调用回调函数后的结果，若无离线设备，则返回错误消息。
 */
export const getOfflineDevices = (
  powerstate: number,
  title: any,
  areaIds: number[],
  callback: {
    (res: { ids: string; res: Array<any> }): any;
  },
): any => {
  // 根据区域ID筛选设备
  const result = filterDevice(equipmentIsArray(), areaIds);
  // 提取并过滤出离线状态的设备
  const offlineDevice = result
    .flat()
    .filter((item: { offline: any }) => item && item.offline);

  // 若无离线设备，则返回错误提示
  if (!offlineDevice.length) {
    return message.error(`${title}已全部离线，请联系设备管理员！`);
  }

  // 根据电源状态筛选设备，分为在线和离线
  const stateDevice = powerstate
    ? offlineDevice.filter((item: { powerstate: boolean }) => !item.powerstate)
    : offlineDevice.filter((item: { powerstate: boolean }) => item.powerstate);

  // 调用回调函数，传递设备ID列表
  callback &&
    callback({
      ids: stateDevice.map((item: { id: number }) => item.id).join(","),
      res: stateDevice,
    });
};

/**
 * 根据主题更新数据
 * @param topic - 主题
 * @param data - 数据对象
 * @param callBack - 回调函数，处理数据
 */
export const updateDataBasedOnTopic = (
  topic: string,
  data: { device: any },
  callBack: {
    (tag: string, row: any): void;
    (tag: string, row: any): void;
    (arg0: string, arg1: { device: any }): any;
  },
) => {
  const topicParts = topic.split("/");
  const lastPart = topicParts[topicParts.length - 1];
  const flatResult = equipmentIsArray();
  if (!flatResult) return;
  const device = flatResult
    .flat(Infinity)
    .flatMap((item: { devices: { DeviceName: any }[] }) =>
      item.devices?.map(({ DeviceName }) => DeviceName),
    );
  if (device.includes(data.device)) {
    if (lastPart === "data") {
      callBack && callBack("data", data);
    } else if (lastPart === "event") {
      callBack && callBack("event", data);
    } else if (lastPart === "response") {
      callBack && callBack("response", data);
    }
  }
};

/**
 * 监听并处理MQTT消息负载
 * 该函数没有参数和返回值，它主要用于监听“mqttPayload”事件，并根据接收到的topic和data更新mqttPayload对象。
 * 当接收到的tag为"data"时，会将设备数据更新到mqttPayload对象中。
 */
export const getMqttPayload = () => {
  // 监听“mqttPayload”事件，处理接收到的topic和data
  emitter.on("mqttPayload", ({ topic, data }) => {
    // 根据topic和data更新数据
    updateDataBasedOnTopic(
      topic,
      data,
      (
        tag: string,
        row: {
          id: string;
          data: any;
          device: any;
          attributes: any;
        },
      ) => {
        // 当tag为"data"时，更新mqttPayload对象
        if (tag === "data") {
          const { device, attributes } = row;
          const result = { [device]: attributes };
          // 将设备数据合并到mqttPayload对象中
          Object.assign(mqttPayload, result);
        } else if (tag === "response") {
          const { id, data } = row;
          const result = { [id]: data };
          Object.assign(mqttResPayload, result);
        } else if (tag === "event") {
          //   // 判断是否是离线还是在线状态
        }
      },
    );
  });

  watchDeep(
    () => mqttPayload,
    (res) => {
      if (Object.keys(res).length > 0) {
        updatePowerState(res);
      }
    },
  );
};

/**
 * 获取MQTT响应负载的函数。
 * 此函数不接受参数。
 * @returns 返回一个Promise，当MQTT响应负载满足条件或超时后解决。
 */
export const getMqttResPayload = () => {
  let timer: any; // 定时器变量，用于处理超时和重置

  // 创建一个新的Promise，通过异步操作来处理MQTT响应负载的观察和超时逻辑
  return new Promise<void>((resolve) => {
    // 深度观察mqttResPayload的变化
    watchDeep(
      () => mqttResPayload,
      (res) => {
        // 当mqttResPayload的长度大于0，表示有有效数据时
        if (Object.keys(res).length > 0) {
          // 如果已经设置了定时器，则清除定时器，避免不必要的错误消息和状态更新
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          // 更新加载状态
          updateLoadingState(res);
          // 解决Promise，并传递res作为结果
          resolve();
        }
      },
    );
    // 设置一个定时器，如果在5秒内mqttResPayload没有有效数据，则显示错误消息，更新加载状态，并解决Promise
    timer = setTimeout(() => {
      message.error("操作开关异常");
      updateLoadingState();
      resolve();
    }, 5000);
  });
};

/**
 * 移除 MQTT 负载
 * 这个函数用于移除事件发射器上名为 "mqttPayload" 的事件监听器。
 * 该函数没有参数。
 * 该函数没有返回值。
 */
export const removeMqttPayload = () => {
  emitter.off("mqttPayload");
};

/**
 * 处理菜单变化
 * @param key - 菜单键
 */
export const handleChangeMenu = (key: string) => {
  selectedKey.value = key;
  Object.assign(mqttResPayload, {});
};

/**
 * 处理设备属性变更的函数。
 * @param id 设备的唯一标识符。
 * @param attr 需要变更的属性名称。
 * @param value 属性变更后的值。
 * @param area_id 可选参数，区域ID，标识设备所在的区域。
 * @param callBack 可选回调函数，当属性变更完成时被调用，接受一个参数。
 */
export const handleEquipmentChange = (
  id: any,
  attr?: string,
  value?: number,
  callBack?: (arg0: any[]) => any,
) => {
  const targetId = id.toString().split(",");
  const result = equipmentIsArray().filter(
    (item: { id: string; loading: boolean; uuid: string }) => {
      if (targetId.includes(item.id.toString())) {
        item.loading = true;
        item.uuid =
          buildUUID() + Math.random().toString(36).substring(2, 15) + item.id;
        return true;
      }
      return false;
    },
  );
  getLocalEquipmentChange(id, attr, value).then((data) => {
    // 如果提供了回调函数，则调用并传入处理后的数据
    callBack && callBack(renameData(value, data, result));
  });
};

/**
 * 将给定数据中的每个设备名称与其对应的数据项关联起来。
 * @param data 一个包含设备数据的对象，其中键为设备名称，值为设备数据数组。
 * @returns 返回一个新数组，其中每个设备数据项都包含了原始数据加上设备名称的键值对。
 */
export const renameData = (value: number, data: any, arr: { uuid: any }[]) => {
  // 遍历数据对象的每个键值对，对于每个非空的设备数据数组，将其转换为包含设备名称的新对象数组
  const result = Object.entries(data).flatMap(([key, obj]) => {
    // 如果值是一个非空数组，则针对每个数组项添加设备名称键值对
    if (!Array.isArray(obj)) {
      obj = [obj];
    }
    if (Array.isArray(obj) && obj.length > 0) {
      return obj.flatMap((item) => ({
        ...item,
        value,
        deviceName: key,
      }));
    }
    // 如果值不是一个非空数组，则跳过该键值对，不返回任何项
    return [];
  });
  return result.map((item, index) => {
    return {
      ...item,
      uuid: arr[index].uuid,
    };
  });
};

/**
 * 更新数据集中每个设备的电源状态。
 * @param data 包含设备信息的数组。
 * @param target 包含设备名称及其电源状态的对象。如果设备在该对象中存在，则更新其电源状态。
 * @returns 返回一个新数组，其中包含根据目标对象更新了电源状态的设备信息。
 */
export const updatePowerState = (target: any) => {
  // 将嵌套的数据数组展平为一维数组
  return equipmentIsArray().reduce(
    (
      acc: any[],
      item: {
        port_key: any;
        devices: { DeviceName: string | number }[];
        offline: boolean;
        powerstate: boolean;
      },
    ) => {
      // 如果当前项包含设备信息且设备数量大于0
      if (item.devices && item.devices.length > 0) {
        // 遍历设备，更新电源状态
        item.devices.forEach((device: { DeviceName: string | number }) => {
          const payload = target[device.DeviceName];
          if (payload) {
            // 如果目标对象中存在该设备，则更新电源状态
            if (payload?.type && payload.type == 1) {
              item.offline = true;
            } else if (payload?.type && payload.type == 2) {
              item.offline = false;
            } else {
              if (item.port_key) {
                item.powerstate = Boolean(
                  target[device.DeviceName][item.port_key],
                );
              } else {
                item.powerstate = Boolean(target[device.DeviceName].powerstate);
              }
            }
          }
        });
      }
      // 将更新后的项添加到结果数组中
      acc.push(item);
      return acc;
    },
    [],
  );
};

/**
 * 更新加载状态
 * 该函数接收一个目标对象，根据该对象的特定状态更新一个数据数组中各项目的加载状态。
 * @param target 一个对象，其键为uuid，值为包含状态信息的对象。
 * @returns 返回一个经过更新加载状态的一维数组。数组中的每个项目都包含uuid和loading属性，loading属性根据目标对象的状态进行更新。
 */
export const updateLoadingState = (target?: any) => {
  // 将嵌套的数据数组展平为一维数组
  return equipmentIsArray().reduce(
    (
      acc: any[], // 用于累积结果的一维数组
      item: {
        uuid: string; // 当前遍历到的项目的uuid
        loading: boolean | null; // 当前遍历到的项目的加载状态
      },
    ) => {
      // 根据目标对象中对应uuid的项目状态，更新加载状态
      item.loading = target
        ? item.uuid && target[item.uuid]?.status == 0
          ? false
          : null
        : false;

      // 将更新后的项添加到结果数组中
      acc.push(item);
      return acc;
    },
    [],
  );
};

/**
 * 更新区域菜单
 * 该函数通过观察某个值的变化，来动态更新菜单区域和下拉菜单的结构。
 * 当观察到的值变成数组并且有变化时，会调用回调函数，传递更新后的菜单区域和下拉菜单结构。
 *
 * @param callBack 一个回调函数，当菜单数据更新时被调用。接收一个参数，包含更新后的菜单区域信息和下拉菜单结构。
 */
export const updateAreaMenu = (callBack: (arg0: any) => any) => {
  // 监听某个值的变化，以决定是否更新菜单
  watchDeep(
    () => equipmentIsArray(), // 监听的目标表达式，判断是否为数组形式的设备信息
    (newVal: { data: any }, oldVal: any) => {
      // 如果新值为false或未定义，则不执行任何操作
      if (!newVal) return;
      // 当新值与旧值不相等时，进行处理
      if (newVal !== oldVal) {
        // 根据新值是否为数组，来处理数据
        const newData = Array.isArray(newVal) ? newVal : newVal?.data;
        // 转换区域设置，生成适用于菜单的格式
        const menuArea = transformAreaSet(
          newData,
          findByMenuArea(selectedKey.value),
        );
        // 将菜单区域数据转换成树状结构
        const dropResult = createTreeStructure(menuArea);
        // 调用回调函数，传递更新后的数据
        callBack({
          menuArea,
          dropResult,
        });
      }
    },
  );
};

/**
 * 过滤设备状态
 * @param areaList 区域列表
 * @param item 设备项
 * @returns 如果区域列表长度为1，则返回true；否则返回是否找到符合条件的设备项
 */
export const filterDeviceStatus = (
  areaList: Array<Number>,
  item: any,
): Boolean => {
  if (areaList.length == 1 && areaList[0] == 0) return true;
  return item?.find((item: { area_id: Number }) =>
    areaList.includes(item.area_id),
  );
};

/**
 * 根据区域ID过滤设备列表。
 *
 * @param row 一个包含设备信息的数组，每个设备对象中应包含 `area_id` 属性。
 * @param areaIds 需要过滤的区域ID数组。如果数组长度为1且该ID为0，则不过滤设备。
 * @returns 如果设备存在于指定的区域ID中，则返回原设备数组；否则，返回一个空数组。
 */
export const filterDevice = (
  row: { area_id: Number }[],
  areaIds: Number[],
): any[] => {
  // 当只有一个区域ID且为0时，不进行过滤，直接返回原数组
  if (areaIds.length == 1 && areaIds[0] == 0) return row;

  return (
    row?.filter((item: { area_id: Number }) =>
      areaIds.includes(item.area_id),
    ) || []
  );
};

/**
 * 根据类型键查找是否为区域菜单
 * @param type_key - 类型键
 * @returns 返回布尔值，指示是否为区域菜单
 */
export const findByMenuArea = (type_key: string) => {
  return menuList.find((item) => item.typeKey === type_key)?.isArea;
};

/**
 * 根据类型键查找菜单键
 * @param type_key - 类型键
 * @returns 返回匹配的菜单项
 */
export const findMenuKey = (type_key: string) => {
  return usePublicStoreHook().funSortList.find(
    (item: { type_key: string }) => item.type_key === type_key,
  );
};

/**
 * 转换区域集合
 * @param result - 结果数组
 * @param isArea - 是否为区域
 * @returns 返回处理后的区域名称集合
 */
export const transformAreaSet = (result: Array<any>, isArea: boolean) => {
  const areaNamesSet = new Set(
    result.flat() as {
      DeviceName: any;
      devices: any;
      area_id: number;
      area_name: string;
      parent_id: number;
      parent_areaname: string;
      isNumber: boolean;
    }[],
  );

  const areaNames = Array.from(areaNamesSet).map(
    ({ area_id, area_name, parent_id, parent_areaname, isNumber }) => ({
      area_id,
      area_name,
      parent_id,
      parent_areaname,
      isNumber,
    }),
  );

  const uniqueAreaNames = Array.from(
    new Set(areaNames.map((item) => item.area_id)),
  ).map((area_id) => areaNames.find((item) => item.area_id === area_id));

  return [
    {
      area_id: 0,
      area_name: "全部",
      total: areaNamesSet.size,
      active: countTotalAndActive(Array.from(areaNamesSet), [0]).active,
      children: "",
      isNumber: uniqueAreaNames.find((item) => item)?.isNumber,
    },
    ...(isArea
      ? findTopLevelArea(uniqueAreaNames, Array.from(areaNamesSet))
      : uniqueAreaNames.map((item) => {
          return {
            ...item,
            active: countTotalAndActive(
              result.flatMap((item) => item),
              [item.area_id],
            ).active,
            total: countTotalAndActive(
              result.flatMap((item) => item),
              [item.area_id],
            ).total,
          };
        })),
  ];
};

/**
 * 根据提供的导航列表创建树结构。
 * @param navList 导航列表，是一个数组，每个元素代表一个导航项，其结构和内容依据实际应用而定。
 * @returns 返回一个数组，每个元素都是一个树结构，对应于输入导航列表中的一个导航项。
 */
export const createTreeStructure = (navList: any[]) => {
  // 将设备信息转换为数组，并提取特定字段
  const data = equipmentIsArray().map(
    ({ area_name, area_id, parent_id, isNumber }) => {
      return {
        area_name,
        area_id,
        parent_id,
        isNumber,
        active: countTotalAndActive(equipmentIsArray(), [area_id]).active,
        total: countTotalAndActive(equipmentIsArray(), [area_id]).total,
      };
    },
  );

  // 查找给定父ID的所有子项
  const findChildren = (array: any[], parentId: any) => {
    return array.filter(
      (item: { parent_id: any }) => item.parent_id === parentId,
    );
  };

  // 创建树结构，递归函数
  const createTree = (array: any, parentId: any, seenIds?: any) => {
    const children = findChildren(array, parentId);
    if (children.length === 0) {
      return null;
    }

    // 递归创建子树，并收集所有子树
    return children
      .map((child: { area_id: any; children: any }) => {
        seenIds = seenIds || new Set();
        if (!seenIds.has(child.area_id)) {
          seenIds.add(child.area_id);

          const grandchildren = createTree(array, child.area_id, seenIds);
          if (grandchildren) {
            child.children = grandchildren;
          }
          return child;
        }
        return null;
      })
      .filter(Boolean); // 过滤掉所有null值
  };

  // 为每个根节点构建树结构，并返回结果
  const resultTrees = navList.map((root: { children: any; area_id: any }) => {
    return {
      ...root,
      children: root.children,

      parent_id: createTree(data, root.area_id),
    };
  });

  return resultTrees;
};

/**
 * 转换数据格式
 * @param params 参数对象
 * @param data 原始数据对象
 * @returns 返回转换后的数据，可以是数组或单一数据
 */
const transformData = (params: any, data: { data?: any }): any[] | any => {
  const airSwitch2 = data.data?.AirSwitch2;

  if (params && airSwitch2) {
    return airSwitch2.map(
      (item: { DeviceName: any; id: any; gateway: any }) => ({
        ...item,
        devices: [
          {
            DeviceName: item.DeviceName,
            device_id: item.id,
            gateway: item.gateway,
          },
        ],
      }),
    );
  } else {
    return Array.isArray(data) ? data : data;
  }
};

/**
 * 过滤数据，分组整理
 * @param data 待处理数据数组
 * @returns 返回分组整理后的数据数组
 */
const filterData = (data: Array<any>) => {
  return Object.values(
    data.reduce((acc, item) => {
      const key = item.device_id || item.id;

      if (item.devices && item.area_name !== null) {
        acc[key] = acc[key] || [];
        acc[key].push(item);
      }

      return acc;
    }, {}),
  );
};

/**
 * 检查传入的设备信息是否为数组，并将其展平为一维数组。
 * @returns 返回展平后的设备信息数组。
 */
export const equipmentIsArray = () => {
  const result = equipmentMap[selectedKey.value];
  return (
    result && (Array.isArray(result) ? result : result.data).flat(Infinity)
  );
};

/**
 * 查找顶级区域
 * @param areas 区域数组
 * @param areaNamesSet 区域名称集合
 * @returns 返回顶级区域及其子区域结构数组
 */
const findTopLevelArea = (areas: Array<any>, areaNamesSet: Array<any>) => {
  // 遍历areas，构建一个以area的parent_id为key，area为value的map
  const childrenMap = areas.reduce((map, area) => {
    // 如果map中没有area的parent_id，则添加一个以area的parent_id为key，空数组为value的键值对
    if (!map.has(area.parent_id)) {
      map.set(area.parent_id, []);
    }
    // 将area添加到以area的parent_id为key的数组中
    map.get(area.parent_id).push(area);
    return map;
  }, new Map());

  // 递归查找子区域并构建区域结构
  function findSubAreas(parentId: any) {
    // 初始化子区域结构
    const this_child = [0, parentId];
    // 获取子区域数组
    const children = childrenMap.get(parentId) || [];
    // 遍历子区域，递归构建子区域结构
    children.forEach((child: { area_id: any }) => {
      // 添加子区域id到结构中
      this_child.push(child.area_id);
      // 递归调用，构建该子区域的子区域结构
      findSubAreas(child.area_id);
    });
    // 返回构建好的子区域结构
    return this_child;
  }

  // 构建顶级区域map
  const topLevelAreasMap = areas.reduce((map, area) => {
    // 如果是顶级区域，则添加到map中
    if (area.parent_id === 0 && !map.has(area.area_id)) {
      map.set(area.area_id, {
        area_id: area.area_id,
        area_name: area.area_name,
      });
    }
    return map;
  }, new Map());

  // 根据顶级区域map构建最终的区域结构数组
  const resTopLevelAreas = Array.from(topLevelAreasMap.values()).map(
    (topArea: { area_id: any; area_name: any }) => {
      // 构建该顶级区域的子区域结构
      const areasMap = findSubAreas(topArea.area_id);
      // 计算该区域及其子区域的总数和激活数
      const { total, active } = countTotalAndActive(areaNamesSet, areasMap);
      // 将子区域结构转换为字符串表示
      const children = areasMap.toString();
      return {
        area_id: topArea.area_id,
        area_name: topArea.area_name,
        children: children,
        total,
        active,
        isNumber: areaNamesSet.find((item) => item)?.isNumber,
      };
    },
  );
  return resTopLevelAreas;
};

/**
 * 计算列表中设备的总数和激活数。
 * @param list 设备列表，每个设备对象应包含区域ID和电源状态。
 * @param areasMap 区域ID的集合，用于筛选特定区域的设备。如果areasMap为单个元素且为0，则只计算电源状态为激活的设备数量。
 * @returns 返回一个对象，包含总设备数（total）和激活状态的设备数（active）。
 */
const countTotalAndActive = (list: any[], areasMap: any) => {
  const result = list.reduce(
    (acc, cur) => {
      // 当areasMap只包含一个元素且该元素为0时，只统计激活状态的设备
      if (areasMap[0] == 0 && areasMap.length == 1) {
        if (cur.powerstate == 1 && cur.powerstate) {
          acc.active++;
        }
      }
      // 如果当前设备的区域ID包含在areasMap中，累加总设备数，若设备为激活状态，则累加激活设备数
      if (areasMap.includes(cur.area_id)) {
        acc.total++;
        if (cur.powerstate == 1 && cur.powerstate) {
          acc.active++;
        }
      }
      return acc;
    },
    { total: 0, active: 0 },
  );
  return result;
};

/**
 * 从给定的数据数组中获取所有设备名称。
 * @param data - 包含设备信息的数组。
 * @returns 返回一个包含所有设备名称的数组。
 */
const getDeviceName = (data: Array<any>) => {
  // 将输入数据转换为数组，并通过映射操作提取出所有设备名称。
  return Array.from(data)
    .map((item) => {
      // 对每项数据中的设备列表进行映射，提取设备名称。
      return (
        item.devices &&
        item?.devices.map((item: { DeviceName: any }) => item.DeviceName)
      );
    })
    .flat(); // 将嵌套的数组拉平为一个一维数组。
};

/**
 * 将设备列表嵌套结构展平，并附加状态信息。
 * @param list 原始设备列表，每个设备包含子设备和端口键。
 * @param res 包含设备名称和状态信息的参考列表。
 * @param isNumber 指示列表中的设备名称是否为数字。
 * @returns 返回一个新数组，其中包含展平的设备列表，每个设备附加了powerstate、offline和isNumber属性。
 */
const flatMapsDevice = (
  list: Array<any>,
  res: Array<any>,
  isNumber: boolean,
) => {
  // 遍历原始设备列表，将每个设备的子设备映射并展平
  return list.flatMap((device: { devices: any; port_key: string | number }) => {
    // 对每个子设备，查找其在参考列表中的状态信息
    return device.devices.map((item1: { DeviceName: any }) => {
      const findData = res.find(
        (item2: { devicename: any }) => item2.devicename === item1.DeviceName,
      );
      // 根据状态确定设备是否离线
      const offline = +findData?.status == 1 ? true : false;
      // 如果设备离线，获取其特定的电源状态，并设置为true，否则为false
      const powerstate = offline
        ? findData?.data?.attributes[device?.port_key ?? "powerstate"] && true
        : false;
      // 返回包含附加信息的设备对象
      return {
        ...device,
        powerstate,
        isNumber,
        offline,
        loading: false,
      };
    });
  });
};
