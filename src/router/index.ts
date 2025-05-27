import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/LoginView.vue'),
        },
        {
          path: 'signup',
          name: 'signup',
          component: () => import('@/views/SignupView.vue'),
        },
        {
          path: 'records',
          name: 'records',
          component: () => import('@/views/RecordList.vue'),
        },
        {
          path: 'records/:id',
          name: 'record-detail',
          component: () => import('@/views/RecordDetail.vue'),
          props: true,
        },
        {
          path: '/plans',
          name: 'plans',
          component: () => import('@/views/PlanList.vue'),
        },
        {
          path: '/my',
          name: 'my',
          component: () => import('@/views/MyPage.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/plan/:id',
          name: 'plan-detail',
          component: () => import('@/views/PlanDetail.vue'),
          props: true,
        },
      ],
    },

    {
      path: '/plan',
      name: 'plan',
      component: () => import('@/views/PlanView.vue'),
    },
    {
      path: '/plan/:id/edit',
      name: 'PlanEdit',
      component: () => import('@/views/PlanEditView.vue'),
      props: true,
      meta: {
        requiresAuth: true, // 로그인 필요
      },
    },
    // 도시 정보와 함께 여행 계획 페이지로 이동
    {
      path: '/plan/:cityId/:cityEn/:cityKo',
      name: 'plan-with-city',
      component: () => import('@/views/PlanView.vue'),
      props: true,
      meta: { requiresAuth: true }, // 로그인 필요
    },
  ],
});

// 라우터 가드 추가
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 인증이 필요한 페이지인데 로그인이 되어있지 않은 경우, 로그인 페이지로 리다이렉트
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;
