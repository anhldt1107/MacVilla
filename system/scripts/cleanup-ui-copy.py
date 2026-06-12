#!/usr/bin/env python3
"""One-off: remove dev-facing API/doc copy from FE-system JSX/TSX UI."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
GLOB_DIRS = ["pages", "components", "layouts"]

# Exact replacements (order matters for longer strings first)
REPLACEMENTS: list[tuple[str, str]] = [
    (
        """              <DialogDescription>
                POST <span className="font-mono text-[11px]">/api/admin/products</span> — ảnh đại diện tải qua{" "}
                <span className="font-mono text-[11px]">/api/admin/uploads?folder=product</span>, dùng <span className="font-semibold">secureUrl</span> trong{" "}
                <span className="font-mono text-[11px]">imageUrl</span>.
              </DialogDescription>""",
        "              <DialogDescription>Điền thông tin sản phẩm; có thể tải ảnh đại diện.</DialogDescription>",
    ),
    (
        """                <CardDescription className="mt-1 text-xs sm:text-sm">
                  Danh sách từ{" "}
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">GET /api/admin/products</span>
                  — bộ lọc tùy chọn.
                </CardDescription>""",
        '                <CardDescription className="mt-1 text-xs sm:text-sm">Danh sách sản phẩm — có thể lọc theo danh mục.</CardDescription>',
    ),
    (
        '              ? "POST /api/admin/categories — slug để trống để hệ thống tự sinh."\n              : "PUT /api/admin/categories/{id} — slug bắt buộc; bỏ ảnh bằng tùy chọn bên dưới."}',
        '              ? "Để trống mã URL để hệ thống tự tạo."\n              : "Cập nhật thông tin danh mục; có thể bỏ ảnh bên dưới."}',
    ),
    ('placeholder={mode === "create" ? "Để trống — BE tự sinh" : ""}', 'placeholder={mode === "create" ? "Để trống để hệ thống tự tạo" : ""}'),
    (
        """              <DialogDescription>
                Gửi POST lên <span className="font-mono text-[11px]">/api/admin/products/{"{id}"}/variants</span>. Ảnh tải lên qua{" "}
                <span className="font-mono text-[11px]">/api/admin/uploads?folder=product</span>, dùng <span className="font-semibold">secureUrl</span> làm{" "}
                <span className="font-mono text-[11px]">imageUrl</span>.
              </DialogDescription>""",
        "              <DialogDescription>Nhập SKU, giá và ảnh biến thể (nếu có).</DialogDescription>",
    ),
    (
        """              <DialogDescription>
                PUT <span className="font-mono text-[11px]">/api/admin/products/{"{id}"}/variants/{"{variantId}"}</span>. Giữ ảnh hiện tại nếu không chọn tệp mới; đổi ảnh thì upload và gửi{" "}
                <span className="font-mono text-[11px]">secureUrl</span> trong <span className="font-mono text-[11px]">imageUrl</span>.
              </DialogDescription>""",
        "              <DialogDescription>Giữ ảnh hiện tại nếu không chọn ảnh mới.</DialogDescription>",
    ),
    (
        """              <DialogDescription>
                PUT <span className="font-mono text-[11px]">/api/admin/products/{"{id}"}</span> — để giữ nguyên ảnh đại diện, <strong className="font-medium">không</strong> gửi trường{" "}
                <span className="font-mono text-[11px]">imageUrl</span>; gửi{" "}
                <span className="font-mono text-[11px]" title="Chuỗi rỗng">
                  &quot;&quot;
                </span>{" "}
                để xóa ảnh.
              </DialogDescription>""",
        "              <DialogDescription>Để giữ ảnh đại diện, không chọn ảnh mới. Chọn «Xóa ảnh» bên dưới nếu cần gỡ ảnh.</DialogDescription>",
    ),
    (
        """                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tệp gửi dạng multipart, trường <span className="font-mono">file</span>. Sau khi upload thành công, hệ thống dùng <span className="font-mono">data.secureUrl</span> cho
                  payload tạo biến thể.
                </p>""",
        '                <p className="text-xs text-slate-500 dark:text-slate-400">Chọn ảnh JPG/PNG (tùy chọn).</p>',
    ),
    (
        """                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Không chọn file: gửi lại <span className="font-mono">imageUrl</span> hiện có (nếu có). Có file: upload rồi dùng <span className="font-mono">secureUrl</span>.
                </p>""",
        '                <p className="text-xs text-slate-500 dark:text-slate-400">Không chọn ảnh mới thì giữ ảnh hiện tại.</p>',
    ),
    (
        """              <DialogDescription>
                Mỗi dòng là một nhóm: tên thuộc tính (ví dụ «Chất liệu») và một hoặc nhiều giá trị. Gửi lên API dạng object — tên trùng
                trên form sẽ được gộp giá trị.
              </DialogDescription>""",
        "              <DialogDescription>Mỗi dòng là một nhóm thuộc tính và các giá trị tương ứng.</DialogDescription>",
    ),
    ('        if (!imageUrl) throw new Error("Upload ảnh không trả về secureUrl.");', '        if (!imageUrl) throw new Error("Upload ảnh thất bại.");'),
    (
        """          <CardDescription>Trang chủ quản trị — tích hợp API theo từng phân hệ.</CardDescription>""",
        "          <CardDescription>Tổng quan hoạt động hệ thống.</CardDescription>",
    ),
    (
        """          <CardDescription>{BRAND_MANAGER_SUB} — `hoa-don-va-thanh-toan.md`.</CardDescription>""",
        "          <CardDescription>{BRAND_MANAGER_SUB}</CardDescription>",
    ),
    (
        """          <CardDescription>Tra cứu và ghi nhận — cùng API `/api/admin/...`.</CardDescription>""",
        "          <CardDescription>Tra cứu và ghi nhận thanh toán.</CardDescription>",
    ),
    (
        """        Dữ liệu từ <code className="rounded bg-muted px-1">/api/admin/dashboard/…</code>. Làm mới nhanh khoảng 5 phút""",
        "        Dữ liệu làm mới tự động khoảng 5 phút",
    ),
    (
        """        <CardDescription>{description ?? "Trang placeholder — nội dung sẽ được nối API sau."}</CardDescription>""",
        '        <CardDescription>{description ?? "Tính năng đang phát triển."}</CardDescription>',
    ),
    (
        """          <DialogDescription>
            POST /api/admin/returns — chọn đơn và dòng hàng giống popup tạo phiếu bảo hành (`doi-tra.md`).
          </DialogDescription>""",
        "          <DialogDescription>Chọn đơn và các dòng hàng cần đổi/trả.</DialogDescription>",
    ),
    (
        """            <DialogDescription>POST …/warranty-tickets/&#123;id&#125;/claims — `bao-hanh.md`.</DialogDescription>""",
        "            <DialogDescription>Ghi nhận yêu cầu bảo hành cho phiếu này.</DialogDescription>",
    ),
    (
        """            <DialogDescription>PUT /api/admin/quotes/&#123;id&#125;/reject — bắt buộc lý do.</DialogDescription>""",
        "            <DialogDescription>Nhập lý do từ chối báo giá.</DialogDescription>",
    ),
    (
        """            <DialogDescription>PUT /api/admin/quotes/&#123;id&#125;/return-to-draft — báo giá về nháp.</DialogDescription>""",
        "            <DialogDescription>Báo giá sẽ chuyển về trạng thái nháp.</DialogDescription>",
    ),
    (
        """            <DialogDescription>PUT …/approve — Manager/Admin (`doi-tra.md`).</DialogDescription>""",
        "            <DialogDescription>Xác nhận duyệt phiếu đổi/trả.</DialogDescription>",
    ),
    (
        """            <DialogDescription>PUT …/reject</DialogDescription>""",
        "            <DialogDescription>Từ chối phiếu đổi/trả.</DialogDescription>",
    ),
    (
        """            <DialogDescription>PUT …/complete — chọn xử lý tồn từng dòng (`doi-tra.md`).</DialogDescription>""",
        "            <DialogDescription>Hoàn tất phiếu và chọn cách xử lý tồn kho từng dòng.</DialogDescription>",
    ),
    (
        '    "Chọn khách / đơn / hợp đồng từ danh sách (API admin). Có thể tìm theo mã đơn để điền nhanh cả khách và đơn.";',
        '    "Chọn khách, đơn hoặc hợp đồng; có thể tìm theo mã đơn.",',
    ),
    (
        '        description="Chọn từ danh sách (có thể tìm theo mã đơn) hoặc nhập ID nâng cao. POST /api/admin/warranty-tickets — bao-hanh.md."',
        '        description="Chọn khách và đơn từ danh sách, hoặc tìm theo mã đơn."',
    ),
    (
        """          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Danh sách, tạo phiếu, tiếp nhận claim — `bao-hanh.md`.</p>""",
        "          <p className=\"mt-1 text-sm text-slate-600 dark:text-slate-400\">Danh sách phiếu bảo hành và xử lý claim.</p>",
    ),
    (
        '      listDescription="Tra cứu B2B/B2C, công nợ — `khach-hang-va-cong-no.md`. Cùng API `/api/admin/customers`."',
        '      listDescription="Tra cứu khách B2B/B2C và công nợ."',
    ),
    (
        """            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] dark:bg-slate-800">GET /api/admin/warranty-claims</code>
            — mặc định <code className="font-mono text-[11px]">onlyOpen=true</code> (`dev/req.md`).""",
        "            Mặc định chỉ hiển thị claim đang mở.",
    ),
    (
        """              <CardDescription>Luồng claim — `dev/req.md` / `bao-hanh.md`</CardDescription>""",
        "              <CardDescription>Tiến trình xử lý claim</CardDescription>",
    ),
    (
        """                <CardDescription>
                  PUT /api/admin/warranty-claims/&#123;id&#125;/status — chỉ các bước tiếp theo hợp lệ (`dev/req.md`).
                </CardDescription>""",
        "                <CardDescription>Chọn bước trạng thái tiếp theo hợp lệ.</CardDescription>",
    ),
    (
        """            Đối soát CK B2B — <code className="rounded bg-slate-100 px-1 font-mono text-[11px] dark:bg-slate-800">GET /api/admin/transfer-notifications</code> (""",
        "            Đối soát thông báo chuyển khoản B2B (",
    ),
    (
        """              API: <span className="font-mono text-[11px]">GET /api/admin/quotes</span>""",
        "",
    ),
    (
        """            GET <span className="font-mono text-xs">/api/admin/quotes?status=PendingApproval</span> — `manager/bao-gia.md`""",
        "            Báo giá chờ duyệt",
    ),
    (
        """              API: <span className="font-mono text-[11px]">GET /api/admin/quotes</span>""",
        "",
    ),
    (
        """                <CardDescription>Dữ liệu đơn kèm phiếu (nếu BE trả về)</CardDescription>""",
        "                <CardDescription>Thông tin đơn hàng liên quan</CardDescription>",
    ),
    (
        """                <DialogDescription>
                  POST cho đơn <span className="font-mono font-semibold">{order.orderCode ?? `#${order.id}`}</span> — loại phiếu và ghi chú tùy chọn.
                </DialogDescription>""",
        """                <DialogDescription>
                  Tạo phiếu xuất cho đơn <span className="font-semibold">{order.orderCode ?? `#${order.id}`}</span>.
                </DialogDescription>""",
    ),
    (
        """            Đơn trạng thái <strong>Confirmed</strong> — mở chi tiết đơn và bấm <strong>Tạo phiếu</strong> (POST fulfillments).""",
        "            Đơn đã xác nhận — mở chi tiết đơn và bấm <strong>Tạo phiếu</strong>.",
    ),
    (
        """                : `${totalCount.toLocaleString("vi-VN")} phiếu — bấm dòng để mở chi tiết (GET /fulfillments/{id}).`}""",
        '                : `${totalCount.toLocaleString("vi-VN")} phiếu — bấm dòng để xem chi tiết.`}',
    ),
    (
        '      setSaveError("Chuyển trạng thái không hợp lệ với bước hiện tại (xem `dev/req.md`).");',
        '      setSaveError("Không thể chuyển sang trạng thái này từ bước hiện tại.");',
    ),
    (
        '                title="GET by-number — tra đúng số phiếu"',
        '                title="Tra cứu theo số phiếu"',
    ),
    (
        """                  Trạng thái hiện tại từ API:{" "}
                  <span className="font-mono font-medium">{order.orderStatus}</span> (không nằm trong chuẩn timeline —
                  vẫn có thể chọn trạng thái mới bên dưới).""",
        """                  Trạng thái hiện tại:{" "}
                  <span className="font-medium">{order.orderStatus}</span> — vẫn có thể chọn trạng thái mới bên dưới.""",
    ),
    (
        """            <DialogDescription>
              Tìm hóa đơn hoặc khách — chọn dòng để điền ID; có thể gợi ý số tiền từ còn nợ HĐ. POST /api/admin/payments.
            </DialogDescription>""",
        "            <DialogDescription>Chọn khách hoặc hóa đơn; số tiền có thể gợi ý từ số còn nợ.</DialogDescription>",
    ),
    (
        """            <DialogDescription>
              Chọn khách / hóa đơn giống ghi nhận thanh toán. POST /api/admin/payments/refund — quyền Manager/Admin theo BE.
            </DialogDescription>""",
        "            <DialogDescription>Chọn khách và hóa đơn tương tự khi ghi nhận thanh toán.</DialogDescription>",
    ),
    (
        """          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Dùng cùng API admin quotes — giao diện tham khảo Admin B2B.</p>""",
        "          <p className=\"mt-1 text-sm text-slate-600 dark:text-slate-400\">Danh sách báo giá B2B.</p>",
    ),
    (
        """          <CardDescription>Chọn khách đã có trong hệ thống — bắt buộc theo tài liệu API.</CardDescription>""",
        "          <CardDescription>Chọn khách hàng cho báo giá.</CardDescription>",
    ),
    (
        """            <CardDescription>Mỗi dòng: biến thể (SKU), số lượng; đơn giá tuỳ chọn — bỏ trống để BE lấy giá bán lẻ.</CardDescription>""",
        "            <CardDescription>Mỗi dòng: biến thể (SKU), số lượng; để trống đơn giá sẽ dùng giá bán lẻ.</CardDescription>",
    ),
    (
        """        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-mono">{createPath}</span>
        </p>""",
        "",
    ),
    (
        """              <DialogDescription className="font-mono text-xs text-slate-600 dark:text-slate-400">
                productId={productId || "—"} · variantId={variantId || "—"}
              </DialogDescription>""",
        "              <DialogDescription>Cập nhật số lượng tồn và ngưỡng đặt hàng lại cho biến thể đã chọn.</DialogDescription>",
    ),
    (
        '        if (!u) throw new Error("Upload ảnh không trả về secureUrl.");',
        '        if (!u) throw new Error("Upload ảnh thất bại.");',
    ),
    (
        """                Thao tác này ghi nhận thanh toán (BankTransfer), cập nhật hóa đơn / công nợ B2B theo BE — không hoàn tác qua màn này.""",
        "                Xác nhận thanh toán chuyển khoản; cập nhật hóa đơn và công nợ. Không hoàn tác trên màn này.",
    ),
    (
        """            Manager theo dõi phiếu và cập nhật trạng thái claim (PUT claim/status); đồng bộ vận hành kho khi cần.""",
        "            Theo dõi phiếu và cập nhật trạng thái claim; phối hợp kho khi cần.",
    ),
    (
        """                    Gán / đổi Sales qua API <span className="font-mono">PUT .../assign-sales</span>.""",
        "                    Gán hoặc đổi nhân viên phụ trách đơn.",
    ),
]

