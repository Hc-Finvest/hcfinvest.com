import express from 'express';
import ChartLayout from '../models/ChartLayout.js';
import { authMiddleware } from '../middleware/auth.js';
import { normalizeSymbol } from '../utils/symbolUtils.js';

const router = express.Router();
const MAX_LAYOUT_BYTES = parseInt(process.env.CHART_LAYOUT_MAX_BYTES || `${512 * 1024}`, 10);
const CURRENT_LAYOUT_VERSION = parseInt(process.env.CHART_LAYOUT_VERSION || '2', 10);

const resolveChartUserId = (req) => req.user?._id;

const resolveTargetSymbol = (rawSymbol) => {
  const normalized = normalizeSymbol(rawSymbol || 'GLOBAL');
  return normalized || 'GLOBAL';
};

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const getLayoutSizeBytes = (layoutJson) => {
  try {
    return Buffer.byteLength(JSON.stringify(layoutJson ?? {}), 'utf8');
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};

const validateLayoutPayload = (layoutJson) => {
  if (!isPlainObject(layoutJson)) {
    return 'Layout data must be a JSON object';
  }

  if (getLayoutSizeBytes(layoutJson) > MAX_LAYOUT_BYTES) {
    return `Layout data exceeds ${MAX_LAYOUT_BYTES} bytes`;
  }

  return null;
};

router.use(authMiddleware);

router.post('/save', async (req, res) => {
  try {
    const { symbol, layoutJson } = req.body;
    const userId = resolveChartUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user is required' });
    }

    const validationError = validateLayoutPayload(layoutJson);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const targetSymbol = resolveTargetSymbol(symbol);
    const layout = await ChartLayout.findOneAndUpdate(
      { userId, symbol: targetSymbol },
      {
        layoutJson,
        layoutVersion: CURRENT_LAYOUT_VERSION,
        symbol: targetSymbol,
        timestamp: Date.now()
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Chart layout saved successfully',
      layoutId: layout._id,
      symbol: targetSymbol,
      layoutVersion: layout.layoutVersion,
      userScoped: true
    });
  } catch (error) {
    console.error('[CHART_ROUTE] Save layout error:', error);
    return res.status(500).json({ success: false, message: 'Error saving chart layout', error: error.message });
  }
});

const loadLayout = async (req, res) => {
  try {
    const userId = resolveChartUserId(req);
    const targetSymbol = resolveTargetSymbol(req.query.symbol);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user is required' });
    }

    let layout = await ChartLayout.findOne({ userId, symbol: targetSymbol });

    if (!layout && targetSymbol !== 'GLOBAL') {
      layout = await ChartLayout.findOne({ userId, symbol: `${targetSymbol}.I` });
      if (!layout) {
        layout = await ChartLayout.findOne({ userId, symbol: `${targetSymbol}.i` });
      }

      if (layout) {
        console.log(`[Chart] Migrating legacy layout for ${userId}: ${layout.symbol} -> ${targetSymbol}`);
        layout.symbol = targetSymbol;
        await layout.save();
      }
    }

    if (!layout) {
      return res.status(404).json({ success: false, message: 'No saved layout found', symbol: targetSymbol, userScoped: true });
    }

    return res.json({
      success: true,
      layoutJson: layout.layoutJson,
      layoutVersion: layout.layoutVersion || 1,
      timestamp: layout.timestamp,
      symbol: targetSymbol,
      userScoped: true
    });
  } catch (error) {
    console.error('[CHART_ROUTE] Load layout error:', error);
    return res.status(500).json({ success: false, message: 'Error loading chart layout', error: error.message });
  }
};

router.get('/load', loadLayout);
router.get('/load/:userId', loadLayout);

const resetLayout = async (req, res) => {
  try {
    const userId = resolveChartUserId(req);
    const targetSymbol = resolveTargetSymbol(req.query.symbol);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user is required' });
    }

    await ChartLayout.findOneAndDelete({ userId, symbol: targetSymbol });
    return res.json({ success: true, message: 'Chart layout reset successfully', symbol: targetSymbol, userScoped: true });
  } catch (error) {
    console.error('[CHART_ROUTE] Reset layout error:', error);
    return res.status(500).json({ success: false, message: 'Error resetting chart layout', error: error.message });
  }
};

router.delete('/reset', resetLayout);
router.delete('/reset/:userId', resetLayout);

export default router;
