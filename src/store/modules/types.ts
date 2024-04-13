export type appType = {
  device: string; // 设备
  serial: string; // 序列号
  version: string; // 版本号
  client_serial: string;
  address: string;
};

export type userType = {
  bankName: string;
  bankId: number;
  serial: string;
  mqttClientId?: string;
  mqttService?: any;
  mqttLocal?: any;
};
