import { withInstall } from "@pureadmin/utils";
import curtains from "./curtains/index.vue";
import equipment from "./equipment/index.vue";
import lamplight from "./lamplight/index.vue";
import scenes from "./scenes/index.vue";
import totalControl from "./totalControl/index.vue";
import air from "./air/index.vue";
import header from "./hooks/header/index.vue";
import main from "./hooks/main.vue";
import footer from "./hooks/footer.vue";

export const ReCurtains = withInstall(curtains);
export const ReEquipment = withInstall(equipment);
export const ReLamplight = withInstall(lamplight);
export const ReScenes = withInstall(scenes);
export const ReTotalControl = withInstall(totalControl);
export const ReAir = withInstall(air);
export const ReHeader = withInstall(header);
export const ReMain = withInstall(main);
export const ReFooter = withInstall(footer);

export default {
  ReCurtains,
  ReEquipment,
  ReLamplight,
  ReScenes,
  ReTotalControl,
  ReAir,
  ReHeader,
  ReMain,
  ReFooter,
};
