import SwiperCore from "swiper";
import { emitter } from "@/utils/mitt";
import { usePublicStoreHook } from "@/store/modules/public";
import { Navigation } from "swiper/modules";
import { colorRange, getAqiColor, getImageUrl } from "@/utils";
import { getIoTData } from "../system/utils";

export function useColumns() {
  const { date, week, executeScene } = usePublicStoreHook();
  const params: {
    active: number;
    activeKey: string;
    envData: {
      name: string;
      key: string;
      unit: string;
      standard?: any;
      color?: string;
      value?: number;
      val?: string;
    }[];
    aqiGrade: {
      [key: string]: {
        [key: number]: [string, string];
      };
    };
  } = reactive({
    active: 0,
    activeKey: "3",
    envData: [
      {
        name: "PM2.5",
        key: "PM25",
        unit: "ug/m³",
      },
      {
        name: "噪声",
        key: "noise",
        unit: "dB",
      },
      {
        name: "温度",
        key: "mtemp",
        unit: "℃",
      },
      {
        name: "湿度",
        key: "mhumi",
        unit: "%",
      },
      {
        name: "PM1",
        key: "PM1",
        unit: "ug/m3",
      },
      {
        name: "PM10",
        key: "PM10",
        unit: "ug/m3",
      },
      {
        name: "二氧化碳",
        key: "co2",
        unit: "ppm",
      },
      {
        name: "ch2o",
        key: "ch2o",
        unit: "mg/m³",
        standard: 1000,
      },
      {
        name: "tvoc",
        key: "tvoc",
        unit: "mg/m³",
        standard: 1000,
      },
    ],
    aqiGrade: {
      PM25: {
        35: ["green", "优"],
        75: ["yellow", "良"],
        115: ["orange", "轻度污染"],
        150: ["red", "中度污染"],
        250: ["purple", "重度污染"],
        500: ["darkRed", "严重污染"],
      },
      // 气压数组
      Atmosphere: {
        101.325: ["green", "正常"],
        102: ["orange", "超标"],
      },
      // PM1空气质量数组
      PM1: {
        50: ["green", "优"],
        100: ["yellow", "良"],
        150: ["orange", "轻度污染"],
        200: ["red", "中度污染"],
        300: ["purple", "重度污染"],
        500: ["darkRed", "严重污染"],
      },
      // PM10空气质量数组
      PM10: {
        50: ["green", "优"],
        100: ["yellow", "良"],
        150: ["orange", "轻度污染"],
        200: ["red", "中度污染"],
        300: ["purple", "重度污染"],
        500: ["darkRed", "严重污染"],
      },
      // 噪声数组
      noise: {
        50: ["green", "正常"],
        75: ["yellow", "嘈杂"],
        90: ["orange", "超标"],
        110: ["red", "危险"],
      },
      // 光照数组
      mlux: {
        300: ["green", "正常"],
        1000: ["yellow", "适应"],
        1100: ["orange", "强光"],
      },
      // 温度数组
      mtemp: {
        5: ["green", "冷"],
        15: ["yellow", "舒适"],
        25: ["orange", "热"],
        35: ["red", "高温"],
      },
      // 湿度数组
      mhumi: {
        45: ["red", "干燥"],
        60: ["green", "舒适"],
        80: ["yellow", "潮湿"],
      },
      // 二氧化碳数组
      co2: {
        450: ["green", "优"],
        800: ["yellow", "良"],
        1000: ["orange", "超标"],
        1200: ["darkRed", "严重超标"],
      },
      // 甲醛数组
      ch2o: {
        0.08: ["green", "优"],
        0.3: ["yellow", "良"],
        0.8: ["orange", "超标"],
      },
      // TVOC 数组
      tvoc: {
        0.5: ["green", "正常"],
        0.6: ["red", "超标"],
      },
    },
  });

  /**
   * 处理场景变更
   * @param data - 场景数据
   */
  const handleChangeScene = (data: { id: number }) => {
    if (data) {
      executeScene(data.id, "确定要执行该场景吗？");
    } else {
      emitter.emit("openSetting", {
        visible: true,
        key: "3",
      });
    }
  };

  SwiperCore.use([Navigation]);

  watchDeep(
    () => usePublicStoreHook().envPayLoad,
    (val) => {
      const { difference, deviceName } = val;
      getIoTData([deviceName]).then((res) => {
        addOffsets(difference, res[0]?.data.attributes);
      });
    },
  );

  const addOffsets = (
    target: { [key: string]: string },
    data: { [key: string]: number },
  ) => {
    const payload = Object.keys(target).reduce(
      (acc, key) => {
        const offsetKey = key.replace("_offset", "");
        if (Object.prototype.hasOwnProperty.call(data, offsetKey)) {
          // 创建一个新的键值对，而不是修改原始的data对象
          acc[offsetKey] = data[offsetKey] + Number(target[key]);
        }
        return acc;
      },
      { ...data },
    );
    params.envData.forEach((item: any) => {
      const value =
        (item.standard && payload[item.key] / +item.standard) ??
        payload[item.key];
      const obj = FilterAqiGrade(item.key, value);
      item.color = obj.color;
      item.val = obj.val;
      item.value = value;
    });
  };

  const FilterAqiGrade = (key: string, values: number) => {
    const isObjectKey = (obj: any, value: number) => {
      const keys = Object.keys(obj);
      const nearestKey = keys.reduce((nearestKey, key) => {
        return Math.abs(+key - value) < Math.abs(nearestKey - value)
          ? key
          : nearestKey;
      }, Number.MAX_SAFE_INTEGER);
      const nearestValue = obj[nearestKey];
      return {
        color: colorRange[nearestValue[0]],
        val: nearestValue[1],
      };
    };

    return Object.entries(params.aqiGrade)
      .map(([k, val]) => {
        if (k === key) {
          return isObjectKey(val, values);
        }
      })
      .find(Boolean);
  };

  emitter.on("mqttPayload", ({ data }) => {
    const { deviceName, difference } = usePublicStoreHook().envPayLoad;
    if (data.device == deviceName) {
      const { attributes } = data;
      addOffsets(difference, attributes);
    }
  });

  return {
    date,
    week,
    params,
    getAqiColor,
    getImageUrl,
    handleChangeScene,
  };
}
