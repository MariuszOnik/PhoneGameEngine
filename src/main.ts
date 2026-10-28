import "./style.css";
import { mountSplitLayout } from "./layout/splitLayout";

const app = document.querySelector<HTMLDivElement>("#app")!;
mountSplitLayout(app);
