import { PREFECTURES } from "@/lib/constants/prefectures";

/**
 * Google Places (New) の addressComponents から都道府県コードを取得する。
 * administrative_area_level_1 の longText (例: "京都府") を PREFECTURES と照合。
 */
export function matchPrefectureCode(
  addressComponents: google.maps.places.AddressComponent[]
): number | null {
  const prefComponent = addressComponents.find((c) =>
    c.types.includes("administrative_area_level_1")
  );
  if (!prefComponent) return null;

  const prefName = prefComponent.longText;
  const matched = PREFECTURES.find((p) => p.name === prefName);
  return matched?.code ?? null;
}

/**
 * Google Places (New) の addressComponents からフォーマット済み住所を組み立てる。
 * 日本の住所を 都道府県 + 市区町村 + 以下 の形で返す。
 */
export function buildAddressFromComponents(
  addressComponents: google.maps.places.AddressComponent[]
): string {
  const parts: string[] = [];

  const typeOrder = [
    "administrative_area_level_1", // 都道府県
    "locality",                    // 市区町村
    "sublocality_level_1",         // 区
    "sublocality_level_2",         // 町
    "sublocality_level_3",         // 丁目
    "sublocality_level_4",
    "premise",                     // 番地
  ];

  for (const type of typeOrder) {
    const comp = addressComponents.find((c) => c.types.includes(type));
    if (comp?.longText) parts.push(comp.longText);
  }

  return parts.join("");
}
