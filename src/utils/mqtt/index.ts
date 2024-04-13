import type { ISubscriptionMap } from "mqtt";
import type mqtt from "mqtt";
import { MqttService } from "./utils";
import type { MessageCallback } from "types";

/**
 * 本地 MQTT 客户端类
 */
class MqttLocal {
  private mqttService: any;
  private options: {
    url: string;
    topic?: string;
    keepalive?: number;
    clean?: boolean;
    connectTimeout?: number;
    clientId?: string;
    username?: string;
    password?: string;
  };

  /**
   * 创建MqttLocal实例，初始化MqttService对象.
   * @param options - MQTT连接选项.
   * @param messageCallback - 全局消息回调函数（可选）.
   */
  constructor(options: mqtt.IClientOptions, messageCallback?: MessageCallback) {
    this.mqttService = new MqttService(options, messageCallback);
  }

  /**
   * 连接到MQTT服务器并执行自定义操作.
   */
  public async connectAndOperate(): Promise<void> {
    try {
      await this.mqttService.connect();
    } catch (error) {
      console.error("连接失败:", error);
    }
  }

  /**
   * 订阅多个主题并监听消息.
   * @param subscriptions - 需要订阅的主题列表或映射.
   * @param messageHandler - 消息处理回调函数.
   */
  public async subscribeTopics(
    subscriptions: string[] | ISubscriptionMap,
    messageHandler: MessageCallback,
  ): Promise<void> {
    this.mqttService.globalMessageCallback = messageHandler;
    await this.mqttService.subscribe(subscriptions);
  }

  /**
   * 发布一条消息到指定主题.
   * @param topic - 主题名称.
   * @param message - 消息内容.
   */
  public async publishToTopic(topic: string, message: string): Promise<void> {
    await this.mqttService.publish(topic, message);
  }

  /**
   * 设置属性。
   *
   * @param bank_id - 银行ID。
   * @param device - 设备。
   * @param type - 类型。
   * @param value - 值。
   */
  public setProperty(
    bank_id: any,
    device: any,
    type: string | number,
    value: any,
  ) {
    const attributes = {};
    attributes[type] = value;
    const message = {
      From: "web_page",
      device,
      Payload: { bank_id, attributes },
    };
    this.publishToTopic(this.options.topic, JSON.stringify(message));
  }

  /**
   * 设置属性-多个设备
   *
   * @param bank_id - 银行ID。
   * @param device - 设备。
   * @param attributes - 属性。
   */
  public setProperties(bank_id: any, device: any, attributes: any): void {
    const message = {
      From: "web_page",
      device,
      Payload: { bank_id, attributes },
    };
    this.publishToTopic(this.options.topic, JSON.stringify(message));
  }

  /**
   * 设置Windows远程。
   *
   * @param bank_id - 银行ID。
   * @param device - 设备。
   * @param win_device - Windows设备。
   * @param value - 值。
   */
  public setWindowsRemote(
    bank_id: any,
    device: any,
    win_device: any,
    value: any,
  ) {
    const self = this;

    if (value === 1) {
      self.setProperty(bank_id, device, "powerstate", win_device);

      setTimeout(function () {
        self.setProperty(bank_id, device, "PowerSwitch", value);
      }, 3000);
    } else {
      self.setProperty(bank_id, device, "PowerSwitch", value);

      setTimeout(function () {
        self.setProperty(bank_id, device, "powerstate", win_device);
      }, 3000);
    }
  }

  /**
   * 设置设备属性网关。
   * Set the device property gateway.
   *
   * @param gateway - 网关信息。The gateway information.
   * @param device - 设备信息。The device information.
   * @param data - 数据信息。The data information.
   */
  public setDevicePropertyGateway(gateway: any, device: any, data: any) {
    const subscribe = `v1/gateway/${gateway}/attributes`;
    const message = {
      device,
      data,
    };
    this.mqttService.publishToTopic(
      subscribe,
      JSON.stringify(message),
      function (error: any) {
        if (error) {
          console.log(error);
        } else {
          console.log(subscribe, JSON.stringify(message));
        }
      },
    );
  }

  /**
   * 设置设备属性网关并返回消息。
   *
   * @param gateway - 网关对象。
   * @param device - 设备对象。
   * @param data - 数据对象。
   * @param id - 可选的ID字符串，默认为空。
   * @param callback - 回调函数，用于处理操作完成后的逻辑。
   */
  public setDevicePropertyGatewayAndReturnMessage(
    gateway: any,
    device: any,
    data: any,
    id = "",
    callback: () => any,
  ) {
    const subscribe = `v1/gateway/${gateway}/attributes`;
    const message = {
      device,
      id,
      data,
    };
    this.mqttService.publish(
      subscribe,
      JSON.stringify(message),
      function (error: any) {
        if (error) {
          console.log(error);
        } else {
          console.log(subscribe, JSON.stringify(message));
        }
        callback && callback();
      },
    );
  }

  /**
   * 设置 Windows 远程到网关的状态。
   *
   * @param gateway - 网关对象。
   * @param device - 设备对象。
   * @param win_gateway - Windows 网关对象。
   * @param win_device - Windows 设备对象。
   * @param powerstate - 电源状态。
   */
  public setWindowsRemoteToGateway(
    gateway: any,
    device: any,
    win_gateway: any,
    win_device: any,
    powerstate: number,
  ) {
    const self = this;
    if (powerstate === 1) {
      // 开机先开屏
      self.setDevicePropertyGateway(
        gateway,
        device,
        JSON.stringify({ powerstate }),
      );

      setTimeout(function () {
        self.setDevicePropertyGateway(
          win_gateway,
          win_device,
          JSON.stringify({ PowerSwitch: powerstate }),
        );
      }, 3000);
    } else {
      // 先关机后关屏
      self.setDevicePropertyGateway(
        win_gateway,
        win_device,
        JSON.stringify({ PowerSwitch: powerstate }),
      );
      setTimeout(function () {
        self.setDevicePropertyGateway(
          gateway,
          device,
          JSON.stringify({ powerstate }),
        );
      }, 3000);
    }
  }

  /**
   * 断开 MQTT 连接
   */
  public disconnect(): void {
    this.mqttService.disconnect();
  }
}

export { MqttLocal, MqttService };
