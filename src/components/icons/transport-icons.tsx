import { type ComponentProps } from "react";

type IconProps = ComponentProps<"svg">;

/**
 * 共通 SVG ラッパー – stroke ベースの統一スタイル
 * strokeWidth / linecap / linejoin を揃えて視覚的な一貫性を保つ
 */
function SvgBase({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  移動手段アイコン (Transport)                                       */
/* ------------------------------------------------------------------ */

/** 徒歩 */
export function WalkIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v5" />
      <path d="M8 12l4 1 4-1" />
      <path d="M9 21l3-9" />
      <path d="M15 21l-3-9" />
    </SvgBase>
  );
}

/** 自転車 */
export function BicycleIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <circle cx="6.5" cy="17" r="3.5" />
      <circle cx="17.5" cy="17" r="3.5" />
      <path d="M6.5 17l5-9h4" />
      <path d="M11.5 8l6 9" />
      <path d="M15.5 8l2 9" />
    </SvgBase>
  );
}

/** 自動車 / タクシー */
export function CarIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M5 17h14v-5H5v5z" />
      <path d="M5 12l2-5h10l2 5" />
      <circle cx="8" cy="17" r="2" />
      <circle cx="16" cy="17" r="2" />
    </SvgBase>
  );
}

/** 新幹線 / 特急 (正面) */
export function BulletTrainIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M6 17V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v11" />
      <rect x="8" y="5" width="8" height="5" rx="1" />
      <path d="M6 17h12" />
      <path d="M8 21l2-4" />
      <path d="M16 21l-2-4" />
      <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
    </SvgBase>
  );
}

/** 在来線 / 一般列車 (正面) */
export function TrainIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <rect x="5" y="3" width="14" height="14" rx="2" />
      <rect x="7" y="5" width="10" height="5" rx="1" />
      <path d="M5 17h14" />
      <path d="M8 21l2-4" />
      <path d="M16 21l-2-4" />
      <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
    </SvgBase>
  );
}

/** バス */
export function BusIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <rect x="3" y="5" width="18" height="13" rx="2" />
      <path d="M3 12h18" />
      <rect x="5" y="7" width="5" height="4" rx="0.5" />
      <rect x="14" y="7" width="5" height="4" rx="0.5" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="16.5" cy="18" r="1.5" />
    </SvgBase>
  );
}

/** 船 */
export function ShipIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M3 17l2-7h14l2 7" />
      <path d="M8 10V6h4v4" />
      <path d="M12 3v7" />
      <path d="M2 21c3-2 5-2 8 0s5 2 8 0" />
    </SvgBase>
  );
}

/** 飛行機 */
export function PlaneIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M12 3v18" />
      <path d="M4 11l8-2 8 2" />
      <path d="M8 19l4-1 4 1" />
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
    </SvgBase>
  );
}

/* ------------------------------------------------------------------ */
/*  カテゴリアイコン (Category)                                        */
/* ------------------------------------------------------------------ */

/** 観光 (カメラ) */
export function SightseeingIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <circle cx="12" cy="13.5" r="3.5" />
      <path d="M8 7l1-3h6l1 3" />
    </SvgBase>
  );
}

/** 食事 (フォーク & ナイフ) */
export function MealIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M7 3v18" />
      <path d="M7 3a3 3 0 0 0-3 6h3" />
      <path d="M17 3v5a3 3 0 0 1-3 3h-1v10" />
      <path d="M17 3v5" />
      <path d="M20 3v5a3 3 0 0 1-3 3" />
    </SvgBase>
  );
}

/** 宿泊 (ベッド) */
export function AccommodationIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M3 20v-8" />
      <path d="M3 12V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5" />
      <path d="M3 12h18v8" />
      <path d="M9 12h10a2 2 0 0 1 2 2v2H9v-4z" />
    </SvgBase>
  );
}

/** その他 (丸にドット) */
export function OtherIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </SvgBase>
  );
}

/* ------------------------------------------------------------------ */
/*  型定義 & マッピング                                                */
/* ------------------------------------------------------------------ */

export type TransportIconComponent = (props: IconProps) => React.JSX.Element;

/** 交通手段 → アイコンのマッピング */
export const transportIcons: Record<string, TransportIconComponent> = {
  shinkansen: BulletTrainIcon,
  express: BulletTrainIcon,
  local_train: TrainIcon,
  bus: BusIcon,
  ship: ShipIcon,
  airplane: PlaneIcon,
  car: CarIcon,
  taxi: CarIcon,
  walk: WalkIcon,
  bicycle: BicycleIcon,
  other: TrainIcon,
};

/** カテゴリ → アイコンのマッピング */
export const categoryIcons: Record<string, TransportIconComponent> = {
  sightseeing: SightseeingIcon,
  meal: MealIcon,
  accommodation: AccommodationIcon,
  other: OtherIcon,
};
