"use client";

import Decimal from "decimal.js";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Menu = { id: string; name: string; price: string; category: string | null };
type Material = { id: string; name: string; unit: string; pack_quantity: string | null };
type Sale = {
  sale_id: string;
  date: string;
  menu_id: string;
  menu_name: string;
  channel: string;
  quantity: string;
  unit_price: string;
  discount_amount: string;
  net_sales: string;
  payment_fee: string;
  unit_food_cost: string | null;
  unit_packaging_cost: string | null;
};
type Preview = {
  basePrice: string;
  foodCost: string | null;
  packagingCost: string | null;
  missingMaterials: string[];
};

const money = (value: string | number | Decimal | null | undefined) => {
  if (value === null || value === undefined) return "확인 필요";
  return `₩${new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber().toLocaleString("ko-KR")}`;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "요청을 처리하지 못했습니다.");
  return body as T;
}

export default function SalesWorkspace({ today }: { today: string }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [recipeCount, setRecipeCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [menuId, setMenuId] = useState("");
  const [channel, setChannel] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentFee, setPaymentFee] = useState("0");
  const [sales, setSales] = useState<Sale[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/reference", { cache: "no-store" })
      .then(readJson<{ menus: Menu[]; materials: Material[]; channels: string[]; recipeCount: number }>)
      .then((data) => {
        if (!active) return;
        setMenus(data.menus);
        setMaterials(data.materials);
        setChannels(data.channels);
        setRecipeCount(data.recipeCount);
        setMenuId((current) => current || data.menus[0]?.id || "");
        setChannel((current) => current || data.channels[0] || "");
        setUnitPrice((current) => current || data.menus[0]?.price || "");
        setLoading(false);
      })
      .catch((reason: Error) => {
        if (!active) return;
        setError(reason.message);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    fetch(`/api/sales?date=${encodeURIComponent(selectedDate)}`, { cache: "no-store" })
      .then(readJson<{ sales: Sale[] }>)
      .then((data) => { if (active) setSales(data.sales); })
      .catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [selectedDate, reload]);

  useEffect(() => {
    if (!selectedDate || !menuId || !channel) return;
    let active = true;
    const timer = window.setTimeout(() => {
      fetch(`/api/preview?date=${encodeURIComponent(selectedDate)}&menuId=${encodeURIComponent(menuId)}&channel=${encodeURIComponent(channel)}`, { cache: "no-store" })
        .then(readJson<Preview>)
        .then((data) => { if (active) { setPreview(data); setUnitPrice((current) => current || data.basePrice); } })
        .catch(() => { if (active) setPreview(null); });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [selectedDate, menuId, channel]);

  const selectedMenu = useMemo(() => menus.find((menu) => menu.id === menuId), [menus, menuId]);
  const liveCalculation = useMemo(() => {
    try {
      const count = new Decimal(quantity || 0);
      const price = new Decimal(unitPrice || 0);
      const discountAmount = new Decimal(discount || 0);
      const gross = count.mul(price);
      return {
        net: gross.minus(discountAmount),
        gross,
        invalidDiscount: discountAmount.gt(gross),
        totalDirectCost: preview?.foodCost !== null && preview?.foodCost !== undefined && preview?.packagingCost !== null && preview?.packagingCost !== undefined
          ? new Decimal(preview.foodCost).plus(preview.packagingCost).mul(count)
          : null,
      };
    } catch {
      return null;
    }
  }, [quantity, unitPrice, discount, preview]);

  const dailyTotals = useMemo(() => sales.reduce((total, row) => total.plus(row.net_sales), new Decimal(0)), [sales]);

  function changeMenu(nextId: string) {
    setMenuId(nextId);
    setUnitPrice(menus.find((menu) => menu.id === nextId)?.price ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const saved = await readJson<{ netSales: string; missingMaterials: string[] }>(await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, menuId, channel, quantity, unitPrice, discountAmount: discount, paymentFee }),
      }));
      setNotice(`판매를 저장했습니다. 순매출 ${money(saved.netSales)}${saved.missingMaterials.length ? " · 원가 확인 필요" : ""}`);
      setQuantity("1");
      setDiscount("0");
      setPaymentFee("0");
      setReload((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "저장하지 못했습니다. 입력값을 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#main" aria-label="프렙 카페 운영 기록 홈">
          <span className="brand-mark">P</span>
          <span><strong>PREP CAFE</strong><small>운영 기록</small></span>
        </a>
        <div className="nav-caption">기록 관리</div>
        <div className="nav-item active"><span className="nav-icon">＋</span>판매 기록</div>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          <span><strong>샘플 자료 연결됨</strong><small>가상 매장 데이터</small></span>
        </div>
      </aside>

      <div className="workspace" id="main">
        <header className="topbar">
          <div className="breadcrumb">기록 관리 <span>/</span> 판매 기록</div>
          <div className="topbar-meta"><span className="live-dot" /> 저장 데이터 사용 중</div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">DAILY OPERATIONS</p>
              <h1>판매 기록</h1>
              <p className="page-description">판매를 입력하면 같은 날짜·메뉴·채널의 기록에 누적됩니다.</p>
            </div>
            <label className="date-filter">
              <span>조회·판매 날짜</span>
              <input aria-label="조회·판매 날짜" type="date" value={selectedDate} max={today} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
          </div>

          {(error || notice) && <div className={`message ${error ? "message-error" : "message-success"}`} role="status">{error || notice}</div>}

          {loading ? <div className="loading-card" role="status">기준 자료를 불러오는 중입니다…</div> : menus.length === 0 ? (
            <div className="loading-card" role="alert">기준 자료를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.</div>
          ) : (
            <>
              <section className="reference-strip" aria-label="불러온 기준자료">
                <div className="reference-intro"><span className="reference-icon">✳</span><span><strong>기준 자료</strong><small>엑셀 자료의 메뉴·재료·레시피 기준</small></span></div>
                <div className="reference-count"><b>{menus.length}</b><span>메뉴</span></div>
                <div className="reference-count"><b>{materials.length}</b><span>재료</span></div>
                <div className="reference-count"><b>{recipeCount}</b><span>레시피</span></div>
                <div className="reference-date">자료 기간<br /><b>2025.07.01 — 2026.09.18</b></div>
              </section>

              <div className="content-grid">
                <section className="card entry-card">
                  <div className="card-heading">
                    <div><p className="eyebrow">NEW ENTRY</p><h2>판매 입력</h2></div>
                    <span className="pill">저장 전 미리보기</span>
                  </div>
                  <form onSubmit={submit} noValidate>
                    <div className="form-grid">
                      <label className="field field-wide">
                        <span>판매 날짜 <em>필수</em></span>
                        <input type="date" value={selectedDate} max={today} required onChange={(event) => setSelectedDate(event.target.value)} />
                      </label>
                      <label className="field">
                        <span>메뉴 <em>필수</em></span>
                        <select value={menuId} required onChange={(event) => changeMenu(event.target.value)}>
                          {menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
                        </select>
                        <small>기준 단가 {selectedMenu ? money(selectedMenu.price) : "—"}</small>
                      </label>
                      <label className="field">
                        <span>판매 채널 <em>필수</em></span>
                        <select value={channel} required onChange={(event) => setChannel(event.target.value)}>
                          {channels.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                      <label className="field">
                        <span>판매 수량 <em>필수</em></span>
                        <div className="input-suffix"><input aria-label="판매 수량" type="number" min="1" step="1" value={quantity} required onChange={(event) => setQuantity(event.target.value)} /><span>개</span></div>
                      </label>
                      <label className="field">
                        <span>실제 판매 단가 <em>필수</em></span>
                        <div className="input-prefix"><span>₩</span><input aria-label="실제 판매 단가" type="number" min="0" step="any" value={unitPrice} required onChange={(event) => setUnitPrice(event.target.value)} /></div>
                      </label>
                      <label className="field">
                        <span>할인액</span>
                        <div className="input-prefix"><span>₩</span><input aria-label="할인액" type="number" min="0" step="any" value={discount} onChange={(event) => setDiscount(event.target.value)} /></div>
                      </label>
                      <label className="field">
                        <span>결제 수수료</span>
                        <div className="input-prefix"><span>₩</span><input aria-label="결제 수수료" type="number" min="0" step="any" value={paymentFee} onChange={(event) => setPaymentFee(event.target.value)} /></div>
                      </label>
                    </div>

                    <div className="preview-box">
                      <div className="preview-title"><span>예상 결과</span><small>원가 = 판매일 가격 이력 × 레시피 사용량</small></div>
                      <div className="preview-metrics">
                        <div><span>순매출</span><strong>{liveCalculation && !liveCalculation.invalidDiscount ? money(liveCalculation.net) : "값 확인"}</strong></div>
                        <div><span>재료·포장 원가</span><strong>{liveCalculation?.totalDirectCost !== null && liveCalculation?.totalDirectCost !== undefined ? money(liveCalculation.totalDirectCost) : preview?.missingMaterials.length ? "확인 필요" : "계산 중"}</strong></div>
                      </div>
                      {preview?.missingMaterials.length ? <p className="preview-warning">가격 또는 레시피를 확인해야 하는 재료: {preview.missingMaterials.join(", ")}</p> : null}
                    </div>

                    <button className="primary-button" type="submit" disabled={saving || !menus.length || !channels.length}>
                      {saving ? "저장 중…" : "판매 기록 저장"}<span aria-hidden="true">→</span>
                    </button>
                    <p className="form-footnote">빈칸은 0원으로 바꾸지 않습니다. 잘못된 값은 저장 전에 알려드립니다.</p>
                  </form>
                </section>

                <section className="card ledger-card">
                  <div className="card-heading ledger-heading">
                    <div><p className="eyebrow">DAILY LEDGER</p><h2>일별 판매 집계</h2></div>
                    <span className="record-count">{sales.length}개 기록</span>
                  </div>
                  <div className="ledger-summary"><span>{selectedDate} 매출 합계</span><strong>{sales.length ? money(dailyTotals) : "기록 없음"}</strong></div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>메뉴 / 채널</th><th>수량</th><th>실판매가</th><th>할인</th><th>순매출</th><th>개당 원가</th></tr></thead>
                      <tbody>
                        {sales.map((row) => {
                          const totalCost = row.unit_food_cost !== null && row.unit_packaging_cost !== null
                            ? new Decimal(row.unit_food_cost).plus(row.unit_packaging_cost)
                            : null;
                          return <tr key={row.sale_id}>
                            <td><strong>{row.menu_name}</strong><small>{row.channel}</small></td>
                            <td>{Number(row.quantity).toLocaleString("ko-KR")}</td>
                            <td>{money(row.unit_price)}</td>
                            <td>{money(row.discount_amount)}</td>
                            <td className="amount-cell">{money(row.net_sales)}</td>
                            <td>{totalCost === null ? "확인 필요" : money(totalCost)}</td>
                          </tr>;
                        })}
                        {!sales.length && <tr><td className="empty-row" colSpan={6}>이 날짜에 저장된 판매 기록이 없습니다.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="ledger-footnote">판매 수량은 날짜·메뉴·채널별로 합쳐서 보여줍니다.</div>
                </section>
              </div>

              <section className="card materials-card">
                <div className="card-heading"><div><p className="eyebrow">REFERENCE</p><h2>재료 기준 목록</h2></div><span className="record-count">{materials.length}개 재료</span></div>
                <div className="materials-list">{materials.map((material) => <div className="material-item" key={material.id}><span className="material-mark">{material.name.slice(0, 1)}</span><span><strong>{material.name}</strong><small>{material.id}</small></span><b>{material.unit}</b></div>)}</div>
              </section>

              <footer className="page-footer">샘플 기록 기간은 2025년 7월 1일부터 2026년 9월 18일까지입니다. 실제 매장 기록이 아닌 가상 데이터입니다.</footer>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
