'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2, Pencil, ArrowRight, TrainFront, Train, Bus, Ship, Plane, Car, Footprints, Bike, Camera, UtensilsCrossed, Hotel, CircleDot, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteItineraryItem } from '@/lib/actions/itinerary';
import { ItineraryForm } from '@/components/trips/itinerary-form';
import { TransportForm } from '@/components/trips/transport-form';
import { sortLinkedList } from '@/lib/utils/linked-list';
import type { ItineraryItem } from '@/lib/types/itinerary';

export type { ItineraryItem };

interface ItineraryTimelineProps {
	tripId?: string;
	items: ItineraryItem[];
	startDate: string | null;
	readOnly?: boolean;
}

const transportTypeLabels: Record<string, string> = {
	shinkansen: '新幹線',
	express: '特急',
	local_train: '在来線',
	bus: 'バス',
	ship: '船',
	airplane: '飛行機',
	car: '車',
	taxi: 'タクシー',
	walk: '徒歩',
	bicycle: '自転車',
	other: 'その他',
};

const transportIcons: Record<string, LucideIcon> = {
	shinkansen: TrainFront,
	express: TrainFront,
	local_train: Train,
	bus: Bus,
	ship: Ship,
	airplane: Plane,
	car: Car,
	taxi: Car,
	walk: Footprints,
	bicycle: Bike,
	other: Train,
};

const categoryIcons: Record<string, LucideIcon> = {
	sightseeing: Camera,
	meal: UtensilsCrossed,
	accommodation: Hotel,
	other: CircleDot,
};

const nodeColors: Record<string, string> = {
	transport: 'bg-blue-100 text-blue-600',
	sightseeing: 'bg-emerald-100 text-emerald-600',
	meal: 'bg-orange-100 text-orange-600',
	accommodation: 'bg-purple-100 text-purple-600',
	other: 'bg-gray-100 text-gray-500',
};

const lineColors: Record<string, string> = {
	transport: 'bg-blue-200',
	sightseeing: 'bg-emerald-200',
	meal: 'bg-orange-200',
	accommodation: 'bg-purple-200',
	other: 'bg-gray-200',
};

function getItemIcon(item: ItineraryItem): LucideIcon {
	if (item.category === 'transport' && item.transportType) {
		return transportIcons[item.transportType] ?? Train;
	}
	return categoryIcons[item.category ?? 'other'] ?? CircleDot;
}

