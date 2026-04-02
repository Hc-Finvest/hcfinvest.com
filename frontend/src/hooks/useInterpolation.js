import { useState, useEffect, useRef } from 'react';

/**
 * useInterpolation - Production-grade price interpolation hook
 *
 * Transforms jumpy tick data into smooth frame-based movement.
 * Supports both single numeric values and dual { bid, ask } objects.
 *
 * @param {number|object} target - Latest price from WebSocket
 * @param {number} smoothingFactor - Lerp speed (0.1 slow … 0.3 fast)
 * @param {number} epsilon - Snap-to-target threshold
 */
export const useInterpolation = (target, smoothingFactor = 0.2, epsilon = 0.00001) => {
  //Sanket v2.0 - isObject derived every render; saved to ref so the RAF loop
  // always reads the latest value without any stale-closure risk.
  const isObject = typeof target === 'object' && target !== null && 'bid' in target && 'ask' in target;

  const [displayPrice, setDisplayPrice] = useState(target);

  const targetRef       = useRef(target);
  const displayRef      = useRef(target);
  const requestRef      = useRef();
  const previousTimeRef = useRef();

  //Sanket v2.0 - All prop-derived values live in refs so the single RAF loop
  // (started once at mount, never restarted) always reads the current value.
  const isObjectRef        = useRef(isObject);
  const smoothingFactorRef = useRef(smoothingFactor);
  const epsilonRef         = useRef(epsilon);

  // Keep refs in sync every render — replaces the need to restart the loop
  isObjectRef.current        = isObject;
  smoothingFactorRef.current = smoothingFactor;
  epsilonRef.current         = epsilon;

  // ── Target sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (target === null || target === undefined) return;

    const isObj = isObjectRef.current;

    //Sanket v2.0 - Guard type transition (e.g. initial numeric 0 → first { bid, ask } object).
    // Without this the LERP branch would do object arithmetic → NaN for one frame.
    if (isObj && typeof displayRef.current !== 'object') {
      displayRef.current = target;
      targetRef.current  = target;
      setDisplayPrice(target);
      return;
    }
    if (!isObj && typeof displayRef.current === 'object') {
      displayRef.current = target;
      targetRef.current  = target;
      setDisplayPrice(target);
      return;
    }

    // Teleport on large jumps (>1 % move) to avoid a very long lerp easing in
    let shouldTeleport = false;
    if (isObj) {
      const prevBid  = targetRef.current?.bid || 0;
      const bidDiff  = Math.abs(target.bid - prevBid);
      const threshold = (prevBid || 1) * 0.01;
      shouldTeleport = bidDiff > threshold;
    } else {
      const prev      = typeof targetRef.current === 'number' ? targetRef.current : 0;
      const diff      = Math.abs(target - prev);
      const threshold = (prev || 1) * 0.01;
      shouldTeleport  = diff > threshold && prev !== 0;
    }

    if (shouldTeleport) {
      displayRef.current = target;
      setDisplayPrice(target);
    }

    targetRef.current = target;
  }, [target]); // intentionally omits isObject — read from ref inside

  // ── RAF animate loop ─────────────────────────────────────────────────────
  //Sanket v2.0 - animate stored as a ref so requestAnimationFrame always calls
  // the latest version. All parameters come from refs → zero stale-closure risk.
  // The loop is started ONCE at mount (empty-dep useEffect) and never restarted.
  const animateRef = useRef(null);
  animateRef.current = (time) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime  = (time - previousTimeRef.current) / 1000;
      const targetVal  = targetRef.current;
      const currentVal = displayRef.current;
      const isObj      = isObjectRef.current;
      const sf         = smoothingFactorRef.current;
      const eps        = epsilonRef.current;

      if (targetVal === null || targetVal === undefined) {
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animateRef.current);
        return;
      }

      const lerpFactor = Math.min(1, sf * 60 * deltaTime);

      if (isObj && typeof currentVal === 'object' && currentVal !== null) {
        // Object { bid, ask } path
        const nextBid = currentVal.bid + (targetVal.bid - currentVal.bid) * lerpFactor;
        const nextAsk = currentVal.ask + (targetVal.ask - currentVal.ask) * lerpFactor;
        const finalBid = Math.abs(targetVal.bid - nextBid) < eps ? targetVal.bid : nextBid;
        const finalAsk = Math.abs(targetVal.ask - nextAsk) < eps ? targetVal.ask : nextAsk;
        displayRef.current = { bid: finalBid, ask: finalAsk };
        setDisplayPrice({ bid: finalBid, ask: finalAsk });
      } else if (!isObj && typeof currentVal === 'number') {
        // Scalar numeric path
        const diff = targetVal - currentVal;
        if (Math.abs(diff) < eps) {
          if (currentVal !== targetVal) {
            displayRef.current = targetVal;
            setDisplayPrice(targetVal);
          }
        } else {
          const next = currentVal + diff * lerpFactor;
          displayRef.current = next;
          setDisplayPrice(next);
        }
      }
    }

    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animateRef.current);
  };

  // Single RAF loop — started once at mount, never restarted
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateRef.current);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      } else {
        previousTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(animateRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // empty deps — loop lives for the full lifetime of the consumer

  return displayPrice;
};
