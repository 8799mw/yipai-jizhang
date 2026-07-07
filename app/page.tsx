"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type TransactionType = "expense" | "income";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  merchant: string;
  note: string;
  createdAt: string;
};

type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  repeatMonthly: boolean;
};

type Reminder = {
  id: string;
  title: string;
  dueDate: string;
  note: string;
  isDone: boolean;
};

type ViewName = "home" | "photo" | "voice" | "bills" | "reports";

const categories = ["餐飲", "交通", "購物", "生活", "娛樂", "醫療", "收入", "其他"];
const billNames = ["信用卡", "水費", "電費", "手機", "瓦斯", "保險", "房租"];
const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

const viewLabels: Record<ViewName, string> = {
  home: "首頁",
  photo: "拍照記帳",
  voice: "語音記帳",
  bills: "帳單中心",
  reports: "財務報表"
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toInputDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function shiftDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toInputDate(date);
}

function shiftMonth(source: string, months: number) {
  const [year, month, day] = source.split("-").map(Number);
  const date = new Date(year, month - 1 + months, day);
  return toInputDate(date);
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) {
        setValue(JSON.parse(saved) as T);
      }
    } catch {
      setValue(initialValue);
    }
    // The first browser-side load is enough; later changes are saved by the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function parseAmount(text: string) {
  const match = text.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function parseTransactionDate(text: string) {
  if (text.includes("昨天")) return shiftDate(-1);
  if (text.includes("明天")) return shiftDate(1);
  return shiftDate(0);
}

function guessCategory(text: string, type: TransactionType) {
  if (type === "income") return "收入";
  if (/早餐|午餐|晚餐|咖啡|便當|飲料|餐|麵|飯|茶/.test(text)) return "餐飲";
  if (/捷運|公車|高鐵|火車|計程車|加油|停車/.test(text)) return "交通";
  if (/藥|診|醫|牙|掛號/.test(text)) return "醫療";
  if (/電影|遊戲|展覽|唱歌/.test(text)) return "娛樂";
  if (/電費|水費|瓦斯|手機|房租|保險|信用卡/.test(text)) return "生活";
  if (/買|購物|超商|便利商店|全聯|家樂福/.test(text)) return "購物";
  return "其他";
}

function mockPhotoParse(): Transaction {
  return {
    id: uid("tx"),
    date: shiftDate(0),
    amount: 128,
    type: "expense",
    category: "餐飲",
    merchant: "全家便利商店",
    note: "發票拍照解析 mock",
    createdAt: new Date().toISOString()
  };
}

function mockVoiceParse(text: string): Transaction {
  const type: TransactionType = /收入|薪水|獎金|轉入|退款/.test(text) ? "income" : "expense";
  const amount = parseAmount(text);
  const category = guessCategory(text, type);
  const note = text.replace(/\d+/g, "").replace(/今天|昨天|明天|收入|支出/g, "").trim() || text;

  return {
    id: uid("tx"),
    date: parseTransactionDate(text),
    amount,
    type,
    category,
    merchant: type === "income" ? "收入" : "",
    note,
    createdAt: new Date().toISOString()
  };
}

function chineseNumberToInt(text: string) {
  const map: Record<string, number> = {
    一: 1,
    二: 2,
    兩: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10
  };
  if (/^\d+$/.test(text)) return Number(text);
  return map[text] ?? 0;
}

function parseReminderDate(text: string) {
  if (text.includes("今天")) return shiftDate(0);
  if (text.includes("明天")) return shiftDate(1);
  if (text.includes("後天")) return shiftDate(2);
  if (/下星期|下週/.test(text)) return shiftDate(7);

  const monthMatch = text.match(/([一二兩三四五六七八九十\d]+)個月後/);
  if (monthMatch) return shiftMonth(shiftDate(0), chineseNumberToInt(monthMatch[1]));

  const dayMatch = text.match(/([一二兩三四五六七八九十\d]+)天後/);
  if (dayMatch) return shiftDate(chineseNumberToInt(dayMatch[1]));

  return "";
}

