/**
 * @name 接口树状结构
 * @param apiList
 * @param prefix
 * @param result
 * @returns
 */
export const flattenApiList = (
  apiList: Record<string, any>,
  prefix = "",
  result: Record<string, any> = {},
) => {
  Object.entries(apiList).forEach(([key, value]) => {
    const url = `${prefix}${key}`;
    const lastTwoLevels = prefix
      .split("/")
      .slice(-2)
      .join("")
      .replace(/^\w/, (c) => c.toUpperCase());
    if (Array.isArray(value)) {
      value.forEach((v: string) => {
        const formattedMethodName = v.replace(/^\w/, (c) => c.toUpperCase());
        const formattedKey = key
          .replace(/\/$/, "")
          .replace(/^\w/, (c) => c.toUpperCase());
        const methodName = `getAsync${lastTwoLevels}${formattedKey}${formattedMethodName}`;
        const camelCaseMethodName = methodName.replace(
          /_([a-z])/g,
          (_match, p1) => p1.toUpperCase(),
        );
        result[camelCaseMethodName] = url + v;
      });
    } else {
      flattenApiList(value, url, result);
    }
  });
  return result;
};

/**
 * Represents the range of AQI (Air Quality Index) values and their corresponding colors.
 * 表示 AQI（空气质量指数）值的范围及其对应的颜色。
 */
export const aqiRange = reactive({
  50: "#a7cf8c",
  100: "#f7da64",
  150: "#f29e39",
  200: "#da555d",
  300: "#b9377a",
  400: "#881326",
});

// 键对应颜色
export const colorRange = reactive({
  green: "#a7cf8c",
  yellow: "#f7da64",
  orange: "#f29e39",
  red: "#da555d",
  purple: "#b9377a",
  darkRed: "#881326",
});

/**
 * Get the color corresponding to the given AQI (Air Quality Index) value.
 * 获取与给定的 AQI（空气质量指数）值对应的颜色。
 *
 * @param aqi - The AQI value.
 * @returns The color corresponding to the given AQI value.
 */
export const getAqiColor = (aqi: number) => {
  const keys = Object.keys(aqiRange);
  const nearestKey = keys.reduce((nearestKey: number, key) => {
    return Math.abs(Number(key) - aqi) < Math.abs(nearestKey - aqi)
      ? Number(key)
      : nearestKey;
  }, Number.MAX_SAFE_INTEGER);
  const nearestValue = aqiRange[nearestKey as keyof typeof aqiRange];
  return nearestValue;
};

/**
 * 获取图片的URL
 * @param name 图片名称，不包含文件扩展名
 * @returns 图片的完整URL路径
 */
export const getImageUrl = (name: string) => {
  // 通过import.meta.url获取当前模块的基URL，然后拼接上图片名称和路径，构造图片的完整URL
  return new URL(`../assets/${name}`, import.meta.url).href;
};
