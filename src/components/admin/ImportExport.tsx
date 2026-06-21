"use client";

import { useRef, useState } from "react";
import type { Workbook, Worksheet, Row } from "exceljs";
import type { Product, Category } from "@/lib/types";
import { apiGet, apiSend, type ProductList } from "./lib";
import { Button, Card } from "./ui";
import { site } from "@/lib/data";

// ---------------------------------------------------------------------------
// Excel round-trip: export the ENTIRE store catalogue to a styled .xlsx the
// owner can edit (e.g. bulk price changes) and import back. exceljs is loaded
// lazily so it never ships in the public storefront bundle.
// ---------------------------------------------------------------------------

type ColKey =
  | "id"
  | "name"
  | "model"
  | "regularPrice"
  | "onSale"
  | "salePrice"
  | "categories"
  | "categoryIds"
  | "image"
  | "inStock"
  | "description";

const COLUMNS: { key: ColKey; header: string; width: number }[] = [
  { key: "id", header: "מזהה", width: 10 },
  { key: "name", header: "שם המוצר", width: 38 },
  { key: "model", header: 'דגם / מק"ט', width: 16 },
  { key: "regularPrice", header: "מחיר רגיל (₪)", width: 14 },
  { key: "onSale", header: "במבצע?", width: 10 },
  { key: "salePrice", header: "מחיר מבצע (₪)", width: 14 },
  { key: "categories", header: "קטגוריות", width: 30 },
  { key: "categoryIds", header: "מזהי קטגוריות", width: 16 },
  { key: "image", header: "כתובת תמונה", width: 34 },
  { key: "inStock", header: "במלאי?", width: 10 },
  { key: "description", header: "תיאור", width: 60 },
];

const HEADER_TO_KEY = new Map<string, ColKey>(
  COLUMNS.map((c) => [c.header, c.key])
);

const BRAND = "FF" + String(site?.theme?.primary || "#2563eb").replace("#", "").toUpperCase();
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function yesNo(v: boolean): string {
  return v ? "כן" : "לא";
}

// "כן"/yes/true/1/✓ → true, "לא"/no/false/0 → false, anything else → undefined.
function parseBool(text: string): boolean | undefined {
  const t = String(text).trim().toLowerCase();
  if (!t) return undefined;
  if (/^(כן|yes|true|1|✓|v|y)$/.test(t)) return true;
  if (/^(לא|no|false|0|x)$/.test(t)) return false;
  return undefined;
}

function parseNum(text: string): number {
  const n = Number(String(text).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// exceljs cell values can be strings, numbers, rich-text or formula objects.
function cellText(cell: { value: unknown } | undefined): string {
  const v = cell?.value;
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText))
      return (o.richText as { text?: string }[]).map((r) => r.text ?? "").join("");
    if (typeof o.text === "string") return o.text;
    if (o.result != null) return String(o.result);
    if (o.hyperlink != null) return String(o.text ?? o.hyperlink);
    return "";
  }
  return String(v);
}

async function loadExcel(): Promise<{ new (): Workbook }> {
  const mod = (await import("exceljs")) as unknown as {
    default?: { Workbook: { new (): Workbook } };
    Workbook?: { new (): Workbook };
  };
  const ns = mod.default ?? mod;
  return ns.Workbook as { new (): Workbook };
}

