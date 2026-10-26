import { getCategoryStats, getInsights, getMonthlyTrend, getSummary } from '../services/stats.service.js';

export const summary = async (req, res, next) => {
  try {
    res.json({ success: true, data: await getSummary(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const byCategory = async (req, res, next) => {
  try {
    res.json({ success: true, data: await getCategoryStats(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const monthlyTrend = async (req, res, next) => {
  try {
    res.json({ success: true, data: await getMonthlyTrend(req.user.id) });
  } catch (error) {
    next(error);
  }
};

export const insights = async (req, res, next) => {
  try {
    res.json({ success: true, data: await getInsights(req.user.id) });
  } catch (error) {
    next(error);
  }
};
