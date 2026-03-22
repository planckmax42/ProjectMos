import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/components/layout/MainLayout';

// 懒加载页面组件
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const EnergyRecords = lazy(() => import('@/pages/energy/EnergyRecords'));
const EnergyImport = lazy(() => import('@/pages/energy/EnergyImport'));
const EnergySummary = lazy(() => import('@/pages/statistics/EnergySummary'));
const TrendAnalysis = lazy(() => import('@/pages/statistics/TrendAnalysis'));
const CopAnalysis = lazy(() => import('@/pages/statistics/CopAnalysis'));
const AnomalyDetection = lazy(() => import('@/pages/statistics/AnomalyDetection'));
const ReportGenerate = lazy(() => import('@/pages/report/ReportGenerate'));
const ScheduledReport = lazy(() => import('@/pages/report/ScheduledReport'));
const BuildingList = lazy(() => import('@/pages/building/BuildingList'));
const DeviceManagement = lazy(() => import('@/pages/building/DeviceManagement'));
const Settings = lazy(() => import('@/pages/Settings'));
const Login = lazy(() => import('@/pages/Login'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Loading组件
const PageLoading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }}>
    <Spin size="large" tip="加载中..." />
  </div>
);

// 包装懒加载组件
const lazyLoad = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<PageLoading />}>
    <Component />
  </Suspense>
);

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/login',
    element: lazyLoad(Login),
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: lazyLoad(Dashboard),
      },
      {
        path: 'energy',
        children: [
          {
            path: 'records',
            element: lazyLoad(EnergyRecords),
          },
          {
            path: 'import',
            element: lazyLoad(EnergyImport),
          },
        ],
      },
      {
        path: 'statistics',
        children: [
          {
            path: 'summary',
            element: lazyLoad(EnergySummary),
          },
          {
            path: 'trend',
            element: lazyLoad(TrendAnalysis),
          },
          {
            path: 'cop',
            element: lazyLoad(CopAnalysis),
          },
          {
            path: 'anomaly',
            element: lazyLoad(AnomalyDetection),
          },
        ],
      },
      {
        path: 'report',
        children: [
          {
            path: 'generate',
            element: lazyLoad(ReportGenerate),
          },
          {
            path: 'scheduled',
            element: lazyLoad(ScheduledReport),
          },
        ],
      },
      {
        path: 'building',
        children: [
          {
            path: 'list',
            element: lazyLoad(BuildingList),
          },
          {
            path: 'devices',
            element: lazyLoad(DeviceManagement),
          },
        ],
      },
      {
        path: 'settings',
        element: lazyLoad(Settings),
      },
    ],
  },
  {
    path: '*',
    element: lazyLoad(NotFound),
  },
]);