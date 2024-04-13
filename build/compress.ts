import type { Plugin } from "vite";
import { isArray } from "@pureadmin/utils";
import compressPlugin from "vite-plugin-compression";

// 压缩基本配置
export const configCompressPlugin = (
  compress: ViteCompression,
): Plugin | Plugin[] => {
  if (compress === "none") return [];

  // 基本配置 gz、br、both
  const gz = {
    // 压缩格式
    ext: ".gz",
    // 体积大于 threshold 的文件才压缩
    threshold: 0,
    // 默认压缩.js|mjs|json|css|html后缀的文件，设置为true压缩所有文件
    filter: () => true,
    // 压缩后是否删除原始文件
    deleteOriginFile: false,
  };
  const br = {
    ext: ".br",
    algorithm: "brotliCompress",
    threshold: 0,
    filter: () => true,
    deleteOriginFile: false,
  };
  const codeList = [
    { k: "gzip", v: gz },
    { k: "brotli", v: br },
    { k: "both", v: [gz, br] },
  ];

  const plugins: Plugin[] = [];

  codeList.forEach((item) => {
    if (compress.includes(item.k)) {
      if (compress.includes("clear")) {
        if (isArray(item.v)) {
          item.v.forEach((vItem) => {
            plugins.push(
              compressPlugin(Object.assign(vItem, { deleteOriginFile: true })),
            );
          });
        } else {
          plugins.push(
            compressPlugin(Object.assign(item.v, { deleteOriginFile: true })),
          );
        }
      } else {
        if (isArray(item.v)) {
          item.v.forEach((vItem) => {
            plugins.push(compressPlugin(vItem));
          });
        } else {
          plugins.push(compressPlugin(item.v));
        }
      }
    }
  });
  return plugins;
};
