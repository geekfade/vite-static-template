import { withInstall } from "@pureadmin/utils";
import lunarCalendar from "./LunarCalendar.vue";
import settingComponent from "./SettingComponent.vue";

export const ReLunarCalendar = withInstall(lunarCalendar);
export const ReSettingComponent = withInstall(settingComponent);

export default {
  ReLunarCalendar,
  ReSettingComponent,
};
