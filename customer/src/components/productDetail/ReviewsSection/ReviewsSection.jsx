import { StarRating } from './StarRating'

export function ReviewsSection({ reviews = [] }) {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold">Đánh giá khách hàng</h3>
        <button
          type="button"
          className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          Viết đánh giá
        </button>
      </div>
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border-b border-slate-100 dark:border-slate-800 pb-6 last:border-0"
          >
            <div className="flex items-center gap-2 mb-2">
              <StarRating value={review.rating} />
              <span className="text-sm font-bold">
                Đã mua hàng: {review.author}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {review.text}
            </p>
            {review.images?.length > 0 && (
              <div className="flex gap-2">
                {review.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="rounded border border-slate-200 w-20 h-20 object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
