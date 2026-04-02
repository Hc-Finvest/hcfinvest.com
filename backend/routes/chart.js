import express from 'express';
import ChartLayout from '../models/ChartLayout.js';
import { normalizeSymbol } from '../utils/symbolUtils.js';

const router = express.Router();

/**
 * POST /api/chart/save
 * Saves a user's chart layout, indicators, and drawings.
 */
router.post('/save', async (req, res) => {
  try {
    const { userId, symbol, layoutJson } = req.body;

    if (!userId || !layoutJson) {
      return res.status(400).json({ success: false, message: 'User ID and layout data are required' });
    }

    // v7.77 Strict Normalization
    const targetSymbol = normalizeSymbol(symbol);

    // Update existing layout for this user/symbol or create a new one
    const layout = await ChartLayout.findOneAndUpdate(
      { userId, symbol: targetSymbol },
      { 
        layoutJson,
        timestamp: Date.now()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Chart layout saved successfully', layoutId: layout._id });
  } catch (error) {
    console.error('[CHART_ROUTE] Save layout error:', error);
    res.status(500).json({ success: false, message: 'Error saving chart layout', error: error.message });
  }
});

/**
 * GET /api/chart/load
 * Retrieves a user's saved chart layout.
 */
router.get('/load/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { symbol } = req.query; // ΓöÇΓöÇ┬ü∩╕Å Senior Dev Fix: extract symbol from query
    let targetSymbol = normalizeSymbol(symbol || 'GLOBAL');
    let layout = await ChartLayout.findOne({ userId, symbol: targetSymbol });

    //Sanket v2.0 - Backward compat: check for old .i suffix layouts and migrate
    if (!layout) {
      layout = await ChartLayout.findOne({ userId, symbol: `${targetSymbol}.i` });
      
      if (layout) {
        console.log(`[v2.0] Migrating .i layout for ${userId}: ${targetSymbol}.i -> ${targetSymbol}`);
        layout.symbol = targetSymbol;
        await layout.save();
      }
    }

    if (!layout) {
      return res.status(404).json({ success: false, message: 'No saved layout found' });
    }

    res.json({ success: true, layoutJson: layout.layoutJson, timestamp: layout.timestamp });
  } catch (error) {
    console.error('[CHART_ROUTE] Load layout error:', error);
    res.status(500).json({ success: false, message: 'Error loading chart layout', error: error.message });
  }
});

/**
 * DELETE /api/chart/reset
 * Resets a user's chart layout to original defaults.
 */
router.delete('/reset/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { symbol } = req.query; // ΓöÇΓöÇ┬ü∩╕Å Senior Dev Fix: extract symbol from query
    const targetSymbol = normalizeSymbol(symbol || 'GLOBAL');
    await ChartLayout.findOneAndDelete({ userId, symbol: targetSymbol });

    res.json({ success: true, message: 'Chart layout reset successfully' });
  } catch (error) {
    console.error('[CHART_ROUTE] Reset layout error:', error);
    res.status(500).json({ success: false, message: 'Error resetting chart layout', error: error.message });
  }
});

export default router;
