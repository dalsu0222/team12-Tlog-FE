import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
    },
    {
      path: '/main',
      name: 'main',
      component: () => import('@/views/MainView.vue'),
    },
    {
      path: '/plans',
      name: 'plans',
      component: () => import('@/views/PlanList.vue'),
    },
    {
      path: '/plans/:id',
      name: 'plan-detail',
      component: () => import('@/views/PlanDetail.vue'),
      props: true,
    },
    {
      path: '/plan',
      name: 'plan',
      component: () => import('@/views/PlanView.vue'),
    },
    {
      path: '/records',
      name: 'records',
      component: () => import('@/views/RecordList.vue'),
    },
    {
      path: '/records/:id',
      name: 'record-detail',
      component: () => import('@/views/RecordDetail.vue'),
      props: true,
    },
  ],
});

export default router;
