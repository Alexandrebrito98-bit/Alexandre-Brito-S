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
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure keyboard height using Visual Viewport API
  const getKeyboardHeight = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    if (window.visualViewport) {
      const heightDiff = window.innerHeight - window.visualViewport.height;
      return heightDiff > 100 ? heightDiff : 0;
    }
    return 0;
  }, []);

  // Calculate visible area above keyboard and scroll smoothly if obscured
  const scrollToFieldIfNeeded = useCallback((element: HTMLElement | null) => {
    if (!element || !element.isConnected) return;

    const rect = element.getBoundingClientRect();

    // Determine the visible area bottom boundary
    let visibleBottom = window.innerHeight;
    let viewportOffsetTop = 0;

    if (window.visualViewport) {
      viewportOffsetTop = window.visualViewport.offsetTop || 0;
      visibleBottom = window.visualViewport.height + viewportOffsetTop;
    }

    // Also account for the fixed footer if it's visible on screen and not hidden
    const footerEl = document.querySelector('footer');
    if (footerEl) {
      const footerRect = footerEl.getBoundingClientRect();
      // If footer is visible in the viewport and above keyboard line
      if (footerRect.top > 120 && footerRect.top < visibleBottom && !footerEl.classList.contains('translate-y-full')) {
        visibleBottom = footerRect.top;
      }
    }

    // Comfortable margin above the keyboard (20–40px)
    const MARGIN_BOTTOM = 32;
    const MARGIN_TOP = 20;

    // Check if element is partially or fully hidden
    const isObscuredBelow = (rect.bottom + MARGIN_BOTTOM) > visibleBottom;
    const isObscuredAbove = rect.top < MARGIN_TOP;

    // If already fully visible with comfortable margin, avoid unnecessary movement
    if (!isObscuredBelow && !isObscuredAbove) {
      return;
    }

    let targetScrollY = window.scrollY;

    if (isObscuredBelow) {
      const overflow = (rect.bottom + MARGIN_BOTTOM) - visibleBottom;
      targetScrollY = window.scrollY + overflow;
    } else if (isObscuredAbove) {
      targetScrollY = Math.max(0, window.scrollY + rect.top - MARGIN_TOP);
    }

    // Smooth scroll animation
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }, []);

  // Schedule multiple passes to ensure alignment during/after keyboard animation
  const scheduleScroll = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    activeElementRef.current = element;

    // Pass 1: Next animation frame
    requestAnimationFrame(() => {
      scrollToFieldIfNeeded(element);
    });

    // Pass 2: Mid-animation (120ms)
    setTimeout(() => {
      scrollToFieldIfNeeded(element);
    }, 120);

    // Pass 3: Keyboard fully open (320ms)
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      scrollToFieldIfNeeded(element);
    }, 320);
  }, [scrollToFieldIfNeeded]);

  useEffect(() => {
    // Focus In handler: identify which field received focus
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Only handle inputs / textareas
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (!isInput) return;

      // Clear pending blur if switching between items
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }

      activeElementRef.current = target;
      setIsKeyboardActive(true);

      // Provide dynamic temporary headroom so bottom-most items can scroll up freely
      const measuredKb = getKeyboardHeight();
      const spacer = Math.max(measuredKb, 340);
      setKeyboardSpacerHeight(spacer);

      scheduleScroll(target);
    };

    // Focus Out handler: restore normal layout when keyboard closes
    const handleFocusOut = () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);

      blurTimeoutRef.current = setTimeout(() => {
        activeElementRef.current = null;
        setIsKeyboardActive(false);
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
        const measuredKb = getKeyboardHeight();
        setKeyboardSpacerHeight(Math.max(measuredKb, 340));
        scheduleScroll(customEvent.detail);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    window.addEventListener('superlist:field-focused', handleCustomFocus);

    // VisualViewport listener for keyboard height changes
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const handleViewportResize = () => {
      const kbHeight = getKeyboardHeight();
      if (kbHeight < 50) {
        // Keyboard dismissed (e.g. Android back button or keyboard down button)
        setIsKeyboardActive(false);
        setKeyboardSpacerHeight(0);
      } else if (activeElementRef.current) {
        setKeyboardSpacerHeight(Math.max(kbHeight, 340));
        scheduleScroll(activeElementRef.current);
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
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [getKeyboardHeight, scheduleScroll]);

  return {
    isKeyboardActive,
    keyboardSpacerHeight,
    scrollToFieldIfNeeded,
    scheduleScroll
  };
}
