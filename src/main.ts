import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { setOnAuthExpired } from "./api";
import { useAuthStore } from "./stores/auth";
import "./styles/index.css";

const app = createApp(App);
app.use(createPinia()).use(router);

// 세션 만료(refresh 실패) 시 동작을 API 계층에 주입한다.
// API 계층(client/refresh)은 router/store를 직접 import하지 않고,
// "만료 발생"만 알린다. 실제 logout/화면 이동은 여기서 연결한다.
setOnAuthExpired(() => {
  const auth = useAuthStore();
  auth.logout();
  router.push({ name: "login" });
});

app.mount("#root");
