import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#7c3aed", "#0d9488", "#ea580c", "#2563eb", "#db2777", "#65a30d", "#64748b"];

/**
 * @param {object} p
 * @param {Array<{ bucket: string; inAmount?: number; outAmount?: number; net?: number }>} p.points
 */
export function RevenueNetLineChart({ points }) {
  const data = (points || []).map((p) => ({
    name: p.bucket,
    net: p.net ?? 0,
    inAmount: p.inAmount ?? 0,
    outAmount: p.outAmount ?? 0,
  }));
  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
          <Tooltip
            formatter={(v) => [Number(v).toLocaleString("vi-VN"), ""]}
            labelFormatter={(l) => String(l)}
          />
          <Legend />
          <Line type="monotone" dataKey="net" name="Net" stroke="#7c3aed" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="inAmount" name="Vào" stroke="#0d9488" dot={false} strokeWidth={1} />
          <Line type="monotone" dataKey="outAmount" name="Ra" stroke="#ea580c" dot={false} strokeWidth={1} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * @param {object} p
 * @param {Array<{ label: string; amount: number; share: number }>} p.buckets
 */
export function PaymentMethodDonut({ buckets }) {
  const data = (buckets || []).map((b) => ({
    name: b.label,
    value: b.amount ?? 0,
    share: b.share,
  }));
  return (
    <div className="h-[260px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v, _n, ctx) => [`${Number(v).toLocaleString("vi-VN")} VND`, ctx?.payload?.name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * @param {object} p
 * @param {Array<{ bucket: string; b2c?: number; b2b?: number }>} p.points
 */
export function B2cB2bStackedBar({ points }) {
  const data = (points || []).map((p) => ({
    name: p.bucket,
    b2c: p.b2c ?? 0,
    b2b: p.b2b ?? 0,
  }));
  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
          <Tooltip formatter={(v) => Number(v).toLocaleString("vi-VN")} />
          <Legend />
          <Bar dataKey="b2c" name="B2C" stackId="a" fill="#7c3aed" />
          <Bar dataKey="b2b" name="B2B" stackId="a" fill="#0d9488" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * @param {object} p
 * @param {Array<{ label: string; amount: number }>} p.buckets
 */
export function SimpleBarChart({ buckets }) {
  const data = (buckets || []).map((b) => ({ name: b.label, amount: b.amount ?? 0 }));
  return (
    <div className="h-[240px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={48} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
          <Tooltip formatter={(v) => Number(v).toLocaleString("vi-VN")} />
          <Bar dataKey="amount" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * @param {object} p
 * @param {Array<{ label: string; count: number; share: number }>} p.buckets
 * @param {(raw: string) => string} [p.labelFn]
 */
export function DonutStatusChart({ buckets, labelFn }) {
  const data = (buckets || []).map((b, i) => ({
    key: b.label ?? String(i),
    name: labelFn ? labelFn(b.label) : b.label,
    value: b.count ?? 0,
    share: b.share,
    color: COLORS[i % COLORS.length],
  }));
  const slices = data.filter((d) => d.value > 0);

  return (
    <div className="flex w-full min-w-0 items-center gap-3 sm:gap-4">
      <ul className="max-h-[220px] min-w-[9rem] shrink-0 overflow-y-auto py-0.5 text-xs sm:min-w-[10rem] sm:text-sm">
        {data.map((item) => (
          <li key={item.key} className="flex items-start gap-2 py-1 pr-1">
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <div className="min-w-0 leading-snug">
              <span className="block font-medium text-foreground">{item.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {item.value.toLocaleString("vi-VN")}
                {item.share != null && Number.isFinite(Number(item.share))
                  ? ` · ${(Number(item.share) * 100).toFixed(0)}%`
                  : ""}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="h-[200px] min-h-[160px] w-full min-w-[120px] flex-1 sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices.length ? slices : [{ key: "_empty", name: "—", value: 1, color: COLORS[6] }]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="78%"
            >
              {(slices.length ? slices : [{ key: "_empty", color: COLORS[6] }]).map((entry, i) => (
                <Cell key={entry.key ?? i} fill={entry.color ?? COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, _n, ctx) => {
                const share = ctx?.payload?.share;
                const pct =
                  share != null && Number.isFinite(Number(share))
                    ? ` (${(Number(share) * 100).toFixed(0)}%)`
                    : "";
                return [`${Number(v).toLocaleString("vi-VN")}${pct}`, ctx?.payload?.name ?? ""];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * @param {object} p
 * @param {Array<{ bucket: string; remainingTotal?: number; overdueAmount?: number }>} p.points
 */
export function ArTimeseriesLine({ points }) {
  const data = (points || []).map((p) => ({
    name: p.bucket,
    remaining: p.remainingTotal ?? 0,
    overdue: p.overdueAmount ?? 0,
  }));
  return (
    <div className="h-[260px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
          <Tooltip formatter={(v) => Number(v).toLocaleString("vi-VN")} />
          <Legend />
          <Line type="monotone" dataKey="remaining" name="Dư nợ" stroke="#7c3aed" dot={false} />
          <Line type="monotone" dataKey="overdue" name="Quá hạn" stroke="#dc2626" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * @param {object} p
 * @param {Array<{ status: string; count: number; totalValue: number }>} p.steps
 * @param {Record<string, string>} [p.labelMap] — optional status → Vietnamese label
 */
export function FunnelBarChart({ steps, labelMap }) {
  const map = labelMap || {};
  const data = (steps || []).map((s) => ({
    name: map[s.status] || s.status,
    value: s.count ?? 0,
    totalValue: s.totalValue ?? 0,
  }));
  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 100, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={96} />
          <Tooltip
            formatter={(v, _name, ctx) => {
              const tv = ctx?.payload?.totalValue;
              const suffix = tv ? ` (${Number(tv).toLocaleString("vi-VN")} đ)` : "";
              return [`${Number(v).toLocaleString("vi-VN")}${suffix}`, "Số lượng"];
            }}
          />
          <Bar dataKey="value" fill="#7c3aed" name="Số lượng" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * @param {object} p
 * @param {Array<{ label: string; in?: number; out?: number; reserve?: number; release?: number; adjust?: number }>} p.points
 */
export function InventoryTxStackedBar({ points }) {
  const data = (points || []).map((p) => ({
    name: p.bucket,
    in: p.in ?? 0,
    out: p.out ?? 0,
    reserve: p.reserve ?? 0,
    release: p.release ?? 0,
    adjust: p.adjust ?? 0,
  }));
  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="in" stackId="s" name="Nhập kho" fill="#0d9488" />
          <Bar dataKey="out" stackId="s" name="Xuất kho" fill="#7c3aed" />
          <Bar dataKey="reserve" stackId="s" name="Giữ chỗ" fill="#ea580c" />
          <Bar dataKey="release" stackId="s" name="Giải phóng" fill="#2563eb" />
          <Bar dataKey="adjust" stackId="s" name="Điều chỉnh" fill="#64748b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * @param {object} p
 * @param {Array<{ from: string; to: string; avgDays: number; sampleSize: number }>} p.stages
 * @param {Record<string, string>} [p.labelMap] — optional status → Vietnamese label
 */
export function TimeInStageBarChart({ stages, labelMap }) {
  const m = labelMap || {};
  const data = (stages || []).map((s) => ({
    name: `${m[s.from] || s.from} → ${m[s.to] || s.to}`,
    avgDays: s.avgDays ?? 0,
    sampleSize: s.sampleSize ?? 0,
  }));
  return (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 140, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 11 }} unit=" ngày" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={136} />
          <Tooltip
            formatter={(v, _name, ctx) => [
              `${Number(v).toFixed(1)} ngày (${ctx?.payload?.sampleSize ?? 0} mẫu)`,
              "TB",
            ]}
          />
          <Bar dataKey="avgDays" fill="#0d9488" name="TB ngày" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const SLA_HISTOGRAM_LABEL_VI = {
  "0-24": "0–24 giờ",
  "24-48": "24–48 giờ",
  "48-72": "48–72 giờ",
  "72-168": "72–168 giờ",
  ">168": ">168 giờ",
};

/**
 * @param {object} p
 * @param {Array<{ label: string; count: number }>} p.histogram
 * @param {(raw: string) => string} [p.labelFn]
 */
export function SlaHistogramBar({ histogram, labelFn }) {
  const mapLabel = labelFn ?? ((l) => SLA_HISTOGRAM_LABEL_VI[l] ?? l);
  const data = (histogram || []).map((h) => ({ name: mapLabel(h.label), count: h.count ?? 0 }));
  return (
    <div className="h-[200px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" name="Số đơn" fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
