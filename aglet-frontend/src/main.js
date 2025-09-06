import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// Import Element Plus
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// Import ECharts (via vue-echarts wrapper)
import ECharts from "vue-echarts";
import { use } from "echarts/core";

// Import ECharts modules you need
import {
  CanvasRenderer
} from "echarts/renderers";
import {
  PieChart,
  BarChart
} from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from "echarts/components";

// Register ECharts components
use([CanvasRenderer, PieChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const app = createApp(App);

// Register Element Plus
app.use(ElementPlus);

// Register vue-echarts as global component
app.component("v-chart", ECharts);

app.use(store).use(router).mount("#app");
