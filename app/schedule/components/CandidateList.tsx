"use client";
import { useCallback } from "react";
import { parseISO, format } from "date-fns";

interface CandidateListProps {
  // 例: [ ["2025-02-03T10:30:00","2025-02-03T11:00:00"], ... ]
  candidates: string[][];
  minTime: string;
  maxTime: string;
  isLoading: boolean; // 親から渡されるローディング状態
}

export default function CandidateList({
  candidates,
  minTime,
  maxTime,
  isLoading,
}: CandidateListProps) {
  // "2025-02-03T10:30:00" → "yyyy/MM/dd HH:mm" のようにフォーマット
  const formatDate = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      return format(date, "yyyy/MM/dd HH:mm");
    } catch (err) {
      console.error("Date parsing error:", err);
      return isoString; // パースできなければ元の文字列を返す
    }
  };

  // 2つの日時文字列から "yyyy/MM/dd HH:mm ~ yyyy/MM/dd HH:mm" を生成
  const formatCandidate = (slotPair: string[]): string => {
    if (slotPair.length !== 2) {
      return slotPair.join(" ");
    }
    const [startStr, endStr] = slotPair;
    const startFormatted = formatDate(startStr);
    const endFormatted = formatDate(endStr);
    return `${startFormatted} ~ ${endFormatted}`;
  };

  // 候補の時間帯を、minTime 〜 maxTime の範囲内にフィルタリングする
  const filteredCandidates = candidates.filter((slotPair) => {
    if (slotPair.length !== 2) return false;
    // 日付部分（最初の10文字）が異なる場合は、日をまたいでいると判断して除外
    if (slotPair[0].substring(0, 10) !== slotPair[1].substring(0, 10))
      return false;

    // ISO 文字列の 11文字目から16文字目が "HH:mm" 部分
    const candidateStart = slotPair[0].substring(11, 16);
    const candidateEnd = slotPair[1].substring(11, 16);
    // 終了時刻が開始時刻よりも早い場合は、0:00をまたいでいるとみなし除外
    if (candidateEnd < candidateStart) return false;
    return candidateStart >= minTime && candidateEnd <= maxTime;
  });

  // 「コピー」ボタン押下時の処理
  const handleCopy = useCallback(() => {
    if (filteredCandidates.length === 0) return;
    const text = filteredCandidates
      .map((pair) => formatCandidate(pair))
      .join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("候補日程をコピーしました!");
      })
      .catch((err) => {
        console.error("コピーに失敗しました:", err);
      });
  }, [filteredCandidates]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-2">候補日一覧</h2>
      <div className="relative bg-rose-100 p-8 rounded min-h-[400px]">
        {isLoading ? (
          // ローディング中はサークル型スピナーを表示
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gray-500"></div>
            <span className="mt-2 text-gray-500 text-lg">Loading...</span>
          </div>
        ) : (
          <>
            {/* コピー用ボタン */}
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 bg-white text-sm px-2 py-1 rounded shadow hover:bg-gray-50"
            >
              copy
            </button>
            {filteredCandidates.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {filteredCandidates.map((slotPair, index) => (
                  <li key={index}>{formatCandidate(slotPair)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">候補がありません。</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
