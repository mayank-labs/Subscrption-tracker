const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export type User = { id: string; name: string; email: string };
export type ApiSubscription = {
  id: string;
  name: string;
  price: string;
  currency: string;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  category: string;
  paymentMethod: string;
  status: 'ACTIVE' | 'CANCELLED';
  startDate: string;
  renewalDate: string;
};
export type Summary = {
  monthlySpend: number;
  yearlySpend: number;
  activeSubscriptions: number;
  nextRenewal: string | null;
};
export type CategoryStat = { category: string; monthlySpend: number };
export type Trend = { month: string; projectedSpend: number };
export type Insights = {
  mostExpensive: { name: string; monthlySpend: number } | null;
  monthlyTotal: number;
  projectedYearlySpend: number;
  categoryCount: number;
};

let accessToken: string | null = null;

const request = async <T>(path: string, options: RequestInit = {}, retry = true): Promise<T> => {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });

  if (response.status === 401 && retry && path !== '/auth/refresh') {
    try {
      await refresh();
      return request<T>(path, options, false);
    } catch {
      accessToken = null;
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export const signIn = async (email: string, password: string) => {
  const result = await request<{ data: { accessToken: string; user: User } }>('/auth/sign-in', {
    method: 'POST', body: JSON.stringify({ email, password }),
  }, false);
  accessToken = result.data.accessToken;
  return result.data.user;
};

export const signUp = async (name: string, email: string, password: string) => {
  const result = await request<{ data: { accessToken: string; user: User } }>('/auth/sign-up', {
    method: 'POST', body: JSON.stringify({ name, email, password }),
  }, false);
  accessToken = result.data.accessToken;
  return result.data.user;
};

export const refresh = async () => {
  const result = await request<{ data: { accessToken: string; user: User } }>('/auth/refresh', { method: 'POST' }, false);
  accessToken = result.data.accessToken;
  return result.data.user;
};

export const signOut = async () => {
  await request('/auth/sign-out', { method: 'POST' }, false);
  accessToken = null;
};

export const getSubscriptions = () => request<{ data: ApiSubscription[] }>('/subscriptions');
export const createSubscription = (data: Record<string, unknown>) =>
  request<{ data: ApiSubscription }>('/subscriptions', { method: 'POST', body: JSON.stringify(data) });
export const updateSubscription = (id: string, data: Record<string, unknown>) =>
  request<{ data: ApiSubscription }>(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubscription = (id: string) => request(`/subscriptions/${id}`, { method: 'DELETE' });
export const getSummary = () => request<{ data: Summary }>('/stats/summary');
export const getCategoryStats = () => request<{ data: CategoryStat[] }>('/stats/by-category');
export const getTrend = () => request<{ data: Trend[] }>('/stats/monthly-trend');
export const getInsights = () => request<{ data: Insights }>('/stats/insights');

export const downloadSubscriptions = async () => {
  const response = await fetch(`${API_URL}/subscriptions/export.csv`, {
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok) throw new Error('Unable to export subscriptions');
  return response.blob();
};
