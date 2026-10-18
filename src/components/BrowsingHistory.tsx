"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2, Clock } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Rating } from "@/components/ui/Rating";
import { cn, discountPercent } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";
import { useI18n } from "@/context/I18nContext";
import { supabase, isDatabaseConfigured } from "@/lib/db";
import type { Product } from "@/types";

const SESSION_KEY = "gt_sid";
const LOCAL_HISTORY_KEY = "gt_browsing_history";
const MAX_LOCAL = 12;

interface HistoryEntry {
	productId: string;
	slug: string;
	title: string;
	image: string;
	price: number;
	viewedAt: string;
}

interface BrowsingHistoryProps {
	relatedProducts?: Product[];
	className?: string;
}

function getSessionId(): string {
	if (typeof window === "undefined") return "";
	try {
		const existing = localStorage.getItem(SESSION_KEY);
		if (existing) return existing;
	} catch {
		/* ignore */
	}
	const id = crypto.randomUUID();
	try {
		localStorage.setItem(SESSION_KEY, id);
	} catch {
		/* ignore */
	}
	return id;
}

function getLocalHistory(): HistoryEntry[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
		if (!raw) return [];
		return JSON.parse(raw) as HistoryEntry[];
	} catch {
		return [];
	}
}

function saveLocalHistory(entries: HistoryEntry[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(
			LOCAL_HISTORY_KEY,
			JSON.stringify(entries.slice(0, MAX_LOCAL)),
		);
	} catch {
		/* ignore */
	}
}

export function logBrowsingHistory(product: Product): void {
	if (typeof window === "undefined") return;
	const sessionId = getSessionId();
	const entry: HistoryEntry = {
		productId: product.id,
		slug: product.slug,
		title: product.title,
		image: product.images[0] ?? "",
		price: product.price,
		viewedAt: new Date().toISOString(),
	};

	const existing = getLocalHistory().filter((e) => e.productId !== product.id);
	const updated = [entry, ...existing].slice(0, MAX_LOCAL);
	saveLocalHistory(updated);

	if (isDatabaseConfigured()) {
		void (async () => {
			try {
				await supabase.from("browsing_history").insert({
					session_id: sessionId,
					product_id: product.id,
					product_slug: product.slug,
					product_title: product.title,
					product_image: product.images[0] ?? null,
					product_price: product.price,
				});
			} catch {
				/* ignore */
			}
		})();
	}
}

export function BrowsingHistory({
	relatedProducts = [],
	className,
}: BrowsingHistoryProps) {
	const { dir } = useI18n();
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const scrollRef = useRef<HTMLDivElement>(null);
	const historyScrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setHistory(getLocalHistory());
	}, []);

	const scroll = useCallback(
		(direction: "left" | "right", target: "related" | "history") => {
			const ref =
				target === "related" ? scrollRef.current : historyScrollRef.current;
			if (!ref) return;
			const amount = 280;
			const delta = direction === "left" ? -amount : amount;
			ref.scrollBy({
				left: dir === "rtl" ? -delta : delta,
				behavior: "smooth",
			});
		},
		[dir],
	);

	function clearHistory() {
		saveLocalHistory([]);
		setHistory([]);
		const sessionId = getSessionId();
		if (isDatabaseConfigured()) {
			void (async () => {
				try {
					await supabase
						.from("browsing_history")
						.delete()
						.eq("session_id", sessionId);
				} catch {
					/* ignore */
				}
			})();
		}
	}

	return (
		<div
			className={cn(
				"space-y-8 py-8 bg-surface-elevated/30 border-t border-border/60",
				className,
			)}
		>
			{/* 1. Related Products Sections */}
			{relatedProducts.length > 0 && (
				<section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between mb-6 border-b border-border/40 pb-3">
						<h2 className="text-xl font-bold text-text tracking-wide">
							{dir === "rtl"
								? "منتجات ذات علاقة بما تصفحته مسبقاً"
								: "Related to items you viewed"}
						</h2>
						<div className="flex gap-2">
							<button
								onClick={() => scroll("left", "related")}
								className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold transition-colors shadow-sm"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<button
								onClick={() => scroll("right", "related")}
								className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-text hover:text-gold transition-colors shadow-sm"
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>

					<div
						ref={scrollRef}
						className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
					>
						{relatedProducts.map((product) => {
							const discount = discountPercent(
								product.price,
								product.compareAtPrice,
							);
							return (
								<Link
									key={product.id}
									href={`/product/${product.slug}`}
									className="group shrink-0 w-52 bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-300"
								>
									<div className="relative h-44 overflow-hidden bg-surface-elevated">
										<SafeImage
											src={product.images[0] ?? ""}
											alt={product.title}
											fill
											sizes="208px"
											className="object-cover transition-transform duration-500 group-hover:scale-105"
										/>
										{discount !== null && (
											<span className="absolute top-2 right-2 bg-success text-white text-xs font-bold px-2 py-0.5 rounded-md">
												-{discount}%
											</span>
										)}
									</div>
									<div className="p-3 space-y-2">
										<h3 className="text-xs font-semibold text-muted line-clamp-1">
											{product.brand}
										</h3>
										<h4 className="text-sm font-medium text-text line-clamp-2 min-h-[2.5rem] leading-snug">
											{product.title}
										</h4>
										<Rating
											rating={product.rating}
											reviewCount={product.reviewCount}
											size="sm"
										/>
										<div className="flex items-baseline gap-2 pt-1">
											<span className="text-base font-bold text-gold">
												{formatPrice(product.price)}
											</span>
											{product.compareAtPrice && (
												<span className="text-xs text-muted line-through">
													{formatPrice(product.compareAtPrice)}
												</span>
											)}
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				</section>
			)}

			{/* 2. Amazon-style Browsing History Footer */}
			{history.length > 0 && (
				<section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 border-t border-border/40 pt-8 mt-4">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-2">
							<Clock className="h-5 w-5 text-gold animate-pulse" />
							<h2 className="text-lg font-bold text-text">
								{dir === "rtl"
									? "سجل التصفح الخاص بك"
									: "Your Recently Viewed Items"}
							</h2>
						</div>
						<button
							onClick={clearHistory}
							className="flex items-center gap-1.5 text-xs text-muted hover:text-error transition-colors bg-surface border border-border px-3 py-1.5 rounded-lg shadow-sm"
						>
							<Trash2 className="h-3.5 w-3.5" />
							<span>
								{dir === "rtl" ? "مسح السجل بالكامل" : "Clear history"}
							</span>
						</button>
					</div>

					<div className="relative group">
						<div
							ref={historyScrollRef}
							className="flex gap-4 overflow-x-auto scroll-smooth pb-3"
							style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
						>
							{history.map((item) => (
								<Link
									key={item.productId}
									href={`/product/${item.slug}`}
									className="shrink-0 w-24 flex flex-col items-center gap-2 group/item"
								>
									<div className="relative h-20 w-24 bg-surface rounded-xl border border-border overflow-hidden p-1 shadow-sm transition-transform duration-300 group-hover/item:scale-105">
										<div className="relative h-full w-full rounded-lg overflow-hidden">
											<SafeImage
												src={item.image}
												alt={item.title}
												fill
												sizes="96px"
												className="object-cover"
											/>
										</div>
									</div>
									<span className="text-xs text-text font-medium text-center line-clamp-1 w-full px-1 group-hover/item:text-gold transition-colors">
										{item.title}
									</span>
								</Link>
							))}
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
