import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/hooks/use-seo";
import { Footer } from "@/components/Footer";
import { Home, Plus, Trash2, Image, Play, Copy, Search, Loader2, ExternalLink, X } from "lucide-react";
import {
  WorldCupItem,
  addItem,
  removeItem,
  getValidItems,
  getRoundOptions,
  validateImageFile,
  serializeWorldCupData,
} from "@/lib/worldcup-logic";
import { saveMyWorldCup } from "@/lib/worldcup-library";

export default function WorldCupCreatePage() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<WorldCupItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTargetId, setSearchTargetId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageResults, setImageResults] = useState<Array<{ title: string; link: string; thumbnail: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");

  useSEO({
    title: "취향 월드컵 만들기",
    description: "나만의 이상형 월드컵, 취향 월드컵을 만들어보세요",
    keywords: "이상형월드컵, 취향월드컵, 월드컵만들기"
  });

  // 이미지 붙여넣기 핸들러
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>, itemId?: number) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          if (itemId !== undefined) {
            // 기존 아이템에 이미지 추가
            setItems(prev => prev.map(it =>
              it.id === itemId ? { ...it, imageUrl: base64 } : it
            ));
          } else {
            // 새 아이템으로 추가
            addItemWithImage(base64);
          }
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, []);

  // 파일 선택으로 이미지 추가
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, itemId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setItems(prev => prev.map(it =>
        it.id === itemId ? { ...it, imageUrl: base64 } : it
      ));
    };
    reader.readAsDataURL(file);
  };

  const addItemWithImage = (imageUrl: string) => {
    const newItem: WorldCupItem = {
      id: Date.now() + Math.random(),
      name: "",
      imageUrl
    };
    setItems(prev => [...prev, newItem]);
  };

  const searchImages = async (itemId: number, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchTargetId(itemId);
    setSearchQuery(trimmed);
    setImageResults([]);
    setSearchError("");
    setFallbackUrl("");
    setSearching(true);
    try {
      const response = await fetch(`/api/image-search?q=${encodeURIComponent(trimmed)}`);
      const data = await response.json();
      if (!response.ok) {
        setSearchError(data.message || "이미지 검색에 실패했습니다.");
        setFallbackUrl(data.fallbackUrl || `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(trimmed)}`);
        return;
      }
      setImageResults(data.items || []);
      if (!data.items?.length) setSearchError("검색된 이미지가 없습니다.");
    } catch {
      setSearchError("이미지 검색 서버에 연결할 수 없습니다.");
      setFallbackUrl(`https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(trimmed)}`);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchedImage = async (imageUrl: string) => {
    if (searchTargetId === null) return;
    setUploadingImage(true);
    setSearchError("");
    try {
      const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`);
      if (!response.ok) throw new Error("이미지를 가져올 수 없습니다.");
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setItems(prev => prev.map(item => item.id === searchTargetId ? { ...item, imageUrl: base64 } : item));
      setSearchTargetId(null);
      setImageResults([]);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "이미지 등록에 실패했습니다.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      alert("항목 이름을 입력해주세요.");
      return;
    }

    const result = addItem(items, newItemName);
    if (result === null) {
      alert("이미 등록된 항목입니다.");
      return;
    }

    const addedItem = result[result.length - 1];
    setItems(result);
    setNewItemName("");
    void searchImages(addedItem.id, addedItem.name);
  };

  const handleRemoveItem = (id: number) => {
    setItems(removeItem(items, id));
  };

  const updateItemName = (id: number, name: string) => {
    setItems(prev => prev.map(it =>
      it.id === id ? { ...it, name } : it
    ));
  };

  const removeImage = (id: number) => {
    setItems(prev => prev.map(it =>
      it.id === id ? { ...it, imageUrl: "" } : it
    ));
  };

  // 월드컵 데이터를 localStorage에 저장하고 플레이 페이지로 이동
  const startWorldCup = (round: number) => {
    if (!title.trim()) {
      alert("월드컵 제목을 입력해주세요.");
      return;
    }

    const validItems = getValidItems(items);
    if (validItems.length < round) {
      alert(`${round}강을 진행하려면 최소 ${round}개의 항목이 필요합니다. (현재 ${validItems.length}개)`);
      return;
    }

    const worldCupData = {
      title: title.trim(),
      items: validItems,
      round,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("worldcup_current", serializeWorldCupData(worldCupData));
    saveMyWorldCup(worldCupData);
    setLocation("/bracket/worldcup/play");
  };

  // 공유 링크 생성
  const generateShareLink = (round: number) => {
    if (!title.trim()) {
      alert("월드컵 제목을 입력해주세요.");
      return;
    }

    const validItems = getValidItems(items);
    if (validItems.length < 8) {
      alert("공유하려면 최소 8개의 항목이 필요합니다.");
      return;
    }

    // 공유용 데이터 (이미지 제외 - URL 길이 제한)
    const shareItems = validItems.map(item => ({
      id: item.id,
      name: item.name,
      imageUrl: "" // 이미지는 공유 시 제외
    }));

    const worldCupData = {
      title: title.trim(),
      items: shareItems,
      round,
      createdAt: new Date().toISOString()
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify(worldCupData)));
    const shareUrl = `${window.location.origin}/bracket/worldcup/play?data=${encoded}`;
    setGeneratedCode(shareUrl);
  };

  const copyCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 to-orange-500 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setLocation("/bracket/worldcup")}
            className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
          >
            <Home className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
        </div>

        <div className="text-center mb-8 text-white">
          <h1 className="text-5xl font-bold mb-4">🏆 취향 월드컵 만들기</h1>
          <p className="text-xl opacity-90">나만의 이상형 월드컵을 만들어보세요</p>
        </div>

        {/* Title Input */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">월드컵 제목</h2>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 최고의 라면 월드컵, 여행지 월드컵"
            maxLength={50}
            className="text-lg"
          />
        </div>

        {/* Items Input */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">항목 추가</h2>
          <p className="text-sm text-gray-500 mb-4">
            💡 텍스트 입력란에 이미지를 Ctrl+V로 붙여넣기 할 수 있어요!
          </p>

          <div className="flex gap-3 mb-6">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
              onPaste={(e) => handlePaste(e)}
              placeholder="항목 이름 입력 (이미지 붙여넣기 가능)"
              className="flex-1"
            />
            <Button onClick={handleAddItem} className="bg-pink-500 hover:bg-pink-600">
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          </div>

          {/* Items List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-lg">아직 항목이 없습니다</p>
                <p className="text-sm mt-1">위에서 항목을 추가해주세요</p>
              </div>
            )}
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-bold text-gray-400 w-8">{index + 1}</span>

                {/* 이미지 미리보기 */}
                {item.imageUrl ? (
                  <div className="relative w-16 h-16 flex-shrink-0 group">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(item.id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                    <button
                      onClick={() => searchImages(item.id, item.name)}
                      title="네이버 이미지에서 교체"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-black/70 text-white flex items-center justify-center"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 flex-shrink-0 space-y-1">
                    <button onClick={() => searchImages(item.id, item.name)} title="네이버 이미지 검색" className="w-16 h-10 border border-gray-300 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </button>
                    <label className="w-16 h-7 border border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer" title="내 파일 업로드">
                      <Image className="w-3.5 h-3.5" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, item.id)} />
                    </label>
                  </div>
                )}

                {/* 이름 입력 */}
                <Input
                  value={item.name}
                  onChange={(e) => updateItemName(item.id, e.target.value)}
                  onPaste={(e) => handlePaste(e, item.id)}
                  placeholder="항목 이름"
                  className="flex-1"
                />

                {/* 삭제 버튼 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 text-right text-sm text-gray-500">
            총 {getValidItems(items).length}개 항목
          </div>
        </div>

        {/* Start Buttons */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎮 월드컵 시작</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[8, 16, 32, 64].map(round => {
              const validCount = getValidItems(items).length;
              const disabled = validCount < round;
              return (
                <Button
                  key={round}
                  onClick={() => startWorldCup(round)}
                  disabled={disabled}
                  className={`h-16 text-lg font-bold ${
                    disabled
                      ? "bg-gray-200 text-gray-400"
                      : "bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white"
                  }`}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {round}강
                </Button>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 mt-3 text-center">
            {getValidItems(items).length < 8
              ? `최소 8개 항목이 필요합니다 (현재 ${getValidItems(items).length}개)`
              : `최대 ${Math.pow(2, Math.floor(Math.log2(getValidItems(items).length)))}강까지 가능합니다`
            }
          </p>
        </div>

        {/* Share Section */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔗 공유하기</h2>
          <p className="text-sm text-gray-500 mb-4">
            공유 링크를 만들면 다른 사람도 이 월드컵을 플레이할 수 있어요!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[8, 16, 32, 64].map(round => {
              const validCount = getValidItems(items).length;
              const disabled = validCount < round;
              return (
                <Button
                  key={`share-${round}`}
                  onClick={() => generateShareLink(round)}
                  disabled={disabled}
                  variant="outline"
                  className={`h-12 text-sm font-bold ${
                    disabled ? "opacity-40" : "border-pink-300 text-pink-600 hover:bg-pink-50"
                  }`}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {round}강 링크
                </Button>
              );
            })}
          </div>
          {generatedCode && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">공유 링크:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={generatedCode}
                  className="flex-1 text-xs bg-white border rounded px-3 py-2 truncate"
                />
                <Button
                  onClick={copyCode}
                  size="sm"
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                >
                  {copied ? "✓ 복사됨" : "복사"}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                ⚠️ 이미지는 공유 링크에 포함되지 않습니다 (텍스트만 공유)
              </p>
            </div>
          )}
        </div>

        {searchTargetId !== null && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => !uploadingImage && setSearchTargetId(null)}>
            <div className="bg-white rounded-3xl border w-full max-w-4xl max-h-[88vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-5 md:p-6 border-b border-white/10 flex items-center gap-3">
                <div className="flex-1">
                  <h2 className="text-xl font-bold">네이버 이미지 선택</h2>
                  <p className="text-sm text-gray-500 mt-1">“{searchQuery}” 검색 결과에서 사진을 선택하면 자동으로 등록됩니다.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSearchTargetId(null)} disabled={uploadingImage}><X className="w-5 h-5" /></Button>
              </div>

              <div className="p-5 border-b border-white/10 flex gap-2">
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchTargetId !== null && searchImages(searchTargetId, searchQuery)} placeholder="이미지 검색어" />
                <Button onClick={() => searchTargetId !== null && searchImages(searchTargetId, searchQuery)} disabled={searching}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="ml-2 hidden sm:inline">검색</span>
                </Button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[62vh]">
                {(searching || uploadingImage) && <div className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /><p className="mt-3 text-gray-400">{uploadingImage ? "선택한 사진을 등록하고 있습니다..." : "이미지를 검색하고 있습니다..."}</p></div>}
                {!searching && !uploadingImage && searchError && (
                  <div className="py-12 text-center">
                    <p className="text-gray-300">{searchError}</p>
                    {fallbackUrl && <Button className="mt-5" onClick={() => window.open(fallbackUrl, "_blank", "noopener,noreferrer")}><ExternalLink className="w-4 h-4 mr-2" />네이버 이미지 검색 열기</Button>}
                    <p className="text-xs text-gray-500 mt-4">자동 선택 기능을 사용하려면 서버에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해야 합니다.</p>
                  </div>
                )}
                {!searching && !uploadingImage && imageResults.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {imageResults.map((result, index) => (
                      <button key={`${result.thumbnail}-${index}`} onClick={() => selectSearchedImage(result.link || result.thumbnail)} className="aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-blue-400 transition-all bg-gray-50 group relative" title={result.title}>
                        <img src={result.thumbnail} alt={result.title || `${searchQuery} 검색 이미지`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">선택</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
