import type { Emitter } from "mitt";
import mitt from "mitt";

/** 全局公共事件需要在此处添加类型 */
type Events = {
  closeSetting: boolean;
  openSetting: any;
  changeStatu: Array<number>;
  mqttPayload: any;
};

export const emitter: Emitter<Events> = mitt<Events>();
