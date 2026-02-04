"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
	RiCheckLine,
	RiCloseLine,
	RiDragMove2Line,
	RiEyeOffLine,
} from "@remixicon/react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { SortableWidget } from "@/components/dashboard/sortable-widget";
import { WidgetSettingsDialog } from "@/components/dashboard/widget-settings-dialog";
import { Button } from "@/components/ui/button";
import WidgetCard from "@/components/widget-card";
import type { DashboardData } from "@/lib/dashboard/fetch-dashboard-data";
import {
	resetWidgetPreferences,
	updateWidgetPreferences,
	type WidgetPreferences,
} from "@/lib/dashboard/widgets/actions";
import {
	type WidgetConfig,
	widgetsConfig,
} from "@/lib/dashboard/widgets/widgets-config";

type DashboardGridEditableProps = {
	data: DashboardData;
	period: string;
	initialPreferences: WidgetPreferences | null;
};

export function DashboardGridEditable({
	data,
	period,
	initialPreferences,
}: DashboardGridEditableProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [isPending, startTransition] = useTransition();

	// Initialize widget order and hidden state
	const defaultOrder = widgetsConfig.map((w) => w.id);
	const [widgetOrder, setWidgetOrder] = useState<string[]>(
		initialPreferences?.order ?? defaultOrder,
	);
	const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(
		initialPreferences?.hidden ?? [],
	);

	// Keep track of original state for cancel
	const [originalOrder, setOriginalOrder] = useState(widgetOrder);
	const [originalHidden, setOriginalHidden] = useState(hiddenWidgets);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Get ordered and visible widgets
	const orderedWidgets = useMemo(() => {
		// Create a map for quick lookup
		const widgetMap = new Map(widgetsConfig.map((w) => [w.id, w]));

		// Get widgets in order, filtering out hidden ones
		const ordered: WidgetConfig[] = [];
		for (const id of widgetOrder) {
			const widget = widgetMap.get(id);
			if (widget && !hiddenWidgets.includes(id)) {
				ordered.push(widget);
			}
		}

		// Add any new widgets that might not be in the order yet
		for (const widget of widgetsConfig) {
			if (
				!widgetOrder.includes(widget.id) &&
				!hiddenWidgets.includes(widget.id)
			) {
				ordered.push(widget);
			}
		}

		return ordered;
	}, [widgetOrder, hiddenWidgets]);

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setWidgetOrder((items) => {
				const oldIndex = items.indexOf(active.id as string);
				const newIndex = items.indexOf(over.id as string);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	}, []);

	const handleToggleWidget = useCallback(
		(widgetId: string) => {
			const newHidden = hiddenWidgets.includes(widgetId)
				? hiddenWidgets.filter((id) => id !== widgetId)
				: [...hiddenWidgets, widgetId];

			setHiddenWidgets(newHidden);

			// Salvar automaticamente ao toggle
			startTransition(async () => {
				await updateWidgetPreferences({
					order: widgetOrder,
					hidden: newHidden,
				});
			});
		},
		[hiddenWidgets, widgetOrder],
	);

	const handleHideWidget = useCallback((widgetId: string) => {
		setHiddenWidgets((prev) => [...prev, widgetId]);
	}, []);

	const handleStartEditing = useCallback(() => {
		setOriginalOrder(widgetOrder);
		setOriginalHidden(hiddenWidgets);
		setIsEditing(true);
	}, [widgetOrder, hiddenWidgets]);

	const handleCancelEditing = useCallback(() => {
		setWidgetOrder(originalOrder);
		setHiddenWidgets(originalHidden);
		setIsEditing(false);
	}, [originalOrder, originalHidden]);

	const handleSave = useCallback(() => {
		startTransition(async () => {
			const result = await updateWidgetPreferences({
				order: widgetOrder,
				hidden: hiddenWidgets,
			});

			if (result.success) {
				toast.success("Preferências salvas!");
				setIsEditing(false);
			} else {
				toast.error(result.error ?? "Erro ao salvar");
			}
		});
	}, [widgetOrder, hiddenWidgets]);

	const handleReset = useCallback(() => {
		startTransition(async () => {
			const result = await resetWidgetPreferences();

			if (result.success) {
				setWidgetOrder(defaultOrder);
				setHiddenWidgets([]);
				toast.success("Preferências restauradas!");
			} else {
				toast.error(result.error ?? "Erro ao restaurar");
			}
		});
	}, [defaultOrder]);

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex items-center justify-end gap-2">
				{isEditing ? (
					<>
						<Button
							variant="outline"
							size="sm"
							onClick={handleCancelEditing}
							disabled={isPending}
							className="gap-2"
						>
							<RiCloseLine className="size-4" />
							Cancelar
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isPending}
							className="gap-2"
						>
							<RiCheckLine className="size-4" />
							Salvar
						</Button>
					</>
				) : (
					<>
						<WidgetSettingsDialog
							hiddenWidgets={hiddenWidgets}
							onToggleWidget={handleToggleWidget}
							onReset={handleReset}
						/>
						<Button
							variant="outline"
							size="sm"
							onClick={handleStartEditing}
							className="gap-2"
						>
							<RiDragMove2Line className="size-4" />
							Reordenar
						</Button>
					</>
				)}
			</div>

			{/* Grid */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={orderedWidgets.map((w) => w.id)}
					strategy={rectSortingStrategy}
				>
					<section className="grid grid-cols-1 gap-3 @4xl/main:grid-cols-2 @6xl/main:grid-cols-3">
						{orderedWidgets.map((widget) => (
							<SortableWidget
								key={widget.id}
								id={widget.id}
								isEditing={isEditing}
							>
								<div className="relative">
									{isEditing && (
										<div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center">
											<div className="flex flex-col items-center gap-2">
												<RiDragMove2Line className="size-8 text-primary" />
												<span className="text-xs font-bold">
													Arraste para mover
												</span>
												<Button
													variant="destructive"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														handleHideWidget(widget.id);
													}}
													className="gap-1 mt-2"
												>
													<RiEyeOffLine className="size-4" />
													Ocultar
												</Button>
											</div>
										</div>
									)}
									<WidgetCard
										title={widget.title}
										subtitle={widget.subtitle}
										icon={widget.icon}
										action={widget.action}
									>
										{widget.component({ data, period })}
									</WidgetCard>
								</div>
							</SortableWidget>
						))}
					</section>
				</SortableContext>
			</DndContext>

			{/* Hidden widgets indicator */}
			{hiddenWidgets.length > 0 && !isEditing && (
				<p className="text-center text-sm text-muted-foreground">
					{hiddenWidgets.length} widget(s) oculto(s) •{" "}
					<button
						onClick={handleReset}
						className="text-primary hover:underline"
					>
						Restaurar todos
					</button>
				</p>
			)}
		</div>
	);
}