function AdBanner() {
  return (
    <div className="flex h-14 items-center justify-center rounded-md border border-dashed border-ink/25 bg-white/70 text-sm font-medium text-ink/55">
      AdMob Banner Placeholder
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div>
      {eyebrow ? <p className="text-sm font-semibold text-leaf">{eyebrow}</p> : null}
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink/70">
      {label}
      {children}
    </label>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewName>("home");
  const [transactions, setTransactions] = useLocalStorageState<Transaction[]>("yp_transactions", []);
  const [bills, setBills] = useLocalStorageState<Bill[]>("yp_bills", []);
  const [reminders, setReminders] = useLocalStorageState<Reminder[]>("yp_reminders", []);

  const [imagePreview, setImagePreview] = useState("");
  const [photoDraft, setPhotoDraft] = useState<Transaction | null>(null);
  const [voiceText, setVoiceText] = useState("今天早餐65");
  const [voiceDraft, setVoiceDraft] = useState<Transaction | null>(null);
  const [billSuggestionName, setBillSuggestionName] = useState("");
  const [billTab, setBillTab] = useState<"bills" | "reminders">("bills");
  const [billForm, setBillForm] = useState({
    name: "信用卡",
    amount: "",
    dueDate: shiftDate(7)
  });
  const [reminderText, setReminderText] = useState("一個月後換機油");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");

  const monthStats = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthItems = transactions.filter((item) => item.date.startsWith(monthKey));
    const income = monthItems
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = monthItems
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const today = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAverage = today > 0 ? expense / today : 0;
    const projectedExpense = dailyAverage * daysInMonth;

    return {
      income,
      expense,
      remaining: income - expense,
      dailyAverage,
      projectedExpense,
      projectedRemaining: income - projectedExpense
    };
  }, [transactions]);

  const report = useMemo(() => {
    const expenses = transactions.filter((item) => item.type === "expense");
    const byCategory = categories
      .map((category) => ({
        category,
        total: expenses
          .filter((item) => item.category === category)
          .reduce((sum, item) => sum + item.amount, 0)
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);

    const recent = [...transactions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);

    const ranking = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

    return { byCategory, recent, ranking };
  }, [transactions]);

  function go(view: ViewName) {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addTransaction(draft: Transaction) {
    const finalTransaction = {
      ...draft,
      id: draft.id || uid("tx"),
      createdAt: draft.createdAt || new Date().toISOString()
    };
    setTransactions((current) => [finalTransaction, ...current]);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setPhotoDraft(mockPhotoParse());
  }

  function confirmPhoto() {
    if (!photoDraft) return;
    addTransaction(photoDraft);
    setPhotoDraft(null);
    setImagePreview("");
    go("home");
  }

  function parseVoice() {
    const parsed = mockVoiceParse(voiceText);
    setVoiceDraft(parsed.amount > 0 ? parsed : { ...parsed, amount: 65 });
  }

  function confirmVoice() {
    if (!voiceDraft) return;
    addTransaction(voiceDraft);
    setVoiceDraft(null);
    setVoiceText("今天早餐65");
    go("home");
  }

  function addBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bill: Bill = {
      id: uid("bill"),
      name: billForm.name,
      amount: Number(billForm.amount),
      dueDate: billForm.dueDate,
      isPaid: false,
      repeatMonthly: false
    };

    if (!bill.name || !bill.amount || !bill.dueDate) return;

    setBills((current) => {
      const updated = [bill, ...current];
      const sameBills = updated.filter((item) => item.name === bill.name);
      if (sameBills.length >= 2 && sameBills.every((item) => !item.repeatMonthly)) {
        setBillSuggestionName(bill.name);
      }
      return updated;
    });
    setBillForm({ name: "信用卡", amount: "", dueDate: shiftDate(7) });
  }

  function confirmMonthlyReminder() {
    const target = billSuggestionName;
    const nextBill = bills.find((bill) => bill.name === target);
    if (!target || !nextBill) return;

    setBills((current) =>
      current.map((bill) => (bill.name === target ? { ...bill, repeatMonthly: true } : bill))
    );
    setReminders((current) => [
      {
        id: uid("reminder"),
        title: `繳納${target}`,
        dueDate: shiftMonth(nextBill.dueDate, 1),
        note: "AI 學習建立的每月提醒",
        isDone: false
      },
      ...current
    ]);
    setBillSuggestionName("");
  }

  function addReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedDate = parseReminderDate(reminderText);
    const finalDate = parsedDate || reminderDate;
    if (!reminderText.trim() || !finalDate) return;

    setReminders((current) => [
      {
        id: uid("reminder"),
        title: reminderText.trim(),
        dueDate: finalDate,
        note: reminderNote,
        isDone: false
      },
      ...current
    ]);
    setReminderText("一個月後換機油");
    setReminderDate("");
    setReminderNote("");
  }

  function parseReminderPreview() {
    const parsedDate = parseReminderDate(reminderText);
    setReminderDate(parsedDate);
  }

  function updateTransactionDraft(
    draft: Transaction,
    setter: (value: Transaction) => void,
    field: keyof Transaction,
    value: string
  ) {
    const nextValue = field === "amount" ? Number(value) : value;
    setter({ ...draft, [field]: nextValue } as Transaction);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-ink/10 bg-rice/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <button className="text-left" onClick={() => go("home")} type="button">
            <p className="text-xl font-black tracking-normal text-ink">一拍記帳</p>
            <p className="text-xs font-semibold text-ink/55">不用打字，拍一下就記帳。</p>
          </button>
          <span className="rounded-full bg-mint px-3 py-2 text-xs font-bold text-leaf">
            PWA
          </span>
        </div>
      </header>

      {activeView === "home" ? (
        <section className="grid gap-5">
          <div className="rounded-md bg-white p-5 shadow-soft">
            <p className="text-sm font-bold text-leaf">AI 記帳 App</p>
            <h1 className="mt-1 text-3xl font-black leading-tight text-ink">一拍記帳</h1>
            <p className="mt-2 text-base font-semibold text-ink/65">不用打字，拍一下就記帳。</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric label="本月收入" value={currency.format(monthStats.income)} tone="green" />
            <Metric label="本月支出" value={currency.format(monthStats.expense)} tone="coral" />
            <Metric label="本月剩餘" value={currency.format(monthStats.remaining)} tone="sky" />
            <Metric label="平均每日花費" value={currency.format(monthStats.dailyAverage)} tone="plain" />
            <Metric label="預估月底花費" value={currency.format(monthStats.projectedExpense)} tone="plain" />
            <Metric
              label="預估月底剩餘"
              value={currency.format(monthStats.projectedRemaining)}
              tone={monthStats.projectedRemaining >= 0 ? "green" : "coral"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <HomeButton number="1" title="拍照記帳" detail="上傳圖片，AI mock 解析" onClick={() => go("photo")} />
            <HomeButton number="2" title="語音記帳" detail="先用文字模擬一句話" onClick={() => go("voice")} />
            <HomeButton number="3" title="帳單中心" detail="帳單、每月提醒、記事提醒" onClick={() => go("bills")} />
            <HomeButton number="4" title="財務報表" detail="分類統計與最近10筆" onClick={() => go("reports")} />
          </div>

          <AdBanner />
        </section>
      ) : null}

      {activeView === "photo" ? (
        <section className="grid gap-5">
          <TopBar title="拍照記帳" onBack={() => go("home")} />
          <div className="rounded-md bg-white p-5 shadow-soft">
            <SectionTitle eyebrow="功能一" title="上傳圖片" />
            <input
              accept="image/*"
              className="mt-5 w-full rounded-md border border-ink/15 bg-rice p-4 text-base font-semibold"
              onChange={handleImageChange}
              type="file"
            />
            {imagePreview ? (
              <img
                alt="上傳圖片預覽"
                className="mt-4 aspect-[4/3] w-full rounded-md object-cover"
                src={imagePreview}
              />
            ) : (
              <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-ink/20 bg-rice text-sm font-semibold text-ink/45">
                圖片預覽
              </div>
            )}
          </div>

          {photoDraft ? (
            <TransactionEditor
              draft={photoDraft}
              title="AI mock 解析結果"
              onCancel={() => setPhotoDraft(null)}
              onConfirm={confirmPhoto}
              onChange={(field, value) => updateTransactionDraft(photoDraft, setPhotoDraft, field, value)}
            />
          ) : null}
        </section>
      ) : null}

      {activeView === "voice" ? (
        <section className="grid gap-5">
          <TopBar title="語音記帳" onBack={() => go("home")} />
          <div className="rounded-md bg-white p-5 shadow-soft">
            <SectionTitle eyebrow="功能二" title="文字模擬語音" />
            <Field label="說一句話">
              <textarea
                className="min-h-28 rounded-md border border-ink/15 bg-rice p-4 text-lg font-semibold outline-none focus:border-leaf"
                onChange={(event) => setVoiceText(event.target.value)}
                value={voiceText}
              />
            </Field>
            <button
              className="mt-4 h-14 w-full rounded-md bg-leaf px-4 text-lg font-black text-white shadow-soft"
              onClick={parseVoice}
              type="button"
            >
              解析這一句
            </button>
          </div>

          {voiceDraft ? (
            <TransactionEditor
              draft={voiceDraft}
              title="AI mock 解析結果"
              onCancel={() => setVoiceDraft(null)}
              onConfirm={confirmVoice}
              onChange={(field, value) => updateTransactionDraft(voiceDraft, setVoiceDraft, field, value)}
            />
          ) : null}
        </section>
      ) : null}

      {activeView === "bills" ? (
        <section className="grid gap-5">
          <TopBar title="帳單中心" onBack={() => go("home")} />
          <div className="grid grid-cols-2 gap-2 rounded-md bg-white p-2 shadow-soft">
            <button
              className={`h-12 rounded-md text-base font-black ${billTab === "bills" ? "bg-leaf text-white" : "bg-rice text-ink/70"}`}
              onClick={() => setBillTab("bills")}
              type="button"
            >
              帳單
            </button>
            <button
              className={`h-12 rounded-md text-base font-black ${billTab === "reminders" ? "bg-leaf text-white" : "bg-rice text-ink/70"}`}
              onClick={() => setBillTab("reminders")}
              type="button"
            >
              記事提醒
            </button>
          </div>

          {billTab === "bills" ? (
            <>
              <form className="grid gap-4 rounded-md bg-white p-5 shadow-soft" onSubmit={addBill}>
                <SectionTitle eyebrow="功能三" title="新增帳單" />
                <Field label="名稱">
                  <select
                    className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-lg font-semibold"
                    onChange={(event) => setBillForm((current) => ({ ...current, name: event.target.value }))}
                    value={billForm.name}
                  >
                    {billNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="金額">
                  <input
                    className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-lg font-semibold"
                    inputMode="numeric"
                    onChange={(event) => setBillForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="例如 1280"
                    type="number"
                    value={billForm.amount}
                  />
                </Field>
                <Field label="繳費日期">
                  <input
                    className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-lg font-semibold"
                    onChange={(event) => setBillForm((current) => ({ ...current, dueDate: event.target.value }))}
                    type="date"
                    value={billForm.dueDate}
                  />
                </Field>
                <button className="h-14 rounded-md bg-leaf text-lg font-black text-white" type="submit">
                  新增帳單
                </button>
              </form>

              <div className="grid gap-3">
                {bills.length ? (
                  bills.map((bill) => (
                    <BillCard
                      bill={bill}
                      key={bill.id}
                      onTogglePaid={() =>
                        setBills((current) =>
                          current.map((item) =>
                            item.id === bill.id ? { ...item, isPaid: !item.isPaid } : item
                          )
                        )
                      }
                      onToggleRepeat={() =>
                        setBills((current) =>
                          current.map((item) =>
                            item.id === bill.id ? { ...item, repeatMonthly: !item.repeatMonthly } : item
                          )
                        )
                      }
                    />
                  ))
                ) : (
                  <EmptyState text="還沒有帳單，先新增一筆信用卡、水費或電費。" />
                )}
              </div>
            </>
          ) : (
            <>
              <form className="grid gap-4 rounded-md bg-white p-5 shadow-soft" onSubmit={addReminder}>
                <SectionTitle eyebrow="記事提醒" title="新增提醒" />
                <Field label="提醒內容">
                  <input
                    className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-lg font-semibold"
                    onChange={(event) => setReminderText(event.target.value)}
                    value={reminderText}
                  />
                </Field>
                <button
                  className="h-12 rounded-md border border-leaf bg-mint text-base font-black text-leaf"
                  onClick={parseReminderPreview}
                  type="button"
                >
                  AI 解析日期
                </button>
                <Field label="提醒日期">
                  <input
                    className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-lg font-semibold"
                    onChange={(event) => setReminderDate(event.target.value)}
                    type="date"
                    value={reminderDate}
                  />
                </Field>
                <Field label="備註">
                  <input
                    className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-lg font-semibold"
                    onChange={(event) => setReminderNote(event.target.value)}
                    placeholder="選填"
                    value={reminderNote}
                  />
                </Field>
                <button className="h-14 rounded-md bg-leaf text-lg font-black text-white" type="submit">
                  建立提醒
                </button>
              </form>

              <div className="grid gap-3">
                {reminders.length ? (
                  reminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={() =>
                        setReminders((current) =>
                          current.map((item) =>
                            item.id === reminder.id ? { ...item, isDone: !item.isDone } : item
                          )
                        )
                      }
                    />
                  ))
                ) : (
                  <EmptyState text="還沒有提醒，可以輸入「下星期回診」或「兩個月後剪頭髮」。" />
                )}
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeView === "reports" ? (
        <section className="grid gap-5">
          <TopBar title="財務報表" onBack={() => go("home")} />
          <ReportPanel title="分類統計">
            {report.byCategory.length ? (
              report.byCategory.map((item) => (
                <div className="grid gap-2" key={item.category}>
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>{item.category}</span>
                    <span>{currency.format(item.total)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-leaf"
                      style={{
                        width: `${Math.max(12, (item.total / (report.byCategory[0]?.total || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="還沒有支出資料。" />
            )}
          </ReportPanel>

          <ReportPanel title="最近10筆">
            {report.recent.length ? (
              report.recent.map((item) => <TransactionRow item={item} key={item.id} />)
            ) : (
              <EmptyState text="拍照或語音記帳後會出現在這裡。" />
            )}
          </ReportPanel>

          <ReportPanel title="支出排行">
            {report.ranking.length ? (
              report.ranking.map((item, index) => (
                <div className="flex items-center justify-between rounded-md bg-rice p-3" key={item.id}>
                  <div>
                    <p className="text-sm font-black text-ink">
                      {index + 1}. {item.note || item.merchant || item.category}
                    </p>
                    <p className="text-xs font-semibold text-ink/55">{item.date}</p>
                  </div>
                  <p className="text-base font-black text-coral">{currency.format(item.amount)}</p>
                </div>
              ))
            ) : (
              <EmptyState text="目前沒有支出排行。" />
            )}
          </ReportPanel>
          <AdBanner />
        </section>
      ) : null}

      {billSuggestionName ? (
        <div className="fixed inset-0 z-40 flex items-end bg-ink/35 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-md bg-white p-5 shadow-soft">
            <p className="text-sm font-bold text-leaf">AI 學習</p>
            <h3 className="mt-1 text-2xl font-black text-ink">是否建立每月提醒？</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">
              「{billSuggestionName}」已連續出現兩次以上，可以幫你建立每月提醒。
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                className="h-12 rounded-md bg-rice text-base font-black text-ink/65"
                onClick={() => setBillSuggestionName("")}
                type="button"
              >
                先不要
              </button>
              <button
                className="h-12 rounded-md bg-leaf text-base font-black text-white"
                onClick={confirmMonthlyReminder}
                type="button"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="safe-bottom sticky bottom-0 z-20 -mx-4 mt-auto grid grid-cols-4 gap-2 border-t border-ink/10 bg-rice/92 px-4 pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {(["home", "photo", "bills", "reports"] as ViewName[]).map((view) => (
          <button
            className={`h-12 rounded-md text-xs font-black ${activeView === view ? "bg-leaf text-white" : "bg-white text-ink/65"}`}
            key={view}
            onClick={() => go(view)}
            type="button"
          >
            {viewLabels[view]}
          </button>
        ))}
      </nav>
    </main>
  );
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "green" | "coral" | "sky" | "plain";
}) {
  const colors = {
    green: "bg-mint text-leaf",
    coral: "bg-[#fff0ec] text-coral",
    sky: "bg-[#edf7fc] text-sky",
    plain: "bg-white text-ink"
  };

  return (
    <div className={`min-h-24 rounded-md p-4 shadow-soft ${colors[tone]}`}>
      <p className="text-xs font-bold opacity-70">{label}</p>
      <p className="mt-2 break-words text-xl font-black">{value}</p>
    </div>
  );
}

function HomeButton({
  number,
  title,
  detail,
  onClick
}: {
  number: string;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      className="grid min-h-28 grid-cols-[2.5rem_1fr] items-center gap-3 rounded-md bg-white p-4 text-left shadow-soft"
      onClick={onClick}
      type="button"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf text-lg font-black text-white">
        {number}
      </span>
      <span>
        <span className="block text-lg font-black text-ink">{title}</span>
        <span className="mt-1 block text-sm font-semibold leading-5 text-ink/55">{detail}</span>
      </span>
    </button>
  );
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button className="h-11 w-16 rounded-md bg-white text-base font-black shadow-soft" onClick={onBack} type="button">
        返回
      </button>
      <h1 className="text-2xl font-black text-ink">{title}</h1>
    </div>
  );
}

function TransactionEditor({
  draft,
  title,
  onChange,
  onCancel,
  onConfirm
}: {
  draft: Transaction;
  title: string;
  onChange: (field: keyof Transaction, value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="grid gap-4 rounded-md bg-white p-5 shadow-soft">
      <SectionTitle title={title} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="日期">
          <input
            className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-base font-semibold"
            onChange={(event) => onChange("date", event.target.value)}
            type="date"
            value={draft.date}
          />
        </Field>
        <Field label="金額">
          <input
            className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-base font-semibold"
            inputMode="numeric"
            onChange={(event) => onChange("amount", event.target.value)}
            type="number"
            value={draft.amount}
          />
        </Field>
        <Field label="類型">
          <select
            className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-base font-semibold"
            onChange={(event) => onChange("type", event.target.value)}
            value={draft.type}
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </Field>
        <Field label="分類">
          <select
            className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-base font-semibold"
            onChange={(event) => onChange("category", event.target.value)}
            value={draft.category}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="店家">
          <input
            className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-base font-semibold"
            onChange={(event) => onChange("merchant", event.target.value)}
            value={draft.merchant}
          />
        </Field>
        <Field label="備註">
          <input
            className="h-14 rounded-md border border-ink/15 bg-rice px-4 text-base font-semibold"
            onChange={(event) => onChange("note", event.target.value)}
            value={draft.note}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className="h-14 rounded-md bg-rice text-lg font-black text-ink/65" onClick={onCancel} type="button">
          取消
        </button>
        <button className="h-14 rounded-md bg-leaf text-lg font-black text-white" onClick={onConfirm} type="button">
          確認存入
        </button>
      </div>
    </div>
  );
}

function BillCard({
  bill,
  onTogglePaid,
  onToggleRepeat
}: {
  bill: Bill;
  onTogglePaid: () => void;
  onToggleRepeat: () => void;
}) {
  return (
    <div className="rounded-md bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-ink">{bill.name}</p>
          <p className="mt-1 text-sm font-semibold text-ink/55">到期日 {bill.dueDate}</p>
        </div>
        <p className="text-xl font-black text-coral">{currency.format(bill.amount)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          className={`h-12 rounded-md text-base font-black ${bill.isPaid ? "bg-mint text-leaf" : "bg-[#fff0ec] text-coral"}`}
          onClick={onTogglePaid}
          type="button"
        >
          {bill.isPaid ? "已繳" : "未繳"}
        </button>
        <button
          className={`h-12 rounded-md text-base font-black ${bill.repeatMonthly ? "bg-mint text-leaf" : "bg-rice text-ink/60"}`}
          onClick={onToggleRepeat}
          type="button"
        >
          {bill.repeatMonthly ? "每月提醒" : "單次帳單"}
        </button>
      </div>
    </div>
  );
}

function ReminderCard({ reminder, onToggle }: { reminder: Reminder; onToggle: () => void }) {
  return (
    <div className="rounded-md bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-lg font-black ${reminder.isDone ? "text-ink/40 line-through" : "text-ink"}`}>
            {reminder.title}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink/55">提醒日 {reminder.dueDate}</p>
          {reminder.note ? <p className="mt-1 text-sm font-semibold text-ink/55">{reminder.note}</p> : null}
        </div>
        <button
          className={`h-11 min-w-20 rounded-md px-3 text-sm font-black ${reminder.isDone ? "bg-mint text-leaf" : "bg-rice text-ink/65"}`}
          onClick={onToggle}
          type="button"
        >
          {reminder.isDone ? "完成" : "待辦"}
        </button>
      </div>
    </div>
  );
}

function TransactionRow({ item }: { item: Transaction }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-rice p-3">
      <div>
        <p className="text-sm font-black text-ink">{item.note || item.merchant || item.category}</p>
        <p className="text-xs font-semibold text-ink/55">
          {item.date} · {item.category}
        </p>
      </div>
      <p className={`text-base font-black ${item.type === "income" ? "text-leaf" : "text-coral"}`}>
        {item.type === "income" ? "+" : "-"}
        {currency.format(item.amount)}
      </p>
    </div>
  );
}

function ReportPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-md bg-white p-5 shadow-soft">
      <SectionTitle title={title} />
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-ink/20 bg-white/70 p-5 text-center text-sm font-semibold leading-6 text-ink/50">
      {text}
    </div>
  );
}
