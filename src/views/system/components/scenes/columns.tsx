import { message } from "ant-design-vue";
import dayjs from "dayjs";
import { apiFnList } from "@/api";
import { usePublicStoreHook } from "@/store/modules/public";

export function useColumns() {
  const { taskList, executeScene } = usePublicStoreHook();
  const columns = ref([
    {
      title: "场景名称",
      dataIndex: "name",
    },
    {
      title: "场景类型",
      dataIndex: "age",
    },
    {
      title: "执行时间",
      dataIndex: "age",
    },
    {
      title: "是否开启",
      dataIndex: "age",
    },
    {
      title: "执行操作",
      dataIndex: "address",
    },
  ]);

  /**
   * 获取指定星期的日期
   * @param {Object} item - 任务项
   * @param {number} week - 星期数
   * @returns {string} - 返回日期对应的颜色值，如果不匹配则返回空字符串
   */
  const getWeekDate = (
    item: {
      task_type: number;
      next_time: string | number | dayjs.Dayjs | Date;
    },
    week: number,
  ): string => {
    const today = +dayjs().format("d");
    if (item.task_type === 1) {
      const nextTime =
        item.next_time === "-" ? today + 1 : +dayjs(item.next_time).format("d");
      return (nextTime == week && "#867044") || "";
    } else {
      return (today == week && "#867044") || "";
    }
  };

  /**
   * 处理任务变更
   * @param {number} id - 任务ID
   * @param {number} statu - 任务状态
   */
  const handleTaskChange = async (id: number, statu: number) => {
    const { status } = await apiFnList.getAsyncApiLocalTaskChange({
      id,
      status: statu,
    });
    if (status == 200) {
      message.success("操作成功");
    }
  };
  return {
    columns,
    taskList,
    getWeekDate,
    executeScene,
    handleTaskChange,
  };
}
