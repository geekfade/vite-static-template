import { isString } from "@pureadmin/utils";
import { emitter } from "@/utils/mitt";
import { selectedKey, updateAreaMenu } from "@/views/system/utils";
/**
 * 提供列操作的自定义钩子。
 * @returns 返回包含参数、下拉引用、获取下拉背景的计算属性和处理标签变化行动的方法的对象。
 */
export function useColumns() {
  const dropRef = ref(null);
  const params = reactive({
    active: 0,
    menuArea: [],
    cloneArea: [],
    dropArea: [],
    visible: false,
    activeIndex: null,
  });

  /**
   * 处理标签变化时触发的行动。
   * @param tag 标签值，决定执行哪个动作。
   * @param row 可选参数，包含行信息的对象，用于获取当前行的详细数据和操作。
   */
  const handleChangeAction = (tag: string | number, row?: any) => {
    // 获取行项目中与区域ID相关的属性
    const { total, isLast, isFirst, parentId } = getAreaIds(row.item);

    // 定义包含两个动作的对象：menu和slide
    const action = {
      menu: () => {
        // 设置激活的菜单项和索引
        params.active = row.index;
        params.activeIndex = `${row.item.area_id}_${row.index}`;
        // 触发状态变化事件
        emitter.emit("changeStatu", total);
      },
      slide: () => {
        // 设置激活的滑块项和索引
        params.active = row.index;
        params.activeIndex = `${row.item.area_id}_${row.index}`;
        // 根据是否是最后一个项来执行不同的逻辑
        if (isLast) {
          // 如果是最后一个项，则进行下一次滚动并更新菜单区域
          const data = params.dropArea.find((item) => item.area_id == parentId);
          if (data) {
            const result = transformData(data).flat();
            if (result.length > 1) {
              params.active = row.index + 1;
              params.menuArea.splice(0, params.menuArea.length, ...result);
              // 计算并设置滚动条的位置
              const scrollLeft = row.index * 271;
              nextTick(() => {
                dropRef.value.$el.scrollLeft = scrollLeft;
              });
              if (row.item?.children) {
                params.active = 0;
              }
            }
          } else {
            const scrollLeft = (row.index - 1) * 271;
            nextTick(() => {
              dropRef.value.$el.scrollLeft = scrollLeft;
            });
          }
        } else if (isFirst) {
          // 如果是第一个项，则将菜单区域重置为克隆的区域
          params.menuArea.splice(
            0,
            params.menuArea.length,
            ...params.cloneArea,
          );
        }
        // 触发状态变化事件
        emitter.emit("changeStatu", total);
      },
    };

    // 根据tag执行相应的动作
    action[tag]?.();
  };

  // 计算函数，获取页面中具有特定id的DOM元素
  const renderParentDom = computed(() => {
    return document.getElementById("dropRef");
  });

  // 计算函数，根据行数据和索引获取对应的背景图片路径
  const getDropBg = computed(() => (row: any, index: any) => {
    // 根据行数据确定使用的背景图片编号
    const url = row.parent_id == "" ? "bg1" : row.children ? "bg2" : "bg3";
    // 判断当前行是否处于激活状态
    const active = `${row.area_id}_${index}` == params.activeIndex;
    // 根据激活状态拼接背景图片路径
    return `src/assets/bg/${url}${active ? "_active" : ""}.svg`;
  });

  // 处理数据，返回与区域ID相关的结构化信息
  const getAreaIds = (
    item: any,
  ): {
    total: number[];
    parentId?: number;
    isLast?: boolean;
    isFirst?: boolean;
  } => {
    // 如果项没有子项且区域ID为0，则认为它是第一个区域
    if (!item.children && item.area_id == 0) {
      return {
        isFirst: true,
        total: [item.area_id],
      };
      // 如果子项以字符串形式存在，则解析该字符串为区域ID数组
    } else if (isString(item.children)) {
      return {
        parentId: item.area_id,
        isLast: true,
        total: item.children.split(",").map((id: string) => Number(id)),
      };
      // 对于具有子项的项，记录其父ID并返回当前区域ID
    } else {
      return {
        parentId: item.parent_id,
        isLast: true,
        total: [item.area_id],
      };
    }
  };

  // 转换数据结构，将parent_id信息嵌入到数据项中
  const transformData = (data: { [x: string]: any; parent_id: any }) => {
    const { parent_id, ...rest } = data;
    return [
      {
        ...rest,
      },
      parent_id?.map((item: any) => ({
        ...item,
      })) ?? [],
    ].filter((item) => !(Array.isArray(item) && item.length === 0));
  };

  // 监听selectedKey的变化，重置相关参数和状态
  watchDeep(
    () => selectedKey.value,
    (newVal) => {
      if (newVal) {
        params.active = 0;
        params.activeIndex = null;
        params.visible = false;
        params.menuArea.splice(0, params.menuArea.length);
        params.dropArea.splice(0, params.dropArea.length);
      }
    },
  );
  onBeforeMount(() => {
    updateAreaMenu(({ menuArea, dropResult }) => {
      params.menuArea.splice(0, params.menuArea.length, ...menuArea);
      params.cloneArea.splice(0, params.cloneArea.length, ...menuArea);
      params.dropArea.splice(0, params.dropArea.length, ...dropResult);
    });
  });

  return {
    params,
    dropRef,
    getDropBg,
    renderParentDom,
    handleChangeAction,
  };
}
