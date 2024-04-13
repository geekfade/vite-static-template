import { usePublicStoreHook } from "@/store/modules/public";
import {
  menuList,
  loadingMap,
  selectedKey,
  findMenuKey,
  handleChangeMenu,
  initEquipmentList,
  getMqttPayload,
  removeMqttPayload,
} from "./utils";
import { getImageUrl } from "@/utils";

export function useColumns() {
  const { date, week } = usePublicStoreHook();

  onBeforeMount(() => {
    initEquipmentList();
    getMqttPayload();
  });

  onBeforeUnmount(() => {
    removeMqttPayload();
  });

  return {
    date,
    week,
    menuList,
    loadingMap,
    selectedKey,
    findMenuKey,
    getImageUrl,
    handleChangeMenu,
  };
}
