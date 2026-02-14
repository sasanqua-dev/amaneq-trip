"use server";

import { getGeminiClient } from "@/lib/gemini";

export interface Recommendation {
  name: string;
  category: string;
  description: string;
  reason: string;
}

export interface RecommendationsResult {
  recommendations: Recommendation[];
  error?: string;
}

export async function getSpotRecommendations(
  spotName: string,
  locationName: string | null,
  latitude: number | null,
  longitude: number | null
): Promise<RecommendationsResult> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const locationContext = [
      spotName,
      locationName && locationName !== spotName ? locationName : null,
      latitude != null && longitude != null
        ? `(緯度: ${latitude}, 経度: ${longitude})`
        : null,
    ]
      .filter(Boolean)
      .join(" / ");

    const prompt = `あなたは日本の旅行に詳しいガイドです。以下のスポットの周辺にある、おすすめの施設やお店を5つ紹介してください。

スポット情報: ${locationContext}

以下の条件で回答してください:
- 実在する施設・お店を紹介してください
- カテゴリは「グルメ」「カフェ」「観光」「ショッピング」「体験」「温泉・リラクゼーション」から選んでください
- 徒歩圏内〜近距離のものを優先してください
- 地元ならではの場所を優先してください

以下のJSON形式で回答してください。JSON以外は出力しないでください:
[
  {
    "name": "施設名",
    "category": "カテゴリ",
    "description": "施設の簡単な説明（30文字以内）",
    "reason": "おすすめの理由（40文字以内）"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { recommendations: [], error: "レスポンスの解析に失敗しました" };
    }

    const parsed = JSON.parse(jsonMatch[0]) as Recommendation[];
    return { recommendations: parsed.slice(0, 5) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";

    if (message.includes("GEMINI_API_KEY")) {
      return {
        recommendations: [],
        error:
          "Gemini APIキーが設定されていません。環境変数 GEMINI_API_KEY を設定してください。",
      };
    }

    return { recommendations: [], error: `おすすめの取得に失敗しました: ${message}` };
  }
}
