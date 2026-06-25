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
        { path: "register", name: "register", component: () => import("@/views/RegisterView.vue") },
        { path: "sessions", name: "sessions", component: () => import("@/views/SessionListView.vue") },
        { path: "problem-detail", name: "problem-detail", component: () => import("@/views/ProblemDetailView.vue") },
        { path: "weak-concepts", name: "weak-concepts", component: () => import("@/views/WeakConceptsView.vue") },
        { path: "wrong-answers", name: "wrong-answers", component: () => import("@/views/WrongAnswersView.vue") },
        { path: "concepts/:id", name: "concept-summary", component: () => import("@/views/ConceptSummaryView.vue") },
        { path: "reports/growth", name: "growth-report", component: () => import("@/views/GrowthReportView.vue") },
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