function downloadBlob(data: BlobPart, filename: string): void {
  const blob = new Blob([data], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function styleHeader(ws: Worksheet): void {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.height = 26;
}

type RowObj = Record<ColKey, string | number>;

function productToRow(
  p: Product,
  catById: Map<number, Category>
): RowObj {
  const ids = Array.isArray(p.categoryIds) ? p.categoryIds : [];
  return {
    id: p.id,
    name: p.name,
    model: p.model ?? "",
    regularPrice: p.regularPrice,
    onSale: yesNo(Boolean(p.onSale)),
    salePrice: p.onSale ? p.salePrice : "",
    categories: ids
      .map((id) => catById.get(id)?.name)
      .filter(Boolean)
      .join(" , "),
    categoryIds: ids.join(", "),
    image: p.image ?? "",
    inStock: yesNo(p.inStock !== false),
    description: p.description ?? "",
  };
}

const DUMMY_ROWS: RowObj[] = [
  {
    id: "",
    name: "מיקסר ידני 5 מהירויות (שורת דוגמה)",
    model: "MX-500",
    regularPrice: 199,
    onSale: "כן",
    salePrice: 149,
    categories: "מוצרים למטבח",
    categoryIds: "",
    image: "/images/products/example-1.jpg",
    inStock: "כן",
    description: "מיקסר חזק עם 5 מהירויות ופעימה. זוהי שורת דוגמה — מחקו אותה לפני הייבוא.",
  },
  {
    id: "",
    name: "מאוורר עמוד 16 אינץ' (שורת דוגמה)",
    model: "FN-16",
    regularPrice: 159,
    onSale: "לא",
    salePrice: "",
    categories: "מוצרי קיץ",
    categoryIds: "",
    image: "",
    inStock: "כן",
    description: "מאוורר עמוד שקט עם 3 מהירויות. זוהי שורת דוגמה — מחקו אותה לפני הייבוא.",
  },
];

function buildInstructions(ws: Worksheet, isTemplate: boolean): void {
  ws.views = [{ rightToLeft: true }];
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 86;

  const title = ws.addRow(["ייבוא וייצוא מוצרים — הוראות מילוי"]);
  title.font = { bold: true, size: 16, color: { argb: BRAND } };
  ws.mergeCells(title.number, 1, title.number, 2);
  ws.addRow([]);

  const intro = [
    "קובץ זה מאפשר לערוך את כל מוצרי החנות בתוכנת Excel ולהעלות אותם בחזרה לאתר.",
    "עברו לגיליון ‘מוצרים’ (הלשונית בתחתית החלון) כדי לראות ולערוך את הנתונים.",
    "ערכו את התאים הרצויים — למשל את המחירים — שמרו את הקובץ, וייבאו אותו דרך כפתור ‘ייבוא מ‑Excel’.",
    "אל תשנו את שורת הכותרות (השורה הראשונה בגיליון ‘מוצרים’) ואל תמחקו או תזיזו עמודות.",
  ];
  if (isTemplate) {
    intro.push(
      "השורות בגיליון ‘מוצרים’ הן דוגמה בלבד — מחקו אותן והזינו את המוצרים שלכם."
    );
  }
  for (const line of intro) {
    const r = ws.addRow(["•", line]);
    r.getCell(2).alignment = { wrapText: true, vertical: "top" };
    r.getCell(1).alignment = { horizontal: "center" };
  }

  ws.addRow([]);
  const modeTitle = ws.addRow(["מצבי הייבוא"]);
  modeTitle.font = { bold: true, size: 13, color: { argb: BRAND } };
  ws.mergeCells(modeTitle.number, 1, modeTitle.number, 2);
  const modes: [string, string][] = [
    [
      "החלפת כל הקטלוג",
      "המוצרים בקובץ הופכים לרשימה המלאה באתר. מוצר שנמחק מהקובץ יוסר גם מהאתר. מומלץ כשמייצאים הכל, עורכים, ומייבאים בחזרה.",
    ],
    [
      "עדכון בלבד",
      "מוצרים קיימים (לפי מזהה) יעודכנו, מוצרים חדשים יתווספו, ושאר המוצרים יישארו ללא שינוי. בטוח יותר לעריכות חלקיות.",
    ],
  ];
  for (const [k, v] of modes) {
    const r = ws.addRow([k, v]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }

  ws.addRow([]);
  const legendTitle = ws.addRow(["העמודות"]);
  legendTitle.font = { bold: true, size: 13, color: { argb: BRAND } };
  ws.mergeCells(legendTitle.number, 1, legendTitle.number, 2);

  const head = ws.addRow(["עמודה", "הסבר"]);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
  });

  const legend: [string, string][] = [
    ["מזהה", "מספר מזהה ייחודי. השאירו ריק כדי ליצור מוצר חדש. אל תשנו מזהים של מוצרים קיימים."],
    ["שם המוצר", "חובה. שם המוצר כפי שיוצג באתר."],
    ['דגם / מק"ט', "מספר דגם או מק\"ט (לא חובה)."],
    ["מחיר רגיל (₪)", "המחיר הרגיל, במספרים בלבד וללא סימן ₪ או פסיקים."],
    ["במבצע?", "‘כן’ אם המוצר במבצע, אחרת ‘לא’."],
    ["מחיר מבצע (₪)", "המחיר בזמן המבצע. רלוונטי רק כאשר ‘במבצע?’ = ‘כן’."],
    ["קטגוריות", "שמות הקטגוריות מופרדים בפסיק. השמות חייבים להתאים לקטגוריות הקיימות באתר."],
    ["מזהי קטגוריות", "מזהי הקטגוריות (מספרים) מופרדים בפסיק. אם עמודה זו מלאה — היא הקובעת. אפשר להשאיר ולערוך רק את עמודת ‘קטגוריות’."],
    ["כתובת תמונה", "נתיב התמונה, למשל /images/products/123.jpg. השאירו ריק כדי לשמור את התמונה הקיימת."],
    ["במלאי?", "‘כן’ אם זמין במלאי, אחרת ‘לא’."],
    ["תיאור", "תיאור המוצר (טקסט חופשי)."],
  ];
  for (const [k, v] of legend) {
    const r = ws.addRow([k, v]);
    r.getCell(1).font = { bold: true };
    r.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }

  ws.addRow([]);
  const foot = ws.addRow([
    "",
    "לאחר הייבוא, האתר מתעדכן אוטומטית תוך כ‑2–3 דקות.",
  ]);
  foot.getCell(2).font = { italic: true };
}

function dataFilename(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const name = String(site?.name || "store").replace(/\s+/g, "-");
  return `מוצרים-${name}-${stamp}.xlsx`;
}

// ----- category resolution (import) ----------------------------------------

function resolveCategories(
  idsText: string,
  namesText: string,
  validIds: Set<number>,
  nameToId: Map<string, number>
): { ids: number[]; warnings: string[] } {
  const warnings: string[] = [];
  const fromIds = idsText
    .split(/[,;|]/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const knownFromIds = fromIds.filter((n) => validIds.has(n));
  if (knownFromIds.length) {
    const unknown = fromIds.filter((n) => !validIds.has(n));
    if (unknown.length)
      warnings.push(`מזהי קטגוריות לא מוכרים הושמטו: ${unknown.join(", ")}`);
    return { ids: Array.from(new Set(knownFromIds)), warnings };
  }
  const ids: number[] = [];
  for (const raw of namesText.split(/[,;|]/)) {
    const nm = raw.trim();
    if (!nm) continue;
    const id = nameToId.get(nm.toLowerCase());
    if (id) ids.push(id);
    else warnings.push(`קטגוריה לא נמצאה: "${nm}"`);
  }
  return { ids: Array.from(new Set(ids)), warnings };
}

type ImportResult = {
  mode: string;
  created: number;
  updated: number;
  skipped: number;
  total: number;
  warnings: string[];
};

export default function ImportExport({
  onToast,
}: {
  onToast: (msg: string, ok: boolean) => void;
}) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function fetchData(): Promise<{ products: Product[]; cats: Category[] }> {
    const [cats, list] = await Promise.all([
      apiGet<Category[]>("/api/categories").catch(() => [] as Category[]),
      apiGet<ProductList>("/api/products"),
    ]);
    return { products: list.products || [], cats: cats || [] };
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const { products, cats } = await fetchData();
      const catById = new Map(cats.map((c) => [c.id, c]));
      const primaryName = (p: Product) =>
        (p.categoryIds || [])
          .map((id) => catById.get(id)?.name)
          .find(Boolean) || "\uFFFF"; // un-categorised sorts last
      const sorted = [...products].sort(
        (a, b) =>
          primaryName(a).localeCompare(primaryName(b), "he") ||
          a.name.localeCompare(b.name, "he")
      );

      const Workbook = await loadExcel();
      const wb = new Workbook();
      wb.creator = String(site?.name || "admin");
      wb.created = new Date();

      const ws = wb.addWorksheet("מוצרים", {
        views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
      });
      ws.columns = COLUMNS.map((c) => ({
        header: c.header,
        key: c.key,
        width: c.width,
      }));
      const rows = sorted.length
        ? sorted.map((p) => productToRow(p, catById))
        : DUMMY_ROWS;
      for (const r of rows) ws.addRow(r);
      styleHeader(ws);
      ws.getColumn("description").alignment = {
        wrapText: true,
        vertical: "top",
      };
      ws.getColumn("name").alignment = { wrapText: true, vertical: "top" };

      buildInstructions(wb.addWorksheet("הוראות"), sorted.length === 0);

      const buf = await wb.xlsx.writeBuffer();
      downloadBlob(buf, dataFilename());
      onToast(
        sorted.length
          ? `יוצאו ${sorted.length} מוצרים לקובץ Excel.`
          : "אין מוצרים עדיין — יוצאה תבנית עם דוגמאות והוראות.",
        true
      );
    } catch (err) {
      onToast(`ייצוא נכשל: ${(err as Error).message}`, false);
    } finally {
      setExporting(false);
    }
  }

  async function handleFile(file: File) {
    if (importing) return;
    setImporting(true);
    setResult(null);
    try {
      const { products: current, cats } = await fetchData();
      const validIds = new Set(cats.map((c) => c.id));
      const nameToId = new Map<string, number>();
      for (const c of cats) {
        const key = c.name.trim().toLowerCase();
        if (!nameToId.has(key)) nameToId.set(key, c.id);
      }

      const Workbook = await loadExcel();
      const wb = new Workbook();
      await wb.xlsx.load(await file.arrayBuffer());

      let ws = wb.getWorksheet("מוצרים");
      if (!ws) {
        ws = wb.worksheets.find((sheet) => {
          const hdr = sheet.getRow(1);
          let found = false;
          hdr.eachCell((c) => {
            if (cellText(c).trim() === "שם המוצר") found = true;
          });
          return found;
        });
      }
      if (!ws) ws = wb.worksheets[0];
      if (!ws) throw new Error("הקובץ ריק או לא תקין.");

      const colOf: Partial<Record<ColKey, number>> = {};
      ws.getRow(1).eachCell((cell, col) => {
        const key = HEADER_TO_KEY.get(cellText(cell).trim());
        if (key) colOf[key] = col;
      });
      if (!colOf.name)
        throw new Error("לא נמצאה עמודת ‘שם המוצר’ בקובץ. ודאו שהקובץ יוצא מהאתר.");

      const get = (row: Row, key: ColKey): string =>
        colOf[key] ? cellText(row.getCell(colOf[key] as number)) : "";

      const payloads: Record<string, unknown>[] = [];
      const warnings: string[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const name = get(row, "name").trim();
        if (!name) return;
        const idNum = parseNum(get(row, "id"));
        const regularPrice = parseNum(get(row, "regularPrice"));
        const onSale = parseBool(get(row, "onSale")) ?? false;
        const salePriceRaw = get(row, "salePrice").trim();
        const salePrice = salePriceRaw ? parseNum(salePriceRaw) : regularPrice;
        const { ids, warnings: cw } = resolveCategories(
          get(row, "categoryIds"),
          get(row, "categories"),
          validIds,
          nameToId
        );
        for (const w of cw) warnings.push(`שורה ${rowNumber}: ${w}`);
        const inStock = parseBool(get(row, "inStock"));
        payloads.push({
          id: idNum > 0 ? idNum : undefined,
          name,
          model: get(row, "model").trim(),
          regularPrice,
          price: onSale ? salePrice : regularPrice,
          onSale,
          salePrice: onSale ? salePrice : regularPrice,
          categoryIds: ids,
          image: get(row, "image").trim(),
          inStock: inStock === undefined ? true : inStock,
          description: get(row, "description"),
        });
      });

      if (!payloads.length)
        throw new Error("לא נמצאו מוצרים בקובץ (ודאו שעמודת ‘שם המוצר’ מלאה).");

      const mode = replaceAll ? "replace" : "merge";
      const msg = replaceAll
        ? `נמצאו ${payloads.length} מוצרים בקובץ.\n\nמצב "החלפת כל הקטלוג" יחליף את כל ${current.length} המוצרים הקיימים ברשימה שבקובץ. מוצרים שאינם בקובץ יימחקו מהאתר.\n\nלהמשיך?`
        : `נמצאו ${payloads.length} מוצרים בקובץ.\n\nמצב "עדכון בלבד" יעדכן/יוסיף מוצרים אלו וישאיר את שאר ${current.length} המוצרים ללא שינוי.\n\nלהמשיך?`;
      if (!window.confirm(msg)) {
        onToast("הייבוא בוטל.", true);
        return;
      }

      const res = await apiSend<ImportResult>("/api/import-products", "POST", {
        products: payloads,
        mode,
      });
      const merged: ImportResult = {
        ...res,
        warnings: [...warnings, ...(res.warnings || [])],
      };
      setResult(merged);
      onToast(
        `הייבוא הושלם: ${merged.created} נוספו, ${merged.updated} עודכנו, סה"כ ${merged.total} מוצרים. האתר יתעדכן תוך ~2–3 דקות.`,
        true
      );
    } catch (err) {
      onToast(`ייבוא נכשל: ${(err as Error).message}`, false);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-extrabold text-heading sm:text-lg">
          ⬇ ייצוא לאקסל
        </h2>
        <p className="mt-1 text-sm text-muted">
          מורידים קובץ Excel עם <strong>כל מוצרי החנות</strong>, ממוין לפי קטגוריות,
          כולל מחיר, מחיר מבצע, תיאור, תמונה ועוד. עורכים בנוחות (למשל שינוי מחירים
          גורף) ומייבאים בחזרה. אם אין עדיין מוצרים — יורד קובץ תבנית עם דוגמאות
          והוראות מילוי בעברית.
        </p>
        <div className="mt-3">
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? "מייצא…" : "⬇ ייצוא ל‑Excel"}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-extrabold text-heading sm:text-lg">
          ⬆ ייבוא מאקסל
        </h2>
        <p className="mt-1 text-sm text-muted">
          מעלים את הקובץ ששמרתם. שורת הכותרות חייבת להישאר כפי שהיא. ראו את גיליון
          ‘הוראות’ בקובץ להסבר מלא על העמודות.
        </p>

        <fieldset className="mt-3 space-y-2">
          <label className="flex items-start gap-2 text-sm text-heading">
            <input
              type="radio"
              name="import-mode"
              checked={replaceAll}
              onChange={() => setReplaceAll(true)}
              className="mt-1"
            />
            <span>
              <strong>החלפת כל הקטלוג</strong> — הקובץ הופך לרשימת המוצרים המלאה.
              מוצר שאינו בקובץ יימחק מהאתר.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-heading">
            <input
              type="radio"
              name="import-mode"
              checked={!replaceAll}
              onChange={() => setReplaceAll(false)}
              className="mt-1"
            />
            <span>
              <strong>עדכון בלבד</strong> — עדכון/הוספה של המוצרים שבקובץ; שאר
              הקטלוג נשמר.
            </span>
          </label>
        </fieldset>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <div className="mt-3">
          <Button
            variant="blue"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? "מייבא…" : "⬆ ייבוא מ‑Excel"}
          </Button>
        </div>

        {result ? (
          <div className="mt-4 rounded-lg border border-line bg-soft p-3 text-sm">
            <p className="font-bold text-heading">
              תוצאות הייבוא ({result.mode === "replace" ? "החלפה" : "עדכון"}):
            </p>
            <ul className="mt-1 list-disc pr-5 text-heading">
              <li>נוספו: {result.created}</li>
              <li>עודכנו: {result.updated}</li>
              {result.skipped ? <li>דולגו: {result.skipped}</li> : null}
              <li>סה"כ מוצרים באתר כעת: {result.total}</li>
            </ul>
            {result.warnings?.length ? (
              <details className="mt-2">
                <summary className="cursor-pointer font-semibold text-brand-red">
                  אזהרות ({result.warnings.length})
                </summary>
                <ul className="mt-1 max-h-48 list-disc overflow-auto pr-5 text-muted">
                  {result.warnings.slice(0, 100).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            ) : null}
            <p className="mt-2 text-muted">האתר יתעדכן אוטומטית תוך כ‑2–3 דקות.</p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
