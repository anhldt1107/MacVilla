import { WorkerMyWorkQueue } from "@/components/warehouse/WorkerMyWorkQueue";

/** Trang chủ Worker — phiếu được gán (Pending / Picking / Packed). */
export function WorkerHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Việc của tôi</h1>
      <WorkerMyWorkQueue />
    </div>
  );
}
