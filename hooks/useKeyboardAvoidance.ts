import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to detect virtual keyboard opening and automatically
 * scroll the focused list item into comfortable view above the keyboard.
 */
export function useKeyboardAvoidance() {
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [keyboardSpacerHeight, setKeyboardSpacerHeight] = useState(0);

  const activeElementRef = useRef<HTMLElement | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear any scheduled scroll passes
  const clearScrollTimeouts = useCallback(() => {
    scrollTimeoutsRef.current.forEach(t => clearTimeout(t));
    scrollTimeoutsRef.current = [];
  }, []);

  // Determine dynamic keyboard height
  const getDynamicKeyboardHeight = useCallback((): number => {
    if (typeof window === 'undefined') return 0;

    // 1. If visualViewport has reported a significant shrinkage, use real measured difference
    if (window.visualViewport) {
      const heightDiff = window.innerHeight - window.visualViewport.height;
      if (heightDiff > 60) {
        return heightDiff;
      }
    }

    // 2. If on mobile / touch screen device (or small screen), dynamically estimate realistic keyboard height
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileWidth = window.innerWidth <= 820;

    if (isTouch || isMobileWidth) {
      // Mobile virtual keyboards typically occupy 38% to 46% of window height in portrait mode
      const estimated = Math.round(window.innerHeight * 0.42);
      return Math.min(Math.max(estimated, 270), 400);
    }

    return 0;
  }, []);

  // Calculate visible area above keyboard and scroll smoothly if obscured
  const scrollToFieldIfNeeded = useCallback((element: HTMLElement | null, instant = false) => {
    if (!element || !element.isConnected) return;

    // Find the enclosing card if editing within a list item
    const cardEl = (element.closest('.item-card') || element) as HTMLElement;
    const inputRect = element.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();

    // The boundary of interest is the bottom of the card/input
    const targetBottom = Math.max(inputRect.bottom, cardRect.bottom);
    const targetTop = Math.min(inputRect.top, cardRect.top);

    // Determine the dynamic keyboard height and visible bottom boundary
    const kbHeight = getDynamicKeyboardHeight();
    let visibleBottom = window.innerHeight - kbHeight;

    // If visualViewport provides exact dimensions, use it
    if (window.visualViewport) {
      const vv = window.visualViewport;
      const vvDiff = window.innerHeight - vv.height;
      if (vvDiff > 60) {
        visibleBottom = vv.height + (vv.offsetTop || 0);
      }
    }

    // Comfortable margin between the bottom of the item and the keyboard (24px)
    const MARGIN_BOTTOM = 24;
    const MARGIN_TOP = 16;

    const maxAllowedBottom = visibleBottom - MARGIN_BOTTOM;

    // Check if element is obscured by keyboard or scrolled above viewport
    const isObscuredBelow = targetBottom > maxAllowedBottom;
    const isObscuredAbove = targetTop < MARGIN_TOP;

    // If already fully visible with comfortable margin, avoid unnecessary movement
    if (!isObscuredBelow && !isObscuredAbove) {
      return;
    }

    const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    let targetScrollY = currentScrollY;

    if (isObscuredBelow) {
      const overflow = targetBottom - maxAllowedBottom;
      targetScrollY = currentScrollY + overflow;
    } else if (isObscuredAbove) {
      targetScrollY = Math.max(0, currentScrollY + targetTop - MARGIN_TOP);
    }

    // Scroll to position
    window.scrollTo({
      top: targetScrollY,
      behavior: instant ? 'auto' : 'smooth'
    });
  }, [getDynamicKeyboardHeight]);

  // Ensure bottom spacer has headroom immediately in DOM so window can scroll down
  const ensureHeadroom = useCallback((height: number) => {
    setKeyboardSpacerHeight(height);
    const spacerEl = document.getElementById('keyboard-avoidance-spacer');
    if (spacerEl) {
      spacerEl.style.transition = 'none'; // Instant expansion so document.scrollHeight is ready immediately
      spacerEl.style.height = `${height}px`;
    }
  }, []);

  // Schedule coordinated scroll passes to handle keyboard opening animation
  const scheduleScroll = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    activeElementRef.current = element;

    clearScrollTimeouts();

    const kbHeight = getDynamicKeyboardHeight();
    const neededSpacer = Math.max(kbHeight + 60, 360);
    ensureHeadroom(neededSpacer);

    // Pass 1: Next animation frame
    requestAnimationFrame(() => {
      scrollToFieldIfNeeded(element, false);
    });

    // Pass 2: 120ms (during keyboard slide-in)
    const t1 = setTimeout(() => {
      scrollToFieldIfNeeded(element, false);
    }, 120);

    // Pass 3: 280ms (keyboard nearly fully open)
    const t2 = setTimeout(() => {
      scrollToFieldIfNeeded(element, false);
    }, 280);

    // Pass 4: 420ms (final stabilization pass)
    const t3 = setTimeout(() => {
      scrollToFieldIfNeeded(element, false);
    }, 420);

    scrollTimeoutsRef.current.push(t1, t2, t3);
  }, [clearScrollTimeouts, getDynamicKeyboardHeight, ensureHeadroom, scrollToFieldIfNeeded]);

  useEffect(() => {
    // Focus In handler: identify which field received focus
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (!isInput) return;

      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }

      activeElementRef.current = target;
      setIsKeyboardActive(true);
      scheduleScroll(target);
    };

    // Focus Out handler: restore normal layout when keyboard closes
    const handleFocusOut = () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);

      blurTimeoutRef.current = setTimeout(() => {
        // Only collapse if activeElement is not another input
        const active = document.activeElement;
        const isStillInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (isStillInput) return;

        activeElementRef.current = null;
        setIsKeyboardActive(false);
        clearScrollTimeouts();

        // Smoothly collapse spacer back to 0
        const spacerEl = document.getElementById('keyboard-avoidance-spacer');
        if (spacerEl) {
          spacerEl.style.transition = 'height 250ms cubic-bezier(0.4, 0, 0.2, 1)';
          spacerEl.style.height = '0px';
        }
        setKeyboardSpacerHeight(0);
      }, 160);
    };

    // Custom event listener for explicit triggering from components
    const handleCustomFocus = (e: Event) => {
      const customEvent = e as CustomEvent<HTMLElement>;
      if (customEvent.detail) {
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = null;
        }
        activeElementRef.current = customEvent.detail;
        setIsKeyboardActive(true);
        scheduleScroll(customEvent.detail);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    window.addEventListener('superlist:field-focused', handleCustomFocus);

    // VisualViewport listener for keyboard height changes
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const handleViewportResize = () => {
      if (vv) {
        const heightDiff = window.innerHeight - vv.height;
        if (heightDiff < 50) {
          // Keyboard dismissed on Android (e.g. back button or hide keyboard button)
          const active = document.activeElement;
          const isStillInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
          if (!isStillInput) {
            setIsKeyboardActive(false);
            const spacerEl = document.getElementById('keyboard-avoidance-spacer');
            if (spacerEl) {
              spacerEl.style.transition = 'height 250ms ease-out';
              spacerEl.style.height = '0px';
            }
            setKeyboardSpacerHeight(0);
          }
        } else if (activeElementRef.current) {
          const neededSpacer = Math.max(heightDiff + 60, 360);
          ensureHeadroom(neededSpacer);
          scrollToFieldIfNeeded(activeElementRef.current, false);
        }
      }
    };

    if (vv) {
      vv.addEventListener('resize', handleViewportResize);
      vv.addEventListener('scroll', handleViewportResize);
    }

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('superlist:field-focused', handleCustomFocus);

      if (vv) {
        vv.removeEventListener('resize', handleViewportResize);
        vv.removeEventListener('scroll', handleViewportResize);
      }

      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      clearScrollTimeouts();
    };
  }, [clearScrollTimeouts, ensureHeadroom, scheduleScroll, scrollToFieldIfNeeded]);

  return {
    isKeyboardActive,
    keyboardSpacerHeight,
    scrollToFieldIfNeeded,
    scheduleScroll
  };
}
