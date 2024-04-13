<script setup lang="ts">
import { Solar, SolarMonth, SolarWeek, HolidayUtil } from "lunar-typescript";

const now = Solar.fromDate(new Date());

class Day {
  public day: number = 0;
  public text: string = "";
  public isFestival: boolean = false;
  public isToday: boolean = false;
  public isOther: boolean = false;
  public isHoliday: boolean = false;
  public isRest: boolean = false;
}

class Week {
  public days: Day[] = [];
}

class Month {
  public heads: string[] = [];
  public weeks: Week[] = [];
}

const state = reactive({
  year: now.getYear(),
  month: now.getMonth(),
  data: new Month(),
  weekStart: 1,
  heads: ["一", "二", "三", "四", "五", "六", "日"],
  weeks: new Array<Week>(),
});

function buildDay(d: Solar) {
  const lunar = d.getLunar();
  const day = new Day();
  day.day = d.getDay();
  let text = lunar.getDayInChinese();
  if (1 === lunar.getDay()) {
    text = lunar.getMonthInChinese() + "月";
  }
  let otherFestivals = d.getOtherFestivals();
  if (otherFestivals.length > 0) {
    text = otherFestivals[0];
    day.isFestival = true;
  }
  otherFestivals = lunar.getOtherFestivals();
  if (otherFestivals.length > 0) {
    text = otherFestivals[0];
    day.isFestival = true;
  }
  let festivals = d.getFestivals();
  if (festivals.length > 0) {
    text = festivals[0];
    day.isFestival = true;
  }
  festivals = lunar.getFestivals();
  if (festivals.length > 0) {
    text = festivals[0];
    day.isFestival = true;
  }
  const jq = lunar.getJieQi();
  if (jq) {
    text = jq;
    day.isFestival = true;
  }
  day.text = text;
  if (d.toYmd() === now.toYmd()) {
    day.isToday = true;
  }
  if (d.getWeek() === 6 || d.getWeek() === 0) {
    day.isHoliday = true;
    day.isRest = true;
  }
  if (d.getMonth() !== state.month) {
    day.isOther = true;
  }
  const h = HolidayUtil.getHoliday(d.getYear(), d.getMonth(), d.getDay());
  if (h) {
    day.isHoliday = true;
    day.isRest = !h.isWork();
  }
  return day;
}

function render() {
  const month = new Month();
  const weeks: SolarWeek[] = [];
  const solarWeeks = SolarMonth.fromYm(
    parseInt(state.year + "", 10),
    parseInt(state.month + "", 10),
  ).getWeeks(state.weekStart);
  solarWeeks.forEach((w) => {
    weeks.push(w);
  });
  while (weeks.length < 6) {
    weeks.push(weeks[weeks.length - 1].next(1, false));
  }
  weeks.forEach((w) => {
    const week = new Week();
    const heads: string[] = [];
    w.getDays().forEach((d) => {
      heads.push(d.getWeekInChinese());
      week.days.push(buildDay(d));
    });
    month.heads = heads;
    month.weeks.push(week);
  });
  state.data = month;
}

render();

watchDeep(
  () => state.year,
  () => {
    render();
  },
);

watchDeep(
  () => state.month,
  () => {
    render();
  },
);
</script>

<template>
  <div class="body">
    <ul class="week">
      <li
        v-for="(head, index) in state.heads"
        :key="index"
        :class="{ first: index === 0 }"
      >
        {{ head }}
      </li>
    </ul>
    <ul v-for="(week, index) in state.data.weeks" :key="index" class="day">
      <li
        v-for="day in week.days"
        :key="day.day"
        :class="{
          festival: day.isFestival,
          today: day.isToday,
          other: day.isOther,
          rest: day.isRest,
        }"
      >
        {{ day.day }}
        <i>{{ day.text }}</i>
        <u v-if="day.isHoliday"> {{ day.isRest ? "休" : "班" }}</u>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
a {
  color: #fff;
  text-decoration: none;
}

div.title {
  height: 48px;
  line-height: 48px;
  font-size: 15px;
  color: #606266;
  width: 160px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

div.body {
  overflow: hidden;

  li {
    position: relative;
    display: block;
    float: left;
    width: 72px;
    text-align: center;
    overflow: hidden;
    cursor: pointer;
  }

  ul {
    list-style: none;

    li {
      float: left;
    }
  }

  ul.week {
    height: 60px;
    li {
      height: 45px;
      line-height: 45px;
      color: #fff;
      background-color: #2f2c27;
      font-size: 14px;
      margin: 0 10px;
      width: 52px;
      &:nth-child(6),
      &:nth-child(7) {
        background-color: #cf9d4a;
      }
    }
  }

  ul.day {
    li {
      height: 86px;
      font-size: 24px;
      font-weight: bold;
      color: #fff;
      padding-top: 16px;

      i {
        display: block;
        font-style: normal;
        font-size: 13px;
        color: #8c8c8c;
        padding: 0 10px;
        line-height: 13px;
      }

      u {
        font-size: 12px;
        font-style: normal;
        text-decoration: none;
        color: #c58900;
        position: absolute;
        right: 0;
        top: 0;
        width: 26px;
        height: 26px;
        text-align: center;
        line-height: 26px;
      }

      u::before {
        content: "";
        position: absolute;
        right: 0;
        top: 0;
        border: 20px solid #d9534f;
        border-left-color: transparent;
        border-bottom-color: transparent;
        z-index: -1;
      }
    }

    li.row {
      width: 38px;
      color: #a0a0a0;
      font-size: 14px;
      padding-top: 24px;
      font-weight: normal;
      overflow: hidden;
    }

    li.other {
      color: #aaa;

      * {
        filter: alpha(opacity=40);
        -moz-opacity: 0.4;
        opacity: 0.4;
      }
    }

    li.festival {
      i {
        color: #dfcaa2;
        font-size: 9px;
      }
    }

    li.rest {
      color: #f6ab00;
      u::before {
        border-right-color: #5cb85c;
        border-top-color: #5cb85c;
      }
    }

    li.today {
      background: #806b42;
      color: #dfcaa2;

      i {
        color: #dfcaa2;
      }
    }
  }
}
</style>
