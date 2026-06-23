import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { public: true },
    },
    {
      path: "/signup",
      name: "signup",
      component: () => import("@/views/SignupView.vue"),
      meta: { public: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/DefaultLayout.vue"),
      children: [
        { path: "", name: "home", component: () => import("@/views/DashboardView.vue") },
        { path: "json-register", name: "json-register", component: () => import("@/views/JsonRegistrationView.vue") },
        { path: "sessions", name: "sessions", component: () => import("@/views/SessionListView.vue") },
        { path: "problem-detail", name: "problem-detail", component: () => import("@/views/ProblemDetailView.vue") },
        { path: "weak-concepts", name: "weak-concepts", component: () => import("@/views/WeakConceptsView.vue") },
        { path: "calendar", name: "calendar", component: () => import("@/views/CalendarView.vue") },
        { path: "wrong-answers", name: "wrong-answers", component: () => import("@/views/WrongAnswersView.vue") },
        { path: "study-comparison", name: "study-comparison", component: () => import("@/views/StudyComparisonView.vue") },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isLoggedIn) return { name: "login" };
  if (to.name === "login" && auth.isLoggedIn) return { name: "home" };
});

export default router;