function formatDate(startDate: string, dayNumber: number): string {
	const date = new Date(startDate);
	date.setDate(date.getDate() + dayNumber - 1);
	return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateWithWeekday(startDate: string, dayNumber: number): string {
	const date = new Date(startDate);
	date.setDate(date.getDate() + dayNumber - 1);
	const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
	return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
}

export function ItineraryTimeline({ tripId, items, startDate, readOnly }: ItineraryTimelineProps) {
	const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [activeDay, setActiveDay] = useState<number | null>(null);
	const daySectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

	const maxDay = items.length > 0 ? Math.max(...items.map((i) => i.dayNumber)) : 0;

	const groupedByDay = items.reduce(
		(acc, item) => {
			if (!acc[item.dayNumber]) {
				acc[item.dayNumber] = [];
			}
			acc[item.dayNumber].push(item);
			return acc;
		},
		{} as Record<number, ItineraryItem[]>,
	);

	const dayNumbers = Object.keys(groupedByDay)
		.map(Number)
		.sort((a, b) => a - b);
	const showSidebar = dayNumbers.length >= 2;

	useEffect(() => {
		if (!showSidebar) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible.length > 0) {
					const day = Number(visible[0].target.getAttribute('data-day'));
					setActiveDay(day);
				}
			},
			{ rootMargin: '-20% 0px -60% 0px', threshold: 0 },
		);

		for (const day of dayNumbers) {
			const el = daySectionRefs.current[day];
			if (el) observer.observe(el);
		}

		return () => observer.disconnect();
	}, [showSidebar, dayNumbers.join(',')]);

	function scrollToDay(day: number) {
		const el = daySectionRefs.current[day];
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function handleEdit(item: ItineraryItem) {
		setEditingItem(item);
		setEditDialogOpen(true);
	}

	function handleEditOpenChange(open: boolean) {
		setEditDialogOpen(open);
		if (!open) setEditingItem(null);
	}

	function calcGapMinutes(endTime: string | undefined, nextStartTime: string | undefined): number | null {
		if (!endTime || !nextStartTime) return null;
		const [eh, em] = endTime.split(':').map(Number);
		const [sh, sm] = nextStartTime.split(':').map(Number);
		const diff = sh * 60 + sm - (eh * 60 + em);
		return diff > 0 ? diff : null;
	}

	function formatMinutes(minutes: number): string {
		if (minutes >= 60) {
			const h = Math.floor(minutes / 60);
			const m = minutes % 60;
			return m > 0 ? `${h}時間${m}分` : `${h}時間`;
		}
		return `${minutes}分`;
	}

	if (items.length === 0) {
		return <p className="text-muted-foreground">スポット・移動はまだありません。上のボタンから追加してください。</p>;
	}

	return (
		<>
			<div className={cn('relative', showSidebar && 'flex gap-6')}>
				{/* Date index sidebar */}
				{showSidebar && (
					<nav className="hidden md:block sticky top-20 self-start w-24 shrink-0">
						<ul className="space-y-1">
							{dayNumbers.map((day) => (
								<li key={day}>
									<button
										onClick={() => scrollToDay(day)}
										className={cn(
											'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
											activeDay === day ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
										)}
									>
										<span className="block text-xs">Day {day}</span>
										{startDate && <span className="block text-xs mt-0.5">{formatDate(startDate, day)}</span>}
									</button>
								</li>
							))}
						</ul>
					</nav>
				)}

				{/* Timeline content */}
				<div className="flex-1 min-w-0 space-y-8">
					{Object.entries(groupedByDay)
						.sort(([a], [b]) => Number(a) - Number(b))
						.map(([day, dayItems]) => {
							const sorted = sortLinkedList(dayItems);
							const dayNum = Number(day);
							return (
								<div
									key={day}
									ref={(el) => {
										daySectionRefs.current[dayNum] = el;
									}}
									data-day={day}
									className="scroll-mt-20"
								>
									<h2 className="mb-4 text-lg font-semibold">
										Day {day}
										{startDate && <span className="ml-2 text-sm font-normal text-muted-foreground">{formatDateWithWeekday(startDate, dayNum)}</span>}
									</h2>
									<div className="relative">
										{sorted.map((item, index) => {
											const Icon = getItemIcon(item);
											const category = item.category ?? 'other';
											const isLast = index === sorted.length - 1;
											const startTime = item.startTime?.slice(0, 5);
											const endTime = item.endTime?.slice(0, 5);
											const durationLabel = !startTime && !endTime && item.durationMinutes ? `約${formatMinutes(item.durationMinutes)}` : null;
											const nextItem = !isLast ? sorted[index + 1] : null;
											const nextStartTime = nextItem?.startTime?.slice(0, 5);
											const gapMinutes = calcGapMinutes(endTime, nextStartTime);

											return (
												<div key={item.id}>
													{/* Item row */}
													<div className="relative flex">
														{/* Start time / duration column */}
														<div className="w-14 shrink-0 pt-1.5 text-right">
															{startTime ? (
																<p className="text-sm font-semibold tabular-nums leading-none">{startTime}</p>
															) : durationLabel ? (
																<p className="text-xs font-medium text-muted-foreground leading-none whitespace-nowrap">{durationLabel}</p>
															) : null}
														</div>

														{/* Icon + connector extending to card bottom */}
														<div className="mx-3 flex flex-col items-center">
															<div
																className={cn(
																	'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background',
																	nodeColors[category] ?? 'bg-gray-100 text-gray-500',
																)}
															>
																<Icon className="h-4 w-4" />
															</div>
															{!isLast && <div className={cn('w-0.5 flex-1', lineColors[category] ?? 'bg-gray-200')} />}
														</div>

														{/* Content card */}
														<div className="flex-1 min-w-0 -mt-0.5">
															<div className="rounded-lg border bg-card shadow-sm overflow-hidden">
																{/* Photo */}
																{item.photoUrl && (
																	<div className="relative h-32 w-full">
																		<img
																			src={item.photoUrl}
																			alt={item.title}
																			className="h-full w-full object-cover"
																			referrerPolicy="no-referrer"
																		/>
																	</div>
																)}
																<div className="px-4 py-3">
																{/* Header: title + actions */}
																<div className="flex items-start justify-between gap-2">
																	<h3 className="font-medium leading-snug">{item.title}</h3>
																	{!readOnly && tripId && (
																		<div className="flex shrink-0 items-center -mr-1 -mt-0.5">
																			<Button
																				variant="ghost"
																				size="icon"
																				className="h-7 w-7 text-muted-foreground hover:text-foreground"
																				onClick={() => handleEdit(item)}
																			>
																				<Pencil className="h-3.5 w-3.5" />
																			</Button>
																			<Button
																				variant="ghost"
																				size="icon"
																				className="h-7 w-7 text-muted-foreground hover:text-destructive"
																				onClick={() => deleteItineraryItem(item.id, tripId)}
																			>
																				<Trash2 className="h-3.5 w-3.5" />
																			</Button>
																		</div>
																	)}
																</div>

																{/* Details */}
																<div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
																	{item.category === 'transport' && (item.departureName || item.arrivalName) ? (
																		<span className="flex items-center gap-1">
																			<MapPin className="h-3.5 w-3.5 shrink-0" />
																			{item.departureName ?? ''}
																			{item.departureName && item.arrivalName && <ArrowRight className="mx-0.5 h-3 w-3 shrink-0" />}
																			{item.arrivalName ?? ''}
																		</span>
																	) : item.locationName ? (
																		<span className="flex items-center gap-1">
																			<MapPin className="h-3.5 w-3.5 shrink-0" />
																			{item.locationName}
																		</span>
																	) : null}
																</div>

																{/* Transport details */}
																{item.category === 'transport' && item.transportType && (
																	<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
																		<span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
																			{transportTypeLabels[item.transportType] ?? item.transportType}
																		</span>
																		{item.carNumber && <span className="text-xs text-muted-foreground">{item.carNumber}号車</span>}
																		{item.seatNumber && <span className="text-xs text-muted-foreground">座席 {item.seatNumber}</span>}
																	</div>
																)}

																{/* Description / memo */}
																{item.description && <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>}
															</div>
															</div>
														</div>
													</div>

													{/* Connector section with end time & gap info */}
													{!isLast ? (
														<div className="flex min-h-8">
															{/* End time + gap at bottom of connector */}
															<div className="w-14 shrink-0 flex flex-col items-end justify-center gap-0.5 pr-1 py-1.5 overflow-visible">
																{endTime && <p className="text-xs tabular-nums text-muted-foreground leading-none whitespace-nowrap">{endTime}</p>}
																{gapMinutes !== null && (
																	<p className="text-xs tabular-nums font-medium text-amber-600 leading-none whitespace-nowrap">{formatMinutes(gapMinutes)}</p>
																)}
															</div>
															{/* Connector line */}
															<div className="mx-3 flex justify-center w-8">
																<div className={cn('w-0.5', lineColors[category] ?? 'bg-gray-200')} />
															</div>
															<div className="flex-1" />
														</div>
													) : endTime ? (
														<div className="flex pt-1.5">
															<div className="w-14 shrink-0 text-right pr-1">
																<p className="text-xs tabular-nums text-muted-foreground leading-none">{endTime}</p>
															</div>
															<div className="mx-3 w-8" />
															<div className="flex-1" />
														</div>
													) : null}
												</div>
											);
										})}
									</div>
								</div>
							);
						})}
				</div>
			</div>

			{!readOnly && tripId && editingItem && editingItem.category === 'transport' ? (
				<TransportForm tripId={tripId} maxDay={maxDay} items={items} editItem={editingItem} open={editDialogOpen} onOpenChange={handleEditOpenChange} />
			) : !readOnly && tripId && editingItem ? (
				<ItineraryForm tripId={tripId} maxDay={maxDay} items={items} editItem={editingItem} open={editDialogOpen} onOpenChange={handleEditOpenChange} />
			) : null}
		</>
	);
}
