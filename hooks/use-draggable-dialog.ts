import { useCallback, useRef } from "react";

type Position = { x: number; y: number };

const MIN_VISIBLE_PX = 20;

function clampPosition(
	x: number,
	y: number,
	elementWidth: number,
	elementHeight: number,
): Position {
	const maxX = window.innerWidth - MIN_VISIBLE_PX;
	const minX = MIN_VISIBLE_PX - elementWidth;
	const maxY = window.innerHeight - MIN_VISIBLE_PX;
	const minY = MIN_VISIBLE_PX - elementHeight;

	return {
		x: Math.min(Math.max(x, minX), maxX),
		y: Math.min(Math.max(y, minY), maxY),
	};
}

function applyTranslate(el: HTMLElement, x: number, y: number) {
	if (x === 0 && y === 0) {
		el.style.translate = "";
	} else {
		el.style.translate = `${x}px ${y}px`;
	}
}

export function useDraggableDialog() {
	const offset = useRef<Position>({ x: 0, y: 0 });
	const dragStart = useRef<Position | null>(null);
	const initialOffset = useRef<Position>({ x: 0, y: 0 });
	const contentRef = useRef<HTMLElement | null>(null);

	const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
		if (e.button !== 0) return;

		dragStart.current = { x: e.clientX, y: e.clientY };
		initialOffset.current = { x: offset.current.x, y: offset.current.y };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}, []);

	const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
		if (!dragStart.current || !contentRef.current) return;

		const dx = e.clientX - dragStart.current.x;
		const dy = e.clientY - dragStart.current.y;

		const rawX = initialOffset.current.x + dx;
		const rawY = initialOffset.current.y + dy;

		const el = contentRef.current;
		const clamped = clampPosition(rawX, rawY, el.offsetWidth, el.offsetHeight);

		offset.current = clamped;
		applyTranslate(el, clamped.x, clamped.y);
	}, []);

	const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
		dragStart.current = null;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}, []);

	const resetPosition = useCallback(() => {
		offset.current = { x: 0, y: 0 };
		if (contentRef.current) {
			applyTranslate(contentRef.current, 0, 0);
		}
	}, []);

	const dragHandleProps = {
		onPointerDown,
		onPointerMove,
		onPointerUp,
		style: { touchAction: "none" as const, cursor: "grab" },
	};

	const contentRefCallback = useCallback((node: HTMLElement | null) => {
		contentRef.current = node;
	}, []);

	return {
		dragHandleProps,
		contentRefCallback,
		resetPosition,
	};
}