# Regex-based cleanups
REGEX_REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"<CardDescription[^>]*>\s*Danh sách[^<]*<span[^>]*>GET /api/admin/categories</span>[^<]*<span[^>]*>GET /api/admin/categories/tree</span>[^<]*</CardDescription>",
            re.DOTALL,
        ),
        '<CardDescription className="mt-1 text-xs sm:text-sm">Danh mục dạng cây hoặc bảng phẳng.</CardDescription>',
    ),
    (re.compile(r"\s*API:\s*<span className=\"font-mono[^\"]*\">GET /api/admin/[^<]+</span>\s*"), ""),
    (re.compile(r"POST <span className=\"font-mono[^\"]*\">/api/admin/quotes</span>[^<]*"), ""),
    (re.compile(r"<span className=\"font-mono[^\"]*\">GET /api/admin/[^<]+</span>"), ""),
    (re.compile(r"`[a-z0-9_/-]+\.md`"), ""),
    (re.compile(r" — `[^`]+`"), ""),
    (re.compile(r" \(`[^`)]+`\)(?=\.)"), ""),
]

# Lines to strip if entire line matches dev-only page intro in JSX
PAGE_INTRO_PATTERNS = [
    re.compile(r"^\s*<p[^>]*>[^<]*`[^`]+\.md`[^<]*</p>\s*$"),
]


def iter_files():
    for d in GLOB_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.suffix in (".jsx", ".tsx") and "node_modules" not in str(path):
                yield path


def process_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    orig = text
    for old, new in REPLACEMENTS:
        if old in text:
            text = text.replace(old, new)
    for pat, repl in REGEX_REPLACEMENTS:
        text = pat.sub(repl, text)
    # Collapse empty CardDescription blocks left by API: removal
    text = re.sub(
        r"<CardDescription([^>]*)>\s*</CardDescription>",
        "",
        text,
    )
    text = re.sub(r"\n{3,}", "\n\n", text)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    changed = []
    for p in iter_files():
        if process_file(p):
            changed.append(p.relative_to(ROOT.parent))
    print(f"Updated {len(changed)} files")
    for c in sorted(changed)[:40]:
        print(" ", c)
    if len(changed) > 40:
        print(f"  ... and {len(changed) - 40} more")


if __name__ == "__main__":
    main()
