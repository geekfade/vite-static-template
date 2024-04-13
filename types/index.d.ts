// 此文件跟同级目录的 global.d.ts 文件一样也是全局类型声明，只不过这里存放一些零散的全局类型，无需引入直接在 .vue 、.ts 、.tsx 文件使用即可获得类型提示

import mqtt from "mqtt";

type RefType<T> = T | null;

type Recordable<T = any> = Record<string, T>;

type MessageCallback = (topic: string, message: string) => void;

interface ChangeEvent extends Event {
  target: HTMLInputElement;
}

interface WheelEvent {
  path?: EventTarget[];
}

interface ImportMetaEnv extends ViteEnv {
  __: unknown;
}

interface MqttOptions extends mqtt.IClientOptions {}
interface Fn<T = any, R = T> {
  (...arg: T[]): R;
}

interface PromiseFn<T = any, R = T> {
  (...arg: T[]): Promise<R>;
}

interface ComponentElRef<T extends HTMLElement = HTMLDivElement> {
  $el: T;
}

/**
 * @name 接口返回数据类型
 */
interface IRT {
  code: number;
  msg: string;
  data: any;
}

interface MenuItem {
  typeKey: string; // 用于标识
  typeName: string; // 用于展示
  isArea: boolean; // 是否是区域
  isNumber: boolean; // 是否显示数字
  isMenu?: boolean; // 是否是菜单
  isDefault?: boolean; // 是否默认选中
  url?: string; // 接口地址
  component?: any; // 子组件
  params?: {
    product_key: string;
  }; // 用于传递参数
}


function parseInt(s: string | number, radix?: number): number;

function parseFloat(string: string | number): number;
