import mqtt, { type MqttClient, type ISubscriptionMap } from "mqtt";
import type { MessageCallback } from "types";

/**
 * MQTT服务类，用于连接、订阅和发布消息到MQTT服务器。
 */
export class MqttService {
  private client: MqttClient | null = null;
  private options: mqtt.IClientOptions;
  public globalMessageCallback: MessageCallback | null = null;

  /**
   * 创建一个MqttService实例。
   * @param options - MQTT连接选项，包括URL和可选的主题。
   * @param messageCallback - 全局消息回调函数（可选）。
   */
  constructor(options: mqtt.IClientOptions, messageCallback?: MessageCallback) {
    // 初始化MQTT连接选项，并覆盖默认值
    this.options = {
      ...options,
      keepalive: options.keepalive || 60,
      clean: options.clean || true,
      connectTimeout: options.connectTimeout || 4000,
      clientId: options.clientId || "",
      username: options.username || "",
      password: options.password || "",
    };

    // 如果提供了全局消息回调，则赋值
    if (messageCallback) {
      this.globalMessageCallback = messageCallback;
    }
  }

  /**
   * 连接到MQTT服务器。
   */
  public async connect(): Promise<void> {
    console.log("连接类", this.options.clientId);
    // 当前没有客户端实例且存在主机名时尝试连接
    if (!this.client && this.options.hostname) {
      try {
        const connectionOptions = { ...this.options };
        this.client = mqtt.connect(connectionOptions);

        // 设置连接成功和消息接收的回调
        this.client.on("connect", () => console.log("连接成功"));
        this.client.on("message", (topic, message) => {
          this.onMessage(topic, message.toString());
        });

        // 设置错误处理回调
        this.client.on("error", (err) => {
          console.error("连接到MQTT服务器时发生错误:", err);
          this.handleConnectionError(err);
        });
      } catch (error) {
        console.error("MQTT连接异常:", error);
        this.handleConnectionError(error);
      }
    }
  }

  /**
   * 处理连接错误的函数，可包含重试逻辑等。
   */
  private handleConnectionError(error: Error) {
    console.log("处理连接错误", error);
  }

  /**
   * 当接收到消息时的处理函数。
   * 如果设置了全局消息回调，则调用该回调。
   */
  private onMessage(topic: string, message: string) {
    if (this.globalMessageCallback) {
      this.globalMessageCallback(topic, message);
    }
  }

  /**
   * 订阅指定主题的消息。
   * @param subscribe - 要订阅的主题。
   */
  public async subscribe(
    subscribe: string | string[] | ISubscriptionMap,
  ): Promise<void> {
    // 当存在客户端实例且有订阅主题时进行订阅
    if (this.client && subscribe) {
      try {
        this.client.subscribe(subscribe);
        console.log("已订阅主题:", subscribe);
      } catch (err) {
        console.error("订阅主题时发生错误:", err);
      }
    }
  }

  /**
   * 发布消息到指定主题。
   * @param topic - 主题名称。
   * @param message - 消息内容。
   */
  public async publish(topic: string, message: string): Promise<void> {
    // 当存在客户端实例时发布消息
    if (this.client) {
      try {
        this.client.publish(topic, message, { qos: 1, retain: false });
        console.log(`消息发布到主题: ${topic},${message}`);
      } catch (err) {
        console.error("发布消息时发生错误:", err);
      }
    }
  }

  /**
   * 断开与MQTT服务器的连接。
   */
  public disconnect(): void {
    // 如果存在客户端实例则结束连接并置为null
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }
}
